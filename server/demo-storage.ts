import { type User, type InsertUser, type Announcement, type InsertAnnouncement, type Question, type InsertQuestion, type ReadStatus, UserRole, Department, Location } from "../shared/schema.js";
import session from "express-session";
import createMemoryStore from "memorystore";
import { IStorage } from "./storage.js";

const MemoryStore = createMemoryStore(session);

// Dados de demonstração
const demoUsers: User[] = [
  {
    id: 1,
    username: "admin",
    passwordHash: "$2b$10$xER0Un.XVVuYTANrnA8Ik.KThNhLlaW6ioMfbQOLrfCgzh4FsMJ/q", // senha: admin
    email: "admin@auralis.com",
    name: "Administrador",
    department: Department.TI,
    location: Location.MATRIZ,
    role: UserRole.ADMIN,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: 2,
    username: "user",
    passwordHash: "$2b$10$zWVyYH8K1ThtfLmv8JGV.O/d27bJxXHkIOJ9vuVNjsNax1zwgb2Ki", // senha: user
    email: "user@auralis.com",
    name: "João Silva",
    department: Department.RH,
    location: Location.MATRIZ,
    role: UserRole.READER,
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02")
  }
];

const demoAnnouncements: Announcement[] = [
  {
    id: 1,
    title: "Bem-vindo ao Sistema Auralis",
    content: "Este é um sistema de comunicados corporativos. Aqui você pode visualizar todos os comunicados da empresa.",
    department: null,
    location: null,
    attachmentPath: null,
    authorId: 1,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15")
  },
  {
    id: 2,
    title: "Novo Sistema de Ponto Eletrônico",
    content: "Informamos que a partir do próximo mês, será implementado um novo sistema de ponto eletrônico para todos os colaboradores.",
    department: Department.RH,
    location: Location.MATRIZ,
    attachmentPath: null,
    authorId: 1,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20")
  },
  {
    id: 3,
    title: "Atualização da Política de Segurança",
    content: "A política de segurança da informação foi atualizada. Todos os colaboradores devem ler o documento anexo.",
    department: Department.TI,
    location: null,
    attachmentPath: null,
    authorId: 1,
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25")
  }
];

const demoQuestions: Question[] = [
  {
    id: 1,
    announcementId: 2,
    questionText: "Qual será o horário de funcionamento do novo sistema?",
    askerId: 2,
    answeredById: 1,
    answerText: "O sistema funcionará 24 horas por dia, 7 dias por semana.",
    isResolved: true,
    answeredAt: new Date("2024-01-22"),
    createdAt: new Date("2024-01-21"),
    updatedAt: new Date("2024-01-22")
  }
];

const demoReadStatuses: ReadStatus[] = [];

// Implementação de armazenamento em memória para demonstração
export class DemoStorage implements IStorage {
  sessionStore: session.SessionStore;
  private users: User[] = [...demoUsers];
  private announcements: Announcement[] = [...demoAnnouncements];
  private questions: Question[] = [...demoQuestions];
  private readStatuses: ReadStatus[] = [...demoReadStatuses];
  private nextUserId = 3;
  private nextAnnouncementId = 4;
  private nextQuestionId = 2;
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      id: this.nextUserId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    
    this.users[index] = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date()
    };
    return this.users[index];
  }
  
  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }
  
  // Announcement methods
  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: this.nextAnnouncementId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.announcements.push(newAnnouncement);
    return newAnnouncement;
  }
  
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    return this.announcements.find(a => a.id === id);
  }
  
  async getAnnouncementWithDetails(id: number): Promise<any | undefined> {
    const announcement = this.announcements.find(a => a.id === id);
    if (!announcement) return undefined;
    
    const author = this.users.find(u => u.id === announcement.authorId);
    const questionsList = this.questions
      .filter(q => q.announcementId === id)
      .map(q => {
        const askedByUser = this.users.find(u => u.id === q.askerId);
        const answeredByUser = q.answeredById ? this.users.find(u => u.id === q.answeredById) : null;
        return {
          ...q,
          askedByUser,
          answeredByUser
        };
      });
    
    return {
      ...announcement,
      author,
      questions: questionsList
    };
  }
  
  async getAllAnnouncements(): Promise<Announcement[]> {
    return [...this.announcements].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async deleteAnnouncement(id: number): Promise<boolean> {
    const index = this.announcements.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    this.announcements.splice(index, 1);
    this.questions = this.questions.filter(q => q.announcementId !== id);
    this.readStatuses = this.readStatuses.filter(r => r.announcementId !== id);
    return true;
  }
  
  async searchAnnouncements(query: string): Promise<Announcement[]> {
    const lowercaseQuery = query.toLowerCase();
    return this.announcements.filter(a => 
      a.title.toLowerCase().includes(lowercaseQuery) ||
      a.content.toLowerCase().includes(lowercaseQuery)
    );
  }
  
  // Question methods
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const newQuestion: Question = {
      ...question,
      id: this.nextQuestionId++,
      answeredById: null,
      answerText: null,
      isResolved: false,
      answeredAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.questions.push(newQuestion);
    return newQuestion;
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.find(q => q.id === id);
  }
  
  async getQuestionsByUser(userId: number): Promise<Question[]> {
    return this.questions.filter(q => q.askerId === userId);
  }
  
  async getQuestionsByAnnouncement(announcementId: number): Promise<Question[]> {
    return this.questions.filter(q => q.announcementId === announcementId);
  }
  
  async getReceivedQuestions(adminId: number): Promise<Question[]> {
    // Para demonstração, retorna todas as perguntas para admins
    const user = await this.getUser(adminId);
    if (!user || user.role !== UserRole.ADMIN) return [];
    
    return [...this.questions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async answerQuestion(id: number, answerText: string, answeredById: number): Promise<Question | undefined> {
    const index = this.questions.findIndex(q => q.id === id);
    if (index === -1) return undefined;
    
    this.questions[index] = {
      ...this.questions[index],
      answerText: answerText,
      answeredById: answeredById,
      answeredAt: new Date(),
      updatedAt: new Date()
    };
    return this.questions[index];
  }
  
  async resolveQuestion(id: number): Promise<Question | undefined> {
    const index = this.questions.findIndex(q => q.id === id);
    if (index === -1) return undefined;
    
    this.questions[index] = {
      ...this.questions[index],
      isResolved: true,
      updatedAt: new Date()
    };
    return this.questions[index];
  }
  
  // Read status methods
  async getReadStatus(userId: number, announcementId: number): Promise<ReadStatus | undefined> {
    return this.readStatuses.find(r => r.userId === userId && r.announcementId === announcementId);
  }
  
  async setReadStatus(userId: number, announcementId: number, isRead: boolean): Promise<ReadStatus> {
    const existing = await this.getReadStatus(userId, announcementId);
    
    if (existing) {
      existing.isRead = isRead;
      existing.readAt = isRead ? new Date() : null;
      return existing;
    }
    
    const newStatus: ReadStatus = {
      userId,
      announcementId,
      isRead,
      readAt: isRead ? new Date() : null
    };
    this.readStatuses.push(newStatus);
    return newStatus;
  }
}