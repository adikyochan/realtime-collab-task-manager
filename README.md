# RealTasks

**Real-time collaborative task management — assign, track, and ship together.**

🔗 [realtime-collab-task-manager.vercel.app](https://realtime-collab-task-manager.vercel.app)

---

## What is this?

RealTasks lets you create tasks, assign them to teammates by email, and watch updates appear live — no refresh needed. Built as a full-stack assignment in 72 hours.

---

## ⚡ Setup (under 5 minutes)

**Prerequisites:** Node.js 18+, a Google account, Git

```bash
# Clone and install
git clone https://github.com/adikyochan/realtime-collab-task-manager.git
cd realtime-collab-task-manager
npm install

# Environment
cp .env.example .env.local
# Fill in your values — see below

# Database
npx prisma db push
npx prisma generate

# Go
npm run dev
```

Open `http://localhost:3000` and sign in with Google. Done.

---

## 🔑 Environment Variables

```env
# Database — use Supabase Transaction Pooler URL (not direct connection)
DATABASE_URL=""

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""                    # run: openssl rand -base64 32

# Google OAuth — console.cloud.google.com
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Pusher — pusher.com → App Keys
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER=""
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER=""
```

---

## 🏗 Architecture

```
Browser
│
├── /login          Public landing page
└── /dashboard      Protected — requires Google sign-in
    │
    ├── React (Next.js App Router)
    └── Pusher Client ←──────────────────────┐
                                             │ WebSocket push
Next.js Server (API Routes)                  │
│                                            │
├── /api/auth/[...nextauth]   Google OAuth   │
├── /api/tasks                CRUD           │
├── /api/tasks/[id]           PATCH/DELETE   │
└── /api/users/search         Assignee lookup│
    │                                        │
    Prisma ORM                          Pusher Server
    │                                        │
    PostgreSQL (Supabase)            triggers on task events
```

**Creating a task:**
```
User submits form
  → POST /api/tasks
  → Auth check (NextAuth session)
  → Resolve assignee email in DB
    → Found: link directly
    → Not found: store as pendingAssigneeEmail
  → Prisma writes to PostgreSQL
  → Pusher fires → assignee UI updates instantly
```

**New user signs in for first time:**
```
Google OAuth completes
  → NextAuth signIn callback fires
  → Find all tasks where pendingAssigneeEmail = user's email
  → Link tasks to new user ID, clear pending email
  → Tasks appear in their dashboard automatically ✅
```

---

## 🛠 Tech Stack

**Frontend**
- Next.js 14 (App Router) — full-stack in one repo, server components, file-based routing
- Tailwind CSS — utility-first, no CSS files needed
- Shadcn/UI — accessible, composable component primitives
- Framer Motion — smooth task animations and transitions

**Backend**
- Next.js API Routes — no separate server needed
- NextAuth.js v5 — Google OAuth, database-backed sessions
- Prisma 7 — type-safe ORM, auto-generated TypeScript types
- Pusher Channels — managed WebSockets, zero infrastructure overhead

**Infrastructure**
- PostgreSQL via Supabase — relational DB, built-in connection pooling
- Vercel — zero-config Next.js hosting, auto CI/CD from GitHub pushes

---

## ⚖️ Assumptions & Trade-offs

**Google-only auth**
Assumed one sign-in provider is sufficient. Simplifies auth significantly — no password resets or email verification needed. Trade-off: users without Google accounts can't join.

**Pusher over self-hosted WebSockets**
Eliminates infrastructure complexity. Trade-off: free tier caps at 200 concurrent connections. Fine for this scale, but at production load, self-hosted Socket.io would be more cost-effective.

**Supabase for PostgreSQL**
Managed Postgres with connection pooling and a great dashboard. Trade-off: the direct connection URL is blocked by some Indian ISPs — requires Cloudflare WARP locally or the Transaction Pooler URL in production.

**NextAuth v5 (beta)**
Cleaner API and better App Router support than v4. Trade-off: still in beta, which caused several breaking changes and painful deployment debugging. v4 would have been safer.

**Pending assignee fallback**
If a task is assigned to an email not yet in the system, it's stored as `pendingAssigneeEmail` and linked automatically on their first sign-in. Trade-off: the assignee has no idea they have a task until they open the app — a transactional email would fix this.

**Optimistic UI**
Status toggles update the UI immediately before the API confirms. Trade-off: a failed request causes a visible revert, which can feel jarring. Acceptable at this scale.

---

## ⚠️ Known Limitations

- Pusher free tier caps at 200 concurrent connections
- No email notifications when tasks are assigned
- Only one assignee per task — no multi-person support
- No team or workspace concept — all users share a flat namespace
- Supabase free tier pauses the DB after 7 days of inactivity
- No file attachments or task comments
- No recurring tasks or due date reminders

---

## 🔮 What's Next

**Features**
- Email notifications on assignment via Resend
- Task comments and activity feed
- File attachments via Supabase Storage
- Multiple assignees per task
- Teams and workspaces with role-based access
- Due date reminders and push notifications

**Technical**
- Migrate Pusher to self-hosted Socket.io for cost efficiency at scale
- End-to-end tests with Playwright
- Rate limiting on API routes
- Error monitoring with Sentry
- Redis for session caching

---

## 🚀 Deployment

```bash
# 1. Push to GitHub
git push origin main

# 2. Import repo at vercel.com → New Project

# 3. Add all env variables in Vercel dashboard
#    DATABASE_URL must be the Supabase Transaction Pooler URL:
#    postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# 4. Add postinstall script to package.json
"postinstall": "prisma generate"

# 5. Update Google Cloud Console with your production URL
#    Authorized origin:  https://your-app.vercel.app
#    Redirect URI:       https://your-app.vercel.app/api/auth/callback/google

# 6. Vercel auto-deploys on every push to main from here on
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    NextAuth handler
│   │   ├── tasks/                 GET, POST
│   │   │   └── [id]/              PATCH, DELETE
│   │   └── users/search/          Assignee search
│   ├── dashboard/                 Protected dashboard
│   └── login/                     Public landing page
├── components/
│   ├── DashboardClient.tsx        Main UI + real-time logic
│   ├── Sidebar.tsx                Navigation + mini calendar
│   ├── TaskCard.tsx               Individual task row
│   ├── TaskForm.tsx               Create task inline form
│   ├── EditTaskModal.tsx          Edit task modal
│   └── UserSearchInput.tsx        Assignee search dropdown
└── lib/
    ├── prisma.ts                  DB client singleton
    ├── auth.ts                    NextAuth config + callbacks
    ├── pusher-server.ts           Server-side event triggers
    └── pusher-client.ts           Client-side event listener
```

---

Made with ❤️ by [@adikyochan](https://github.com/adikyochan) · *and way too much coffee and Prisma version conflicts*