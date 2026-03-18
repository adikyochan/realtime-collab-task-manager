# RealTasks 📋

> A real-time collaborative task manager — assign tasks, track progress, and watch updates happen live.

**Live Demo → [realtasks.vercel.app](https://realtime-collab-task-manager.vercel.app)**

---

## ⚡ Quick Start (under 5 minutes)

```bash
# 1. Clone
git clone https://github.com/adikyochan/realtime-collab-task-manager.git
cd realtime-collab-task-manager

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Fill in your values (see Environment Variables below)

# 4. Database
npx prisma db push
npx prisma generate

# 5. Run
npm run dev
```

Open **http://localhost:3000** — you're in. ✅

---

## 🔑 Environment Variables

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | [supabase.com](https://supabase.com) → Settings → Database → Connection pooler (Transaction mode) |
| `NEXTAUTH_URL` | `http://localhost:3000` locally, your deployed URL in production |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `PUSHER_APP_ID` | [pusher.com](https://pusher.com) → Your App → App Keys |
| `PUSHER_KEY` | Same as above |
| `PUSHER_SECRET` | Same as above |
| `PUSHER_CLUSTER` | Same as above (e.g. `ap2`) |
| `NEXT_PUBLIC_PUSHER_KEY` | Same value as `PUSHER_KEY` |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Same value as `PUSHER_CLUSTER` |

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│   Next.js App (React)                                   │
│   ┌──────────────┐  ┌──────────────┐                   │
│   │  /login      │  │  /dashboard  │                   │
│   │  (public)    │  │  (protected) │                   │
│   └──────────────┘  └──────┬───────┘                   │
│                             │                           │
│                    Pusher Client (WebSocket)             │
└─────────────────────────────┼───────────────────────────┘
                              │ HTTP / WS
┌─────────────────────────────▼───────────────────────────┐
│                    Next.js Server                        │
│                                                         │
│  API Routes                                             │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ /api/auth/      │  │ /api/tasks (GET, POST)       │  │
│  │ [...nextauth]   │  │ /api/tasks/[id] (PATCH, DEL) │  │
│  └────────┬────────┘  │ /api/users/search (GET)      │  │
│           │           └──────────────┬────────────────┘  │
│      NextAuth v5                     │                   │
│      (Google OAuth)                  │ Prisma ORM        │
└───────────┼──────────────────────────┼───────────────────┘
            │                          │
     ┌──────▼──────┐          ┌────────▼────────┐
     │   Supabase  │          │     Pusher      │
     │ PostgreSQL  │          │  (WebSockets)   │
     └─────────────┘          └─────────────────┘
```

### Request Lifecycle

```
User creates task → POST /api/tasks
  → Auth check (NextAuth session)
  → Resolve assignee email → Prisma DB write
  → Trigger Pusher event on user-{id} channel
  → Assignee browser receives event instantly
  → UI updates without page refresh
```

---

## 🛠 Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Full-stack in one repo, server components, easy Vercel deploy |
| **Styling** | Tailwind CSS + Shadcn/UI | Utility-first, accessible components, fast iteration |
| **Auth** | NextAuth.js v5 | Best-in-class for Next.js, handles OAuth flow, session persistence |
| **Database** | PostgreSQL (Supabase) | Relational data fits task/user relationships perfectly |
| **ORM** | Prisma 7 | Type-safe queries, auto-generated TypeScript types, easy migrations |
| **Real-time** | Pusher Channels | Managed WebSockets, zero infrastructure overhead |
| **Deployment** | Vercel | Zero-config Next.js, automatic CI/CD from GitHub |

---

## ⚖️ Assumptions & Trade-offs

### Assumptions
- Users authenticate exclusively via Google — no email/password auth needed
- Tasks are either personal or assigned to one person — no multi-assignee support required
- Real-time is a bonus feature, not a hard requirement — the app works without Pusher
- Free tier infrastructure is acceptable for this scale

### Trade-offs

**Pusher vs self-hosted WebSockets**
Pusher adds a third-party dependency and has usage limits on the free tier, but eliminates the complexity of managing WebSocket servers. For a production app at scale, self-hosted Socket.io or Ably would be more cost-effective.

**Supabase vs PlanetScale/Neon**
Supabase's direct connection URL is blocked by some ISPs in India — this caused significant friction during development. In hindsight, Neon would have been smoother for development since it's accessible without a VPN.

**NextAuth v5 (beta)**
NextAuth v5 changed its API significantly from v4. Using a beta version introduced breaking changes and deployment issues. The trade-off is access to newer features vs stability — v4 would have been safer.

**No optimistic UI rollback on error**
Task creation uses Pusher events to update the UI rather than directly updating state. If the Pusher event fails, the UI won't update. A more robust approach would be local state update + revert on error.

**Pending assignee email**
If you assign a task to someone who hasn't signed up, their email is stored as `pendingAssigneeEmail`. When they sign in, tasks are linked automatically. The trade-off is no email notification is sent — users must be told out-of-band to sign up.

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Import at vercel.com → New Project → select repo

# 3. Add all environment variables in Vercel dashboard
#    IMPORTANT: Use Supabase Transaction Pooler URL for DATABASE_URL
#    postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# 4. Add to package.json scripts:
"postinstall": "prisma generate"

# 5. Update Google Console with your Vercel URL:
#    Authorized origins: https://your-app.vercel.app
#    Redirect URI: https://your-app.vercel.app/api/auth/callback/google
```

> **India-specific note:** Supabase direct connections are blocked by major ISPs. Always use the Transaction Pooler URL in production, and Cloudflare WARP locally for `prisma db push`.

---

## ⚠️ Known Limitations

| Limitation | Impact | Workaround |
|---|---|---|
| Pusher free tier: 200 concurrent connections | App won't scale beyond ~200 active users | Upgrade Pusher plan or self-host Socket.io |
| No email notifications | Assignees don't know they have a task unless they open the app | Add SendGrid/Resend for assignment emails |
| No task comments | No discussion thread on tasks | Out of scope for v1 |
| No file attachments | Can't attach documents to tasks | Out of scope for v1 |
| Single assignee per task | Can't assign to multiple people | DB schema change needed |
| No team/workspace concept | All users share a flat namespace | No team isolation |
| Supabase free tier DB pauses | DB pauses after 7 days inactivity on free plan | Upgrade or use Neon which doesn't pause |

---

## 🔮 What I'd Do Next

**Features**
- [ ] Email notifications on task assignment (SendGrid/Resend)
- [ ] Task comments and activity log
- [ ] File attachments (Supabase Storage)
- [ ] Sub-tasks / checklist items
- [ ] Multiple assignees per task
- [ ] Due date reminders / push notifications
- [ ] Recurring tasks

**Technical**
- [ ] Migrate from Pusher to self-hosted Socket.io for cost efficiency
- [ ] Add end-to-end tests with Playwright
- [ ] Rate limiting on API routes
- [ ] Proper error monitoring (Sentry)
- [ ] Redis for session caching at scale
- [ ] Teams / workspaces concept with role-based access

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── tasks/                # GET, POST tasks
│   │   │   └── [id]/             # PATCH, DELETE task
│   │   └── users/search/         # User search for assignment
│   ├── dashboard/                # Protected dashboard page
│   ├── login/                    # Homepage + login
│   └── layout.tsx
├── components/
│   ├── DashboardClient.tsx       # Main dashboard (real-time)
│   ├── Sidebar.tsx               # Nav + mini calendar
│   ├── TaskCard.tsx              # Individual task row
│   ├── TaskForm.tsx              # Create task form
│   ├── EditTaskModal.tsx         # Edit task modal
│   ├── TaskSkeleton.tsx          # Loading placeholder
│   └── UserSearchInput.tsx       # Assignee search dropdown
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # NextAuth config
│   ├── pusher-server.ts          # Server-side Pusher trigger
│   └── pusher-client.ts          # Client-side Pusher listener
└── types/
    └── task.ts                   # Shared TypeScript types
```

---

## 👤 Author

Built by **Adidev J J** · [adidevjj@gmail.com](mailto:adidevjj@gmail.com) · [GitHub](https://github.com/adikyochan)

---

<p align="center">Made with ☕ and too many Prisma version conflicts</p>