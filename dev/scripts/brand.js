// Régénère brand/*.svg et icon-*.png depuis logo.js (source unique). Usage : node dev/scripts/brand.js
const fs = require('fs'), path = require('path'), L = require('../../logo.js');
const R = path.join(__dirname, '../..'), xml = s => '<?xml version="1.0" encoding="UTF-8"?>\n' + s.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ') + '\n';
const fichiers = {
  'cap-logo-clair.svg': L.mark({ size: 512 }),
  'cap-logo-noir.svg': L.mark({ size: 512, mode: 'dark' }),
  'cap-monochrome.svg': L.mark({ size: 512, mode: 'mono', color: '#0A0A0B' }),
  'cap-monogramme-clair.svg': L.mark({ size: 128 }),
  'cap-monogramme-noir.svg': L.mark({ size: 128, mode: 'dark' }),
  'cap-icone.svg': L.mark({ size: 1024, mode: 'icon', square: true })
};
for (const [n, s] of Object.entries(fichiers)) fs.writeFileSync(path.join(R, 'brand', n), xml(s));
(async () => {
  const { chromium } = require(require.resolve('playwright', { paths: [path.join(R, 'dev/tests'), R] }));
  const b = await chromium.launch(), p = await b.newPage();
  for (const t of [180, 192, 512]) {
    await p.setViewportSize({ width: t, height: t });
    await p.setContent('<body style="margin:0;background:#000">' + L.mark({ size: t, mode: 'icon', square: true }) + '</body>');
    await p.screenshot({ path: path.join(R, 'icon-' + t + '.png'), omitBackground: false });
  }
  await b.close(); console.log('brand + icônes régénérés');
})();
