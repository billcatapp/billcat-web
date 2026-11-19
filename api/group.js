// Interstitial for the e-bill's "Join Whatsapp Group" button.
//
// Meta forbids chat.whatsapp.com in a template URL button, so the button
// points at billcat.in/g/<code>. A plain redirect from here does NOT work:
// WhatsApp opens the button in its own in-app browser, and a server-side
// redirect to chat.whatsapp.com happens inside that webview, where the app
// never gets to intercept it as a native link — the user just sees
// "Couldn't load". A link the user TAPS can hand off natively, so this
// serves a page with the invite as a real tap target instead.
//
// 'none' is the code sent by a shop that has not set a group link; a dynamic
// button must always carry a parameter, so that case lands here too.

const INVITE_BASE = 'https://chat.whatsapp.com/';

// WhatsApp invite codes are alphanumeric. Anything else is refused rather
// than reflected, so this cannot be used to point billcat.in at another site.
const CODE_RE = /^[A-Za-z0-9]{6,40}$/;

function page({ title, body, href, cta }) {
  const link = href
    ? `<a class="cta" href="${href}">${cta}</a>`
    : `<a class="cta secondary" href="https://www.billcat.in/">Go to BillCat</a>`;
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center;
    justify-content: center; padding: 24px;
    font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f7f7f8; color: #1d1d1f;
  }
  .card {
    background: #fff; border-radius: 16px; padding: 32px 24px; max-width: 380px;
    width: 100%; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,.08);
  }
  .mark { font-size: 15px; font-weight: 700; letter-spacing: -.2px; color: #1aad56; }
  h1 { font-size: 20px; font-weight: 700; margin: 18px 0 8px; }
  p { font-size: 14.5px; color: #6e6e73; margin: 0 0 24px; }
  .cta {
    display: block; padding: 15px 20px; border-radius: 12px; background: #25d366;
    color: #fff; font-weight: 700; font-size: 15.5px; text-decoration: none;
  }
  .cta.secondary { background: #1d1d1f; }
  .hint { font-size: 12.5px; color: #8e8e93; margin: 16px 0 0; }
</style>
</head><body>
  <div class="card">
    <div class="mark">BillCat</div>
    <h1>${title}</h1>
    <p>${body}</p>
    ${link}
    <p class="hint">If nothing happens, press and hold the button and choose Open.</p>
  </div>
</body></html>`;
}

export default function handler(req, res) {
  const raw = Array.isArray(req.query?.code) ? req.query.code[0] : req.query?.code;
  // A dynamic URL button APPENDS its parameter to the base URL. A template
  // whose base wrongly ends in the placeholder yields /g/{{1}}<code>, so the
  // placeholder is stripped rather than failing the bill's button. Fix the
  // template too — this only rescues messages already sent.
  const code = String(raw ?? '').trim().replace(/^\{\{\s*\d+\s*\}\}/, '');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // The site sends X-Frame-Options: DENY on every path. In-app browsers can
  // refuse to render that, which is the very failure this page exists to fix.
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

  if (!CODE_RE.test(code) || code === 'none') {
    res.status(200).send(page({
      title: 'No group yet',
      body: 'This shop has not set up a WhatsApp group. Your bill is attached to the message you came from.',
    }));
    return;
  }

  res.status(200).send(page({
    title: 'Join the WhatsApp group',
    body: 'Tap below to open the group in WhatsApp.',
    href: INVITE_BASE + code,
    cta: 'Open in WhatsApp',
  }));
}
