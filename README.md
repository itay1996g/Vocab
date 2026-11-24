# Vocab

A vocabulary practice app for iPhone: a words bank, flashcards and a typing quiz. All data stays on the phone (IndexedDB).

## Run it on your Mac

```sh
npm install
npm run dev
```

- Open the "Local" URL on the Mac.
- To try it on your iPhone, open the "Network" URL in Safari (same Wi-Fi). Offline use and Add to Home Screen need the HTTPS version below.

## Deploy to Vercel

1. Push this folder to a GitHub repo (it can be private).
2. On vercel.com, click "Add New" > "Project", import the repo and click "Deploy". Vercel finds the Vite settings itself.
3. Each push to the main branch deploys again.

## Install on the iPhone

1. Open the Vercel URL in Safari.
2. Tap Share > "Add to Home Screen".
3. Open Vocab from the Home Screen. It runs full screen and works offline.

## Notes

- Export a backup from Settings from time to time ("Save to Files"). Import merges the file and skips words you already have.
- In the translation, separate several correct answers with "," or "/". Text in parentheses is optional in the quiz.
- To change the app icon, edit `public/logo.svg` and run `npm run icons`.
