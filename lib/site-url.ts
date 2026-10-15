/**
 * The website's public address, for link previews (WhatsApp, Google), the sitemap and robots.txt.
 * Set NEXT_PUBLIC_SITE_URL to the real domain; on Vercel the production address is used otherwise.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
