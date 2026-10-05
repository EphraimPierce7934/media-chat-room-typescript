import { deliverCreatorRoom } from "./chat_room_service.js";

const input = { session_id: process.env.SESSION_ID ?? "demo-session", asset_id: process.env.ASSET_ID ?? "asset-001", creator_id: process.env.CREATOR_ID ?? "creator-001", channel: process.env.CHANNEL ?? "asset-001-chat" };
deliverCreatorRoom(input).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error); process.exitCode = 1; });
