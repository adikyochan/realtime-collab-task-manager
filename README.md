# RealTasks 📋

> *Because "I'll remember to do that" is not a project management strategy.*

RealTasks is a real-time collaborative task manager. You create tasks, assign them to people by email, and everyone sees updates **instantly** — no refreshing, no chasing people on Slack, no excuses. Built with a clean, minimal UI that stays out of your way and just works.

---

## 🔗 Links

🌐 **Live App** → [realtime-collab-task-manager.vercel.app](https://realtime-collab-task-manager.vercel.app)
📦 **Repo** → [github.com/adikyochan/realtime-collab-task-manager](https://github.com/adikyochan/realtime-collab-task-manager)

---

## 🚀 How to Use It

1. **Sign in** with your Google account — no passwords, no forms, no nonsense
2. **Create a task** — click "Add task", give it a title, set priority, pick a date and time separately
3. **Assign it** — search for a teammate by name or type their email directly. If they haven't signed up yet, the task is stored and automatically linked to them when they join
4. **Watch it happen** — open the app on two devices. Create or complete a task. See it update on the other screen in real time
5. **Manage your work** — filter by date using the calendar (dots appear under dates with pending tasks), sort by name/priority/date, search anything, edit or delete tasks you own
6. **Mark tasks done** — both the owner and the assignee can mark tasks complete and bring them back
7. **Sign out** — bottom of the sidebar. Your data stays safe ☁️

---

## 🛠 Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Pusher](https://img.shields.io/badge/Pusher-300D4F?style=flat&logo=pusher&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

| Layer | What we used |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + Shadcn/UI + Framer Motion |
| Auth | NextAuth.js v5 (Google OAuth) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 |
| Real-time | Pusher Channels (WebSockets) |
| Font | Geist Mono |
| Deployment | Vercel |

---

## 📦 Deploy Your Own

### 1. Clone & install

```bash
git clone https://github.com/adikyochan/realtime-collab-task-manager.git
cd realtime-collab-task-manager
npm install
```

### 2. Set up your services

You'll need accounts on three free services:

- **[supabase.com](https://supabase.com)** → create a project, grab the Transaction Pooler connection string
- **[console.cloud.google.com](https://console.cloud.google.com)** → create OAuth credentials (Web application)
- **[pusher.com](https://pusher.com)** → create a Channels app, grab the app keys

### 3. Configure environment

```bash
cp .env.example .env.local
# Fill in all values — see Environment Variables below
```

### 4. Push schema & run

```bash
npx prisma db push
npx prisma generate
npm run dev
```

Open `http://localhost:3000` — you're live. ✅

### 5. Deploy to Vercel

```bash
# Push to GitHub, then import at vercel.com → New Project
git push origin main

# Add all env variables in Vercel dashboard
# IMPORTANT: Use Supabase Transaction Pooler URL for DATABASE_URL

# Add this to package.json scripts before deploying:
"postinstall": "prisma generate"

# Update Google Console with your Vercel URL:
# Authorized origin:  https://your-app.vercel.app
# Redirect URI:       https://your-app.vercel.app/api/auth/callback/google
```

Vercel auto-deploys on every push to `main` from here on. 🎉

> **India-specific note:** Supabase direct connections are blocked by some ISPs. Use the Transaction Pooler URL in production and Cloudflare WARP locally for `prisma db push`.

---

## 🔑 Environment Variables

```env
# ─── Database ────────────────────────────────────────────
# Use Transaction Pooler URL from Supabase (not direct connection)
DATABASE_URL=""

# ─── Auth ────────────────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""          # run: openssl rand -base64 32

# ─── Google OAuth ────────────────────────────────────────
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ─── Pusher ──────────────────────────────────────────────
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER=""
NEXT_PUBLIC_PUSHER_KEY=""        # same as PUSHER_KEY
NEXT_PUBLIC_PUSHER_CLUSTER=""    # same as PUSHER_CLUSTER
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                    │
│                                             │
│  Next.js (React)        Pusher Client       │
│  /login  /dashboard  ←──(WebSocket)──────┐  │
└──────────────────────────────────────────┼──┘
                                           │
                    HTTP                   │ push events
                                           │
┌──────────────────────────────────────────┼──┐
│            Next.js Server                │  │
│                                          │  │
│  /api/auth/[...nextauth]  Google OAuth   │  │
│  /api/tasks               GET / POST     │  │
│  /api/tasks/[id]          PATCH / DELETE │  │
│  /api/users/search        find users     │  │
│                                       Pusher│
│  Prisma ORM ──────────────────────────────  │
│      │                                      │
└──────┼──────────────────────────────────────┘
       │
┌──────▼──────────┐
│  PostgreSQL      │
│  (Supabase)      │
└──────────────────┘
```

**How a task assignment works:**
```
User types email → POST /api/tasks
  → if email exists in DB  → link task directly → Pusher notifies them instantly
  → if email doesn't exist → store pendingAssigneeEmail
     → user signs up later → signIn callback links all pending tasks automatically
```

**Real-time event flow:**
```
Any task change (create / update / delete / complete)
  → API route triggers Pusher event on user-{id} channel
  → Owner gets notified
  → Assignee gets notified
  → Both UIs update without any refresh
```

---

## ⚖️ Trade-offs

**Google-only auth** — No passwords, no email verification, no headaches. Trade-off: anyone without a Google account can't use it.

**Pusher over self-hosted WebSockets** — Zero infrastructure to manage. Trade-off: free tier caps at 200 concurrent connections. Fine for now, Socket.io would be better at scale.

**NextAuth v5 (beta)** — Much cleaner API than v4, better App Router support. Trade-off: still in beta, hit multiple breaking changes during deployment. v4 would have been safer for a production app today.

**Supabase** — Great dashboard, built-in pooling, generous free tier. Trade-off: direct connection blocked by some Indian ISPs — Transaction Pooler URL required in production, Cloudflare WARP needed locally.

**Prisma 7** — Latest version, modern config API. Trade-off: significant breaking changes from v6, new `prisma.config.ts` setup caused friction during deployment. v6 would have been more stable.

**No email notifications** — Pending task assignment works silently. The assignee won't know until they open the app. Resend integration would fix this cleanly.

**Optimistic UI** — Status toggles update instantly before the API confirms. Trade-off: a failed request causes a visible revert. Acceptable at this scale.

---

## 🔮 Features I'd Add Next

- 📧 Email notifications on assignment via Resend
- 💬 Task comments and activity feed
- 📎 File attachments via Supabase Storage
- 👥 Teams and workspaces with role-based access
- 🔁 Recurring tasks and due date reminders
- 📱 Native mobile app (React Native)
- 🔔 Push notifications
- 📊 Analytics — tasks completed, overdue, per member
- 🌙 Full dark mode

---

## ⚠️ Limitations

- Pusher free tier: 200 concurrent connections max
- Supabase free tier pauses the DB after 7 days of inactivity
- No email sent when a task is assigned to a pending user — they won't know until they open the app
- One assignee per task only — no multi-person assignment
- No team isolation — all users share a flat namespace
- No file attachments or task comments
- Google-only login — no alternative sign-in method
- Dark mode styles exist in code but no toggle is exposed in the UI

---

## 🤖 AI Assistance

I used Claude (Anthropic) throughout this project in a few specific ways:

- **Workflow planning** — helped me break the 72-hour build into structured phases (setup → DB → auth → API → real-time → UI → deployment) so I wasn't just winging it
- **Boilerplate generation** — scaffolding repetitive files like API route handlers, Prisma adapter config, and NextAuth callbacks
- **README** — this document was written with AI assistance and then edited for accuracy


---

```
Made with ❤️ by @adikyochan

Powered by way too much coffee and one too many Prisma version
conflicts.
```

---

*If this README is longer than the time it took you to set up the app, something went right.*