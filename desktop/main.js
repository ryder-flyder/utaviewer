const { app, BrowserWindow, Menu, shell, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const isMac = process.platform === 'darwin', isLinux = process.platform === 'linux';

// serve from a custom scheme so workers and fetch work like on the website
protocol.registerSchemesAsPrivileged([{ scheme: 'utaviewer', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }]);

// the Chromium sandbox often can't start for unpacked apps on Linux
if (isLinux) app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function menu() {
  if (!isMac) { Menu.setApplicationMenu(null); return; }
  // macOS needs a menu for Cmd+Q, copy and paste
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' }, { role: 'editMenu' },
    { label: 'View', submenu: [{ role: 'togglefullscreen' }, { role: 'toggleDevTools' }] },
    { role: 'windowMenu' }
  ]));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 900, minHeight: 600,
    icon: path.join(__dirname, 'icon.png'), backgroundColor: '#0c0d10', autoHideMenuBar: true, title: 'UtaViewer',
    webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false }
  });
  menu();
  win.loadURL('utaviewer://app/index.html' + (process.env.UTAVIEWER_TEST ? '?test' : ''));
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  return win;
}

app.whenReady().then(() => {
  protocol.handle('utaviewer', req => {
    const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.normalize(path.join(__dirname, rel));
    if (!file.startsWith(__dirname + path.sep)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => app.quit());
