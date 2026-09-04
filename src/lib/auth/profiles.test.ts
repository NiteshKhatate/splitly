import { ensureUserProfile } from "./profiles";

function createSelectQuery(result: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

function createInsertQuery(result: unknown) {
  return {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
  };
}

const user = {
  id: "user-1",
  email: "ada@example.com",
  user_metadata: {
    full_name: "Ada Lovelace",
  },
};

describe("ensureUserProfile", () => {
  it("returns an existing profile without inserting", async () => {
    const existingProfile = {
      id: "user-1",
      full_name: "Ada Lovelace",
      email: "ada@example.com",
      avatar_url: null,
    };
    const selectQuery = createSelectQuery({ data: existingProfile, error: null });
    const supabase = {
      from: jest.fn(() => selectQuery),
    };

    const result = await ensureUserProfile(supabase as never, user as never);

    expect(result).toEqual({ data: existingProfile, error: null });
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it("creates a profile with trimmed explicit full name when missing", async () => {
    const selectQuery = createSelectQuery({ data: null, error: null });
    const insertQuery = createInsertQuery({ data: { id: "user-1" }, error: null });
    const supabase = {
      from: jest.fn()
        .mockReturnValueOnce(selectQuery)
        .mockReturnValueOnce(insertQuery),
    };

    const result = await ensureUserProfile(supabase as never, user as never, " Ada Byron ");

    expect(result).toEqual({ data: { id: "user-1" }, error: null });
    expect(insertQuery.insert).toHaveBeenCalledWith({
      id: "user-1",
      full_name: "Ada Byron",
      email: "ada@example.com",
    });
  });

  it("re-reads the profile when insert hits a duplicate key race", async () => {
    const initialSelect = createSelectQuery({ data: null, error: null });
    const insertQuery = createInsertQuery({ data: null, error: { code: "23505" } });
    const finalProfile = { id: "user-1", full_name: "Ada", email: "ada@example.com", avatar_url: null };
    const finalSelect = createSelectQuery({ data: finalProfile, error: null });
    const supabase = {
      from: jest.fn()
        .mockReturnValueOnce(initialSelect)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(finalSelect),
    };

    const result = await ensureUserProfile(supabase as never, user as never);

    expect(result).toEqual({ data: finalProfile, error: null });
    expect(supabase.from).toHaveBeenCalledTimes(3);
  });
});
