import type { SupabaseClient } from "@supabase/supabase-js";

import type { Group } from "@/components/dashboard/types";
import {
  getCurrentUserGroupBalances,
  type GroupBalanceDatabase,
} from "@/lib/balances/group-balances";

const DASHBOARD_GROUP_LIMIT = 4;

type GroupRow = {
  id: string;
  name: string;
  currency: string | null;
};

type GroupMembershipRow = {
  group_id: string;
  joined_at: string | null;
  groups: GroupRow | GroupRow[] | null;
};

type GroupMemberRow = {
  group_id: string;
};

type DashboardGroupsResult =
  | {
      groups: Group[];
      error: null;
    }
  | {
      groups: [];
      error: { message: string };
    };

function normalizeGroup(group: GroupMembershipRow["groups"]): GroupRow | null {
  if (Array.isArray(group)) {
    return group[0] ?? null;
  }

  return group;
}

export async function getDashboardGroups(
  supabase: SupabaseClient,
  database: GroupBalanceDatabase,
  userId: string,
  limit = DASHBOARD_GROUP_LIMIT,
): Promise<DashboardGroupsResult> {
  const memberships = await supabase
    .from("group_members")
    .select("group_id, joined_at, groups(id, name, currency)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })
    .limit(limit)
    .returns<GroupMembershipRow[]>();

  if (memberships.error) {
    return { groups: [], error: memberships.error };
  }

  const groupRows = memberships.data
    .map((membership) => normalizeGroup(membership.groups))
    .filter((group): group is GroupRow => Boolean(group));

  if (groupRows.length === 0) {
    return { groups: [], error: null };
  }

  const groupIds = groupRows.map((group) => group.id);
  const [memberRows, groupBalances] = await Promise.all([
    supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds)
      .returns<GroupMemberRow[]>(),
    getCurrentUserGroupBalances(database, userId, groupIds),
  ]);

  if (memberRows.error) {
    return { groups: [], error: memberRows.error };
  }

  if (groupBalances.error) {
    return { groups: [], error: groupBalances.error };
  }

  const memberCounts = new Map<string, number>();

  for (const member of memberRows.data) {
    memberCounts.set(member.group_id, (memberCounts.get(member.group_id) ?? 0) + 1);
  }

  const groups = groupRows.map((group) => {
    const balance = groupBalances.balances.get(group.id) ?? {
      amountInMinorUnits: 0,
      label: "Settled up",
      tone: "neutral" as const,
    };

    return {
      id: group.id,
      name: group.name,
      members: memberCounts.get(group.id) ?? 1,
      balance,
      href: `/groups/${group.id}`,
    };
  });

  return { groups, error: null };
}
