# 🤖 Discord Slash-Command & Moderation Bot

A monolithic, cloud-native full-stack web application and Discord moderation bot built with **Next.js 16 (App Router)**, **TypeScript**, **Prisma 7**, and a connection-pooled **Neon Serverless PostgreSQL** database. 

Designed to operate seamlessly in serverless environments, this application receives Discord slash commands, verifies Ed25519 cryptographic signatures, processes interactive modal forms, performs automated AI triage using free-tier LLMs (Gemini / Groq), mirrors alerts to Slack/Discord webhooks, and provides a real-time admin management dashboard with multi-server isolation.

---

## ⚡ Quick Start (Test Live Right Now!)

Want to evaluate the project immediately without setting up local environment variables? You can jump straight into our live production environment:

* **🎮 1. Join our Live Demo Discord Server:** [**Click to Join Test Server**](https://discord.gg/pmBEtB4Ya) — The bot is already installed, running, and configured! Commands executed in `#general` (like `/report`, `/feedback`, or `/status`) are automatically evaluated by our LLM and mirrored directly to the `#notifications` channel.
* **📊 2. Inspect the Live Admin Dashboard:** [**https://discord-slash-bot.vercel.app/login**](https://discord-slash-bot.vercel.app/login) — Log in using our throwaway evaluation credentials:
  * **Username:** `admin`
  * **Password:** `admin123`
  *(Here you can view real-time PostgreSQL command logs, test interactive action buttons, change keyword trigger rules, and test Multi-Server Scope switching!)*

---

## 🌟 What the App Does (Features & Stretch Goals)

### 1. Core Requirements Delivered
* **Ed25519 Request Signature Verification:** Every incoming HTTP POST request at `/api/interactions` is cryptographically authenticated using Discord's public key (`discord-interactions`). Unsigned or forged requests are immediately rejected with `401 Unauthorized`.
* **Idempotent Webhook Deduplication:** Uses database unique constraints on `interactionId` to ensure that duplicate webhook deliveries from Discord retries never execute business logic twice.
* **Non-Blocking Asynchronous Processing (3s SLA Compliance):** To prevent Discord's strict ~3,000ms webhook timeout when database pools wake up or LLMs inference, commands return Type 5 (`DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE`) in under **20ms**. Database insertions, AI triage, and webhook mirroring run asynchronously in background workers.
* **Downstream Notification Mirroring:** Automatically forwards formatted alert notifications to secondary Slack Incoming Webhooks or separate Discord channel webhooks.
* **Secure Admin Dashboard:** Behind cookie-based authentication (`/login`), administrators can monitor a live feed of all PostgreSQL logs, view system health metrics, and dynamically configure trigger rules.

### 2. All Stretch Goals Achieved 🚀
* **Dynamic Command Rule Configuration in UI:** Admins can edit flagged keyword triggers directly from the web dashboard without editing code or restarting servers.
* **Interactive Components (Action Buttons):** Interactive confirmation buttons (`[ ACK Report ✅ ]`, `[ Dismiss ❌ ]`) allow moderators to handle alerts. Once clicked, buttons visually transform into disabled consensus badges (`[ Acknowledged by Abuzar ✅ ]`) to prevent duplicate processing.
* **Modal Dialog Forms (Type 9 Modals):** Invoking `/report` or `/feedback` without arguments launches an interactive multi-step popup dialog collecting structured Titles and Detailed Descriptions.
* **Automated AI Triage Step:** Uses free-tier Google Gemini or Groq APIs (with a zero-cost simulation fallback) to automatically classify reports (`Category: Bug/Security | Priority: High | Summary`).
* **Multi-Server Tenant Isolation & DM Support:** Scoped completely by `guild_id`. Each connected server maintains isolated rules and logs. Admins can toggle between server scopes using the dashboard's **Active Server Scope Switcher Bar**. Global commands are enabled in DMs and user installs.

---

## 🛠️ Tech Stack

* **Framework:** Next.js 16 (App Router, React 19, Server Actions, API Routes)
* **Language:** TypeScript / Node.js
* **Database & ORM:** Neon Serverless PostgreSQL with Prisma 7 (`@prisma/adapter-pg` native connection pooling)
* **Styling:** Vanilla CSS & Tailwind CSS styling with modern dark mode aesthetics
* **AI / LLM Integration:** Google Gemini (`gemini-2.5-flash`) & Groq (`llama-3.3-70b-versatile`)
* **Cryptography:** `discord-interactions`, `tweetnacl`

---

## 🚀 How to Run Locally

### 1. Prerequisites
* **Node.js** (v20+ recommended)
* **npm** or **pnpm**
* A free **Neon Postgres** database URL (or local PostgreSQL)
* A **Discord Developer Application** (create free at [Discord Developer Portal](https://discord.com/developers/applications))

### 2. Clone & Install Dependencies
```bash
git clone <your-repository-url>
cd my-discord-bot
npm install
```

### 3. Environment Variables
Copy the example environment template and fill in your keys:
```bash
cp .env.example .env
```
Refer to [`.env.example`](file:///Users/abuzarsiddiqui/Desktop/my-discord-bot/.env.example) for the full schema:
* `DISCORD_PUBLIC_KEY`, `DISCORD_BOT_TOKEN`, `DISCORD_APP_ID`: From Discord Developer Portal -> General Information & Bot tab.
* `DATABASE_URL`: Your Postgres connection string.
* `DISCORD_WEBHOOK_URL` / `SLACK_WEBHOOK_URL`: Your downstream notification webhook URLs.
* `GEMINI_API_KEY` / `GROQ_API_KEY`: (Optional) Free API keys for live AI triage.

### 4. Database Setup & Migration
Push the Prisma schema to your PostgreSQL database:
```bash
npx prisma db push
```
*(Optional)* Launch Prisma Studio to visually inspect tables:
```bash
npx prisma studio
```

### 5. Register Slash Commands with Discord
Run the included standalone registration script to push global commands (`/report`, `/feedback`, `/status`) with DM and Multi-Server support:
```bash
npx tsx register.ts
```

### 6. Start the Local Development Server
```bash
npm run dev
```
The application will be running at `http://localhost:3000`.

### 7. Expose Locally to Discord (via ngrok)
Because Discord requires a publicly reachable HTTPS URL for webhooks, start an ngrok tunnel:
```bash
npx ngrok http 3000
```
Copy your ngrok forwarding URL (e.g., `https://xxxx.ngrok-free.app`), go to your Discord Developer Portal -> **General Information** -> **Interactions Endpoint URL**, and paste:
```text
https://xxxx.ngrok-free.app/api/interactions
```

---

## 🌐 How and Where It Is Deployed

This application is architected for seamless deployment on edge and serverless platforms such as **Vercel**, **Render**, or **Cloudflare/AWS**:
1. **Hosting Platform:** Deployed as a full-stack Next.js application on **Vercel**.
2. **Database:** Hosted on **Neon Serverless PostgreSQL**, leveraging native connection pooling (`@prisma/adapter-pg`) to handle bursty webhook spikes without exhausting database connections.
3. **Live Deployed URL:** `https://discord-slash-bot.vercel.app`
4. **Live Interactions Endpoint:** `https://discord-slash-bot.vercel.app/api/interactions`

---

## 🧪 How to Test the Project (Evaluator Instructions)

We have made it simple to test the bot end-to-end:

### 1. Add the Bot to Your Server (or Test in DMs!)
* **Option A (Direct Messages):** Because we enabled Discord v10 User Installs and DM contexts, you can simply open a Direct Message with our bot and type `/report` or `/status`!
* **Option B (Invite to Your Server):** Use this OAuth2 Invite URL to add the bot to your test server:
  ```text
  https://discord.com/api/oauth2/authorize?client_id=1521243620794040320&permissions=2147485696&scope=bot%20applications.commands
  ```
* **Option C (Join Our Live Demo Server):** Want to jump right into a live environment where the bot is already installed, running, and configured? In this server, commands written in `#general` are automatically mirrored to the `#notifications` channel! Join our public demo Discord server using this invite link:
  ```text
  https://discord.gg/pmBEtB4Ya
  ```

### 2. Log in to the Admin Dashboard
Visit the live dashboard to view real-time webhook logs, trigger rules, and server isolation:
* **Dashboard URL:** `https://discord-slash-bot.vercel.app/login`
* **Throwaway Admin Username:** `admin`
* **Throwaway Admin Password:** `admin123`

### 3. Try These Test Scenarios
1. **Interactive Modal Dialog:** In Discord, type `/report` (with no arguments) and press Enter. A popup dialog will appear! Fill out Title and Details and submit.
2. **AI Triage & Action Buttons:** Watch the bot reply instantly with an AI-generated Triage card. Click **[ ACK Report ✅ ]** and watch the button disable itself while mirroring the alert to Slack/Discord.
3. **Multi-Server Isolation Switcher:** Open the Admin Dashboard (`/dashboard`), look at the top **Active Server Scope Switcher Bar**, and toggle between `Global / Default` and specific Server IDs to see completely isolated logs and rules!
4. **Dynamic Keyword Flagging:** On the dashboard, change Flagged Trigger Keywords to `exploit, ddos`. Go to Discord and run `/report text: critical ddos detected`. Check the dashboard to see it immediately flagged in **RED**!

---

## 🚀 What We'd Improve With More Time (Roadmap)

While we achieved 100% of the core requirements and every single stretch goal, given more time, we would enhance the platform with the following production-grade additions:
1. **Persistent Background Job Queue (Inngest / Upstash Redis):** Currently, downstream tasks (database writes, Slack webhook mirroring, and LLM triage) run in an asynchronous background worker inside the API route handler. Migrating to a dedicated persistent job queue (like Inngest or BullMQ) would provide guaranteed retry policies with exponential backoff and dead-letter queues if Slack or LLM APIs experience prolonged outages.
2. **Granular Role-Based Access Control (RBAC):** We currently use a streamlined throwaway admin credential (`admin`/`admin123`) for evaluation simplicity. With more time, we would integrate Discord OAuth2 login (`/api/auth/discord`) so server administrators can log into the dashboard using their Discord accounts, automatically restricting their views to servers where they hold `ADMINISTRATOR` or `MANAGE_GUILD` permissions.
3. **Automated E2E Integration Test Suite:** Add Playwright and Jest tests to simulate cryptographic Ed25519 signature verification, mock Discord webhook payloads, and verify interactive button state transitions in a CI/CD pipeline.

---

## 📚 Project Documentation & AI Collaboration Notes
For a detailed breakdown of our architectural trade-offs, how we solved synchronous webhook timeouts, and our AI pair-programming methodology, please read [**`AI_NOTES.md`**](https://github.com/abuzarsid7/discord-slash-bot/blob/main/AI_NOTES.md).
