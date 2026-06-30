import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';

export async function POST(req: Request) {
  // Get headers for verification
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  
  // We need the raw body as a string to verify the signature
  const rawBody = await req.text();

  if (!signature || !timestamp) {
    return new Response('Missing signature or timestamp', { status: 401 });
  }

  // Ensure DISCORD_PUBLIC_KEY is set in your environment variables (.env.local)
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    return new Response('Server configuration error: missing public key', { status: 500 });
  }

  // Verify the request signature
  const isValidRequest = await verifyKey(rawBody, signature, timestamp, publicKey);

  if (!isValidRequest) {
    return new Response('Invalid request signature', { status: 401 });
  }

  // Parse the verified message body
  const message = JSON.parse(rawBody);

  if (message.type === InteractionType.PING) {
    return new Response(JSON.stringify({ type: InteractionResponseType.PONG }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // TODO: Handle other interaction types (e.g., slash commands)
  
  return new Response('Unknown interaction type', { status: 400 });
}
