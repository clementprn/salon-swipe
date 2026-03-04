import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getEvents, getEventBySlug,
  getExhibitorsByEvent, getNextExhibitorToSwipe, getSwipeQueue,
  getExhibitorById, countRemainingExhibitors,
  castVote, deleteVote, getLastVote, getMyVotes, getTeamVotes, getVoteStats,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Events ─────────────────────────────────────────────────
  events: router({
    list: publicProcedure.query(async () => {
      return getEvents();
    }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getEventBySlug(input.slug);
      }),
  }),

  // ── Exhibitors ─────────────────────────────────────────────
  exhibitors: router({
    list: publicProcedure
      .input(z.object({ eventId: z.number(), limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return getExhibitorsByEvent(input.eventId, input.limit, input.offset);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getExhibitorById(input.id);
      }),

    // File de swipe : prochain exposant à voter
    swipeQueue: protectedProcedure
      .input(z.object({ eventId: z.number(), batchSize: z.number().default(5) }))
      .query(async ({ ctx, input }) => {
        const queue = await getSwipeQueue(ctx.user.id, input.eventId, input.batchSize);
        const remaining = await countRemainingExhibitors(ctx.user.id, input.eventId);
        return { queue, remaining };
      }),

    countRemaining: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ ctx, input }) => {
        return countRemainingExhibitors(ctx.user.id, input.eventId);
      }),
  }),

  // ── Votes ──────────────────────────────────────────────────
  votes: router({
    cast: protectedProcedure
      .input(z.object({
        exhibitorId: z.number(),
        eventId: z.number(),
        voteType: z.enum(['like', 'superlike', 'dislike']),
        note: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return castVote(ctx.user.id, input.exhibitorId, input.eventId, input.voteType, input.note);
      }),

    undo: protectedProcedure
      .input(z.object({ exhibitorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteVote(ctx.user.id, input.exhibitorId);
        return { success: true };
      }),

    myVotes: protectedProcedure
      .input(z.object({ eventId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getMyVotes(ctx.user.id, input.eventId);
      }),

    teamVotes: protectedProcedure
      .input(z.object({ eventId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getTeamVotes(input.eventId);
      }),

    stats: protectedProcedure
      .input(z.object({ eventId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getVoteStats(input.eventId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
