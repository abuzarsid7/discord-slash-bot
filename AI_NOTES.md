# AI Collaboration & Project Notes

## 1. AI Tools, Models, and Workflow Division
* **Tools & Models Used:** Developed using **Google Antigravity IDE** powered by **Gemini 3.1 Pro (High)** as an interactive pair-programming and debugging assistant.
* **Work Split:**
  * **My Role (Architecture, Integration & QA):** I defined the core system architecture, selected the technology stack (Next.js 16, Prisma 7, Neon Serverless Postgres), configured external integrations (Discord Developer Portal, Slack Incoming Webhooks, ngrok tunneling), designed the end-to-end data flow, and led live-environment testing and debugging.
  * **AI's Role (Code Generation & Acceleration):** The AI assisted by generating initial boilerplate (Ed25519 request signature verification using `discord-interactions`, Prisma schema syntax, UI components for the admin dashboard), writing the standalone TypeScript script (`register.ts`) for registering guild slash commands, implementing interactive Discord UI components (buttons, ActionRows, multi-step modal dialogs), and executing code refactors during optimization.

---

## 2. Key Independent Design Decisions
To ensure a robust, maintainable, and cloud-native application without over-engineering, I made the following architectural choices:

1. **Monolithic Full-Stack Architecture (Next.js 16 App Router):** 
   Instead of splitting the project into a separate frontend SPA and backend Node/Express API, I chose a unified Next.js App Router application. The admin dashboard UI (`/app/components/*`) and the Discord webhook receiver (`/app/api/interactions/route.ts`) live within a single codebase and deployment unit. This eliminated CORS complexities, simplified environment variable management, and made deployment to serverless platforms seamless.
2. **Connection-Pooled ORM (`@prisma/adapter-pg` with native `pg`):** 
   In serverless environments, standard ORM connections can easily exhaust database connection limits during bursty webhook traffic. I decided to use Prisma 7 paired with the native `@prisma/adapter-pg` driver. This guarantees efficient PostgreSQL connection pool utilization while maintaining end-to-end TypeScript type safety for command logging and deduplication.
3. **Asynchronous Non-Blocking Webhook Processing & Deferred Responses:** 
   Rather than coupling the HTTP response to downstream I/O, I architected the interactions endpoint to decouple acknowledgement from execution. For slash commands, the handler returns Type 5 (`DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE`) in under 20ms, displaying *"Bot is thinking..."* and granting a 15-minute SLA. Meanwhile, database writes and Slack/Discord webhook mirroring fire asynchronously in the background before updating the original message via REST (`PATCH /messages/@original`).
4. **Interactive UI State Management & Disabled Button Patterns:** 
   When administrators process reports via button clicks (`ack_report`, `dismiss_report`), instead of attempting to pass empty component arrays (`components: []`) which violate Discord's v10 interaction response schema, we transform active buttons into disabled visual indicators (`[ Acknowledged by username ✅ ]`). This provides clear visual consensus across admin channels while adhering to Discord's strict validation rules.
5. **Modular Layered Dispatcher Architecture:** 
   As interaction types expanded to encompass Slash Commands (Type 2), Message Components (Type 3), and Modal Submissions (Type 5), the monolithic route grew to ~500 lines. We refactored the codebase into clean separation of concerns: `utils/verify.ts` handles Ed25519 cryptographic authentication, `services/webhooks.ts` manages outbound REST APIs, and dedicated domain handlers (`handlers/commands.ts`, `handlers/components.ts`, `handlers/modals.ts`) encapsulate business logic, leaving `app/api/interactions/route.ts` as a concise 38-line traffic controller.

---

## 3. The Hardest AI Bug / Wrong Turn: Synchronous Blocking & Webhook Timeouts
* **What the AI Got Wrong:** When drafting the initial `/api/interactions` handler, the AI wrote sequential, synchronous `await` calls for all downstream tasks: first `await prisma.command_log.findUnique(...)` for deduplication, then `await prisma.command_log.create(...)` to save the record, and finally `await fetch(process.env.SLACK_WEBHOOK_URL, ...)` to mirror the alert to Slack—all *before* returning the `NextResponse.json(...)` reply to Discord.
* **How I Noticed:** During live testing with ngrok, executing `/report` or `/status` in Discord frequently resulted in a red error message: *"The application did not respond"*. Strangely, when checking Prisma Studio, the command records *were* actually being saved in PostgreSQL! Furthermore, if I re-ran the command a minute later, it would succeed without timing out.
* **The Root Cause:** Discord enforces a strict **~3,000ms timeout** on interaction webhooks. Because I used a free-tier Neon Serverless Postgres database, compute resources auto-suspended after periods of inactivity. When a fresh slash command arrived, waking up the database and establishing a TLS connection took ~1.8 to 2.2 seconds. Adding the synchronous HTTP POST round-trip to Slack's servers (~600–900ms) pushed total latency above 3,000ms. Discord closed the connection and showed an error to the user, even though Node.js finished writing to the DB in the background a second later.
* **How I Fixed It:** I refactored the route handler to eliminate all blocking downstream I/O before the return statement:
  1. I removed the explicit pre-query `await findUnique` check, instead relying directly on PostgreSQL's native `@unique` index constraint on `interactionId` to silently catch duplicate payloads in an asynchronous `.catch()` block.
  2. I stripped the `await` keyword from both `prisma.command_log.create(...)` and `fetch(SLACK_WEBHOOK_URL, ...)`. 
  3. I transitioned to Discord's deferred message workflow (`DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE`), allowing the endpoint to acknowledge receipt in under **~20ms** every time. Database logging and Slack mirroring reliably complete in an IIFE background task before editing the `@original` interaction message.

---

## 4. Advanced Interactive Features: Modals & Action Rows
To eliminate single-string command limitations and enable rich data collection, we integrated interactive components:
* **Multi-Step Dialog Forms (Modals):** We added a dedicated `/feedback` command and updated `/report` with optional arguments. When invoked without text, the endpoint returns `InteractionResponseType.MODAL` (Type 9) immediately, launching a popup dialog with short text (`Title`) and paragraph (`Detailed Description`) input rows.
* **Modal Submission Processing:** When users submit dialog forms, Discord fires an interaction of Type 5 (`MODAL_SUBMIT`). Our `handleModalSubmit` handler extracts form values from nested `ActionRow` structures, records them asynchronously to PostgreSQL, scans for flagged keywords, mirrors alerts to Slack/Discord channels, and replies with a formatted confirmation message featuring interactive admin review buttons.

---

## 5. The AI Triage Step (Free Tier LLM Integration)
To elevate the bot from a passive recorder to an intelligent community moderator assistant, we implemented automated LLM triage without introducing additional latency or costs:
* **The Goal & Workflow:** Every `/report` command and modal submission is processed through an LLM to automatically generate a structured 1-line summary (`Category: <Bug/Spam/Feature/Other> | Priority: <High/Medium/Low> | Summary: <1-sentence summary>`). This triage string is persisted to PostgreSQL, attached to the Discord message response, and prominently displayed in a dedicated column on the live admin dashboard.
* **Zero-Cost Tooling (Google Gemini & Groq):** The triage service (`services/ai.ts`) dynamically supports free-tier API keys (`GEMINI_API_KEY` via Google AI Studio or `GROQ_API_KEY` via Groq Llama-3.3-70B). If neither key is present during initial testing, a built-in simulation fallback generates triage metadata so the bot never fails or blocks execution.
* **Reliability via Deferred Acknowledgments:** Because LLM inference typically takes ~1 to 3 seconds—which would risk triggering Discord's strict 3,000ms webhook timeout if executed synchronously—we leveraged our Type 5 (`DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE`) deferred response architecture. The endpoint immediately replies with *"Bot is thinking..."* in under ~20ms. The AI triage API call executes concurrently in the background IIFE alongside PostgreSQL logging and Slack mirroring before editing the `@original` Discord message with the final AI insights.
