import { prisma } from '@/lib/prisma';

export async function notifyMirrorWebhooks(guildId: string, notifyText: string, interactionId?: string): Promise<void> {
  try {
    const mirrorRecord = await prisma.config.findUnique({
      where: { guildId_key: { guildId, key: 'mirror_webhook_url' } }
    });
    const dbMirrorUrl = mirrorRecord?.value?.trim();
    const envDiscordUrl = (process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL)?.trim();
    const urlsToNotify = Array.from(new Set([dbMirrorUrl, envDiscordUrl].filter(Boolean) as string[]));

    if (urlsToNotify.length === 0) return;

    const payload = JSON.stringify({
      content: notifyText, // For Discord channel webhooks
      text: notifyText     // Fallback for Slack webhooks
    });

    urlsToNotify.forEach((url) => {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000),
        body: payload
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        })
        .catch((error) => {
          console.error(`Mirror webhook failed (${url}):`, error);
          if (interactionId) {
            prisma.command_log.updateMany({
              where: { interactionId, guildId },
              data: { errorLog: `Mirror failed (${url.slice(0, 25)}...): ${error.message || error}` }
            }).catch((e) => console.error("Failed to update DB error log:", e));
          }
        });
    });
  } catch (err) {
    console.error("Error checking mirror webhooks:", err);
  }
}

export async function editOriginalInteraction(token: string, content: string, components?: any[]): Promise<void> {
  const appId = process.env.DISCORD_APP_ID;
  if (!appId || !token) return;

  const editUrl = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
  const editPayload: any = { content };
  if (components) {
    editPayload.components = components;
  }

  try {
    const res = await fetch(editUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(4000),
      body: JSON.stringify(editPayload)
    });
    if (!res.ok) {
      console.error("Discord edit original interaction failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("Failed to edit original interaction message:", e);
  }
}
