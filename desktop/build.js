// Builds the Windows app: copies the web files into desktop/app, then packages them with Electron.
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
fs.writeFileSync(path.join(app, 'package.json'), JSON.stringify({
  name: 'utaviewer', productName: 'UtaViewer', version: require('./package.json').version,
  description: 'View vocal synth project files on a piano roll and export them as video.',
  main: 'main.js', license: 'MIT'
}, null, 2));

packager({
  dir: app, name: 'UtaViewer', platform: 'win32', arch: 'x64',
  out: path.join(__dirname, 'dist'), overwrite: true, asar: true
}).then(p => console.log('Built:', p.join(', '))).catch(e => { console.error(e); process.exit(1); });
