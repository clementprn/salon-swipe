import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Événements (salons) ──────────────────────────────────────
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  location: varchar("location", { length: 255 }),
  startDate: varchar("startDate", { length: 50 }),
  endDate: varchar("endDate", { length: 50 }),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("#2C3E7A"),
  logoUrl: varchar("logoUrl", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

// ── Exposants ────────────────────────────────────────────────
export const exhibitors = mysqlTable("exhibitors", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  stand: varchar("stand", { length: 50 }),
  website: varchar("website", { length: 500 }),
  description: text("description"),
  shortDescription: varchar("shortDescription", { length: 300 }),
  sector: varchar("sector", { length: 255 }),
  themes: text("themes").default("[]"),  // stored as JSON string
  tier: mysqlEnum("tier", ["A", "B", "C", "D"]).default("C").notNull(),
  sodexoScore: int("sodexoScore").default(0),
  sodexoReason: text("sodexoReason"),
  thematicTags: text("thematicTags").default("[]"),  // stored as JSON string
  logoUrl: varchar("logoUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Exhibitor = typeof exhibitors.$inferSelect;
export type InsertExhibitor = typeof exhibitors.$inferInsert;

// ── Votes ────────────────────────────────────────────────────
export const votes = mysqlTable("votes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exhibitorId: int("exhibitorId").notNull(),
  eventId: int("eventId").notNull(),
  voteType: mysqlEnum("voteType", ["like", "superlike", "dislike"]).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vote = typeof votes.$inferSelect;
export type InsertVote = typeof votes.$inferInsert;

// ── Équipes ──────────────────────────────────────────────────
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  eventId: int("eventId").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

export const teamMembers = mysqlTable("teamMembers", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  eventId: int("eventId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;

export const inviteTokens = mysqlTable("inviteTokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  teamId: int("teamId").notNull(),
  createdBy: int("createdBy").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InviteToken = typeof inviteTokens.$inferSelect;

// ── Liste d'attente ──────────────────────────────────────────
export const waitlist = mysqlTable("waitlist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  company: varchar("company", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WaitlistEntry = typeof waitlist.$inferSelect;
