# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server (runs both backend and frontend)
- `npm run build` - Build production assets
- `npm start` - Run production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes to PostgreSQL

### Database Setup
Requires PostgreSQL connection via `DATABASE_URL` environment variable. The project uses Neon serverless PostgreSQL with Drizzle ORM.

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript, Vite, Wouter routing, TanStack Query, Tailwind CSS + shadcn/ui components
- **Backend**: Express.js + TypeScript, Passport.js authentication, Drizzle ORM
- **Database**: PostgreSQL with session-based auth stored in DB

### Key Patterns
- Session-based authentication with Passport local strategy
- Role-based access control (ADMIN/READER roles)
- RESTful API with modular route structure
- Component-based frontend with feature-based organization
- Protected routes using authentication middleware

### Core Features
1. **Announcements System**: Create, view, and filter corporate announcements by department and location
2. **Q&A System**: Users can ask questions on announcements, admins can respond
3. **User Management**: Admin interface for managing users and roles
4. **File Uploads**: PDF attachment support for announcements (stored in `/uploads`)
5. **Read Status Tracking**: Track which announcements each user has read

### Database Schema (in `/shared/schema.ts`)
- `users`: User accounts with roles
- `announcements`: Corporate announcements with department/location targeting
- `questions`: Q&A entries linked to announcements
- `announcement_read_statuses`: Tracks read status per user/announcement
- `session`: PostgreSQL session store

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `SESSION_SECRET`: Session encryption key (required)
- `PORT`: Server port (defaults to 5000)

### Deployment
Configured for Replit deployment with fixed port 5000. Production serves both API and static client files from Express.