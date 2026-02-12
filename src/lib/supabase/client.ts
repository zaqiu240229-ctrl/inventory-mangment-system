// Stub Supabase client for frontend compatibility during Neon migration
// Frontend components should use API routes instead of direct database access

export function createClient() {
  return {
    from: (table: string) => {
      console.warn(`⚠️ Direct database access not supported. Table: ${table}`);
      console.warn("💡 This frontend component needs migration to use API routes.");
      console.warn("📝 See MIGRATION_STATUS.md for details.");

      return {
        select: () => ({
          data: null,
          error: new Error("Use API routes instead of direct database access"),
        }),
        insert: () => ({
          data: null,
          error: new Error("Use API routes instead of direct database access"),
        }),
        update: () => ({
          data: null,
          error: new Error("Use API routes instead of direct database access"),
        }),
        delete: () => ({
          data: null,
          error: new Error("Use API routes instead of direct database access"),
        }),
        upsert: () => ({
          data: null,
          error: new Error("Use API routes instead of direct database access"),
        }),
        eq: function () {
          return this;
        },
        neq: function () {
          return this;
        },
        gt: function () {
          return this;
        },
        gte: function () {
          return this;
        },
        lt: function () {
          return this;
        },
        lte: function () {
          return this;
        },
        like: function () {
          return this;
        },
        ilike: function () {
          return this;
        },
        is: function () {
          return this;
        },
        in: function () {
          return this;
        },
        contains: function () {
          return this;
        },
        containedBy: function () {
          return this;
        },
        rangeGt: function () {
          return this;
        },
        rangeGte: function () {
          return this;
        },
        rangeLt: function () {
          return this;
        },
        rangeLte: function () {
          return this;
        },
        rangeAdjacent: function () {
          return this;
        },
        overlaps: function () {
          return this;
        },
        textSearch: function () {
          return this;
        },
        match: function () {
          return this;
        },
        not: function () {
          return this;
        },
        or: function () {
          return this;
        },
        filter: function () {
          return this;
        },
        order: function () {
          return this;
        },
        limit: function () {
          return this;
        },
        range: function () {
          return this;
        },
        abortSignal: function () {
          return this;
        },
        single: function () {
          return this;
        },
        maybeSingle: function () {
          return this;
        },
        csv: function () {
          return this;
        },
        then: function () {
          return Promise.resolve({ data: null, error: new Error("Use API routes instead") });
        },
      };
    },
    auth: {
      signInWithPassword: () =>
        Promise.resolve({
          data: null,
          error: new Error("Use /api/auth/login instead"),
        }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () =>
        Promise.resolve({
          data: { user: null },
          error: new Error("Authentication moved to API routes"),
        }),
    },
  };
}
