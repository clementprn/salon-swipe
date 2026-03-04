import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB functions
vi.mock("./db", () => ({
  getEvents: vi.fn().mockResolvedValue([
    { id: 1, name: "FHT 2026 - Food Hotel Tech", slug: "fht-2026", color: "#C0392B", isActive: true, location: "Paris", startDate: "2026-06-09", endDate: "2026-06-11", description: null, logoUrl: null, createdAt: new Date() },
    { id: 2, name: "TechInnov 2026", slug: "techinnov-2026", color: "#2C3E7A", isActive: true, location: "Paris-Saclay", startDate: "2026-03-24", endDate: "2026-03-24", description: null, logoUrl: null, createdAt: new Date() },
  ]),
  getEventBySlug: vi.fn().mockImplementation(async (slug: string) => {
    if (slug === "fht-2026") return { id: 1, name: "FHT 2026", slug: "fht-2026", color: "#C0392B", isActive: true };
    return undefined;
  }),
  getExhibitorsByEvent: vi.fn().mockResolvedValue([
    { id: 1, eventId: 1, name: "Adoria", stand: "C39", website: "https://adoria.com", tier: "A", sodexoScore: 98, description: "Solution FoodTech", shortDescription: "Solution FoodTech", sector: "Food", themes: "RSE, Back-Office", thematicTags: '["🍽️ Food"]', sodexoReason: "Core Sodexo", logoUrl: null, createdAt: new Date() },
  ]),
  getSwipeQueue: vi.fn().mockResolvedValue([
    { id: 1, eventId: 1, name: "Adoria", stand: "C39", website: "https://adoria.com", tier: "A", sodexoScore: 98, description: "Solution FoodTech", shortDescription: "Solution FoodTech", sector: "Food", themes: "RSE", thematicTags: '["🍽️ Food"]', sodexoReason: null, logoUrl: null, createdAt: new Date() },
    { id: 2, eventId: 1, name: "Koust", stand: "D12", website: "https://koust.net", tier: "A", sodexoScore: 96, description: "Food cost", shortDescription: "Food cost", sector: "Food", themes: "Food", thematicTags: '["🍽️ Food"]', sodexoReason: null, logoUrl: null, createdAt: new Date() },
  ]),
  getExhibitorById: vi.fn().mockResolvedValue({ id: 1, name: "Adoria", tier: "A" }),
  countRemainingExhibitors: vi.fn().mockResolvedValue(45),
  castVote: vi.fn().mockImplementation(async (userId: number, exhibitorId: number, eventId: number, voteType: string) => ({ id: 1, userId, exhibitorId, eventId, voteType, note: null })),
  deleteVote: vi.fn().mockResolvedValue(undefined),
  getLastVote: vi.fn().mockResolvedValue(null),
  getMyVotes: vi.fn().mockResolvedValue([]),
  getTeamVotes: vi.fn().mockResolvedValue([]),
  getVoteStats: vi.fn().mockResolvedValue({ total: 0, likes: 0, superlikes: 0, dislikes: 0, byTier: {}, byUser: [] }),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthCtx(overrides: Partial<NonNullable<TrpcContext["user"]>> = {}): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@sodexo.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.auth.me();
    expect(result?.name).toBe("Test User");
    expect(result?.email).toBe("test@sodexo.com");
  });

  it("logout clears session cookie", async () => {
    const ctx = createAuthCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("events", () => {
  it("list returns all active events", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const events = await caller.events.list();
    expect(events).toHaveLength(2);
    expect(events[0].name).toBe("FHT 2026 - Food Hotel Tech");
    expect(events[1].name).toBe("TechInnov 2026");
  });

  it("getBySlug returns correct event", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const event = await caller.events.getBySlug({ slug: "fht-2026" });
    expect(event?.slug).toBe("fht-2026");
    expect(event?.color).toBe("#C0392B");
  });

  it("getBySlug returns undefined for unknown slug", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const event = await caller.events.getBySlug({ slug: "unknown-event" });
    expect(event).toBeUndefined();
  });
});

describe("exhibitors", () => {
  it("list returns exhibitors for event", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const exhibitors = await caller.exhibitors.list({ eventId: 1 });
    expect(exhibitors).toHaveLength(1);
    expect(exhibitors[0].name).toBe("Adoria");
    expect(exhibitors[0].tier).toBe("A");
  });

  it("swipeQueue requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.exhibitors.swipeQueue({ eventId: 1 })).rejects.toThrow();
  });

  it("swipeQueue returns queue and remaining count for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.exhibitors.swipeQueue({ eventId: 1 });
    expect(result.queue).toHaveLength(2);
    expect(result.remaining).toBe(45);
    expect(result.queue[0].name).toBe("Adoria");
  });

  it("swipeQueue respects batchSize parameter", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.exhibitors.swipeQueue({ eventId: 1, batchSize: 3 });
    expect(result.queue.length).toBeLessThanOrEqual(3);
  });
});

describe("votes", () => {
  it("cast requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.votes.cast({ exhibitorId: 1, eventId: 1, voteType: "like" })).rejects.toThrow();
  });

  it("cast like vote successfully", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.votes.cast({ exhibitorId: 1, eventId: 1, voteType: "like" });
    expect(result.voteType).toBe("like");
  });

  it("cast superlike vote successfully", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.votes.cast({ exhibitorId: 1, eventId: 1, voteType: "superlike" });
    expect(result.voteType).toBe("superlike");
  });

  it("cast dislike vote successfully", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.votes.cast({ exhibitorId: 1, eventId: 1, voteType: "dislike" });
    expect(result.voteType).toBe("dislike");
  });

  it("undo vote requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.votes.undo({ exhibitorId: 1 })).rejects.toThrow();
  });

  it("undo vote succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.votes.undo({ exhibitorId: 1 });
    expect(result.success).toBe(true);
  });

  it("myVotes returns empty array when no votes", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const votes = await caller.votes.myVotes({});
    expect(votes).toHaveLength(0);
  });

  it("teamVotes requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.votes.teamVotes({})).rejects.toThrow();
  });

  it("stats returns zero counts when no votes", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const stats = await caller.votes.stats({});
    expect(stats.total).toBe(0);
    expect(stats.likes).toBe(0);
    expect(stats.superlikes).toBe(0);
    expect(stats.dislikes).toBe(0);
  });

  it("vote type enum validation rejects invalid type", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    await expect(
      caller.votes.cast({ exhibitorId: 1, eventId: 1, voteType: "invalid" as any })
    ).rejects.toThrow();
  });
});
