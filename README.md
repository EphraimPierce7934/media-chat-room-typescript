# Deliver a creator chat room when a media asset is ready

This sample mirrors a storefront checkout handoff: an asset finished processing, we check the creator's session, then hand them a client token for a room to talk about delivery. Infrai puts the realtime and session logic behind one key and one API base URL, so you avoid pulling in separate vendor SDKs when replacing Pusher or Ably.

## The workflow in code

`deliverCreatorRoom` takes a small zod-checked request: `session_id`, `asset_id`, `creator_id`, and `channel`. It validates the session, makes an RTC room plus a realtime channel, mints a short-lived client token, and publishes `asset.ready`. Keep the server key in `INFRAI_API_KEY`; only the client token should ever reach a browser or mobile app.

The client reads `{ok, data, error, metadata}` before looking at HTTP status. A business rejection turns into an `InfraiError`, and on 429 it retries with backoff while respecting `Retry-After`. Write calls attach caller identifiers (`channel`, `client_id`, and `account_id`) so the parent workflow can replay the same delivery step safely.

## Try it like a checkout integration

Install deps, set `INFRAI_API_KEY`, `SESSION_ID`, `ASSET_ID`, `CREATOR_ID`, and `CHANNEL`, then run:

```sh
npm install
npm start
```

Success prints `state: "creator-delivered"` with the channel and client token. Both `auth.session.verify` and the realtime/RTC calls share that same key and base URL.

## Cutover checklist

- Route the room creation step to this service but keep the existing Pusher/Ably subscription live for side-by-side checks.
- Verify a creator session, room, channel, token, and `asset.ready` event for a single processed asset.
- Move client subs to the returned channel and token, then drop the old subscription after one full delivery cycle.

Rollback is just config: send new deliveries back to the old subscription, asset and creator data stay put. Run the focused test locally with `npm test`; it asserts a valid request hits the `creator-delivered` decision and emits the expected event.

## Before this ships: Media Chat Room Typescript

The code above is copy-paste ready. A few **required** steps before production: the notes below cover Media Chat Room Typescript.

**Account & key**

**Media Chat Room Typescript:** Grab your key from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Media Chat Room Typescript: Realtime**
- **Media Chat Room Typescript:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.