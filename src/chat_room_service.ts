import { z } from "zod";
import { InfraiClient, infrai } from "./infrai_client.js";

export const deliveryRequest = z.object({ session_id: z.string().min(1), asset_id: z.string().min(1), creator_id: z.string().min(1), channel: z.string().min(1) });
export type DeliveryRequest = z.infer<typeof deliveryRequest>;

export async function deliverCreatorRoom(input: DeliveryRequest, client = new InfraiClient()) {
  const request = deliveryRequest.parse(input);
  await infrai.auth.session.verify(client, request.session_id);
  await infrai.rtc.room.create(client, { name: request.channel, max_participants: 50, empty_timeout_s: 300, region: "auto" });
  const channel = await infrai.realtime.channel.create(client, { channel: request.channel, type: "chat", vendor: "infrai" });
  const token = await infrai.realtime.token.issue(client, { client_id: request.creator_id, channels: [request.channel], capabilities: ["publish", "subscribe"], ttl_seconds: 3600 });
  await infrai.realtime.publish(client, { channel: request.channel, event: "asset.ready", data: { asset_id: request.asset_id }, account_id: request.creator_id });
  return { channel, token, state: "creator-delivered" as const };
}
