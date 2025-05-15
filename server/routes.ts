import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAnnouncementSchema, insertQuestionSchema, InsertUser, UserRole } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// File upload configuration
const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(null, false);
      cb(new Error('Only PDF files are allowed!'));
    }
  },
});

// Create public uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Auth middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication (based on blueprint)
  setupAuth(app);
  
  // ANNOUNCEMENTS ROUTES
  
  // Get all announcements
  app.get("/api/announcements", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const announcements = await storage.getAllAnnouncements();
      
      // For each announcement, get read status for the current user
      const announcementsWithReadStatus = await Promise.all(
        announcements.map(async (announcement) => {
          const readStatus = await storage.getReadStatus(req.user!.id, announcement.id);
          return {
            ...announcement,
            isRead: readStatus?.isRead || false
          };
        })
      );
      
      res.json(announcementsWithReadStatus);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Create announcement (admin only)
  app.post("/api/announcements", isAdmin, upload.single('attachment'), async (req, res) => {
    try {
      // Validate required fields manually first
      if (!req.body.title || !req.body.message || !req.body.department || !req.body.category) {
        return res.status(400).json({ 
          message: "Missing required fields",
          missingFields: {
            title: !req.body.title,
            message: !req.body.message,
            department: !req.body.department,
            category: !req.body.category
          }
        });
      }
      
      // Log the request body for debugging
      console.log("Request body:", req.body);
      
      // Prepare data for validation
      const targetedLocations = Array.isArray(req.body.targetedLocations) 
          ? req.body.targetedLocations 
          : Object.keys(req.body)
              .filter(key => key.startsWith('targetedLocations['))
              .map(key => req.body[key]);
              
      console.log("Targeted locations:", targetedLocations);
      
      if (!targetedLocations || targetedLocations.length === 0) {
        return res.status(400).json({ 
          message: "At least one location must be selected" 
        });
      }
      
      // Parse announcement data
      const announcementData = insertAnnouncementSchema.parse({
        title: req.body.title,
        message: req.body.message,
        department: req.body.department,
        category: req.body.category,
        targetedLocations: targetedLocations,
        authorId: req.user!.id
      });
      
      // Handle file attachment
      if (req.file) {
        // Save file reference
        announcementData.attachment = `/uploads/${req.file.filename}`;
      }
      
      // Validate if admin can create for this department
      if (req.user?.actingDepartment && req.user.actingDepartment !== announcementData.department) {
        return res.status(403).json({ 
          message: "You can only create announcements for your assigned department" 
        });
      }
      
      const announcement = await storage.createAnnouncement(announcementData);
      console.log("Announcement created successfully:", announcement);
      res.status(201).json(announcement);
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid announcement data", errors: error.errors });
      }
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  });
  
  // Get announcement by ID
  app.get("/api/announcements/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const announcement = await storage.getAnnouncementWithDetails(id);
      
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      // Check if reader has access to this announcement
      if (req.user?.role === UserRole.READER && req.user.assignedLocations?.length > 0) {
        const userLocations = req.user.assignedLocations as string[];
        const announcementLocations = announcement.targetedLocations as string[];
        
        // Check if there's any overlap between user locations and announcement locations
        const hasAccess = userLocations.some(loc => announcementLocations.includes(loc));
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have access to this announcement" });
        }
      }
      
      // Get read status for current user
      const readStatus = await storage.getReadStatus(req.user!.id, announcement.id);
      announcement.isRead = readStatus?.isRead || false;
      
      res.json(announcement);
    } catch (error) {
      console.error("Error fetching announcement:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Delete announcement (admin only, creator only)
  app.delete("/api/announcements/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const announcement = await storage.getAnnouncement(id);
      
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      // Check if current admin is the creator
      if (announcement.authorId !== req.user!.id) {
        return res.status(403).json({ message: "You can only delete announcements you created" });
      }
      
      // Delete the announcement
      const success = await storage.deleteAnnouncement(id);
      
      if (success) {
        // Delete attachment file if it exists
        if (announcement.attachment) {
          const filePath = path.join(process.cwd(), announcement.attachment);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        
        res.json({ message: "Announcement deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete announcement" });
      }
    } catch (error) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update read status for an announcement
  app.post("/api/announcements/:id/read-status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const isRead = req.body.isRead === true;
      
      // Check if announcement exists
      const announcement = await storage.getAnnouncement(id);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      // Update read status
      const status = await storage.setReadStatus(req.user!.id, id, isRead);
      res.json(status);
    } catch (error) {
      console.error("Error updating read status:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Search announcements
  app.get("/api/search", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const query = req.query.q as string;
      
      if (!query || query.length < 3) {
        return res.status(400).json({ message: "Search query must be at least 3 characters" });
      }
      
      const results = await storage.searchAnnouncements(query);
      
      // Filter results based on user role and locations
      let filteredResults = results;
      
      if (req.user?.role === UserRole.READER && req.user.assignedLocations?.length > 0) {
        const userLocations = req.user.assignedLocations as string[];
        
        filteredResults = results.filter(announcement => {
          const announcementLocations = announcement.targetedLocations as string[];
          return userLocations.some(loc => announcementLocations.includes(loc));
        });
      }
      
      res.json(filteredResults);
    } catch (error) {
      console.error("Error searching announcements:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // QUESTIONS ROUTES
  
  // Create a question for an announcement
  app.post("/api/announcements/:id/questions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const announcementId = parseInt(req.params.id);
      
      // Check if announcement exists
      const announcement = await storage.getAnnouncement(announcementId);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      // Validate and create question
      const questionData = insertQuestionSchema.parse({
        announcementId,
        askerId: req.user!.id,
        text: req.body.text
      });
      
      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error: any) {
      console.error("Error creating question:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get questions asked by the current user
  app.get("/api/questions/mine", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const questions = await storage.getQuestionsByUser(req.user!.id);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching user questions:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get questions received by the current admin
  app.get("/api/questions/received", isAdmin, async (req, res) => {
    try {
      const questions = await storage.getReceivedQuestions(req.user!.id);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching received questions:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Answer a question (admin only)
  app.post("/api/questions/:id/answer", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { answerText } = req.body;
      
      if (!answerText || answerText.trim() === "") {
        return res.status(400).json({ message: "Answer text is required" });
      }
      
      // Get the question
      const question = await storage.getQuestion(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Verify this admin created the announcement
      const announcement = await storage.getAnnouncement(question.announcementId);
      if (!announcement || announcement.authorId !== req.user!.id) {
        return res.status(403).json({ 
          message: "You can only answer questions about announcements you created" 
        });
      }
      
      // Answer the question
      const updatedQuestion = await storage.answerQuestion(
        id, 
        answerText, 
        req.user!.id
      );
      
      res.json(updatedQuestion);
    } catch (error) {
      console.error("Error answering question:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Mark a question as resolved (admin only)
  app.post("/api/questions/:id/resolve", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the question
      const question = await storage.getQuestion(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Verify this admin created the announcement
      const announcement = await storage.getAnnouncement(question.announcementId);
      if (!announcement || announcement.authorId !== req.user!.id) {
        return res.status(403).json({ 
          message: "You can only resolve questions about announcements you created" 
        });
      }
      
      // Mark the question as resolved
      const updatedQuestion = await storage.resolveQuestion(id);
      
      res.json(updatedQuestion);
    } catch (error) {
      console.error("Error resolving question:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // USER MANAGEMENT ROUTES
  
  // Get all users (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Create new user (admin only)
  app.post("/api/users", isAdmin, async (req, res) => {
    try {
      // Check if username/email already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create the user with hashed password
      const userData: InsertUser = {
        ...req.body,
        // Password will be hashed in the auth module
      };
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update existing user (admin only)
  app.patch("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if user exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user
      const updatedUser = await storage.updateUser(id, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Rota de busca para API e webhook
  app.get("/api/search", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const query = req.query.q as string;
      
      if (!query || query.length < 3) {
        return res.status(400).json({ message: "Search query must be at least 3 characters" });
      }

      // Busca no banco de dados
      const searchResults = await storage.searchAnnouncements(query);
      
      // Se tivéssemos um webhook real, poderíamos consultar aqui também
      // Mas vamos apenas retornar os resultados do banco de dados por enquanto
      
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  const httpServer = createServer(app);
  return httpServer;
}
