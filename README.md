# FishMap

**Public shore, pier & dock fishing spots near Byron Center, Michigan**

A beautiful, mobile-first single-file web app for finding quick public fishing access (no boat required) within ~15 miles of Byron Center, MI.

## Features

- **20 real public fishing locations** (Kent County parks, Grand River accesses, Reeds Lake, etc.)
- Animated submarine-style radar logo with neon cyberpunk effects
- Interactive Leaflet map with custom neon markers
  - Cyan = Pier / Dock
  - Violet = Shore / Bank access
- "Near Me" geolocation that highlights the closest spots
- Live hourly weather (now + next 4 hours) for the Byron Center area via Open-Meteo

- Detailed spot modals with:
  - Address, hours, parking info
  - Target species tags
  - "Open in Maps" and "Drive There" buttons
- Fully responsive (excellent on mobile)
- Dark futuristic cyberpunk aesthetic

## Live Demo

Visit on your phone or desktop:

→ [Your custom subdomain here]

(Or open `index.html` directly in any browser)

**Social sharing note:** Includes Open Graph + Twitter Card meta tags + og-image.jpg (created from your header branding with the radar logo, FishMap name, and SHORE • PIER • DOCK line) so link previews on iMessage/WhatsApp/etc. look good. The image URLs are root-relative (/og-image.jpg) so they work on any domain. Update only the og:url (and the comment above it) if you want a different canonical URL for your custom subdomain.

## How to Use Locally

1. Clone the repo
2. Open `index.html` in your browser
3. That's it — no build step (open index.html directly). Note: `@vercel/analytics` is an optional prod dependency for Vercel Web Analytics (only active when deployed to Vercel).

## Deployment

This is a static site (single `index.html`). It deploys easily to Vercel (recommended, for the built-in Analytics) or GitHub Pages.

### Deploy to Vercel (recommended)

1. Make sure you've pushed your latest changes to the GitHub repo.
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
3. Click **"Add New Project"** → Import the `fishmap2` GitHub repository.
4. Vercel will auto-detect it as a static site (we have a `vercel.json` to ensure this).
5. Click **Deploy**.
6. (Optional but recommended) In your new Vercel project settings:
   - Go to **Analytics** tab and enable Vercel Web Analytics.
   - The `<script>` tags already in `index.html` will start sending data automatically.

Once deployed, update the "Live Demo" link in this README and the `og:url` meta tag in `index.html` to your new Vercel URL (e.g. `https://fishmap2.vercel.app`).

You can also deploy from the CLI (from this directory):

```bash
npx vercel
# Follow the prompts to log in and deploy
# For production: npx vercel --prod
```

### Alternative: GitHub Pages

1. In your GitHub repo settings → Pages → Source: "Deploy from a branch" → Branch: `main` / root.
2. It will be available at `https://<username>.github.io/fishmap2/`.
3. Update the `og:url` and README links accordingly.
4. Note: Vercel Analytics will not work on GitHub Pages (remove the analytics script tags if you go this route).

`vercel.json` is configured for zero-build static output.

## Tech Stack

- Single self-contained HTML file
- Tailwind CSS (precompiled to a committed `tailwind.css` — rebuild with `npm run build:css` after changing classes in `index.html`; still no build step at deploy time)
- Leaflet.js (CDN)
- Live hourly weather from [Open-Meteo](https://open-meteo.com) (free, no API key required)
- Pure CSS animations for the radar logo
- Optional: @vercel/analytics (for production analytics when deployed on Vercel)

## Data

All locations are real public access points (shore, pier, or dock) within 15 miles of Byron Center (42.81, -85.72). Data compiled from Kent County Parks, local city parks, and public fishing resources.

## License & Disclaimer

Michigan fishing license required. Always verify current conditions and regulations. Data is for informational purposes only.

---

Built with ❤️ for local anglers who only have an hour or two.