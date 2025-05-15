import { users, type User, type InsertUser, announcements, type Announcement, type InsertAnnouncement, questions, type Question, type InsertQuestion, announcementReadStatuses, type ReadStatus, type InsertReadStatus, UserRole, Department, Location } from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, or, like, desc } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Define interface for storage
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Announcement methods
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  getAnnouncementWithDetails(id: number): Promise<any | undefined>;
  getAllAnnouncements(): Promise<Announcement[]>;
  deleteAnnouncement(id: number): Promise<boolean>;
  searchAnnouncements(query: string): Promise<Announcement[]>;
  
  // Question methods
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByUser(userId: number): Promise<Question[]>;
  getQuestionsByAnnouncement(announcementId: number): Promise<Question[]>;
  getReceivedQuestions(adminId: number): Promise<Question[]>;
  answerQuestion(id: number, answerText: string, answeredById: number): Promise<Question | undefined>;
  resolveQuestion(id: number): Promise<Question | undefined>;
  
  // Read status methods
  getReadStatus(userId: number, announcementId: number): Promise<ReadStatus | undefined>;
  setReadStatus(userId: number, announcementId: number, isRead: boolean): Promise<ReadStatus>;
  
  // Session store
  sessionStore: session.SessionStore;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    // Set up session store
    if (process.env.DATABASE_URL) {
      this.sessionStore = new PostgresSessionStore({ 
        conObject: {
          connectionString: process.env.DATABASE_URL
        },
        createTableIfMissing: true
      });
    } else {
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000, // 24 hours
      });
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Announcement methods
  async createAnnouncement(announcementData: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db
      .insert(announcements)
      .values(announcementData)
      .returning();
    return announcement;
  }
  
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    const [announcement] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id));
    return announcement;
  }
  
  async getAnnouncementWithDetails(id: number): Promise<any | undefined> {
    const [announcement] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id));
      
    if (!announcement) return undefined;
    
    // Get author details
    const [author] = await db
      .select()
      .from(users)
      .where(eq(users.id, announcement.authorId));
      
    // Get questions for this announcement
    const announcementQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.announcementId, id));
      
    return {
      ...announcement,
      author,
      questions: announcementQuestions
    };
  }
  
  async getAllAnnouncements(): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));
  }
  
  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await db
      .delete(announcements)
      .where(eq(announcements.id, id));
    
    return result.rowCount > 0;
  }
  
  async searchAnnouncements(query: string): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .where(
        or(
          like(announcements.title, `%${query}%`),
          like(announcements.message, `%${query}%`)
        )
      );
  }
  
  // Question methods
  async createQuestion(questionData: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(questionData)
      .returning();
    return question;
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id));
    return question;
  }
  
  async getQuestionsByUser(userId: number): Promise<Question[]> {
    // Get questions asked by this user with announcement details
    const userQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.askerId, userId))
      .orderBy(desc(questions.createdAt));
      
    // For each question, get the announcement details and answerer details
    const questionsWithDetails = await Promise.all(
      userQuestions.map(async (question) => {
        const [announcement] = await db
          .select()
          .from(announcements)
          .where(eq(announcements.id, question.announcementId));
          
        let answerer = null;
        if (question.answeredById) {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, question.answeredById));
          answerer = user;
        }
        
        return {
          ...question,
          announcement,
          answeredBy: answerer
        };
      })
    );
    
    return questionsWithDetails;
  }
  
  async getQuestionsByAnnouncement(announcementId: number): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.announcementId, announcementId));
  }
  
  async getReceivedQuestions(adminId: number): Promise<Question[]> {
    // Get announcements created by this admin
    const adminAnnouncements = await db
      .select()
      .from(announcements)
      .where(eq(announcements.authorId, adminId));
      
    if (adminAnnouncements.length === 0) return [];
    
    // Get questions for these announcements
    const announcementIds = adminAnnouncements.map(a => a.id);
    const receivedQuestions = await db
      .select()
      .from(questions)
      .where(inArray(questions.announcementId, announcementIds))
      .orderBy(desc(questions.createdAt));
      
    // Get additional details for each question
    const questionsWithDetails = await Promise.all(
      receivedQuestions.map(async (question) => {
        const [announcement] = await db
          .select()
          .from(announcements)
          .where(eq(announcements.id, question.announcementId));
          
        const [asker] = await db
          .select()
          .from(users)
          .where(eq(users.id, question.askerId));
          
        return {
          ...question,
          announcement,
          asker
        };
      })
    );
    
    return questionsWithDetails;
  }
  
  async answerQuestion(id: number, answerText: string, answeredById: number): Promise<Question | undefined> {
    const [updatedQuestion] = await db
      .update(questions)
      .set({
        answerText,
        answeredById,
        answeredAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(questions.id, id))
      .returning();
    
    return updatedQuestion;
  }
  
  async resolveQuestion(id: number): Promise<Question | undefined> {
    const [updatedQuestion] = await db
      .update(questions)
      .set({
        isResolved: true,
        updatedAt: new Date()
      })
      .where(eq(questions.id, id))
      .returning();
    
    return updatedQuestion;
  }
  
  // Read status methods
  async getReadStatus(userId: number, announcementId: number): Promise<ReadStatus | undefined> {
    const [status] = await db
      .select()
      .from(announcementReadStatuses)
      .where(
        and(
          eq(announcementReadStatuses.userId, userId),
          eq(announcementReadStatuses.announcementId, announcementId)
        )
      );
    
    return status;
  }
  
  async setReadStatus(userId: number, announcementId: number, isRead: boolean): Promise<ReadStatus> {
    // Check if a status already exists
    const existingStatus = await this.getReadStatus(userId, announcementId);
    
    if (existingStatus) {
      // Update existing status
      const [updatedStatus] = await db
        .update(announcementReadStatuses)
        .set({
          isRead,
          readAt: isRead ? new Date() : null
        })
        .where(
          and(
            eq(announcementReadStatuses.userId, userId),
            eq(announcementReadStatuses.announcementId, announcementId)
          )
        )
        .returning();
      
      return updatedStatus;
    } else {
      // Create new status
      const [newStatus] = await db
        .insert(announcementReadStatuses)
        .values({
          userId,
          announcementId,
          isRead,
          readAt: isRead ? new Date() : null
        })
        .returning();
      
      return newStatus;
    }
  }
}

// Create and export storage instance
export const storage = new DatabaseStorage();
