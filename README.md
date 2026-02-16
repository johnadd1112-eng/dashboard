# React Dashboard - Setup Guide

## Prerequisites
- Node.js 18+ installed
- A Neon DB account (free tier available at https://neon.tech)
- Vercel account (free tier available at https://vercel.com)

## Local Development Setup

### 1. Get Your Neon DB Connection String
1. Go to https://neon.tech and create a free account
2. Create a new project
3. Copy your connection string (it looks like: `postgresql://user:password@host/database?sslmode=require`)

### 2. Configure Environment Variables
1. Open `.env.local` in the project root
2. Replace the `DATABASE_URL` with your Neon DB connection string
3. Generate a secure secret for `NEXTAUTH_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
4. Update `NEXTAUTH_SECRET` with the generated value

### 3. Set Up Database
```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Deployment to Vercel

### Option 1: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Using Vercel Dashboard
1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variables:
   - `DATABASE_URL`: Your Neon DB connection string
   - `NEXTAUTH_URL`: Your production URL (e.g., https://your-app.vercel.app)
   - `NEXTAUTH_SECRET`: A secure random string
5. Deploy!

## Usage

### First User (Admin)
1. The first user to sign up automatically becomes an admin with approved status
2. Log in immediately after signing up

### Subsequent Users
1. Sign up with email and password
2. Wait for admin approval
3. Once approved, log in to access the dashboard

### Admin Features
- View all users
- Approve or reject pending users
- See user statistics

## Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: Neon DB (PostgreSQL)
- **ORM**: Prisma
- **Deployment**: Vercel
