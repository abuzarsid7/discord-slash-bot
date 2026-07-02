import { verifyKey } from 'discord-interactions';

export async function verifyDiscordRequest(req: Request): Promise<{
  isValid: true;
  message: any;
  rawBody: string;
} | {
  isValid: false;
  response: Response;
}> {
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  const rawBody = await req.text();

  if (!signature || !timestamp) {
    return { isValid: false, response: new Response('Missing signature or timestamp', { status: 401 }) };
  }

  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    return { isValid: false, response: new Response('Server configuration error: missing public key', { status: 500 }) };
  }

  const isValidRequest = await verifyKey(rawBody, signature, timestamp, publicKey);
  if (!isValidRequest) {
    return { isValid: false, response: new Response('Invalid request signature', { status: 401 }) };
  }

  const message = JSON.parse(rawBody);
  return { isValid: true, message, rawBody };
}
