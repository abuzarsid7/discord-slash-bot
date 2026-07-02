import { InteractionType, InteractionResponseType } from 'discord-interactions';
import { verifyDiscordRequest } from '@/utils/verify';
import { handleApplicationCommand, handleMessageComponent, handleModalSubmit } from '@/handlers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // 1. Verify Ed25519 signature and parse message body
  const verification = await verifyDiscordRequest(req);
  if (!verification.isValid) {
    return verification.response;
  }

  const { message } = verification;

  // 2. Dispatch by interaction type
  if (message.type === InteractionType.PING) {
    return new Response(JSON.stringify({ type: InteractionResponseType.PONG }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (message.type === InteractionType.APPLICATION_COMMAND) {
    return handleApplicationCommand(message);
  }

  if (message.type === InteractionType.MESSAGE_COMPONENT) {
    return handleMessageComponent(message);
  }

  if (message.type === InteractionType.MODAL_SUBMIT) {
    return handleModalSubmit(message);
  }

  return new Response('Unknown interaction type', { status: 400 });
}
