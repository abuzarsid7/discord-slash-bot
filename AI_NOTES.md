# AI Collaboration & Project Notes

## 1. AI Tools, Models, and Workflow Division
* **Tools & Models Used:** Developed using **Google Antigravity IDE** powered by **Gemini 3.1 Pro (High)** as an interactive pair-programming and debugging assistant.
* **Work Split:**
  * **My Role (Architecture, Integration & QA):** I defined the core system architecture, selected the technology stack (Next.js 16, Prisma 7, Neon Serverless Postgres), configured external integrations (Discord Developer Portal, Slack Incoming Webhooks, ngrok tunneling), designed the end-to-end data flow, and led live-environment testing and debugging.
  * **AI's Role (Code Generation & Acceleration):** The AI assisted by generating initial boilerplate (Ed25519 request signature verification using `discord-interactions`, Prisma schema syntax, UI components for the admin dashboard), writing the standalone TypeScript script (`register.ts`) for registering guild slash commands, and executing code refactors during optimization.

---

## 2. Key Independent Design Decisions
To ensure a robust, maintainable, and cloud-native application without over-engineering, I made the following architectural choices:

1. **Monolithic Full-Stack Architecture (Next.js 16 App Router):** 
   Instead of splitting the project into a separate frontend SPA and backend Node/Express API, I chose a unified Next.js App Router application. The admin dashboard UI (`/app/components/*`) and the Discord webhook receiver (`/app/api/interactions/route.ts`) live within a single codebase and deployment unit. This eliminated CORS complexities, simplified environment variable management, and made deployment to serverless platforms seamless.
2. **Connection-Pooled ORM (`@prisma/adapter-pg` with native `pg`):** 
   In serverless environments, standard ORM connections can easily exhaust database connection limits during bursty webhook traffic. I decided to use Prisma 7 paired with the native `@prisma/adapter-pg` driver. This guarantees efficient PostgreSQL connection pool utilization while maintaining end-to-end TypeScript type safety for command logging and deduplication.
3. **Asynchronous Non-Blocking Webhook Processing:** 
   Rather than coupling the HTTP response to downstream I/O, I architected the interactions endpoint to decouple acknowledgement from execution. The handler validates the signature and returns the JSON reply to Discord immediately, while database writes and Slack notifications fire asynchronously. This design isolates Discord's strict response SLA from third-party network variability.

---

## 3. The Hardest AI Bug / Wrong Turn: Synchronous Blocking & Webhook Timeouts
* **What the AI Got Wrong:** When drafting the initial `/api/interactions` handler, the AI wrote sequential, synchronous `await` calls for all downstream tasks: first `await prisma.command_log.findUnique(...)` for deduplication, then `await prisma.command_log.create(...)` to save the record, and finally `await fetch(process.env.SLACK_WEBHOOK_URL, ...)` to mirror the alert to Slack—all *before* returning the `NextResponse.json(...)` reply to Discord.
* **How I Noticed:** During live testing with ngrok, executing `/report` or `/status` in Discord frequently resulted in a red error message: *"The application did not respond"*. Strangely, when checking Prisma Studio, the command records *were* actually being saved in PostgreSQL! Furthermore, if I re-ran the command a minute later, it would succeed without timing out.
* **The Root Cause:** Discord enforces a strict **~3,000ms timeout** on interaction webhooks. Because I used a free-tier Neon Serverless Postgres database, compute resources auto-suspended after periods of inactivity. When a fresh slash command arrived, waking up the database and establishing a TLS connection took ~1.8 to 2.2 seconds. Adding the synchronous HTTP POST round-trip to Slack's servers (~600–900ms) pushed total latency above 3,000ms. Discord closed the connection and showed an error to the user, even though Node.js finished writing to the DB in the background a second later.
* **How I Fixed It:** I refactored the route handler to eliminate all blocking downstream I/O before the return statement:
  1. I removed the explicit pre-query `await findUnique` check, instead relying directly on PostgreSQL's native `@unique` index constraint on `interactionId` to silently catch duplicate payloads in an asynchronous `.catch()` block.
  2. I stripped the `await` keyword from both `prisma.command_log.create(...)` and `fetch(SLACK_WEBHOOK_URL, ...)`. 
  This allowed the endpoint to return the Type 4 (`CHANNEL_MESSAGE_WITH_SOURCE`) acknowledgement back to Discord in under **~20ms** every time, while database logging and Slack mirroring reliably complete in the background without ever risking a webhook timeout.
