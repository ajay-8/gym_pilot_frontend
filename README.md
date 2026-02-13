# Gym Pilot - Frontend

Modern, production-grade frontend for the Gym Pilot SaaS platform.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**:
  - TanStack Query (React Query) - Server state
  - Zustand - Client state
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
gym_pilot_frontend/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth routes group
│   ├── (dashboard)/       # Dashboard routes group
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                   # Utility functions
│   ├── api/              # API client
│   ├── hooks/            # Custom React hooks
│   ├── store/            # Zustand stores
│   └── utils/            # Helper functions
├── types/                 # TypeScript types
└── public/               # Static files
```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

### Commit Convention

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Build/config changes

## Features

- 🔐 Authentication & Authorization
- 🏢 Multi-tenant Gym Management
- 👥 Member Management
- 💳 Membership Plans
- 📅 Class Scheduling
- 👨‍🏫 Trainer Management
- 💰 Payment Tracking
- 📊 Analytics Dashboard
- 🎯 Lead Management

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## License

Proprietary - All rights reserved
