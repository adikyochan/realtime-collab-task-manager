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
2. **Create a task** — click "Add task", type a title, set priority and due date
3. **Assign it** — type a teammate's email in the assign field. If they haven't signed up yet, the task waits for them and links automatically when they join
4. **Watch it happen** — open the app on two devices. Create or complete a task. See it update on the other screen in real time
5. **Manage your work** — filter by date using the calendar, sort by name/priority/date, search anything, edit or delete tasks you own
6. **Sign out** — bottom of the sidebar. Your data stays safe in the cloud ☁️

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
| Styling | Tailwind CSS + Shadcn/UI |
| Auth | NextAuth.js v5 (Google OAuth) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 |
| Real-time | Pusher Channels (WebSockets) |
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

---

## 🔑 Environment Variables

```env
# ─── Database ───────────────────────────────────────────
# Use Transaction Pooler URL from Supabase (not direct connection)
DATABASE_URL=""

# ─── Auth ───────────────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""          # openssl rand -base64 32

# ─── Google OAuth ───────────────────────────────────────
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ─── Pusher ─────────────────────────────────────────────
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

---

## ⚖️ Trade-offs

**Google-only auth** — No passwords, no email verification, no headaches. Trade-off: anyone without a Google account can't use it.

**Pusher over self-hosted WebSockets** — Zero infrastructure to manage. Trade-off: free tier caps at 200 concurrent connections. Fine for now, Socket.io would be better at scale.

**NextAuth v5 (beta)** — Much cleaner API than v4. Trade-off: still in beta. Hit multiple breaking changes during deployment. Would use v4 for a production app today.

**Supabase** — Great dashboard, built-in pooling, generous free tier. Trade-off: direct connection blocked by some Indian ISPs — Transaction Pooler URL required in production.

**No email notifications** — Pending task assignment works, but the assignee doesn't know until they open the app. Resend integration would fix this cleanly.

---

## 🔮 Features I'd Add Next

- 📧 Email notifications on task assignment (Resend)
- 💬 Task comments and activity feed
- 📎 File attachments (Supabase Storage)
- 👥 Teams and workspaces with role-based access
- 🔁 Recurring tasks and due date reminders
- 📱 Native mobile app (React Native)
- 🔔 Push notifications
- 📊 Analytics dashboard — tasks completed, overdue, by member

---

## ⚠️ Limitations

- Pusher free tier: 200 concurrent connections max
- Supabase free tier pauses the DB after 7 days of inactivity
- No email sent when a task is assigned to a pending user
- One assignee per task only — no multi-person assignment
- No team isolation — all users are in a shared namespace
- No file attachments or task comments in v1

---

```
Made with ❤️ by @adikyochan

Powered by way too much coffee and too many Prisma version
conflicts.
```

---

*If this README is longer than the time it took you to set up the app, I've done something right.*