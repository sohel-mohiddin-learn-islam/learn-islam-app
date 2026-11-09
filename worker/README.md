# Learn Islam free backend (AI Tutor + push notifications)

One Cloudflare Worker (free plan) does both jobs.

1. Create a free account at cloudflare.com. Install Node, then in this `worker/` folder run:
   `npx wrangler login` then `npx wrangler deploy`  (Workers AI is included in the free daily allowance).
2. Push notifications: Firebase console > Project settings > Service accounts > Generate new private key.
   Then run `npx wrangler secret put FCM_SERVICE_ACCOUNT` and paste the whole JSON file contents.
3. Copy the Worker URL (https://learn-islam-api.<you>.workers.dev).
4. GitHub repo > Settings > Secrets and variables > Actions > **Variables** > New variable `AI_ENDPOINT` = that URL.
5. Publish the new `firestore.rules` (adds `tokens`) and re-run the APK build.
