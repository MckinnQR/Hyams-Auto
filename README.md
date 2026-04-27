# Hyams Auto

Static marketing site for Hyams Auto & ... (Blue Ash, OH). Hosted on Firebase Hosting, with a single Cloud Function backing the contact / appointment form.

## Local development

```bash
# Install Firebase CLI if needed:
npm i -g firebase-tools

# One-time: install the function deps
npm run functions:install

# Serve hosting + functions emulator (form submissions work end-to-end in mock mode)
npm run serve

# Or just the static site (no form backend):
npm run serve:hosting
```

Hosting runs at http://localhost:5002. The form posts to `/api/lead`, which is rewritten to the `lead` function.

## Demo / mock mode

If no `BREVO_API_KEY` secret is set, submissions still succeed: the lead is written to Firestore and the would-be email + SMS are logged to `firebase functions:log` instead of sent. The success screen shows a small "(demo mode)" badge so you can tell them apart in pitches.

To make it fully live, set the secrets below.

## Going live (Brevo email + SMS)

1. Make sure the Firebase project `hyams-auto` exists and has Blaze billing enabled (required for Functions).
2. Authenticate once: `firebase login`
3. Create a Brevo account at https://brevo.com, generate an API key, and verify a sender email.
4. Set the secrets:
   ```bash
   firebase functions:secrets:set BREVO_API_KEY    # from Brevo → SMTP & API
   firebase functions:secrets:set NOTIFY_FROM      # verified Brevo sender email
   firebase functions:secrets:set NOTIFY_TO        # comma-separated recipients
   firebase functions:secrets:set NOTIFY_SMS_TO    # optional, comma-separated E.164 numbers (+15137954171)
   firebase functions:secrets:set NOTIFY_SMS_FROM  # optional, alphanumeric sender id, ≤11 chars (default: HyamsAuto)
   ```
5. Deploy: `npm run deploy` (hosting + functions). Use `npm run deploy:hosting` for content-only changes.

## Lead storage

Form submissions are written to the `leads` collection in Firestore (auto-provisioned). Notifications are fire-and-forget — if Brevo fails, the lead still saves and the user still sees a success message. Check `firebase functions:log` for delivery status.

## Logo / image processing

The transparent logo + favicons + og-image are generated from a source PNG via `scripts/process-logo.py`.
Re-run if you swap the source: `npm run process-logo` (requires `pillow` and `rembg`).

## Stack

- Static HTML/CSS/vanilla JS
- Firebase Hosting (cleanUrls, security headers, immutable asset caching)
- Firebase Cloud Functions v2 (Node 20) for the contact form
- Firestore for lead storage
- Brevo HTTP API for transactional email + SMS notifications
- Inter + Big Shoulders Display from Google Fonts
