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

## Tech Stack

- Single self-contained HTML file
- Tailwind CSS (CDN)
- Leaflet.js (CDN)
- Pure CSS animations for the radar logo
- Optional: @vercel/analytics (for production analytics when deployed on Vercel)

## Data

All locations are real public access points (shore, pier, or dock) within 15 miles of Byron Center (42.81, -85.72). Data compiled from Kent County Parks, local city parks, and public fishing resources.

## License & Disclaimer

Michigan fishing license required. Always verify current conditions and regulations. Data is for informational purposes only.

---

Built with ❤️ for local anglers who only have an hour or two.