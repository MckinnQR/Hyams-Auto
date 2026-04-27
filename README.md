# Hyams Auto

Static marketing site for Hyams Auto & ... (Blue Ash, OH). Hosted on Firebase Hosting.

## Local development

```bash
# Install Firebase CLI if needed:
npm i -g firebase-tools

# Serve locally on http://localhost:5002
npm run serve
```

## Deploying

1. Make sure the Firebase project `hyams-auto` exists at https://console.firebase.google.com — create it if not.
2. Authenticate once: `firebase login`
3. Deploy: `npm run deploy`

## Logo / image processing

The transparent logo + favicons + og-image are generated from a source PNG via `scripts/process-logo.py`.
Re-run if you swap the source: `npm run process-logo` (requires `pillow` and `rembg`).

## Stack

- Static HTML/CSS/vanilla JS
- Firebase Hosting (cleanUrls, security headers, immutable asset caching)
- Inter + Big Shoulders Display from Google Fonts
