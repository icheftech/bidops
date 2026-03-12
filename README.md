# BidOps

**Autonomous Contract Sourcing & Bid Preparation Platform**

AI-native platform for government and commercial contract pursuit. Built for Southern Shade LLC — Texas HUB certified, SAM.gov registered, AI & Robotics focused.

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- SAM.gov API key ([register here](https://sam.gov/profile/details))

### 1. Clone and install
\`\`\`bash
git clone https://github.com/your-org/bidops.git
cd bidops
npm install
\`\`\`

### 2. Environment setup
\`\`\`bash
cp .env.example .env.local
# Fill in your SAM_GOV_API_KEY and generate NEXTAUTH_SECRET
# openssl rand -base64 32
\`\`\`

### 3. Start infrastructure
\`\`\`bash
docker compose -f infra/docker-compose.yml up -d
\`\`\`

### 4. Initialize database
\`\`\`bash
npm run db:generate
npm run db:migrate
\`\`\`

### 5. Start development
\`\`\`bash
npm run dev
# Web: http://localhost:3000
# API: http://localhost:8000 (FastAPI — coming Phase 2)
\`\`\`

---

## Architecture

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind |
| Auth | NextAuth.js — tenant-scoped JWT |
| Agent Orchestration | Python FastAPI + LangGraph |
| LLM | Anthropic Claude API |
| Database | PostgreSQL + pgvector (multi-tenant with RLS) |
| Queue | Redis + BullMQ |
| Storage | Cloudflare R2 / AWS S3 |

## Project Structure

\`\`\`
bidops/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Python FastAPI + LangGraph agents
├── packages/
│   ├── db/           # Prisma schema + client
│   ├── types/        # Shared TypeScript types
│   └── config/       # Shared tooling config
└── infra/            # Docker Compose, migrations
\`\`\`

## Phase Roadmap

| Phase | Focus |
|-------|-------|
| 1 | Scaffold, auth, DB, SAM.gov ingest ← **YOU ARE HERE** |
| 2 | Sourcing + Scoring agents, opportunity dashboard |
| 3 | Pricing, Compliance, Narrative, Assembly agents |
| 4 | CP-2 UI, auto-qualify, commercial scrapers |
| 5 | Reporting, admin panels, RBAC |
| 6 | Auto-submit (disabled), trust-building period |
| 7 | White-label tenant provisioning |
