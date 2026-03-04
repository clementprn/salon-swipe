import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getEvents, getEventBySlug,
  getExhibitorsByEvent, getNextExhibitorToSwipe, getSwipeQueue,
  getExhibitorById, countRemainingExhibitors,
  castVote, deleteVote, deleteAllVotes, getLastVote, getMyVotes, getTeamVotes, getVoteStats,
  getTeams, createTeam, joinTeam, getMyTeam, createInviteToken, resolveInviteToken,
  getVoteStatsForAI,
} from "./db";
import { invokeLLM } from "./_core/llm";

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

    delete: protectedProcedure
      .input(z.object({ exhibitorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteVote(ctx.user.id, input.exhibitorId);
        return { success: true };
      }),

    deleteAll: protectedProcedure
      .input(z.object({ eventId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        await deleteAllVotes(ctx.user.id, input.eventId);
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

    exportCsv: protectedProcedure
      .input(z.object({ eventId: z.number().optional(), scope: z.enum(['mine', 'team']).default('mine') }))
      .query(async ({ ctx, input }) => {
        const data = input.scope === 'team'
          ? await getTeamVotes(input.eventId)
          : await getMyVotes(ctx.user.id, input.eventId);

        // Build CSV
        const header = 'Exposant,Stand,Tier,Vote,Note,Votant,Date';
        const rows = data.map((v: any) => [
          `"${(v.exhibitor?.name ?? '').replace(/"/g, '""')}"`,
          `"${(v.exhibitor?.stand ?? '').replace(/"/g, '""')}"`,
          v.exhibitor?.tier ?? '',
          v.voteType,
          `"${(v.note ?? '').replace(/"/g, '""')}"`,
          `"${(v.user?.name ?? v.userName ?? 'Moi').replace(/"/g, '""')}"`,
          new Date(v.createdAt).toLocaleDateString('fr-FR'),
        ].join(','));

        return { csv: [header, ...rows].join('\n'), count: data.length };
      }),
  }),

  // ── Teams ──────────────────────────────────────────────────
  teams: router({
    myTeam: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getMyTeam(ctx.user.id, input.eventId);
      }),

    list: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return getTeams(input.eventId);
      }),

    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(50), eventId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return createTeam(ctx.user.id, input.name, input.eventId);
      }),

    join: protectedProcedure
      .input(z.object({ teamId: z.number(), eventId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return joinTeam(ctx.user.id, input.teamId, input.eventId);
      }),

    createInvite: protectedProcedure
      .input(z.object({ teamId: z.number(), origin: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const token = await createInviteToken(ctx.user.id, input.teamId);
        const url = `${input.origin}/join?token=${token}`;
        return { url, token };
      }),

    resolveInvite: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return resolveInviteToken(ctx.user.id, input.token);
      }),
  }),

  // ── AI Chat ────────────────────────────────────────────────
  ai: router({
    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(500),
        eventId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Récupérer le contexte des votes
        const stats = await getVoteStatsForAI(ctx.user.id, input.eventId);

        const systemPrompt = `Tu es un assistant expert en analyse de salons professionnels pour SalonSwipe.
Tu aides les utilisateurs à explorer leurs données de vote sur les exposants d'un salon.

Données de vote actuelles :
${JSON.stringify(stats, null, 2)}

Règles :
- Réponds UNIQUEMENT sur les données de vote présentes ci-dessus
- Sois concis (max 3-4 phrases)
- Utilise des chiffres précis quand disponibles
- Réponds en français
- Ne propose pas de fonctionnalités externes
- Si la question sort du contexte des votes/exposants, redirige poliment`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input.message },
          ],
        });

        return { reply: response.choices[0]?.message?.content ?? 'Désolé, je n\'ai pas pu analyser les données.' };
      }),
  }),
});

export type AppRouter = typeof appRouter;
