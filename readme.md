# Committee Jeopardy

A single-page, clickable Jeopardy board for Life Gurukula / Our Lady of the Elms.
Click a dollar tile to show the clue, click once to reveal the response, click again
to close and gray out the tile. "Reset Board" restores everything.

It's one static `index.html` with no build step and no dependencies (fonts load
from Google Fonts; it still works offline with fallback fonts).

## Push to GitHub

```bash
git init
git add index.html README.md
git commit -m "Committee Jeopardy board"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Deploy to Vercel

1. Go to vercel.com, click **Add New → Project**, and import the GitHub repo.
2. Framework Preset: **Other**. Leave build command and output directory blank.
3. Click **Deploy**. Vercel serves `index.html` at the root automatically — no
   `vercel.json` needed.

Or, from the command line with the Vercel CLI:

```bash
npm i -g vercel
vercel
```