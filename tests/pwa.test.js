const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const manifest = JSON.parse(read('manifest.webmanifest'));
const html = read('vector-gp.html');

function pngSize(file) {                                   // width and height from the PNG header
  const b = fs.readFileSync(path.join(root, file));
  assert.strictEqual(b.subarray(1, 4).toString(), 'PNG', file + ' is a PNG');
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

test('manifest: installable as a standalone app', () => {
  assert.ok(manifest.name && manifest.short_name);
  assert.strictEqual(manifest.display, 'standalone');
  assert.ok(fs.existsSync(path.join(root, manifest.start_url)), 'start_url exists');
  assert.ok(/^#?[0-9a-f]{6}$/i.test(manifest.background_color.replace('#', '')));
});

test('manifest: icons exist at the sizes they claim, with a 192, a 512 and a maskable one', () => {
  for (const ic of manifest.icons) {
    const [w, h] = ic.sizes.split('x').map(Number);
    assert.deepStrictEqual(pngSize(ic.src), [w, h], ic.src);
  }
  const has = (size, purpose) => manifest.icons.some(i => i.sizes === size && i.purpose.split(' ').includes(purpose));
  assert.ok(has('192x192', 'any') && has('512x512', 'any') && has('512x512', 'maskable'));
  assert.deepStrictEqual(pngSize('icons/apple-touch-icon.png'), [180, 180]);
});

test('the page links the manifest, the icons and the phone meta tags', () => {
  for (const needle of ['rel="manifest" href="manifest.webmanifest"', 'rel="apple-touch-icon"', 'name="theme-color"', 'apple-mobile-web-app-capable', 'viewport-fit=cover', "register('sw.js')"])
    assert.ok(html.includes(needle), needle);
});

test('service worker: everything it pre-caches exists, and its cache name follows the version', () => {
  const sw = read('sw.js');
  const shell = JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  for (const f of shell) if (f !== './') assert.ok(fs.existsSync(path.join(root, f)), f);
  for (const ic of manifest.icons) assert.ok(shell.includes('./' + ic.src), ic.src + ' is pre-cached');
  assert.ok(shell.includes('./vector-gp.html'));
  const version = JSON.parse(read('package.json')).version;
  assert.ok(sw.includes(`'vgp-${version}'`), 'bump VERSION in sw.js with package.json');
});

test('phone layout: touch controls scale with the screen and the menu has a phone layout', () => {
  assert.ok(html.includes('--tb:min(84px,calc((100vw - 40px)/4))'));
  assert.ok(/@media \(max-width:820px\)/.test(html) && /@media \(max-height:520px\) and \(orientation:landscape\)/.test(html));
  for (const id of ['tmenu', 'touch', 'instbtn', 'fsbtn']) assert.ok(html.includes(`id="${id}"`), id);
});

test('iPhone: the page cannot be zoomed by a double tap or a pinch while racing', () => {
  for (const needle of ['maximum-scale=1', "document.addEventListener('touchend'", "'gesturestart'", '{ passive: false }', 'touch-action:manipulation'])
    assert.ok(html.includes(needle), needle);
});

test('the version shown on screen is the package version, the cache version and the page header', () => {
  const version = JSON.parse(read('package.json')).version;
  assert.ok(html.includes(`const APP_VERSION = '${version}';`), 'APP_VERSION in vector-gp.html follows package.json');
  assert.ok(read('sw.js').includes(`'vgp-${version}'`));
  assert.ok(html.includes('id="ver"') && html.includes("'V' + APP_VERSION"));
});
