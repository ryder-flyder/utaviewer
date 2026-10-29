// Packages the web files with Electron for this system. UV_PLATFORM and UV_ARCH override the target.
const fs = require('fs');
const path = require('path');
const { packager } = require('@electron/packager');

const root = path.join(__dirname, '..');
const app = path.join(__dirname, 'app');
fs.rmSync(app, { recursive: true, force: true });
fs.mkdirSync(app, { recursive: true });
for (const f of ['index.html', 'style.css', 'parsers.js', 'lyrics.js', 'app.js', 'favicon.svg', 'LICENSE']) fs.copyFileSync(path.join(root, f), path.join(app, f));
fs.cpSync(path.join(root, 'vendor'), path.join(app, 'vendor'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'main.js'), path.join(app, 'main.js'));
fs.copyFileSync(path.join(__dirname, 'icons', 'icon.png'), path.join(app, 'icon.png'));
fs.writeFileSync(path.join(app, 'package.json'), JSON.stringify({
  name: 'utaviewer', productName: 'UtaViewer', version: require('./package.json').version,
  description: 'View vocal synth project files on a piano roll and export them as video.',
  main: 'main.js', license: 'MIT'
}, null, 2));

const platform = process.env.UV_PLATFORM || process.platform, arch = process.env.UV_ARCH || process.arch;
const opts = {
  dir: app, name: 'UtaViewer', platform, arch, out: path.join(__dirname, 'dist'), overwrite: true, asar: true,
  icon: path.join(__dirname, 'icons', platform === 'win32' ? 'icon.ico' : platform === 'darwin' ? 'icon.icns' : 'icon.png'),
  appBundleId: 'io.github.ryderflyder.utaviewer', appCategoryType: 'public.app-category.video'
};
// Apple Silicon won't run unsigned apps, so use an ad-hoc signature
if (platform === 'darwin') opts.osxSign = { identity: '-', identityValidation: false, optionsForFile: () => ({ hardenedRuntime: false }) };

packager(opts).then(p => console.log('Built:', p.join(', '))).catch(e => { console.error(e); process.exit(1); });
