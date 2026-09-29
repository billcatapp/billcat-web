// Redirects to the current Windows installer.
//
// The site used to serve public/downloads/BillCat-Setup.exe, a file committed
// to this repo and refreshed by hand. It had gone three releases stale (1.12.0
// while 1.15.1 was out), so every new shop installed an old build and then had
// to self-update forward — and a shop whose self-update fails was stranded on
// whatever the site handed it.
//
// Reading the same feed the app itself checks means the site can never fall
// behind a release again. Naming follows the release workflow: tag v<version>,
// asset BillCat-Setup-<version>.exe.

const FEED_URL =
  'https://xawpxbhglzhaibmcpwho.supabase.co/storage/v1/object/public/billcat-updates/version-windows.json';
const RELEASES_PAGE = 'https://github.com/billcatapp/billcatwin/releases/latest';

export default async function handler(req, res) {
  let target = RELEASES_PAGE;
  try {
    const feed = await fetch(FEED_URL, { cache: 'no-store' });
    if (feed.ok) {
      const data = await feed.json();
      const version = String(data.version || '').trim();
      // Guard the version shape: it is interpolated into a URL, and a feed
      // that ever returned something unexpected must fall back rather than
      // send visitors to a made-up address.
      if (/^\d+\.\d+\.\d+$/.test(version)) {
        target =
          `https://github.com/billcatapp/billcatwin/releases/download/v${version}` +
          `/BillCat-Setup-${version}.exe`;
      }
    }
  } catch (e) {
    // Falls through to the releases page: one extra click, but always a
    // current installer.
  }
  // 302, not 301: the target moves with every release and must never be
  // cached by a browser as permanent.
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.redirect(302, target);
}
