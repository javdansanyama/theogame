# Theo Coin Quest (Phaser + Vite + TypeScript PWA)

A mobile-first Phaser 3 game scaffolded with Vite + TypeScript and installable as a PWA.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).


> Note: PWA PNG icons are generated procedurally by `scripts/generate-pwa-icons.mjs` during `npm run dev` and `npm run build`, so binary icons are not stored in git.

## Build for production

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

This repo includes a workflow at `.github/workflows/deploy-gh-pages.yml` that deploys on pushes to `main`.

1. Push this project to GitHub.
2. In your repository on GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main` (or run the workflow manually from **Actions**).
5. After it finishes, your game will be live at:
   `https://<your-username>.github.io/<your-repo-name>/`

The workflow automatically sets `BASE_PATH=/<repo-name>/` so Vite and the PWA manifest work correctly on project pages.

## Gameplay

- Move with **Left/Right** and jump with **Jump** (touch buttons) on mobile.
- Keyboard is also supported for desktop testing:
  - Left/Right arrows to move
  - Up arrow or space to jump
- Collect all 5 coins to show **You Win!**

## Install as a PWA on Android

1. Run a production build and serve it (`npm run build && npm run preview`) or deploy it over HTTPS.
2. Open the game in Chrome on Android.
3. Tap the browser menu (⋮) and choose **Add to Home screen** (or **Install app**).
4. Launch from your home screen for standalone app mode.
