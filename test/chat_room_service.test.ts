import assert from "node:assert/strict";
import { deliverCreatorRoom } from "../src/chat_room_service.js";

const calls: Array<[string, string, unknown]> = [];
const fake = { request: async (method: string, path: string, body?: unknown) => { calls.push([method, path, body]); if (path.includes("session/verify")) return { valid: true }; if (path.includes("channel/create")) return { name: "room" }; if (path.includes("token/issue")) return { token: "client-token" }; return { accepted: true }; } } as any;
const result = await deliverCreatorRoom({ session_id: "s1", asset_id: "a1", creator_id: "c1", channel: "a1-chat" }, fake);
assert.equal(result.state, "creator-delivered");
assert.equal(calls.some(([, path]) => path === "/v1/realtime/publish"), true);
assert.equal((calls.find(([, path]) => path === "/v1/realtime/token/issue")?.[2] as any).client_id, "c1");
console.log("chat room delivery decision: creator-delivered");
