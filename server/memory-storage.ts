import { IStorage } from "./storage";
import { User, InsertUser, Announcement, InsertAnnouncement, Question, InsertQuestion, ReadStatus, UserRole, Department, Location } from "../shared/schema.js";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemoryStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private announcements: Map<number, Announcement> = new Map();
  private questions: Map<number, Question> = new Map();
  private readStatuses: Map<string, ReadStatus> = new Map();
  private nextUserId = 1;
  private nextAnnouncementId = 1;
  private nextQuestionId = 1;
  
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Initialize with demo data
    this.initializeDemoData();
  }
  
  private initializeDemoData() {
    // Create demo admin user
    const adminUser: User = {
      id: 1,
      username: "admin",
      email: "admin@auralis.com",
      name: "Administrator",
      password: "$2b$10$YourHashedPasswordHere", // Not used in demo mode
      role: UserRole.ADMIN,
      departments: [Department.DESENVOLVIMENTO, Department.FINANCEIRO],
      location: Location.SEDE,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);
    this.nextUserId = 2;
    
    // Create demo reader user
    const readerUser: User = {
      id: 2,
      username: "user",
      email: "user@auralis.com", 
      name: "User Reader",
      password: "$2b$10$YourHashedPasswordHere", // Not used in demo mode
      role: UserRole.READER,
      departments: [Department.DESENVOLVIMENTO],
      location: Location.SEDE,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(readerUser.id, readerUser);
    this.nextUserId = 3;
    
    // Create some demo announcements
    const demoAnnouncements: Announcement[] = [
      {
        id: 1,
        title: "Bem-vindo ao Sistema Auralis",
        message: "Este é o novo sistema de comunicados corporativos da empresa. Aqui você poderá acompanhar todos os comunicados importantes.",
        type: 'general',
        priority: 'high',
        departments: [],
        locations: [],
        attachmentPath: null,
        authorId: 1,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        title: "Nova Política de Home Office",
        message: "A partir do próximo mês, implementaremos uma nova política de trabalho remoto. Todos os colaboradores poderão trabalhar de casa até 3 dias por semana.",
        type: 'policy',
        priority: 'medium',
        departments: [],
        locations: [],
        attachmentPath: null,
        authorId: 1,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 3,
        title: "Atualização do Sistema de Ponto",
        message: "O sistema de ponto eletrônico será atualizado no próximo final de semana. Durante este período, utilize o formulário de backup.",
        type: 'update',
        priority: 'low',
        departments: [Department.DESENVOLVIMENTO, Department.TECNOLOGIA],
        locations: [Location.SEDE],
        attachmentPath: null,
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    demoAnnouncements.forEach(announcement => {
      this.announcements.set(announcement.id, announcement);
    });
    this.nextAnnouncementId = 4;
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      ...userData,
      id: this.nextUserId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      ...userData,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Announcement methods
  async createAnnouncement(announcementData: InsertAnnouncement): Promise<Announcement> {
    const announcement: Announcement = {
      ...announcementData,
      id: this.nextAnnouncementId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.announcements.set(announcement.id, announcement);
    return announcement;
  }
  
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    return this.announcements.get(id);
  }
  
  async getAnnouncementWithDetails(id: number): Promise<any | undefined> {
    const announcement = this.announcements.get(id);
    if (!announcement) return undefined;
    
    const author = this.users.get(announcement.authorId);
    const questions = Array.from(this.questions.values())
      .filter(q => q.announcementId === id);
    
    return {
      ...announcement,
      author,
      questions
    };
  }
  
  async getAllAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async deleteAnnouncement(id: number): Promise<boolean> {
    return this.announcements.delete(id);
  }
  
  async searchAnnouncements(query: string): Promise<Announcement[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.announcements.values()).filter(a => 
      a.title.toLowerCase().includes(lowerQuery) ||
      a.message.toLowerCase().includes(lowerQuery)
    );
  }
  
  // Question methods
  async createQuestion(questionData: InsertQuestion): Promise<Question> {
    const question: Question = {
      ...questionData,
      id: this.nextQuestionId++,
      isResolved: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.questions.set(question.id, question);
    return question;
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async getQuestionsByUser(userId: number): Promise<Question[]> {
    const userQuestions = Array.from(this.questions.values())
      .filter(q => q.askerId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return Promise.all(userQuestions.map(async (question) => {
      const announcement = this.announcements.get(question.announcementId);
      const answerer = question.answeredById ? this.users.get(question.answeredById) : null;
      
      return {
        ...question,
        announcement,
        answeredBy: answerer
      };
    }));
  }
  
  async getQuestionsByAnnouncement(announcementId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.announcementId === announcementId);
  }
  
  async getReceivedQuestions(adminId: number): Promise<Question[]> {
    const adminAnnouncements = Array.from(this.announcements.values())
      .filter(a => a.authorId === adminId);
    
    if (adminAnnouncements.length === 0) return [];
    
    const announcementIds = adminAnnouncements.map(a => a.id);
    const receivedQuestions = Array.from(this.questions.values())
      .filter(q => announcementIds.includes(q.announcementId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return Promise.all(receivedQuestions.map(async (question) => {
      const announcement = this.announcements.get(question.announcementId);
      const asker = this.users.get(question.askerId);
      
      return {
        ...question,
        announcement,
        asker
      };
    }));
  }
  
  async answerQuestion(id: number, answerText: string, answeredById: number): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion = {
      ...question,
      answerText,
      answeredById,
      answeredAt: new Date(),
      updatedAt: new Date()
    };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async resolveQuestion(id: number): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion = {
      ...question,
      isResolved: true,
      updatedAt: new Date()
    };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  // Read status methods
  async getReadStatus(userId: number, announcementId: number): Promise<ReadStatus | undefined> {
    const key = `${userId}-${announcementId}`;
    return this.readStatuses.get(key);
  }
  
  async setReadStatus(userId: number, announcementId: number, isRead: boolean): Promise<ReadStatus> {
    const key = `${userId}-${announcementId}`;
    const existingStatus = this.readStatuses.get(key);
    
    const status: ReadStatus = existingStatus ? {
      ...existingStatus,
      isRead,
      readAt: isRead ? new Date() : null
    } : {
      userId,
      announcementId,
      isRead,
      readAt: isRead ? new Date() : null
    };
    
    this.readStatuses.set(key, status);
    return status;
  }
}