import { WebhookReceiver } from "livekit-server-sdk";
import { NextRequest } from "next/server";

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!,
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const auth = req.headers.get("Authorization");
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }
  const event = receiver.receive(body, auth);
  console.log("event", event);

  return new Response("OK");
}
