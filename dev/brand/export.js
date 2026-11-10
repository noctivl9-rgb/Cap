const fs = require('fs'); const L = require('../../logo.js'); const { chromium } = require('playwright');
const out = __dirname + '/out/'; fs.mkdirSync(out, { recursive: true });
const word = (mode, col) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 128" width="460" height="128"><g>${L.mark({ size: 128, mode }).replace('<svg ', '<svg x="0" y="0" ')}</g><text x="168" y="86" font-family="-apple-system,'SF Pro Display','Helvetica Neue',Arial,sans-serif" font-size="58" font-weight="600" letter-spacing="18" fill="${col}">CAP</text></svg>`;
const files = {
  'cap-logo-clair.svg': word('light', '#141416'), 'cap-logo-noir.svg': word('dark', '#E9EBEE'),
  'cap-monogramme-clair.svg': L.mark({ size: 128 }), 'cap-monogramme-noir.svg': L.mark({ size: 128, mode: 'dark' }),
  'cap-monochrome.svg': L.mark({ size: 128, mode: 'mono', color: '#141416' }), 'cap-icone.svg': L.mark({ size: 128, mode: 'icon' })
};
for (const [f, v] of Object.entries(files)) fs.writeFileSync(out + f, v.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  for (const s of [180, 192, 512]) { await p.setViewportSize({ width: s, height: s }); await p.setContent('<body style="margin:0">' + L.mark({ size: s, mode: 'icon', square: true }) + '</body>'); await p.waitForTimeout(100); await p.screenshot({ path: out + 'icon-' + s + '.png', clip: { x: 0, y: 0, width: s, height: s } }); }
  await b.close(); console.log(fs.readdirSync(out).join(' ')); })();
