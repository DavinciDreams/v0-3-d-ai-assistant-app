# 3D AI Assistant App - Production Version

A production-ready 3D AI assistant web application featuring realistic avatars, speech recognition, text-to-speech, and AI conversation capabilities.

## Features

- **3D Avatar Integration**: Interactive VRM-format 3D avatars with lip-sync and expression capabilities
- **Speech Recognition**: Using Web Speech API for real-time speech-to-text conversion
- **Text-to-Speech**: Using EasySpeech for natural voice output
- **AI Integration**: Connect to your Flowise API for AI conversations
- **User Authentication**: Secure login and registration with NextAuth.js
- **Database Storage**: Save conversations, user settings, and preferences
- **Responsive Design**: Works on both desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js, React, Three.js, React Three Fiber
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Speech**: Web Speech API, EasySpeech
- **Styling**: Tailwind CSS
- **3D**: Three.js, React Three Fiber, VRM

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/3d-ai-assistant-app.git
   cd 3d-ai-assistant-app
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` (or edit the existing `.env` file)
   - Update the database connection string and other configuration values

4. Set up the database:
   ```bash
   pnpm dlx prisma migrate dev
   ```

5. Run the development server:
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Setting Up Flowise Integration

1. Install and set up Flowise AI on your server or use their cloud service
2. Create a new flow in Flowise that processes conversation input and returns responses
3. Once deployed, copy your Flowise API URL and API Key (if required)
4. In the app settings, input your Flowise API details and save

## Production Deployment

### Database Setup

For production, use a managed PostgreSQL service like:
- Neon
- Supabase
- AWS RDS
- Digital Ocean Managed Database

Update your `DATABASE_URL` environment variable accordingly.

### Deployment Options

1. **Vercel** (recommended):
   - Connect your GitHub repository
   - Set up environment variables in the Vercel dashboard
   - Deploy with automatic CI/CD

2. **Docker**:
   - Build the Docker image: `docker build -t 3d-ai-assistant-app .`
   - Run the container: `docker run -p 3000:3000 3d-ai-assistant-app`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

**[https://v0.dev/chat/projects/miX0q0n8Qfq](https://v0.dev/chat/projects/miX0q0n8Qfq)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository