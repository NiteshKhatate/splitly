import type { SupabaseClient } from "@supabase/supabase-js";

import {
  formatMinorUnits,
  getCurrentUserGroupBalances,
  type GroupBalanceDatabase,
} from "@/lib/balances/group-balances";
import type { BalanceTone } from "@/lib/balances/types";

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  currency: string | null;
  created_by: string;
};

type GroupMemberRow = {
  id: string;
  role: string;
  user_id: string;
  profiles:
    | {
        id: string;
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
      }
    | {
        id: string;
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
      }[]
    | null;
};

type ExpenseRow = {
  id: string;
  description: string;
  totalMinor: number;
  date: Date;
};

export type GroupMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  isCurrentUser: boolean;
};

export type GroupExpense = {
  id: string;
  description: string;
  amount: string;
  date: string;
};

export type GroupDetail = {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  memberCount: number;
  currentUserRole: string;
  canAddMembers: boolean;
  balances: {
    youOwe: { amount: string; tone: BalanceTone };
    youAreOwed: { amount: string; tone: BalanceTone };
    net: { amount: string; tone: BalanceTone; description: string };
  };
  members: GroupMember[];
  recentExpenses: GroupExpense[];
};

type GroupDetailResult =
  | {
      group: GroupDetail;
      error: null;
    }
  | {
      group: null;
      error: { message: string };
    };

function normalizeProfile(member: GroupMemberRow) {
  if (Array.isArray(member.profiles)) {
    return member.profiles[0] ?? null;
  }

  return member.profiles;
}

function formatExpenseDate(date: Date | string | null) {
  if (!date) return "No date";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

function createBalanceCards(amountInMinorUnits: number): GroupDetail["balances"] {
  const youOwe = amountInMinorUnits < 0 ? Math.abs(amountInMinorUnits) : 0;
  const youAreOwed = amountInMinorUnits > 0 ? amountInMinorUnits : 0;
  const netTone: BalanceTone = amountInMinorUnits > 0 ? "success" : amountInMinorUnits < 0 ? "danger" : "neutral";

  return {
    youOwe: {
      amount: formatMinorUnits(youOwe),
      tone: youOwe > 0 ? "danger" : "neutral",
    },
    youAreOwed: {
      amount: formatMinorUnits(youAreOwed),
      tone: youAreOwed > 0 ? "success" : "neutral",
    },
    net: {
      amount: `${amountInMinorUnits > 0 ? "+" : amountInMinorUnits < 0 ? "-" : ""}${formatMinorUnits(Math.abs(amountInMinorUnits))}`,
      tone: netTone,
      description:
        amountInMinorUnits > 0
          ? "Overall, you're owed money"
          : amountInMinorUnits < 0
            ? "Overall, you owe money"
            : "This group is settled up",
    },
  };
}

export async function getGroupDetail(
  supabase: SupabaseClient,
  database: GroupBalanceDatabase,
  groupId: string,
  userId: string,
): Promise<GroupDetailResult> {
  const group = await supabase
    .from("groups")
    .select("id, name, description, currency, created_by")
    .eq("id", groupId)
    .maybeSingle<GroupRow>();

  if (group.error) {
    return { group: null, error: group.error };
  }

  if (!group.data) {
    return { group: null, error: { message: "Group not found." } };
  }

  let relatedData;

  try {
    relatedData = await Promise.all([
      supabase
        .from("group_members")
        .select("id, role, user_id, profiles(id, full_name, email, avatar_url)")
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true })
        .returns<GroupMemberRow[]>(),
      database.expense.findMany({
        where: { deletedAt: null, groupId },
        orderBy: { date: "desc" },
        take: 5,
        select: {
          date: true,
          description: true,
          id: true,
          totalMinor: true,
        },
      }),
      getCurrentUserGroupBalances(database, userId, [groupId]),
    ]);
  } catch {
    return { group: null, error: { message: "Group details could not be loaded." } };
  }

  const [membersResult, expenses, balancesResult] = relatedData;

  if (membersResult.error) {
    return { group: null, error: membersResult.error };
  }

  if (balancesResult.error) {
    return { group: null, error: balancesResult.error };
  }

  const members = membersResult.data.map((member) => {
    const profile = normalizeProfile(member);
    const email = profile?.email ?? "";
    const fallbackName = email ? email.split("@")[0] : "Splitly user";

    return {
      id: member.id,
      userId: member.user_id,
      name: profile?.full_name?.trim() || fallbackName,
      email,
      avatarUrl: profile?.avatar_url ?? null,
      role: member.role,
      isCurrentUser: member.user_id === userId,
    };
  });

  const currentUserMembership = members.find((member) => member.userId === userId);
  const balance = balancesResult.balances.get(groupId);

  return {
    group: {
      id: group.data.id,
      name: group.data.name,
      description: group.data.description,
      currency: group.data.currency ?? "INR",
      memberCount: members.length,
      currentUserRole: currentUserMembership?.role ?? "member",
      canAddMembers: currentUserMembership?.role === "admin",
      balances: createBalanceCards(balance?.amountInMinorUnits ?? 0),
      members,
      recentExpenses: (expenses as ExpenseRow[]).map((expense) => ({
        id: expense.id,
        description: expense.description,
        amount: formatMinorUnits(expense.totalMinor),
        date: formatExpenseDate(expense.date),
      })),
    },
    error: null,
  };
}
