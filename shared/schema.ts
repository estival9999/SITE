import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums for the database
export enum UserRole {
  ADMIN = "ADMIN",
  READER = "READER"
}

export enum Department {
  CONTROLES_INTERNOS = "CONTROLES_INTERNOS",
  ADMINISTRATIVO = "ADMINISTRATIVO",
  CICLO_DE_CREDITO = "CICLO_DE_CREDITO"
}

export enum Category {
  INFORMATIVO = "INFORMATIVO",
  ATUALIZACAO = "ATUALIZACAO",
  DETERMINACAO = "DETERMINACAO"
}

export enum Location {
  MARACAJU = "MARACAJU",
  SIDROLANDIA = "SIDROLANDIA",
  AQUIDAUANA = "AQUIDAUANA",
  NIOAQUE = "NIOAQUE"
}

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").$type<UserRole>().notNull().default(UserRole.READER),
  actingDepartment: text("acting_department").$type<Department>(),
  assignedLocations: text("assigned_locations").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdAnnouncements: many(announcements),
  askedQuestions: many(questions, { relationName: "asker" }),
  answeredQuestions: many(questions, { relationName: "answerer" }),
  readStatuses: many(announcementReadStatuses),
}));

// Announcements Table
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  attachment: text("attachment"),
  department: text("department").$type<Department>().notNull(),
  category: text("category").$type<Category>().notNull(),
  targetedLocations: text("targeted_locations").array().notNull(),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Announcement Relations
export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
  questions: many(questions),
  readStatuses: many(announcementReadStatuses),
}));

// Questions Table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  announcementId: integer("announcement_id").notNull().references(() => announcements.id, { onDelete: "cascade" }),
  askerId: integer("asker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  answerText: text("answer_text"),
  answeredById: integer("answered_by_id").references(() => users.id, { onDelete: "set null" }),
  answeredAt: timestamp("answered_at"),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Question Relations
export const questionsRelations = relations(questions, ({ one }) => ({
  announcement: one(announcements, {
    fields: [questions.announcementId],
    references: [announcements.id],
  }),
  asker: one(users, {
    fields: [questions.askerId],
    references: [users.id],
    relationName: "asker",
  }),
  answeredBy: one(users, {
    fields: [questions.answeredById],
    references: [users.id],
    relationName: "answerer",
  }),
}));

// Announcement Read Status Table (Many-to-Many between Users and Announcements)
export const announcementReadStatuses = pgTable(
  "announcement_read_statuses",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    announcementId: integer("announcement_id")
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    isRead: boolean("is_read").default(false),
    readAt: timestamp("read_at"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.announcementId] }),
  })
);

// AnnouncementReadStatus Relations
export const announcementReadStatusesRelations = relations(
  announcementReadStatuses,
  ({ one }) => ({
    user: one(users, {
      fields: [announcementReadStatuses.userId],
      references: [users.id],
    }),
    announcement: one(announcements, {
      fields: [announcementReadStatuses.announcementId],
      references: [announcements.id],
    }),
  })
);

// Zod schemas for validation and type inference
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  answerText: true,
  answeredById: true,
  answeredAt: true,
  isResolved: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReadStatusSchema = createInsertSchema(announcementReadStatuses).omit({
  readAt: true,
});

// User registration schema
export const userRegistrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  role: z.nativeEnum(UserRole),
  actingDepartment: z.nativeEnum(Department).nullable().optional(),
  assignedLocations: z.array(z.nativeEnum(Location)).optional(),
});

// Login schema
export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Types for database operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertReadStatus = z.infer<typeof insertReadStatusSchema>;
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// Types for database selection
export type User = typeof users.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type ReadStatus = typeof announcementReadStatuses.$inferSelect;
