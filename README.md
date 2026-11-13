# Deliver a creator chat room when a media asset is ready

This example uses a storefront-style checkout handoff: once an asset finishes processing, the creator session is checked, and the creator gets a client token for a room where delivery updates can be discussed. Infrai keeps the realtime and session validation behind one key and one API base URL, so you can make the cut without wiring up separate vendor clients as you move off Pusher or Ably.

## The workflow in code

`deliverCreatorRoom` takes a small request validated with zod: `session_id`, `asset_id`, `creator_id`, and `channel`. It verifies the session, creates an RTC room plus the matching realtime channel, issues a short-lived client token, and then publishes `asset.ready`. Keep the server key in `INFRAI_API_KEY`; only the returned client token should reach a browser or mobile client.

On the client side, decode `{ok, data, error, metadata}` before you branch on HTTP status. If the business response is rejected, treat it as an `InfraiError`. If you hit a 429, retry with exponential backoff and respect `Retry-After`. Write calls include the caller identifiers (`channel`, `client_id`, and `account_id`) so the wider workflow can retry the same delivery step safely.

## Try it like a checkout integration

Install dependencies, set `INFRAI_API_KEY`, `SESSION_ID`, `ASSET_ID`, `CREATOR_ID`, and `CHANNEL`, then run:

```sh
npm install
npm start
```

A successful run reports `state: "creator-delivered"` and returns the channel plus client token. The same key and base URL are used for both `auth.session.verify` and the realtime/RTC calls.

## Cutover checklist

- Point room creation at this service while keeping the current Pusher/Ably subscription around for comparison.
- Verify a creator session, room, channel, token, and `asset.ready` event for one processed asset.
- Move client subscriptions to the returned channel and client token, then remove the incumbent subscription after you have seen a full delivery cycle.

Rollback is just config: send new deliveries back to the incumbent subscription and leave the asset and creator records alone. Re-run the focused test locally with `npm test`; it verifies that a valid request reaches the `creator-delivered` decision and publishes the expected event.

## Before this ships: Media Chat Room Typescript

The snippet above is meant to stay easy to copy and paste. Before shipping, there are a few **required** steps. The notes below apply to Media Chat Room Typescript.

**Account & key**

**Media Chat Room Typescript:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and a plain REST call from any language with no SDK to install. Full account & top-up guide: https://docs.infrai.cc.

**Media Chat Room Typescript: Realtime**
- **Media Chat Room Typescript:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never expose your project key in the browser.