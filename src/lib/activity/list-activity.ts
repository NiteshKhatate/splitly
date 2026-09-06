import type { ActivityEventType, Prisma, PrismaClient } from "@prisma/client";

export const ACTIVITY_PAGE_SIZE = 20;

export const ACTIVITY_TYPE_OPTIONS = [
  { label: "Group created", value: "GROUP_CREATED" },
  { label: "Member joined", value: "MEMBER_JOINED" },
  { label: "Member removed", value: "MEMBER_REMOVED" },
  { label: "Expense added", value: "EXPENSE_CREATED" },
  { label: "Expense updated", value: "EXPENSE_UPDATED" },
  { label: "Expense deleted", value: "EXPENSE_DELETED" },
  { label: "Settlement recorded", value: "SETTLEMENT_CREATED" },
  { label: "Settlement confirmed", value: "SETTLEMENT_CONFIRMED" },
] as const satisfies ReadonlyArray<{ label: string; value: ActivityEventType }>;

const ACTIVITY_TYPES = new Set<ActivityEventType>(
  ACTIVITY_TYPE_OPTIONS.map(({ value }) => value),
);

export type ActivityFilters = {
  groupId?: string;
  page?: number;
  type?: ActivityEventType;
};

export type ActivityFeedItem = {
  createdAt: string;
  description: string;
  groupId: string;
  groupName: string;
  href: string;
  id: string;
  label: string;
  type: ActivityEventType;
};

export type ActivityGroupOption = {
  id: string;
  name: string;
};

export type ActivityListDatabase = Pick<
  PrismaClient,
  "activityEvent" | "group" | "settlement"
>;

export function parseActivityType(value: string | undefined): ActivityEventType | undefined {
  return value && ACTIVITY_TYPES.has(value as ActivityEventType)
    ? (value as ActivityEventType)
    : undefined;
}

export function parseActivityPage(value: string | undefined): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function metadataRecord(metadata: Prisma.JsonValue): Record<string, Prisma.JsonValue> {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata as Record<string, Prisma.JsonValue>
    : {};
}

function metadataString(
  metadata: Record<string, Prisma.JsonValue>,
  key: string,
): string | undefined {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function metadataInteger(
  metadata: Record<string, Prisma.JsonValue>,
  key: string,
): number | undefined {
  const value = metadata[key];
  return typeof value === "number" && Number.isSafeInteger(value) ? value : undefined;
}

function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(amountMinor / 100);
}

type SettlementDetails = {
  amountMinor: number;
  currency: string;
  payeeName: string;
  payerName: string;
};

function describeEvent(
  event: {
    actor: { name: string };
    entityId: string;
    metadata: Prisma.JsonValue;
    type: ActivityEventType;
  },
  settlements: Map<string, SettlementDetails>,
): string {
  const actor = event.actor.name;
  const metadata = metadataRecord(event.metadata);
  const description = metadataString(metadata, "description") ?? "an expense";
  const memberName = metadataString(metadata, "memberName") ?? "A member";
  const settlement = settlements.get(event.entityId);
  const amountMinor = settlement?.amountMinor ?? metadataInteger(metadata, "amountMinor");
  const expenseTotalMinor = metadataInteger(metadata, "totalMinor");
  const currency = settlement?.currency ?? metadataString(metadata, "currency") ?? "INR";
  const amount = amountMinor === undefined ? "a payment" : formatMoney(amountMinor, currency);

  switch (event.type) {
    case "GROUP_CREATED":
      return `${actor} created the group`;
    case "MEMBER_JOINED":
      return `${memberName} joined the group`;
    case "MEMBER_REMOVED":
      return `${memberName} was removed from the group`;
    case "EXPENSE_CREATED":
      return `${actor} added ${expenseTotalMinor === undefined ? "" : `${formatMoney(expenseTotalMinor, currency)} `}${description}`;
    case "EXPENSE_UPDATED":
      return `${actor} updated ${description}`;
    case "EXPENSE_DELETED":
      return `${actor} deleted ${description}`;
    case "SETTLEMENT_CREATED":
      return settlement
        ? `${settlement.payerName} recorded ${amount} paid to ${settlement.payeeName}`
        : `${actor} recorded ${amount} settlement`;
    case "SETTLEMENT_CONFIRMED":
      return settlement
        ? `${actor} confirmed ${amount} from ${settlement.payerName}`
        : `${actor} confirmed a settlement`;
  }
}

function eventHref(type: ActivityEventType, entityId: string, groupId: string): string {
  return type.startsWith("EXPENSE_")
    ? `/expenses/${entityId}`
    : type.startsWith("SETTLEMENT_")
      ? `/groups/${groupId}/balances`
      : `/groups/${groupId}`;
}

function eventLabel(type: ActivityEventType): string {
  return ACTIVITY_TYPE_OPTIONS.find(({ value }) => value === type)?.label ?? "Activity";
}

export async function listActivity(
  database: ActivityListDatabase,
  userId: string,
  filters: ActivityFilters = {},
  pageSize = ACTIVITY_PAGE_SIZE,
): Promise<{
  error: { message: string } | null;
  groups: ActivityGroupOption[];
  hasMore: boolean;
  items: ActivityFeedItem[];
  page: number;
}> {
  const page = Number.isSafeInteger(filters.page) && (filters.page ?? 0) > 0
    ? filters.page as number
    : 1;
  const take = Math.min(Math.max(pageSize, 1), 100);

  try {
    const groups = await database.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
      where: { members: { some: { userId } } },
    });

    const authorizedGroupIds = groups.map(({ id }) => id);
    if (filters.groupId && !authorizedGroupIds.includes(filters.groupId)) {
      return {
        error: { message: "Group activity could not be found." },
        groups,
        hasMore: false,
        items: [],
        page,
      };
    }

    if (authorizedGroupIds.length === 0) {
      return { error: null, groups, hasMore: false, items: [], page };
    }

    const events = await database.activityEvent.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        actor: { select: { name: true } },
        createdAt: true,
        entityId: true,
        group: { select: { name: true } },
        groupId: true,
        id: true,
        metadata: true,
        type: true,
      },
      skip: (page - 1) * take,
      take: take + 1,
      where: {
        groupId: filters.groupId ?? { in: authorizedGroupIds },
        ...(filters.type ? { type: filters.type } : {}),
      },
    });

    const visibleEvents = events.slice(0, take);
    const settlementIds = visibleEvents
      .filter(({ type }) => type.startsWith("SETTLEMENT_"))
      .map(({ entityId }) => entityId);
    const settlementRows = settlementIds.length > 0
      ? await database.settlement.findMany({
          select: {
            amountMinor: true,
            currency: true,
            id: true,
            payee: { select: { name: true } },
            payer: { select: { name: true } },
          },
          where: {
            groupId: { in: authorizedGroupIds },
            id: { in: settlementIds },
          },
        })
      : [];
    const settlements = new Map(
      settlementRows.map((settlement) => [settlement.id, {
        amountMinor: settlement.amountMinor,
        currency: settlement.currency,
        payeeName: settlement.payee.name,
        payerName: settlement.payer.name,
      }]),
    );

    return {
      error: null,
      groups,
      hasMore: events.length > take,
      items: visibleEvents.map((event) => ({
        createdAt: event.createdAt.toISOString(),
        description: describeEvent(event, settlements),
        groupId: event.groupId,
        groupName: event.group.name,
        href: eventHref(event.type, event.entityId, event.groupId),
        id: event.id,
        label: eventLabel(event.type),
        type: event.type,
      })),
      page,
    };
  } catch {
    return {
      error: { message: "Activity could not be loaded." },
      groups: [],
      hasMore: false,
      items: [],
      page,
    };
  }
}
