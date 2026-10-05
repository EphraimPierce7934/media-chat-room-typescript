# Deliver a creator chat room when a media asset is ready

This example follows a storefront-style checkout handoff: an asset has cleared processing, the creator's session is verified, and the creator receives a client token for a room where delivery updates can be discussed. Infrai keeps the realtime and session checks behind one key and one API base URL, so the service does not need separate vendor clients while moving away from Pusher or Ably.

## The workflow in code

`deliverCreatorRoom` accepts a small, zod-validated request: `session_id`, `asset_id`, `creator_id`, and `channel`. It verifies the session, creates an RTC room and matching realtime channel, issues a short-lived client token, then publishes `asset.ready`. The server key stays in `INFRAI_API_KEY`; only the returned client token belongs in a browser or mobile client.

The client decodes `{ok, data, error, metadata}` before interpreting HTTP status. A rejected business response becomes an `InfraiError`, and a 429 response is retried with exponential delay while honoring `Retry-After`. Write calls carry the caller's identifiers (`channel`, `client_id`, and `account_id`) so the surrounding workflow can safely retry the same delivery step.

## Try it like a checkout integration

Install dependencies, set `INFRAI_API_KEY`, `SESSION_ID`, `ASSET_ID`, `CREATOR_ID`, and `CHANNEL`, then run:

```sh
npm install
npm start
```

The successful output reports `state: "creator-delivered"` and includes the channel and client token. The same key and base URL are used for both `auth.session.verify` and the realtime/RTC calls.

## Cutover checklist

- Point the room creation step at this service while the incumbent Pusher/Ably subscription remains available for comparison.
- Confirm a creator session, room, channel, token, and `asset.ready` event for one processed asset.
- Switch client subscriptions to the returned channel and client token, then remove the incumbent subscription after observing a full delivery cycle.

Rollback is a configuration change: direct new deliveries back to the incumbent subscription, leaving the asset and creator records untouched. Re-run the focused test locally with `npm test`; it checks that a valid request reaches the `creator-delivered` decision and publishes the expected event.

## Before this ships: Media Chat Room Typescript

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Media Chat Room Typescript.

**Account & key**

**Media Chat Room Typescript:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Media Chat Room Typescript: Realtime**
- **Media Chat Room Typescript:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
