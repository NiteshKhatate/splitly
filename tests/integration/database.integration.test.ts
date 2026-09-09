import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { createGroup } from "@/lib/groups/create-group";

const REQUIRED_CONFIRMATION = "NON_PRODUCTION_DATABASE_CONFIRMED";

function requireEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for integration tests.`);
  return value;
}

function assertDisposableDatabase(connectionString: string): void {
  if (process.env.INTEGRATION_TEST_CONFIRMATION !== REQUIRED_CONFIRMATION) {
    throw new Error(
      `Set INTEGRATION_TEST_CONFIRMATION=${REQUIRED_CONFIRMATION} only for a disposable database.`,
    );
  }

  if (
    connectionString === process.env.DATABASE_URL
    || connectionString === process.env.DIRECT_URL
  ) {
    throw new Error("Integration tests must not use DATABASE_URL or DIRECT_URL.");
  }
}

describe("real PostgreSQL transactions and Supabase RLS", () => {
  let database: PrismaClient;
  let ownerClient: SupabaseClient;
  let outsiderClient: SupabaseClient;
  let ownerId: string;
  let outsiderId: string;
  const createdGroupIds: string[] = [];

  beforeAll(async () => {
    const connectionString = requireEnvironment("TEST_DATABASE_URL");
    assertDisposableDatabase(connectionString);

    database = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

    const supabaseUrl = requireEnvironment("TEST_SUPABASE_URL");
    const publishableKey = requireEnvironment("TEST_SUPABASE_PUBLISHABLE_KEY");
    ownerClient = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    outsiderClient = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const ownerSession = await ownerClient.auth.signInWithPassword({
      email: requireEnvironment("TEST_OWNER_EMAIL"),
      password: requireEnvironment("TEST_OWNER_PASSWORD"),
    });
    const outsiderSession = await outsiderClient.auth.signInWithPassword({
      email: requireEnvironment("TEST_OUTSIDER_EMAIL"),
      password: requireEnvironment("TEST_OUTSIDER_PASSWORD"),
    });

    if (ownerSession.error || !ownerSession.data.user) {
      throw new Error("The disposable integration owner could not authenticate.");
    }
    if (outsiderSession.error || !outsiderSession.data.user) {
      throw new Error("The disposable integration outsider could not authenticate.");
    }

    ownerId = ownerSession.data.user.id;
    outsiderId = outsiderSession.data.user.id;

    const profiles = await database.user.count({
      where: { id: { in: [ownerId, outsiderId] } },
    });
    if (profiles !== 2) {
      throw new Error("Both integration users must have synchronized profile rows.");
    }
  }, 30_000);

  afterAll(async () => {
    if (database) {
      if (createdGroupIds.length > 0) {
        await database.group.deleteMany({ where: { id: { in: createdGroupIds } } });
      }
      await database.$disconnect();
    }
    await ownerClient?.auth.signOut();
    await outsiderClient?.auth.signOut();
  });

  it("rolls back a group and its trigger-created activity after an intermediate failure", async () => {
    const groupId = randomUUID();

    await expect(database.$transaction(async (transaction) => {
      await transaction.group.create({
        data: {
          createdBy: ownerId,
          defaultCurrency: "INR",
          id: groupId,
          name: `Rollback ${groupId}`,
        },
      });
      throw new Error("forced intermediate failure");
    })).rejects.toThrow("forced intermediate failure");

    await expect(database.group.findUnique({ where: { id: groupId } })).resolves.toBeNull();
    await expect(database.activityEvent.count({ where: { groupId } })).resolves.toBe(0);
  });

  it("creates a complete group atomically and enforces two-user RLS isolation", async () => {
    const groupId = randomUUID();
    createdGroupIds.push(groupId);

    await expect(createGroup(database, {
      createdBy: ownerId,
      defaultCurrency: "INR",
      description: "Disposable integration fixture",
      id: groupId,
      name: `Integration ${groupId}`,
    })).resolves.toEqual({ groupId });

    await expect(database.groupMember.count({ where: { groupId, userId: ownerId } })).resolves.toBe(1);
    await expect(database.activityEvent.count({ where: { groupId, type: "GROUP_CREATED" } })).resolves.toBe(1);

    const ownerRead = await ownerClient.from("groups").select("id").eq("id", groupId).maybeSingle();
    expect(ownerRead.error).toBeNull();
    expect(ownerRead.data).toEqual({ id: groupId });

    const outsiderRead = await outsiderClient.from("groups").select("id").eq("id", groupId).maybeSingle();
    expect(outsiderRead.error).toBeNull();
    expect(outsiderRead.data).toBeNull();
  });

  it("keeps the financial ledger unavailable through the browser data API", async () => {
    const result = await ownerClient.from("expenses").select("id").limit(1);
    expect(result.error).not.toBeNull();
  });

  it("enforces the group currency at the PostgreSQL boundary", async () => {
    const groupId = randomUUID();
    createdGroupIds.push(groupId);
    await createGroup(database, {
      createdBy: ownerId,
      defaultCurrency: "INR",
      description: null,
      id: groupId,
      name: `Currency ${groupId}`,
    });

    await expect(database.expense.create({
      data: {
        category: "GENERAL",
        createdBy: ownerId,
        currency: "USD",
        date: new Date("2026-09-09T00:00:00.000Z"),
        description: "Rejected currency",
        groupId,
        totalMinor: 100,
      },
    })).rejects.toThrow();

    await database.groupMember.create({
      data: { groupId, role: "MEMBER", userId: outsiderId },
    });
    await expect(database.settlement.create({
      data: {
        amountMinor: 100,
        createdBy: ownerId,
        currency: "USD",
        date: new Date("2026-09-09T00:00:00.000Z"),
        groupId,
        payeeId: outsiderId,
        payerId: ownerId,
      },
    })).rejects.toThrow();
  });
});
