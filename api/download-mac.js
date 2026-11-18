// Redirects to the current macOS DMG.
//
// Mirrors download-windows.js: reads the same feed the Mac app checks for
// updates (version.json), so the site's Mac button always serves the latest
// release. Naming follows the Mac release: tag v<version>, asset
// BillCat-<version>.dmg.

const FEED_URL =
  'https://xawpxbhglzhaibmcpwho.supabase.co/storage/v1/object/public/billcat-updates/version.json';
const RELEASES_PAGE = 'https://github.com/billcatapp/billcat/releases/latest';

export default async function handler(req, res) {
  let target = RELEASES_PAGE;
  try {
    const feed = await fetch(FEED_URL, { cache: 'no-store' });
    if (feed.ok) {
      const data = await feed.json();
      const version = String(data.version || '').trim();
      const dmg = String(data.dmg_url || '').trim();
      // Only follow URLs on hosts we publish to, since the feed value is
      // used as a redirect target.
      if (
        dmg.startsWith('https://xawpxbhglzhaibmcpwho.supabase.co/') ||
        dmg.startsWith('https://github.com/billcatapp/billcat/releases/download/')
      ) {
        target = dmg;
      } else if (/^\d+\.\d+\.\d+$/.test(version)) {
        target =
          `https://github.com/billcatapp/billcat/releases/download/v${version}` +
          `/BillCat-${version}.dmg`;
      }
    }
  } catch (e) {
    // Falls through to the releases page: one extra click, but always a
    // current DMG.
  }
  // 302, not 301: the target moves with every release.
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.redirect(302, target);
}
