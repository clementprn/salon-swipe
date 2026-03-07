import { eq, and, ne, notInArray, desc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, events, exhibitors, votes, teams, teamMembers, inviteTokens, waitlist } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Events ───────────────────────────────────────────────────
export async function getEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).where(eq(events.isActive, true)).orderBy(events.name);
}

export async function getEventBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  return result[0];
}

// ── Exhibitors ───────────────────────────────────────────────
export async function getExhibitorsByEvent(eventId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exhibitors)
    .where(eq(exhibitors.eventId, eventId))
    .orderBy(exhibitors.tier, exhibitors.sodexoScore)
    .limit(limit)
    .offset(offset);
}

export async function getNextExhibitorToSwipe(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) return null;

  // Trouver les IDs déjà votés par cet utilisateur pour cet événement
  const votedRows = await db.select({ exhibitorId: votes.exhibitorId })
    .from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.eventId, eventId)));

  const votedIds = votedRows.map(r => r.exhibitorId);

  // Prendre le prochain exposant non voté, trié par tier puis score
  const query = db.select().from(exhibitors)
    .where(
      votedIds.length > 0
        ? and(eq(exhibitors.eventId, eventId), notInArray(exhibitors.id, votedIds))
        : eq(exhibitors.eventId, eventId)
    )
    .orderBy(
      sql`FIELD(${exhibitors.tier}, 'A', 'B', 'C', 'D')`,
      desc(exhibitors.sodexoScore)
    )
    .limit(1);

  const result = await query;
  return result[0] ?? null;
}

export async function getSwipeQueue(userId: number, eventId: number, batchSize = 5) {
  const db = await getDb();
  if (!db) return [];

  const votedRows = await db.select({ exhibitorId: votes.exhibitorId })
    .from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.eventId, eventId)));

  const votedIds = votedRows.map(r => r.exhibitorId);

  const query = db.select().from(exhibitors)
    .where(
      votedIds.length > 0
        ? and(eq(exhibitors.eventId, eventId), notInArray(exhibitors.id, votedIds))
        : eq(exhibitors.eventId, eventId)
    )
    .orderBy(
      sql`FIELD(${exhibitors.tier}, 'A', 'B', 'C', 'D')`,
      desc(exhibitors.sodexoScore)
    )
    .limit(batchSize);

  return query;
}

export async function getExhibitorById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(exhibitors).where(eq(exhibitors.id, id)).limit(1);
  return result[0] ?? null;
}

export async function countRemainingExhibitors(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) return 0;

  const votedRows = await db.select({ exhibitorId: votes.exhibitorId })
    .from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.eventId, eventId)));

  const votedIds = votedRows.map(r => r.exhibitorId);

  const result = await db.select({ count: sql<number>`COUNT(*)` })
    .from(exhibitors)
    .where(
      votedIds.length > 0
        ? and(eq(exhibitors.eventId, eventId), notInArray(exhibitors.id, votedIds))
        : eq(exhibitors.eventId, eventId)
    );

  return Number(result[0]?.count ?? 0);
}

// ── Votes ────────────────────────────────────────────────────
export async function castVote(userId: number, exhibitorId: number, eventId: number, voteType: 'like' | 'superlike' | 'dislike', note?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Upsert : si déjà voté, mettre à jour
  const existing = await db.select().from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.exhibitorId, exhibitorId)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(votes)
      .set({ voteType, note: note ?? null, updatedAt: new Date() })
      .where(eq(votes.id, existing[0].id));
    return { ...existing[0], voteType, note };
  } else {
    const result = await db.insert(votes).values({ userId, exhibitorId, eventId, voteType, note: note ?? null });
    return { id: Number((result as any).insertId), userId, exhibitorId, eventId, voteType, note };
  }
}

export async function deleteVote(userId: number, exhibitorId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(votes).where(and(eq(votes.userId, userId), eq(votes.exhibitorId, exhibitorId)));
}

export async function deleteAllVotes(userId: number, eventId?: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const condition = eventId
    ? and(eq(votes.userId, userId), eq(votes.eventId, eventId))
    : eq(votes.userId, userId);
  await db.delete(votes).where(condition);
}

export async function getLastVote(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.eventId, eventId)))
    .orderBy(desc(votes.updatedAt))
    .limit(1);
  return result[0] ?? null;
}

export async function getMyVotes(userId: number, eventId?: number) {
  const db = await getDb();
  if (!db) return [];

  const condition = eventId
    ? and(eq(votes.userId, userId), eq(votes.eventId, eventId))
    : eq(votes.userId, userId);

  const myVotes = await db.select().from(votes).where(condition).orderBy(desc(votes.updatedAt));

  // Enrichir avec les données exposants
  if (myVotes.length === 0) return [];
  const exhibitorIds = myVotes.map(v => v.exhibitorId);
  const exhibitorList = await db.select().from(exhibitors).where(inArray(exhibitors.id, exhibitorIds));
  const exMap = new Map(exhibitorList.map(e => [e.id, e]));

  return myVotes.map(v => ({
    ...v,
    exhibitor: exMap.get(v.exhibitorId) ?? null,
  }));
}

export async function getTeamVotes(eventId?: number) {
  const db = await getDb();
  if (!db) return [];

  const condition = eventId ? eq(votes.eventId, eventId) : undefined;
  const allVotes = await db.select().from(votes)
    .where(condition)
    .orderBy(desc(votes.updatedAt));

  if (allVotes.length === 0) return [];

  const exhibitorIds = Array.from(new Set(allVotes.map(v => v.exhibitorId)));
  const userIds = Array.from(new Set(allVotes.map(v => v.userId)));

  const exhibitorList = await db.select().from(exhibitors).where(inArray(exhibitors.id, exhibitorIds));
  const userList = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, userIds));

  const exMap = new Map(exhibitorList.map(e => [e.id, e]));
  const userMap = new Map(userList.map(u => [u.id, u]));

  return allVotes.map(v => ({
    ...v,
    exhibitor: exMap.get(v.exhibitorId) ?? null,
    user: userMap.get(v.userId) ?? null,
  }));
}

export async function getVoteStats(eventId?: number) {
  const db = await getDb();
  if (!db) return { total: 0, likes: 0, superlikes: 0, dislikes: 0, byTier: {}, byThematic: {}, byUser: [] };

  const condition = eventId ? eq(votes.eventId, eventId) : undefined;

  const [totals] = await db.select({
    total: sql<number>`COUNT(*)`,
    likes: sql<number>`SUM(CASE WHEN voteType='like' THEN 1 ELSE 0 END)`,
    superlikes: sql<number>`SUM(CASE WHEN voteType='superlike' THEN 1 ELSE 0 END)`,
    dislikes: sql<number>`SUM(CASE WHEN voteType='dislike' THEN 1 ELSE 0 END)`,
  }).from(votes).where(condition);

  // Stats par tier
  const tierStats = await db.select({
    tier: exhibitors.tier,
    voteType: votes.voteType,
    count: sql<number>`COUNT(*)`,
  })
    .from(votes)
    .innerJoin(exhibitors, eq(votes.exhibitorId, exhibitors.id))
    .where(condition)
    .groupBy(exhibitors.tier, votes.voteType);

  const byTier: Record<string, Record<string, number>> = {};
  for (const r of tierStats) {
    if (!byTier[r.tier]) byTier[r.tier] = {};
    byTier[r.tier][r.voteType] = Number(r.count);
  }

  // Stats par utilisateur
  const userStats = await db.select({
    userId: votes.userId,
    userName: users.name,
    total: sql<number>`COUNT(*)`,
    likes: sql<number>`SUM(CASE WHEN ${votes.voteType}='like' THEN 1 ELSE 0 END)`,
    superlikes: sql<number>`SUM(CASE WHEN ${votes.voteType}='superlike' THEN 1 ELSE 0 END)`,
    dislikes: sql<number>`SUM(CASE WHEN ${votes.voteType}='dislike' THEN 1 ELSE 0 END)`,
  })
    .from(votes)
    .leftJoin(users, eq(votes.userId, users.id))
    .where(condition)
    .groupBy(votes.userId, users.name);

  return {
    total: Number(totals?.total ?? 0),
    likes: Number(totals?.likes ?? 0),
    superlikes: Number(totals?.superlikes ?? 0),
    dislikes: Number(totals?.dislikes ?? 0),
    byTier,
    byUser: userStats.map(u => ({
      userId: u.userId,
      userName: u.userName ?? 'Anonyme',
      total: Number(u.total),
      likes: Number(u.likes),
      superlikes: Number(u.superlikes),
      dislikes: Number(u.dislikes),
    })),
  };
}

// ── Teams ─────────────────────────────────────────────────────
export async function getTeams(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teams).where(eq(teams.eventId, eventId)).orderBy(teams.name);
}

export async function getMyTeam(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) return null;

  // Trouver le membership de cet user pour cet event
  const membership = await db.select().from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.eventId, eventId)))
    .limit(1);

  if (membership.length === 0) return null;

  const team = await db.select().from(teams)
    .where(eq(teams.id, membership[0].teamId))
    .limit(1);

  if (team.length === 0) return null;

  // Récupérer les membres
  const members = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
  })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(and(eq(teamMembers.teamId, team[0].id), eq(teamMembers.eventId, eventId)));

  return { ...team[0], members };
}

export async function createTeam(userId: number, name: string, eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Créer l'équipe
  await db.insert(teams).values({ name, eventId, createdBy: userId });

  // Récupérer l'ID de la dernière équipe créée par cet utilisateur
  const [created] = await db.select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.createdBy, userId), eq(teams.eventId, eventId)))
    .orderBy(desc(teams.createdAt))
    .limit(1);

  const teamId = created.id;

  // Ajouter le créateur comme membre
  await db.insert(teamMembers).values({ userId, teamId, eventId });

  return { id: teamId, name, eventId, createdBy: userId };
}

export async function joinTeam(userId: number, teamId: number, eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Vérifier si déjà membre d'une équipe pour cet event
  const existing = await db.select().from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.eventId, eventId)))
    .limit(1);

  if (existing.length > 0) {
    // Changer d'équipe
    await db.update(teamMembers)
      .set({ teamId })
      .where(and(eq(teamMembers.userId, userId), eq(teamMembers.eventId, eventId)));
  } else {
    await db.insert(teamMembers).values({ userId, teamId, eventId });
  }

  return { success: true, teamId };
}

export async function createInviteToken(userId: number, teamId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Générer un token unique
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

  await db.insert(inviteTokens).values({ token, teamId, createdBy: userId, expiresAt });
  return token;
}

export async function resolveInviteToken(userId: number, token: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const invite = await db.select().from(inviteTokens)
    .where(eq(inviteTokens.token, token))
    .limit(1);

  if (invite.length === 0) throw new Error("Lien d'invitation invalide");
  if (invite[0].expiresAt < new Date()) throw new Error("Lien d'invitation expiré");

  // Récupérer l'équipe pour avoir l'eventId
  const team = await db.select().from(teams).where(eq(teams.id, invite[0].teamId)).limit(1);
  if (team.length === 0) throw new Error("Équipe introuvable");

  await joinTeam(userId, invite[0].teamId, team[0].eventId);
  return { success: true, teamId: invite[0].teamId, teamName: team[0].name, eventId: team[0].eventId };
}

// ── AI Stats ──────────────────────────────────────────────────
export async function getVoteStatsForAI(userId: number, eventId?: number) {
  const db = await getDb();
  if (!db) return {};

  const condition = eventId ? eq(votes.eventId, eventId) : undefined;

  // Top exposants likés par l'équipe
  const topLiked = await db.select({
    name: exhibitors.name,
    stand: exhibitors.stand,
    tier: exhibitors.tier,
    sector: exhibitors.sector,
    likes: sql<number>`SUM(CASE WHEN ${votes.voteType}='like' THEN 1 ELSE 0 END)`,
    superlikes: sql<number>`SUM(CASE WHEN ${votes.voteType}='superlike' THEN 1 ELSE 0 END)`,
    dislikes: sql<number>`SUM(CASE WHEN ${votes.voteType}='dislike' THEN 1 ELSE 0 END)`,
  })
    .from(votes)
    .innerJoin(exhibitors, eq(votes.exhibitorId, exhibitors.id))
    .where(condition)
    .groupBy(exhibitors.id, exhibitors.name, exhibitors.stand, exhibitors.tier, exhibitors.sector)
    .orderBy(desc(sql`SUM(CASE WHEN ${votes.voteType}='superlike' THEN 1 ELSE 0 END) * 3 + SUM(CASE WHEN ${votes.voteType}='like' THEN 1 ELSE 0 END)`))
    .limit(20);

  // Stats globales
  const [totals] = await db.select({
    total: sql<number>`COUNT(*)`,
    likes: sql<number>`SUM(CASE WHEN voteType='like' THEN 1 ELSE 0 END)`,
    superlikes: sql<number>`SUM(CASE WHEN voteType='superlike' THEN 1 ELSE 0 END)`,
    dislikes: sql<number>`SUM(CASE WHEN voteType='dislike' THEN 1 ELSE 0 END)`,
  }).from(votes).where(condition);

  // Stats par tier
  const tierStats = await db.select({
    tier: exhibitors.tier,
    voteType: votes.voteType,
    count: sql<number>`COUNT(*)`,
  })
    .from(votes)
    .innerJoin(exhibitors, eq(votes.exhibitorId, exhibitors.id))
    .where(condition)
    .groupBy(exhibitors.tier, votes.voteType);

  // Mes votes personnels
  const myVotesData = await db.select({
    name: exhibitors.name,
    stand: exhibitors.stand,
    tier: exhibitors.tier,
    voteType: votes.voteType,
    note: votes.note,
  })
    .from(votes)
    .innerJoin(exhibitors, eq(votes.exhibitorId, exhibitors.id))
    .where(and(eq(votes.userId, userId), ...(eventId ? [eq(votes.eventId, eventId)] : [])))
    .orderBy(desc(votes.updatedAt))
    .limit(50);

  return {
    globalStats: {
      total: Number(totals?.total ?? 0),
      likes: Number(totals?.likes ?? 0),
      superlikes: Number(totals?.superlikes ?? 0),
      dislikes: Number(totals?.dislikes ?? 0),
    },
    topExhibitors: topLiked.map(e => ({
      name: e.name,
      stand: e.stand,
      tier: e.tier,
      sector: e.sector,
      likes: Number(e.likes),
      superlikes: Number(e.superlikes),
      dislikes: Number(e.dislikes),
      score: Number(e.superlikes) * 3 + Number(e.likes),
    })),
    byTier: tierStats.reduce((acc: Record<string, Record<string, number>>, r) => {
      if (!acc[r.tier]) acc[r.tier] = {};
      acc[r.tier][r.voteType] = Number(r.count);
      return acc;
    }, {}),
    myVotes: myVotesData,
  };
}

// ── Liste d'attente ──────────────────────────────────────────
export async function joinWaitlist(data: { email: string; name?: string; company?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Check if already registered
  const existing = await db.select().from(waitlist).where(eq(waitlist.email, data.email)).limit(1);
  if (existing.length > 0) {
    throw new Error("Cet email est déjà sur la liste d'attente.");
  }

  await db.insert(waitlist).values({
    email: data.email,
    name: data.name ?? null,
    company: data.company ?? null,
  });
}
