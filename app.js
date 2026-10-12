(() => {
'use strict';
const VERSION = '1.3.0';
const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const k in props || {}) {
    const v = props[k];
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) e.append(c);
  return e;
}

// colour helpers
const hex2rgb = x => { x = x.replace('#', ''); if (x.length === 3) x = [...x].map(c => c + c).join(''); const n = parseInt(x, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mixc = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return A.map((v, i) => Math.round(v + (B[i] - v) * t)); };
const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const lum = x => { const c = hex2rgb(x); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; };

// themes
// editor styles are based on each program's piano roll
const SHOW = { glow: 14, sparks: true, round: 20, noteH: 78, outline: 0, pitchMode: 'reveal', pitchW: 3 };
const PRESETS = {
  'Default': { g: 'Yours', bg1: '#0a0c1a', bg2: '#151a33', grid: '#9aa6ff', rowW: '#000000', rowWA: 0, rowB: '#9aa6ff', rowBA: 0.06, keyW: '#cfd3ec', keyB: '#171a2e', fg: '#e8ebff', play: '#ffffff', hi: '#ffffff', act: '#ffffff', pitch: '', edge: '', palette: ['#7c8cff', '#ff7aa8', '#5ee0c1', '#ffc65c', '#b58cff', '#6fd0ff'], fx: {} },
  'VOCALOID 4': { g: 'Editors', bg1: '#c9c9c9', bg2: '#c2c2c2', grid: '#555555', rowW: '#d3d3d3', rowWA: 1, rowB: '#b6b6b6', rowBA: 1, keyW: '#f4f4f4', keyB: '#1b1b1b', fg: '#1a1a1a', play: '#1fc4dd', hi: '#f6ffd2', act: '#0b7480', pitch: '#e8641e', edge: '#788f14', palette: ['#b9d63a', '#3fd0d6', '#f0a53a', '#e86a8a', '#8aa0ff', '#7ad06a'], fx: { glow: 0, sparks: false, round: 0, noteH: 86, outline: 1.5, pitchMode: 'always', pitchW: 1.6, dim: 30 } },
  'VOCALOID 6': { g: 'Editors', bg1: '#18181b', bg2: '#141416', grid: '#74748a', rowW: '#202024', rowWA: 1, rowB: '#101012', rowBA: 1, keyW: '#e8e8ec', keyB: '#0d0d0f', fg: '#f2f2f6', play: '#ffffff', hi: '#ffd9e6', act: '#ffb0c9', pitch: '#e0a850', edge: '#ea6b92', palette: ['#c2305e', '#3a8fd6', '#e0a850', '#58b86a', '#a56bd8', '#d65a3a'], fx: { glow: 0, sparks: false, round: 3, noteH: 86, outline: 1.5, pitchMode: 'always', pitchW: 1.6, dim: 35 } },
  'Synthesizer V': { g: 'Editors', bg1: '#2a2b2e', bg2: '#252629', grid: '#8a8c94', rowW: '#2e2f33', rowWA: 1, rowB: '#232427', rowBA: 1, keyW: '#c8c8cc', keyB: '#26272a', fg: '#ececf0', play: '#ececf0', hi: '#e8ffc4', act: '#ffffff', pitch: '#ececf0', edge: '', palette: ['#79b52f', '#d24e4e', '#4aa3d8', '#e0a93a', '#a77be0', '#3fc0a8'], fx: { glow: 0, sparks: false, round: 12, noteH: 88, outline: 0, pitchMode: 'always', pitchW: 1.5, dim: 35 } },
  'CeVIO AI': { g: 'Editors', bg1: '#2b2b2b', bg2: '#262626', grid: '#101010', rowW: '#4e4e4e', rowWA: 1, rowB: '#4e4e4e', rowBA: 1, rows: ['#6f93cf', '#4e4e4e', '#7ba37a', '#4e4e4e', '#b1a85f', '#b88b5d', '#4e4e4e', '#c88583', '#4e4e4e', '#8266a8', '#4e4e4e', '#5b67ab'], rowTintA: 1, keyW: '#ffffff', keyB: '#2a2a2a', fg: '#f4f4f4', play: '#ffffff', hi: '#fffbd0', act: '#ffffff', pitch: '#ff6a2a', edge: '#b3a817', palette: ['#f2e432', '#ff8f4a', '#7fd6ff', '#9ee07a', '#e68fd0', '#c9b6ff'], fx: { glow: 0, sparks: false, round: 0, noteH: 96, outline: 1, pitchMode: 'always', pitchW: 2, dim: 30 } },
  'VoiSona': { g: 'Editors', bg1: '#0d0e13', bg2: '#0b0c10', grid: '#c8c8d4', rowW: '#000000', rowWA: 0, rowB: '#000000', rowBA: 0.35, rows: ['#c98a8a', '#14151b', '#6fa06f', '#14151b', '#5a8fb0', '#9a7ac0', '#14151b', '#b06a8a', '#14151b', '#7a6ac0', '#14151b', '#6a9a9a'], rowTintA: 0.34, keyW: '#fafafa', keyB: '#101114', fg: '#f2f2f6', play: '#f7931e', hi: '#fff0d0', act: '#ffffff', pitch: '#ffe0a8', edge: '', palette: ['#ff9a1f', '#4ad0c0', '#7aa2ff', '#ff7aa8', '#b69cff', '#9be07a'], fx: { glow: 0, sparks: false, round: 6, noteH: 94, outline: 0, pitchMode: 'always', pitchW: 1.8, dim: 35 } },
  'OpenUtau': { g: 'Editors', bg1: '#ffffff', bg2: '#f7f7f9', grid: '#8d8d9a', rowW: '#fbfbfc', rowWA: 1, rowB: '#ececf0', rowBA: 1, keyW: '#ffffff', keyB: '#ff4f8b', fg: '#2a2a33', play: '#6c6c7a', hi: '#d6ecff', act: '#0f5fa8', pitch: '#ff3d7f', edge: '', palette: ['#4da3e8', '#ff6aa0', '#5cc48a', '#f2a93b', '#9b7be0', '#35b9c9'], fx: { glow: 0, sparks: false, round: 6, noteH: 88, outline: 0, pitchMode: 'always', pitchW: 1.6, dim: 25 } },
  'Mono': { g: 'Moods', bg1: '#0f0f10', bg2: '#1a1a1c', grid: '#bbbbbb', rowW: '#000000', rowWA: 0, rowB: '#ffffff', rowBA: 0.05, keyW: '#d8d8d8', keyB: '#161617', fg: '#f0f0f0', play: '#ffffff', hi: '#ffffff', act: '#ffffff', pitch: '', edge: '', palette: ['#f2f2f2', '#9c9c9c', '#cfcfcf', '#6f6f6f'], fx: { ...SHOW } }
};
const FMT_STYLE = { USTX: 'OpenUtau', UST: 'OpenUtau', SVP: 'Synthesizer V', VSQX: 'VOCALOID 4', VPR: 'VOCALOID 6', CCS: 'CeVIO AI', TSSLN: 'VoiSona', MIDI: 'Default' };
// colour themes named after vocal synth characters, built from one accent and a palette
const toHex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
const CHARS = [
  ['Miku', '#39c5bb', '#051a1d', '#0b2f33', ['#39c5bb', '#ff6fae', '#8ff0e8', '#ffffff', '#1f8f93', '#ffc4de']],
  ['Kagamine', '#ffc928', '#1a1405', '#2d2308', ['#ffc928', '#ff8f2e', '#fff0a0', '#ffffff', '#e0a010', '#5b6b8a']],
  ['Luka', '#ff9ec4', '#1d0d16', '#301424', ['#ff9ec4', '#ffd2e4', '#e8b84a', '#ffffff', '#e05a92', '#7fd6ff']],
  ['MEIKO', '#e0313b', '#1c080b', '#2e0f14', ['#e0313b', '#ff7a6a', '#ffd0c8', '#ffffff', '#a01e2a', '#6a3a2a']],
  ['KAITO', '#3d6ff0', '#070d22', '#0e1a3e', ['#3d6ff0', '#8fb4ff', '#ffffff', '#2b3f8a', '#7fe0ff', '#c8d8ff']],
  ['GUMI', '#8be04d', '#0c1a08', '#162b0e', ['#8be04d', '#ff9a3d', '#d8ffb0', '#ffffff', '#4fa02a', '#ffd27a']],
  ['Teto', '#e8334f', '#1b080d', '#2d0f17', ['#e8334f', '#ff8696', '#ffffff', '#9a1f36', '#ffc2c9', '#6a2a3a']],
  ['Yukari', '#a37cf0', '#120b21', '#1e1238', ['#a37cf0', '#d6b8ff', '#ff9ad0', '#ffffff', '#6a4cc0', '#9ad8ff']],
];
for (const [name, c, b1, b2, pal] of CHARS) {
  PRESETS[name] = Object.assign({}, PRESETS.Default, { g: 'Characters', bg1: b1, bg2: b2, grid: c, rowB: c, keyW: toHex(mixc(c, '#ffffff', 0.86)), keyB: b1, fg: toHex(mixc(c, '#ffffff', 0.9)), hi: toHex(mixc(c, '#ffffff', 0.75)), palette: pal, fx: { ...SHOW } });
  // light variant: pale tinted paper, darker accents so notes stay readable
  const dk = (x, t) => toHex(mixc(x, '#000000', t));
  PRESETS[name].alt = Object.assign({}, PRESETS[name], {
    bg1: toHex(mixc(c, '#ffffff', 0.94)), bg2: toHex(mixc(c, '#ffffff', 0.86)), grid: dk(c, 0.3), rowB: dk(c, 0.3), rowBA: 0.07,
    keyW: '#ffffff', keyB: dk(c, 0.62), fg: dk(c, 0.72), play: dk(c, 0.55), hi: dk(c, 0.5), act: dk(c, 0.35),
    palette: pal.map(p => lum(p) > 0.8 ? dk(c, 0.45) : lum(p) > 0.62 ? dk(p, 0.3) : p), fx: { ...SHOW, glow: 5 }
  });
}
const presetOf = name => { const b = PRESETS[name] || PRESETS.Default; return look.shade === 'light' && b.alt ? b.alt : b; };
const BLACK = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// state
const FXDEF = [
  { sec: 'Playback' },
  { k: 'highlight', t: 'toggle', l: 'Highlight the sounding note' },
  { k: 'flash', t: 'toggle', l: 'Flash at note onset' },
  { k: 'progress', t: 'toggle', l: 'Fill the note as it plays' },
  { k: 'glow', t: 'range', l: 'Glow', min: 0, max: 40, step: 1, u: 'px' },
  { k: 'glowColor', t: 'select', l: 'Glow color', opts: [['track', 'Track color'], ['hi', 'Highlight color'], ['white', 'White']] },
  { k: 'sparks', t: 'toggle', l: 'Sparks at the playhead' },
  { k: 'pulse', t: 'toggle', l: 'Pulse the playhead on the beat' },
  { sec: 'Pitch curve' },
  { k: 'pitch', t: 'toggle', l: 'Draw pitch onto notes' },
  { k: 'pitchMode', t: 'select', l: 'Drawing style', opts: [['reveal', 'Reveal as it plays'], ['always', 'Full curve, traced bright'], ['static', 'Full curve, always visible'], ['trail', 'Fading trail']] },
  { k: 'pitchColor', t: 'select', l: 'Curve color', opts: [['theme', 'Theme pitch color'], ['tint', 'Tinted track color'], ['track', 'Track color']] },
  { k: 'pitchW', t: 'range', l: 'Line width', min: 1, max: 10, step: 0.5, u: 'px' },
  { k: 'trail', t: 'range', l: 'Trail length', min: 0.2, max: 4, step: 0.1, u: 's' },
  { k: 'head', t: 'toggle', l: 'Dot at the pitch head' },
  { k: 'bend', t: 'range', l: 'MIDI bend range', min: 1, max: 24, step: 1, u: 'st', reload: true },
  { sec: 'Lyrics' },
  { k: 'lyrics', t: 'toggle', l: 'Show lyrics' },
  { k: 'lyricMode', t: 'select', l: 'Placement', opts: [['auto', 'Inside, above when too narrow'], ['inside', 'Inside notes'], ['above', 'Above notes']] },
  { k: 'lyricSize', t: 'range', l: 'Lyric size', min: 50, max: 180, step: 5, u: '%' },
  { sec: 'Lyric box' },
  { k: 'lyrPos', t: 'select', l: 'Corner', opts: [['br', 'Bottom right'], ['bl', 'Bottom left'], ['bc', 'Bottom center'], ['tr', 'Top right'], ['tl', 'Top left']] },
  { k: 'lyrSize', t: 'range', l: 'Size', min: 50, max: 220, step: 5, u: '%' },
  { k: 'lyrKaraoke', t: 'toggle', l: 'Highlight each word as it is sung' },
  { k: 'lyrBox', t: 'toggle', l: 'Dark panel behind the text' },
  { k: 'lyrNext', t: 'toggle', l: 'Show the next line underneath' },
  { sec: 'Portraits' },
  { k: 'portShow', t: 'toggle', l: 'Show portraits' },
  { k: 'portOpacity', t: 'range', l: 'Opacity', min: 5, max: 100, step: 1, u: '%' },
  { k: 'portSize', t: 'range', l: 'Size (percent of the video height)', min: 30, max: 140, step: 1, u: '%' },
  { k: 'portPos', t: 'select', l: 'Position', opts: [['r', 'Right'], ['c', 'Center'], ['l', 'Left']] },
  { k: 'portReact', t: 'toggle', l: 'Brighten while the track sings' },
  { sec: 'Background' },
  { k: 'bgDim', t: 'range', l: 'Dim', min: 0, max: 95, step: 1, u: '%' },
  { k: 'bgBlur', t: 'range', l: 'Blur', min: 0, max: 24, step: 1, u: 'px' },
  { sec: 'Audio visualizer' },
  { hint: 'Uses the audio you add in Projects. Nothing is drawn without audio. Use up to two at once.' },
  { k: 'wfStyle', t: 'select', l: 'Style (one at a time)', opts: [['off', 'Off'], ['scope', 'Scope line'], ['bars', 'Spectrum bars'], ['keys', 'Piano-key spectrum']] },
  { k: 'wfColor', show: 'any', t: 'select', l: 'Colors', opts: [['theme', 'Theme palette'], ['custom', 'Custom colors']] },
  { k: 'wfColA', show: 'any', t: 'color', l: 'Custom color 1 (lines, low end)' },
  { k: 'wfColB', show: 'any', t: 'color', l: 'Custom color 2 (peaks, tops)' },
  { k: 'wfOpacity', show: 'any', t: 'range', l: 'Opacity', min: 10, max: 100, step: 1, u: '%' },
  { k: 'wfGain', show: 'any', t: 'range', l: 'Sensitivity', min: 25, max: 300, step: 5, u: '%' },
  { k: 'wfOver', show: 'any', t: 'toggle', l: 'Draw over the notes (otherwise under them)' },
  { k: 'wfScopeW', show: 'scope', t: 'range', l: 'Scope line width', min: 1, max: 10, step: 0.5, u: 'px' },
  { k: 'wfScopeY', show: 'scope', t: 'range', l: 'Scope height in the view', min: 10, max: 90, step: 1, u: '%' },
  { k: 'wfBarN', show: 'bars', t: 'range', l: 'Bar count', min: 16, max: 128, step: 8, u: '' },
  { k: 'wfBarH', show: 'bars', t: 'range', l: 'Bar height', min: 10, max: 100, step: 1, u: '%' },
  { k: 'wfBarPos', show: 'bars', t: 'select', l: 'Bar position', opts: [['bottom', 'Bottom'], ['top', 'Top'], ['center', 'Mirrored from the middle']] },
  { k: 'wfKeyLen', show: 'keys', t: 'range', l: 'Piano-key spectrum length', min: 10, max: 100, step: 1, u: '%' },
  { k: 'wfKeySide', show: 'keys', t: 'select', l: 'Piano-key spectrum side', opts: [['left', 'From the keys'], ['right', 'From the right edge']] },
  { sec: 'Notes and rows' },
  { k: 'noteH', t: 'range', l: 'Note height', min: 40, max: 100, step: 1, u: '%' },
  { k: 'round', t: 'range', l: 'Corner rounding', min: 0, max: 50, step: 1, u: '%' },
  { k: 'outline', t: 'range', l: 'Note outline', min: 0, max: 4, step: 0.5, u: 'px' },
  { k: 'dim', t: 'range', l: 'Dim played notes', min: 0, max: 90, step: 1, u: '%' },
  { k: 'rows', t: 'toggle', l: 'Row shading' },
  { k: 'rowTint', t: 'toggle', l: 'Pitch-class row tints (if the style has them)' },
  { sec: 'View' },
  { k: 'window', t: 'range', l: 'Time window', min: 2, max: 24, step: 0.5, u: 's' },
  { k: 'playPos', t: 'range', l: 'Playhead position', min: 5, max: 70, step: 1, u: '%' },
  { k: 'pad', t: 'range', l: 'Pitch padding', min: 0, max: 12, step: 1, u: 'st' },
  { k: 'gridDiv', t: 'select', l: 'Grid subdivision', opts: [['auto', 'Auto by zoom'], ['1', 'Beats'], ['2', '8th notes'], ['4', '16th notes']] },
  { k: 'follow', t: 'toggle', l: 'Auto-shift the view up and down with the notes' },
  { k: 'followSens', t: 'range', l: 'Shift sensitivity (notes to move before shifting)', min: 1, max: 12, step: 1, u: ' st' },
  { k: 'followRows', t: 'range', l: 'Visible range when following', min: 12, max: 48, step: 1, u: ' st' },
  { k: 'keys', t: 'toggle', l: 'Piano keys' },
  { k: 'grid', t: 'toggle', l: 'Grid lines' }
];
const FX0 = { wfStyle: 'off', wfColor: 'theme', wfColA: '#39c5bb', wfColB: '#ff6fae', wfOpacity: 60, wfGain: 100, wfOver: false, wfScopeW: 2.5, wfScopeY: 50, wfBarN: 64, wfBarH: 55, wfBarPos: 'bottom', wfKeyLen: 55, wfKeySide: 'left', highlight: true, flash: true, progress: true, glow: 14, glowColor: 'track', sparks: true, pulse: false, pitch: true, pitchMode: 'reveal', pitchColor: 'theme', pitchW: 3, trail: 1.4, head: true, bend: 2, lyrics: true, lyricMode: 'auto', lyricSize: 100, noteH: 78, round: 20, outline: 0, dim: 45, rows: true, rowTint: true, window: 6, playPos: 25, pad: 3, gridDiv: 'auto', follow: false, followSens: 3, followRows: 24, keys: true, grid: true, lyrShow: false, lyrSrc: 'notes', lyrPos: 'br', lyrSize: 100, lyrKaraoke: true, lyrBox: true, lyrNext: false, portShow: false, portPos: 'r', portSize: 90, portOpacity: 30, portReact: true, bgDim: 40, bgBlur: 0, lyr2: 'off' };
const STYLEKEYS = ['highlight', 'flash', 'progress', 'glow', 'glowColor', 'sparks', 'pulse', 'pitch', 'pitchMode', 'pitchColor', 'pitchW', 'trail', 'head', 'noteH', 'round', 'outline', 'dim', 'rows', 'rowTint'];
const LOOK0 = { preset: 'Default', auto: true, colors: {}, palette: null, mine: null, caption: '', size: '1920x1080', fps: '60', mbps: '16', lyricText: '', lyricText2: '', lyrTrack: 'auto', bgMode: 'normal', shade: 'dark', tc: {}, themes: {} };
let fx = { ...FX0 }, look = { ...LOOK0 };
try { const s = JSON.parse(localStorage.getItem('utaviewer.v2') || 'null'); if (s) { Object.assign(fx, s.fx || {}); Object.assign(look, s.look || {}); if (look.size === '1280x720' && look.fps === '30' && look.mbps === '8') Object.assign(look, { size: LOOK0.size, fps: LOOK0.fps, mbps: LOOK0.mbps }); } } catch (e) {}
if (look.mine) PRESETS['My theme'] = look.mine; else PRESETS['My theme'] = Object.assign({}, PRESETS.Default, { g: 'Yours', fx: {} });
if (!look.colors) look.colors = {};
if (!look.tc || typeof look.tc !== 'object') look.tc = {};
if (!look.themes || typeof look.themes !== 'object') look.themes = {};
// theme files: colors and effects only, safe to share (no portraits, backgrounds or lyrics)
const TH_COLORS = ['bg1', 'bg2', 'grid', 'rowW', 'rowB', 'keyW', 'keyB', 'fg', 'play', 'hi', 'act', 'pitch', 'edge'];
const TH_NUMS = ['rowWA', 'rowBA', 'rowTintA'];
const okHex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
function cleanVariant(o) {
  if (!o || typeof o !== 'object') return null;
  const v = {};
  for (const k of TH_COLORS) if (okHex(o[k])) v[k] = o[k].toLowerCase(); else if ((k === 'pitch' || k === 'edge') && o[k] === '') v[k] = '';
  for (const k of TH_NUMS) if (typeof o[k] === 'number' && o[k] >= 0 && o[k] <= 1) v[k] = o[k];
  if (Array.isArray(o.rows) && o.rows.length === 12 && o.rows.every(okHex)) v.rows = o.rows.map(x => x.toLowerCase());
  if (!okHex(v.bg1) || !okHex(v.fg)) return null;
  if (!okHex(v.bg2)) v.bg2 = v.bg1;
  const pal = Array.isArray(o.palette) ? o.palette.filter(okHex).slice(0, 6).map(x => x.toLowerCase()) : [];
  v.palette = pal.length ? pal : PRESETS.Default.palette.slice();
  return v;
}
function cleanTheme(d) {
  const dark = cleanVariant(d.dark), light = cleanVariant(d.light);
  const main = dark || light; if (!main) return null;
  const fxo = {};
  for (const k of STYLEKEYS) if (d.fx && typeof d.fx[k] === typeof FX0[k] && (typeof FX0[k] !== 'number' || isFinite(d.fx[k]))) fxo[k] = d.fx[k];
  const P = Object.assign({}, PRESETS.Default, main, { g: 'Yours', fx: fxo });
  if (dark && light) P.alt = Object.assign({}, PRESETS.Default, light, { g: 'Yours', fx: fxo });
  return P;
}
function variantOut(P) { const o = {}; for (const k of [...TH_COLORS, ...TH_NUMS, 'rows', 'palette']) if (P[k] !== undefined && P[k] !== null) o[k] = P[k]; return o; }
function registerTheme(name, P) {
  const builtin = n => PRESETS[n] && PRESETS[n].g !== 'Yours';
  if (/^(__proto__|constructor|prototype|toString|hasOwnProperty)$/.test(name)) name = 'Theme ' + name;
  let n = name, i = 2; while (builtin(n)) n = name + ' (' + i++ + ')';
  P.g = 'Yours'; if (P.alt) P.alt.g = 'Yours';
  PRESETS[n] = P; look.themes[n] = P; return n;
}
for (const n in look.themes) { const P = cleanTheme({ dark: look.themes[n], light: look.themes[n].alt, fx: look.themes[n].fx }); if (P) PRESETS[n] = P; else delete look.themes[n]; }
if (!PRESETS[look.preset]) look.preset = 'Default';
const tkey = (f, t) => f.name + '|' + t.name;
const save = () => { try { localStorage.setItem('utaviewer.v2', JSON.stringify({ fx, look })); } catch (e) {} };

const S = { files: [], time: 0, duration: 10, playing: false, range: { lo: 57, hi: 79 }, tm: null, ctx: null, master: null, dest: null, buf: null, bufName: '', src: null, shift: 0, c0: 0, t0: 0, prevT: 0, parts: [], nextId: 1, ci: 0, exporting: null, scrub: false, dl: null, last: 0, ports: new Map(), bg: null, lines: [], lines2: [], linesDirty: true, loop: { a: null, b: null, on: false }, queue: [] };
const cv = $('#cv'), ctx = cv.getContext('2d');

// status
function msg(text, kind) { S.wake = performance.now(); const m = $('#msg'); m.textContent = text || ''; m.className = 'status' + (kind ? ' ' + kind : ''); }

// file model
function allTracks() { const r = []; for (const f of S.files) for (const t of f.tracks) r.push({ f, t }); return r; }
function recalc() {
  let end = 0, any = false;
  for (const { f, t } of allTracks()) { if (!t.on) continue; const sh = f.offset / 1000; for (const n of t.notes) { end = Math.max(end, n.t1 + sh); any = true; } }
  let d = any ? end + 1.5 : 8;
  if (S.buf) d = Math.max(d, S.buf.duration - S.shift);
  S.duration = Math.max(3, d);
  S.time = clamp(S.time, 0, S.duration);
  const real = S.files[0];
  S.tm = real ? real.tm : null;
  let lo = 127, hi = 0;
  for (const { t } of allTracks()) { if (!t.on) continue; for (const n of t.notes) { lo = Math.min(lo, n.pitch); hi = Math.max(hi, n.pitch); } }
  if (lo > hi) { lo = 60; hi = 72; }
  lo = Math.floor(lo) - fx.pad; hi = Math.ceil(hi) + fx.pad;
  while (hi - lo < 11) { hi++; if (hi - lo < 11) lo--; }
  S.range = { lo, hi };
  $('#tEnd').textContent = fmt(S.duration);
  S.linesDirty = true; refreshLines(); renderVis();
}
const fmt = t => { t = Math.max(0, t); const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); };

function addProject(res, name) {
  const pal = S.P.palette;
  const f = { id: S.nextId++, name, fmt: res.fmt, variant: res.variant || '', tm: res.tm, offset: 0, tracks: res.tracks.map(t => ({ name: t.name, notes: t.notes, on: true, color: pal[S.ci++ % pal.length] })) };
  for (const t of f.tracks) { const c = look.tc[tkey(f, t)]; if (c) t.color = c; }
  S.files.push(f);
}
// extension wins over the browser's guess: Chrome reports .mid as audio/mid
const PROJ_EXT = ['ustx', 'ust', 'mid', 'midi', 'vsqx', 'vpr', 'svp', 'ccs', 'tssln'];
async function addFiles(list) {
  const files = Array.from(list), audio = [], proj = [];
  for (const f of files) { const e = f.name.split('.').pop().toLowerCase(); (PROJ_EXT.includes(e) ? proj : (['wav', 'mp3', 'ogg', 'flac', 'm4a', 'aac', 'opus'].includes(e) || f.type.startsWith('audio/') ? audio : proj)).push(f); }
  const errs = []; let added = 0, styled = '';
  for (const f of proj) {
    try {
      const r = await parseProjectFile(f, fx.bend);
      const first = !S.files.length;
      // only UST files stack, anything else replaces what's loaded
      const keep = r.fmt === 'UST' ? S.files.filter(x => x.fmt === 'UST') : [];
      if (keep.length !== S.files.length) { S.files = keep; if (!keep.length) S.ci = 0; }
      addProject(r, f.name); added++;
      if (first && look.auto && FMT_STYLE[r.fmt] && look.preset !== FMT_STYLE[r.fmt]) { applyPreset(FMT_STYLE[r.fmt], true); styled = FMT_STYLE[r.fmt]; }
    } catch (e) { errs.push(f.name + ': ' + (e && e.message || 'could not be read')); }
  }
  if (audio.length) await loadAudio(audio[0]);
  recalc(); renderProjects();
  if (errs.length) msg(errs.join('  |  '), 'err');
  else if (added) msg(added + (added === 1 ? ' project' : ' projects') + ' loaded.' + (styled ? ' Style set to ' + styled + ' (change it in Look).' : ''), 'ok');
}

// audio
async function ensureCtx() {
  if (!S.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext; S.ctx = new AC();
    S.master = S.ctx.createGain(); S.master.gain.value = 1;
    S.dest = S.ctx.createMediaStreamDestination();
    S.master.connect(S.ctx.destination); S.master.connect(S.dest);
  }
  if (S.ctx.state !== 'running') { try { await S.ctx.resume(); } catch (e) {} }
}
async function loadAudio(file) {
  try {
    await ensureCtx();
    const ab = await file.arrayBuffer();
    S.buf = await S.ctx.decodeAudioData(ab); S.bufName = file.name;
    if (S.playing) restartAudio();
    renderAudio(); msg('Audio loaded: ' + file.name, 'ok');
  } catch (e) { msg('That audio file could not be decoded. WAV, MP3 and OGG usually work.', 'err'); }
}
function stopSrc() { if (S.src) { try { S.src.stop(); } catch (e) {} S.src.disconnect(); S.src = null; } }
function restartAudio() {
  stopSrc(); if (!S.buf || !S.ctx || !S.playing) return;
  const s = S.ctx.createBufferSource(); s.buffer = S.buf; s.connect(S.master);
  const a = S.time + S.shift;
  if (a >= 0) { if (a < S.buf.duration) s.start(0, a); else return; } else s.start(S.ctx.currentTime - a, 0);
  S.src = s;
}

// transport
async function play() {
  if (S.playing) return;
  await ensureCtx();
  if (S.time >= S.duration - 0.05) S.time = 0;
  S.playing = true; S.c0 = S.ctx.currentTime; S.t0 = S.time; S.prevT = S.time;
  restartAudio(); setPlayIcon(); bgSync();
}
function pause() { if (!S.playing) return; S.playing = false; stopSrc(); setPlayIcon(); bgSync(); }
function seek(t) {
  S.time = clamp(t, 0, S.duration); S.prevT = S.time; S.parts.length = 0;
  if (S.playing) { S.c0 = S.ctx.currentTime; S.t0 = S.time; restartAudio(); }
  bgSync(true);
}
function setPlayIcon() {
  $('#playIcon').innerHTML = S.playing ? '<path d="M3 1.5h3.4v13H3zM9.6 1.5H13v13H9.6z"/>' : '<path d="M3 1.5v13l11-6.5z"/>';
  $('#play').setAttribute('aria-label', S.playing ? 'Pause' : 'Play');
}
$('#play').addEventListener('click', () => S.playing ? pause() : play());
$('#toStart').addEventListener('click', () => seek(0));
$('#btnExport').addEventListener('click', () => { const b = document.querySelector('.tabs button[data-tab="exp"]'); if (b) b.click(); });
window.addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input,select,textarea,button,dialog')) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (e.code === 'Space') { e.preventDefault(); S.playing ? pause() : play(); }
  else if (e.code === 'Home') seek(0);
  else if (e.code === 'End') seek(S.duration);
  else if (e.code === 'ArrowRight') seek(S.time + (e.shiftKey ? 10 : 2));
  else if (e.code === 'ArrowLeft') seek(S.time - (e.shiftKey ? 10 : 2));
  else if (k === '+' || k === '=') nudgeWindow(-1);
  else if (k === '-' || k === '_') nudgeWindow(1);
  else if (k === 'f' || k === 'F') { if (document.fullscreenElement) document.exitFullscreen(); else if ($('#screen').requestFullscreen) $('#screen').requestFullscreen().catch(() => {}); }
  else if (k === 'l' || k === 'L') { fx.lyrShow = !fx.lyrShow; syncVisInputs(); save(); msg('Lyric box ' + (fx.lyrShow ? 'on.' : 'off.')); }
  else if (k === '[') loopPoint('a');
  else if (k === ']') loopPoint('b');
  else if (k === 'r' || k === 'R') toggleLoop();
  else if (k === 'Escape') clearLoop();
  else if (k === '?' || k === '/') { $('#help').showModal(); }
  else if (/^[1-5]$/.test(k)) { const b = document.querySelectorAll('.tabs button')[+k - 1]; if (b) b.click(); }
});
function nudgeWindow(dir) { fx.window = clamp(Math.round(fx.window * (dir > 0 ? 1.25 : 0.8) * 2) / 2, 2, 24); syncControl('window'); save(); msg('Time window ' + fx.window + ' s'); }
$('#btnHelp').addEventListener('click', () => $('#help').showModal());

// drawing
const FONT = '"Instrument Sans","Noto Sans JP","Hiragino Sans","Yu Gothic UI","Meiryo",sans-serif';
function updateP() {
  const base = presetOf(look.preset), P = Object.assign({}, base, look.colors || {});
  if (look.palette && look.palette.length) P.palette = look.palette.slice();
  P.light = lum(P.bg1) > 0.55;
  P.pitchRgb = P.pitch ? hex2rgb(P.pitch) : null;
  P.edgeRgb = P.edge ? hex2rgb(P.edge) : null;
  P.actC = css(hex2rgb(P.act || P.hi));
  S.P = P;
}
function colorsFor(tr, P) {
  const key = tr.color + P.hi; if (tr._k === key) return tr._c;
  const rgb = hex2rgb(tr.color), lift = mixc(tr.color, P.hi, 0.42);
  const c = { base: css(rgb), rgb, lift: css(lift), peak: css(mixc(tr.color, P.hi, 0.8)), hi: css(hex2rgb(P.hi)), hiRgb: mixc(tr.color, P.hi, 0.55), edge: css(mixc(tr.color, '#000000', 0.42)), txt: lum(tr.color) > 0.6 ? '#10132a' : '#ffffff', txtLit: ((0.2126 * lift[0] + 0.7152 * lift[1] + 0.0722 * lift[2]) / 255) > 0.6 ? '#10132a' : '#ffffff' };
  tr._k = key; tr._c = c; return c;
}
function rr(x, y, w, hh, r) { ctx.beginPath(); if (w < 0.5) w = 0.5; r = Math.min(r, w / 2, hh / 2); if (ctx.roundRect && r > 0) ctx.roundRect(x, y, w, hh, r); else ctx.rect(x, y, w, hh); }
function curveAt(n, t) {
  const q = n.curve; if (!q) return n.pitch;
  const f = (t - q.a) / q.step, i = clamp(Math.floor(f), 0, q.v.length - 1), j = Math.min(i + 1, q.v.length - 1);
  return q.v[i] + (q.v[j] - q.v[i]) * clamp(f - i, 0, 1);
}
function fitText(text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  const ch = Array.from(text); let n = ch.length;
  while (n > 1) { n--; const t = ch.slice(0, n).join('') + '…'; if (ctx.measureText(t).width <= maxW) return t; }
  return '';
}

// auto follow: the view only recenters once the notes drift past the sensitivity, then eases over
function camUpdate(T) {
  const dt = S.dt || 0.016, win = fx.window * (1 - fx.playPos / 100) * 0.7;
  let mn = 1e9, mx = -1e9;
  for (const { f, t } of allTracks()) { if (!t.on) continue; const sh = f.offset / 1000; for (const n of t.notes) { if (n.t1 + sh < T - 0.2) continue; if (n.t0 + sh > T + win) continue; if (n.pitch < mn) mn = n.pitch; if (n.pitch > mx) mx = n.pitch; } }
  const half = fx.followRows / 2;
  if (mn <= mx) {
    const target = (mn + mx) / 2;
    const jump = S.camT == null || T < S.camT || T - S.camT > 1;
    if (S.camGoal == null || jump || Math.abs(target - S.camGoal) >= fx.followSens || mn < S.camC - half + 1 || mx > S.camC + half - 1) S.camGoal = target;
    if (S.camC == null || jump) S.camC = S.camGoal;
  } else if (S.camC == null) { S.camC = (S.range.lo + S.range.hi) / 2; S.camGoal = S.camC; }
  S.camT = T;
  S.camC += (S.camGoal - S.camC) * (1 - Math.exp(-dt * 5));
  return S.camC;
}

function draw(T) {
  const W = cv.width, H = cv.height, sc = Math.min(W, H) / 720, P = S.P;
  const keysW = fx.keys ? Math.round(W * (W < H ? 0.09 : 0.055)) : 0;
  const playX = keysW + (W - keysW) * fx.playPos / 100, pps = (W - keysW) / fx.window;
  let { lo, hi } = S.range;
  if (fx.follow) { const c = camUpdate(T); const n = fx.followRows; hi = c + n / 2 - 0.5; lo = hi - n + 1; }
  const span = hi - lo + 1, rowH = H / span, yOf = p => (hi - p + 0.5) * rowH, loI = Math.floor(lo) - 1, hiI = Math.ceil(hi) + 1;
  const tL = T - (playX - keysW) / pps, tR = T + (W - playX) / pps, gr = hex2rgb(P.grid);
  ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
  const bgm = look.bgMode;
  if (bgm === 'alpha') ctx.clearRect(0, 0, W, H);
  else if (bgm === 'green') { ctx.fillStyle = '#00ff00'; ctx.fillRect(0, 0, W, H); }
  else {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.bg1); g.addColorStop(1, P.bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    drawBg(W, H, P);
  }
  const tm = S.tm, bph = tm ? (((tm.s2t(T) / tm.res) % 1) + 1) % 1 : 0, pulse = fx.pulse && S.playing ? Math.exp(-bph * 6) : 0;

  ctx.save(); ctx.beginPath(); ctx.rect(keysW, 0, W - keysW, H); ctx.clip();
  if (fx.rows && bgm === 'normal') {
    const tint = fx.rowTint && P.rows;
    for (let p = loI; p <= hiI; p++) {
      const pc = ((p % 12) + 12) % 12, blk = BLACK[pc];
      let c, a;
      if (tint) { c = P.rows[pc]; a = P.rowTintA == null ? 1 : P.rowTintA; } else if (blk) { c = P.rowB; a = P.rowBA; } else { c = P.rowW; a = P.rowWA; }
      if (c && a > 0) { ctx.globalAlpha = a * (S.bg ? 0.55 : 1); ctx.fillStyle = c; ctx.fillRect(keysW, (hi - p) * rowH, W - keysW, rowH + 0.6); }
    }
    ctx.globalAlpha = 1;
  }
  if (fx.grid) {
    ctx.lineWidth = Math.max(1, sc);
    if (rowH > 7 * sc) { ctx.strokeStyle = css(gr, 0.1); ctx.beginPath(); for (let p = loI; p <= hiI; p++) { const y = Math.round((hi - p + 1) * rowH) + 0.5; ctx.moveTo(keysW, y); ctx.lineTo(W, y); } ctx.stroke(); }
    ctx.strokeStyle = css(gr, 0.3); ctx.beginPath();
    for (let p = loI; p <= hiI; p++) if (((p % 12) + 12) % 12 === 0) { const y = Math.round((hi - p + 1) * rowH) + 0.5; ctx.moveTo(keysW, y); ctx.lineTo(W, y); }
    ctx.stroke();
    if (tm) {
      // grid follows the tempo: bars every 4 beats, then beats, then 8th/16th lines when zoomed in
      const kn = Math.floor(tm.s2t(T) / tm.res), beatPx = (tm.t2s((kn + 1) * tm.res) - tm.t2s(kn * tm.res)) * pps;
      const n = fx.gridDiv === 'auto' ? (beatPx >= 150 * sc ? 4 : beatPx >= 70 * sc ? 2 : 1) : parseInt(fx.gridDiv, 10) || 1;
      const k0 = Math.max(0, Math.floor(tm.s2t(tL) / tm.res) * n), k1 = Math.ceil(tm.s2t(tR) / tm.res) * n;
      if (k1 - k0 < 2400) for (let k = k0; k <= k1; k++) {
        const x = Math.round(playX + (tm.t2s(k * tm.res / n) - T) * pps) + 0.5, beat = k % n === 0, bar = k % (4 * n) === 0;
        const on = beat && Math.floor(k / n) === kn;
        ctx.strokeStyle = css(gr, (bar ? 0.3 : beat ? 0.12 : 0.055) + (on ? pulse * 0.3 : 0)); ctx.lineWidth = bar ? Math.max(1.5, 1.5 * sc) : Math.max(1, sc);
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
    }
  }

  drawPortraits(W, H, keysW, P);
  drawWave(W, H, keysW, P, T, hi, loI, hiI, rowH, sc, playX, false);
  const act = [], jobs = [], gl = fx.glow * sc, nh = rowH * fx.noteH / 100, rad = nh * fx.round / 100;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const { f, t } of allTracks()) {
    if (!t.on) continue;
    const sh = f.offset / 1000, col = colorsFor(t, P), notes = t.notes;
    const gcol = fx.glowColor === 'hi' ? col.hi : fx.glowColor === 'white' ? '#ffffff' : col.base;
    const lineRgb = fx.pitchColor === 'track' ? col.rgb : (fx.pitchColor === 'theme' && P.pitchRgb) ? P.pitchRgb : col.hiRgb;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i], a0 = n.t0 + sh, a1 = n.t1 + sh;
      if (a1 < tL - 0.1 || a0 > tR) continue;
      const x0 = playX + (a0 - T) * pps, x1 = playX + (a1 - T) * pps, w = x1 - x0, y = yOf(n.pitch) - nh / 2;
      const on = T >= a0 && T < a1, past = T >= a1, lit = on && fx.highlight;
      if (on) act.push({ n, t, col, sh });
      const alpha = (past ? 1 - fx.dim / 100 : (on ? 1 : 0.95)) * (n.rest ? 0.45 : 1);
      ctx.globalAlpha = alpha; ctx.fillStyle = lit ? col.lift : col.base;
      if (gl > 0) { ctx.shadowColor = gcol; ctx.shadowBlur = gl * (lit ? 2.2 : past ? 0.3 : 0.75); }
      rr(x0, y, w, nh, rad); ctx.fill(); ctx.shadowBlur = 0;
      if (fx.outline > 0) { ctx.strokeStyle = P.edgeRgb ? css(P.edgeRgb) : col.edge; ctx.lineWidth = fx.outline * sc; rr(x0, y, w, nh, rad); ctx.stroke(); }
      if (on && fx.progress) { const u = (T - a0) / (a1 - a0); ctx.fillStyle = col.peak; if (gl > 0 && lit) { ctx.shadowColor = gcol; ctx.shadowBlur = gl; } rr(x0, y, w * u, nh, rad); ctx.fill(); ctx.shadowBlur = 0; }
      if (fx.flash) { const d = T - a0; if (d >= 0 && d < 0.32) { ctx.globalAlpha = (1 - d / 0.32) * 0.7; ctx.fillStyle = col.hi; rr(x0, y, w, nh, rad); ctx.fill(); } }
      if (lit) { ctx.globalAlpha = 1; ctx.strokeStyle = P.actC; ctx.lineWidth = Math.max(1.2, 1.7 * sc); rr(x0, y, w, nh, rad); ctx.stroke(); }
      if (n.lyric) jobs.push({ x0, y, w, on, past, col, lit, text: n.lyric, rest: n.rest });
      if (fx.pitch) {
        const lw = fx.pitchW * sc, c = n.curve, ts = T - sh, mode = fx.pitchMode;
        const path = (from, to) => {
          ctx.beginPath(); let st = false;
          if (c) {
            const i0 = Math.max(0, Math.floor((from - c.a) / c.step)), i1 = Math.min(c.v.length - 1, Math.ceil((to - c.a) / c.step));
            for (let k = i0; k <= i1; k++) { const tt = Math.min(c.a + k * c.step, to), x = playX + (tt + sh - T) * pps, yy = yOf(c.v[k]); if (st) ctx.lineTo(x, yy); else { ctx.moveTo(x, yy); st = true; } }
          } else { const yy = yOf(n.pitch); ctx.moveTo(playX + (Math.max(from, n.t0) + sh - T) * pps, yy); ctx.lineTo(playX + (to + sh - T) * pps, yy); }
          ctx.stroke();
        };
        const start = c ? c.a : n.t0; ctx.lineWidth = lw; ctx.globalAlpha = past ? Math.min(1, 1.1 - fx.dim / 100) : 1;
        if (mode === 'static') { ctx.strokeStyle = css(lineRgb, 1); path(start, n.t1); }
        else {
          if (mode === 'always') { ctx.strokeStyle = css(lineRgb, 0.35); path(start, n.t1); }
          if (ts >= start) {
            const to = Math.min(ts, n.t1);
            if (mode === 'trail') {
              if (ts - fx.trail < n.t1) {
                const from = Math.max(start, ts - fx.trail), xa = playX + (from + sh - T) * pps, xb = playX + (to + sh - T) * pps;
                if (xb - xa > 0.5) { const gg = ctx.createLinearGradient(xa, 0, xb, 0); gg.addColorStop(0, css(lineRgb, 0)); gg.addColorStop(1, css(lineRgb, 1)); ctx.strokeStyle = gg; if (gl > 0) { ctx.shadowColor = css(lineRgb); ctx.shadowBlur = gl * 0.7; } path(from, to); ctx.shadowBlur = 0; }
              }
            } else { ctx.strokeStyle = css(lineRgb, 1); if (gl > 0) { ctx.shadowColor = css(lineRgb); ctx.shadowBlur = gl * 0.7; } path(start, to); ctx.shadowBlur = 0; }
          }
        }
      }
    }
  }
  ctx.globalAlpha = 1;

  for (const a of act) a.y = yOf(curveAt(a.n, T - a.sh));
  if (fx.head) for (const a of act) {
    const hc = P.pitchRgb ? css(P.pitchRgb) : a.col.hi;
    ctx.fillStyle = hc; if (gl > 0) { ctx.shadowColor = hc; ctx.shadowBlur = gl * 1.4; }
    ctx.beginPath(); ctx.arc(playX, a.y, Math.max(3, (fx.pitchW + 2.5) * sc), 0, 6.2832); ctx.fill(); ctx.shadowBlur = 0;
  }

  if (fx.lyrics && jobs.length) {
    const fs = Math.max(8, Math.min(nh * 0.62, 24 * sc) * fx.lyricSize / 100), fsA = Math.max(8, Math.min(18 * sc, fs * 0.9));
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    for (const j of jobs) {
      if (j.x0 + j.w < -20 || j.x0 > W) continue;
      const wgt = j.on ? 700 : 600; let done = false;
      if (fx.lyricMode !== 'above') {
        ctx.font = `${wgt} ${fs}px ${FONT}`;
        const avail = j.w - 8 * sc, txt = fx.lyricMode === 'inside' ? fitText(j.text, avail) : (ctx.measureText(j.text).width <= avail ? j.text : '');
        if (txt) { ctx.globalAlpha = (j.past ? 0.75 : 1) * (j.rest ? 0.5 : 1); ctx.fillStyle = j.lit ? j.col.txtLit : j.col.txt; ctx.fillText(txt, j.x0 + 5 * sc, j.y + nh / 2 + sc * 0.5); done = true; }
      }
      if (!done && fx.lyricMode !== 'inside') {
        ctx.font = `${wgt} ${fsA}px ${FONT}`;
        const txt = fitText(j.text, Math.max(j.w, 80 * sc));
        if (txt) { ctx.globalAlpha = (j.past ? 0.55 : 1) * (j.rest ? 0.5 : 1); ctx.fillStyle = P.fg; if (j.on && gl > 0) { ctx.shadowColor = j.col.base; ctx.shadowBlur = gl * 0.6; } ctx.fillText(txt, j.x0 + 2 * sc, j.y - fsA * 0.7); ctx.shadowBlur = 0; }
      }
    }
    ctx.globalAlpha = 1;
  }

  drawWave(W, H, keysW, P, T, hi, loI, hiI, rowH, sc, playX, true);
  if (S.parts.length) {
    if (!P.light) ctx.globalCompositeOperation = 'lighter';
    for (const p of S.parts) { const k = p.life / p.max; ctx.fillStyle = css(p.c, k * (P.light ? 0.9 : 0.8)); ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (0.4 + k * 0.6), 0, 6.2832); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.strokeStyle = P.play; ctx.lineWidth = Math.max(1.5, 2 * sc) * (1 + pulse * 0.9); ctx.globalAlpha = 0.9;
  if (gl > 0) { ctx.shadowColor = P.play; ctx.shadowBlur = gl * (0.8 + pulse); }
  ctx.beginPath(); ctx.moveTo(playX, 0); ctx.lineTo(playX, H); ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  ctx.restore();
  S.act = act; S.playX = playX; S.sc = sc;

  if (keysW) {
    ctx.fillStyle = P.keyW; ctx.fillRect(0, 0, keysW, H);
    for (let p = hiI; p >= loI; p--) if (BLACK[((p % 12) + 12) % 12]) { ctx.fillStyle = P.keyB; ctx.fillRect(0, (hi - p) * rowH, keysW * 0.64, rowH); }
    for (const a of act) { const p = Math.round(a.n.pitch), isB = BLACK[((p % 12) + 12) % 12]; ctx.fillStyle = a.col.base; ctx.fillRect(0, (hi - p) * rowH, isB ? keysW * 0.64 : keysW, rowH); }
    ctx.strokeStyle = css(gr, 0.35); ctx.lineWidth = Math.max(1, sc); ctx.beginPath();
    for (let p = hiI; p >= loI; p--) { const m = ((p % 12) + 12) % 12; if (m === 0 || m === 5) { const y = Math.round((hi - p + 1) * rowH) + 0.5; ctx.moveTo(0, y); ctx.lineTo(keysW, y); } }
    ctx.stroke();
    ctx.fillStyle = lum(P.keyW) > 0.55 ? '#1a1c2a' : '#f2f2f6'; ctx.font = `600 ${Math.min(rowH * 0.7, 13 * sc)}px monospace`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    if (rowH > 9 * sc) for (let p = loI; p <= hiI; p++) if (((p % 12) + 12) % 12 === 0) ctx.fillText('C' + (Math.floor(p / 12) - 1), keysW - 5 * sc, (hi - p + 0.5) * rowH);
    ctx.textAlign = 'left'; ctx.fillStyle = css(gr, 0.5); ctx.fillRect(keysW - 1, 0, 1.5, H);
  }
  if (!S.files.length) { ctx.font = `600 ${22 * sc}px ${FONT}`; ctx.fillStyle = P.fg; ctx.globalAlpha = 0.6; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Drop project files here', W / 2, H / 2); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
  if (look.caption) { ctx.font = `650 ${22 * sc}px ${FONT}`; ctx.fillStyle = P.fg; ctx.globalAlpha = 0.9; ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.fillText(look.caption, keysW + 22 * sc, 18 * sc); ctx.globalAlpha = 1; }
  drawLyricBox(W, H, sc, keysW, P, T);
}

function stepParticles(dt) {
  const sc = S.sc || 1;
  if (fx.sparks && S.playing && S.act) {
    for (const a of S.act) {
      a.t._acc = (a.t._acc || 0) + dt * 70;
      while (a.t._acc >= 1) {
        a.t._acc--;
        const ang = Math.random() * 6.2832, sp = (30 + Math.random() * 120) * sc, life = 0.5 + Math.random() * 0.5;
        S.parts.push({ x: S.playX, y: a.y + (Math.random() - 0.5) * 4 * sc, vx: Math.cos(ang) * sp - 90 * sc, vy: Math.sin(ang) * sp - 20 * sc, life, max: life, s: (1.5 + Math.random() * 3) * sc, c: a.col.hiRgb });
      }
    }
    if (S.parts.length > 700) S.parts.splice(0, S.parts.length - 700);
  }
  if (S.playing || S.parts.length) for (const p of S.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * sc * dt; p.vx *= 0.985; }
  S.parts = S.parts.filter(p => p.life > 0);
  if (!fx.sparks && S.parts.length) S.parts.length = 0;
}


// timeline
const tlScroll = $('#tlScroll'), tlBody = $('#tlBody'), tlCv = $('#tlCv'), tlHead = $('#tlHead'), phead = $('#phead'), tlZoom = $('#tlZoom');
const LANE = 30, RULER = 24;
let tlSig = '', tlPps = 40, tlW = 0;
function tlLanes() {
  const r = [];
  for (const { f, t } of allTracks()) r.push({ name: t.name, color: t.color, on: t.on, f, t });
  if (S.buf) r.push({ name: S.bufName || 'Audio', color: null, audio: true, on: true });
  return r;
}
function tlLayout() {
  const avail = Math.max(200, tlScroll.clientWidth - (window.innerWidth <= 520 ? 96 : 150));
  const fit = avail / S.duration, cap = 16000 / (window.devicePixelRatio || 1) / S.duration;   // canvases break past ~32k px
  const max = Math.min(Math.max(fit, 240), Math.max(fit, cap));
  tlPps = fit * Math.pow(max / fit, tlZoom.value / 100);
  tlW = Math.max(avail, Math.ceil(S.duration * tlPps));
}
function audioPeaks() {
  if (!S.buf) return null;
  if (S.buf._pk) return S.buf._pk;
  const ch = S.buf.getChannelData(0), N = 2000, step = Math.max(1, Math.floor(ch.length / N)), pk = new Float32Array(N);
  for (let i = 0; i < N; i++) { let m = 0; const a = i * step, e = Math.min(ch.length, a + step); for (let j = a; j < e; j += 8) { const v = Math.abs(ch[j]); if (v > m) m = v; } pk[i] = m; }
  return (S.buf._pk = pk);
}
function drawTL() {
  const lanes = tlLanes(), dpr = window.devicePixelRatio || 1, H = RULER + Math.max(lanes.length, 1) * LANE;
  tlLayout();
  tlCv.width = Math.round(tlW * dpr); tlCv.height = Math.round(H * dpr); tlCv.style.width = tlW + 'px'; tlCv.style.height = H + 'px';
  const c = tlCv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cs = getComputedStyle(document.documentElement), line = cs.getPropertyValue('--line').trim(), mute = cs.getPropertyValue('--mute').trim(), p2 = cs.getPropertyValue('--panel2').trim(), p3 = cs.getPropertyValue('--panel3').trim();
  c.fillStyle = p3; c.fillRect(0, 0, tlW, H);
  c.font = '11px ' + FONT; c.textBaseline = 'middle';
  const steps = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300]; let st = steps.find(x => x * tlPps >= 70) || 600;
  c.fillStyle = p2; c.fillRect(0, 0, tlW, RULER);
  for (let t = 0; t <= S.duration + 1e-6; t += st) {
    const x = Math.round(t * tlPps) + 0.5;
    c.strokeStyle = line; c.beginPath(); c.moveTo(x, RULER - 8); c.lineTo(x, H); c.stroke();
    c.fillStyle = mute; c.fillText(fmt(t).replace(/\.0$/, ''), x + 4, RULER / 2);
  }
  lanes.forEach((ln, i) => {
    const y = RULER + i * LANE;
    c.fillStyle = line; c.fillRect(0, y + LANE - 1, tlW, 1);
    if (ln.audio) {
      const pk = audioPeaks(), x0 = -S.shift * tlPps, w = S.buf.duration * tlPps;
      c.fillStyle = mute; c.globalAlpha = 0.55;
      for (let x = 0; x < tlW; x += 2) { const k = Math.floor((x - x0) / w * pk.length); if (k < 0 || k >= pk.length) continue; const hh = Math.max(1, pk[k] * (LANE - 8)); c.fillRect(x, y + LANE / 2 - hh / 2, 1.5, hh); }
      c.globalAlpha = 1; return;
    }
    const notes = ln.t.notes; if (!notes.length) return;
    let lo = 127, hi = 0; for (const n of notes) { if (n.pitch < lo) lo = n.pitch; if (n.pitch > hi) hi = n.pitch; }
    const span = Math.max(12, hi - lo), sh = ln.f.offset / 1000;
    c.fillStyle = ln.color; c.globalAlpha = ln.on ? 0.95 : 0.25;
    for (const n of notes) {
      const x = (n.t0 + sh) * tlPps, w = Math.max(1.5, (n.t1 - n.t0) * tlPps - 0.5);
      const y2 = y + 4 + (1 - (n.pitch - lo) / span) * (LANE - 11);
      c.fillRect(x, y2, w, 3);
    }
    c.globalAlpha = 1;
  });
  tlHead.replaceChildren(h('div', { class: 'ruler' }, 'Time'), ...lanes.map(ln => h('div', { title: ln.name }, h('i', { style: 'background:' + (ln.color || 'var(--mute)') }), h('span', {}, ln.audio ? 'Audio: ' + ln.name : ln.name))));
  if (!lanes.length) tlHead.append(h('div', { style: 'color:var(--mute)' }, 'No tracks'));
}
let sigAt = 0;
function updateTL() {
  const now = performance.now();
  if (tlSig === '' || now - sigAt > 250) {
    sigAt = now;
    const lanes = tlLanes();
    const sig = lanes.map(l => l.name + l.color + l.on + (l.f ? l.f.offset : '')).join('|') + '|' + S.duration.toFixed(2) + '|' + tlZoom.value + '|' + tlScroll.clientWidth + '|' + (S.buf ? 1 : 0) + '|' + (document.documentElement.dataset.theme || '') + '|' + window.innerWidth;
    if (sig !== tlSig) { tlSig = sig; drawTL(); }
  }
  if (S.loop.a != null) syncLoopUI();
  const x = S.time * tlPps; phead.style.transform = 'translateX(' + x + 'px)';
  if (S.playing && !tlDrag) { const l = tlScroll.scrollLeft, vw = tlScroll.clientWidth - 150; if (x < l || x > l + vw - 40) tlScroll.scrollLeft = Math.max(0, x - 40); }
}
let tlDrag = false;
function tlSeekFrom(e) { const r = tlBody.getBoundingClientRect(); seek((e.clientX - r.left) / tlPps); }
tlBody.addEventListener('pointerdown', e => { tlDrag = true; S.scrub = true; tlBody.setPointerCapture(e.pointerId); tlSeekFrom(e); });
tlBody.addEventListener('pointermove', e => { if (tlDrag) tlSeekFrom(e); });
const tlEnd = () => { tlDrag = false; S.scrub = false; };
tlBody.addEventListener('pointerup', tlEnd); tlBody.addEventListener('pointercancel', tlEnd);
tlZoom.addEventListener('input', () => { const t = S.time; tlSig = ''; updateTL(); tlScroll.scrollLeft = Math.max(0, t * tlPps - tlScroll.clientWidth / 3); });

// main loop
let lastTxt = '', lastInfo = '';
function bpmText() {
  if (!S.tm || !S.files.length) return '';
  const b = S.tm.segs.map(g => g.bpm), lo = Math.min(...b), hi = Math.max(...b), f = v => (Math.round(v * 10) / 10).toString();
  return '  ·  ' + (hi - lo < 0.05 ? f(lo) : f(lo) + '–' + f(hi)) + ' BPM';
}
// redraw at full speed only while something is happening, otherwise ~5 fps
for (const ev of ['pointerdown', 'pointermove', 'keydown', 'input', 'change', 'wheel', 'drop', 'dragover', 'resize']) window.addEventListener(ev, () => { S.wake = performance.now(); }, { passive: true });
function loop(ts) {
  const busy = S.playing || S.exporting || S.parts.length || ts - (S.wake || 0) < 1500;
  if (!busy && ts - (S.last || 0) < 200) { requestAnimationFrame(loop); return; }
  const dt = clamp((ts - (S.last || ts)) / 1000, 0, 0.1); S.last = ts;
  if (S.playing && S.ctx) {
    S.time = S.t0 + (S.ctx.currentTime - S.c0);
    if (S.loop.on && !S.exporting && S.time >= S.loop.b) seek(S.loop.a);
    const lim = S.exporting && S.exporting.to != null ? S.exporting.to : S.duration;
    if (S.time >= lim) {
      S.time = lim; pause();
      if (S.exporting) finishExport();
    }
    S.prevT = S.time;
  }
  stepParticles(dt); S.dt = dt;
  draw(S.time);
  const tx = fmt(S.time); if (tx !== lastTxt) { $('#tNow').textContent = tx; lastTxt = tx; }
  updateTL(); { const ti = S.files.map(f => f.name).join(', ') + bpmText(); if (ti !== lastInfo) { lastInfo = ti; $('#tcInfo').textContent = ti; } }
  if (S.exporting) { const x = S.exporting, k = clamp((S.time - x.from) / Math.max(0.1, x.to - x.from), 0, 1); $('#recBar').style.width = (k * 100).toFixed(1) + '%'; $('#recText').textContent = 'Recording ' + Math.round(k * 100) + '%  (' + fmt(S.time - x.from) + ' of ' + fmt(x.to - x.from) + ')'; }
  requestAnimationFrame(loop);
}

// project list UI
function renderProjects() {
  const box = $('#fileList'); box.replaceChildren();
  if (!S.files.length) { box.append(h('div', { class: 'empty' }, 'No projects loaded. Add files or drop them on the preview.')); return; }
  for (const f of S.files) {
    const el = h('div', { class: 'file', style: 'margin-bottom:10px' },
      h('div', { class: 'fh' }, h('span', { class: 'fn', title: f.name }, f.name), h('span', { class: 'badge' }, f.fmt + (f.variant ? ' · ' + f.variant : '')),
        h('button', { class: 'btn small', type: 'button', 'aria-label': 'Remove ' + f.name, onclick: () => { S.files = S.files.filter(x => x !== f); recalc(); renderProjects(); } }, 'Remove')));
    for (const t of f.tracks) {
      el.append(h('div', { class: 'trk' },
        h('input', { type: 'checkbox', checked: t.on, 'aria-label': 'Show ' + t.name, onchange: e => { t.on = e.target.checked; recalc(); } }),
        h('input', { type: 'color', value: t.color, title: 'Note color for this track', 'aria-label': 'Color for ' + t.name, oninput: e => { t.color = e.target.value; look.tc[tkey(f, t)] = t.color; save(); }, onchange: () => renderProjects() }),
        h('span', { class: 'tn', title: t.name }, t.name), h('span', { class: 'nc' }, t.notes.length + ' notes'),
        look.tc[tkey(f, t)] ? h('button', { class: 'btn small', type: 'button', title: 'Back to the theme color', 'aria-label': 'Reset color for ' + t.name, onclick: () => { delete look.tc[tkey(f, t)]; recolorTracks(); save(); } }, 'Reset') : null));
    }
    el.append(h('div', { class: 'foff' }, h('label', { for: 'off' + f.id }, 'Time offset'),
      h('input', { id: 'off' + f.id, type: 'number', step: 10, value: f.offset, oninput: e => { f.offset = parseFloat(e.target.value) || 0; recalc(); } }), 'ms'));
    box.append(el);
  }
}
function renderAudio() {
  const b = $('#audioBox'); b.replaceChildren(); if (!S.buf) return;
  b.append(h('div', { class: 'file' },
    h('div', { class: 'fh' }, h('span', { class: 'fn', title: S.bufName }, S.bufName), h('span', { class: 'badge' }, 'AUDIO'),
      h('button', { class: 'btn small', type: 'button', onclick: () => { stopSrc(); S.buf = null; recalc(); renderAudio(); } }, 'Remove')),
    h('div', { class: 'foff' }, h('label', { for: 'ash' }, 'Audio offset'),
      h('input', { id: 'ash', type: 'number', step: 10, value: Math.round(S.shift * 1000), oninput: e => { S.shift = (parseFloat(e.target.value) || 0) / 1000; recalc(); if (S.playing) restartAudio(); } }), 'ms')));
}

// effects + look UI
const ctrlRefs = {};
function syncControl(k) { const r = ctrlRefs[k]; if (!r) return; if (r.type === 'checkbox') r.checked = !!fx[k]; else { r.value = fx[k]; if (r.nextOutput) r.nextOutput.textContent = fx[k] + (r.u || ''); } }
const wfRows = [];
function syncWf() { for (const e of wfRows) e.hidden = fx.wfStyle === 'off' || (e.dataset.show !== 'any' && e.dataset.show !== fx.wfStyle); }
function buildFx() {
  const pane = $('#fxPane'); let box = pane, first = true;
  for (const d of FXDEF) {
    if (d.sec) {
      const body = h('div', { class: 'acbody' }), det = h('details', { class: 'ac' }, h('summary', null, d.sec), body);
      if (first) { det.open = true; first = false; }
      pane.append(det); box = body; continue;
    }
    if (d.hint) { box.append(h('p', { class: 'hint' }, d.hint)); continue; }
    const id = 'fx-' + d.k; let el;
    if (d.t === 'color') {
      const inp = h('input', { type: 'color', id, value: fx[d.k], oninput: e => { fx[d.k] = e.target.value; save(); } });
      ctrlRefs[d.k] = inp; el = h('label', { class: 'cell', for: id, style: 'margin:0' }, h('span', null, d.l), inp);
    } else if (d.t === 'toggle') {
      const inp = h('input', { type: 'checkbox', id, checked: !!fx[d.k], onchange: e => { fx[d.k] = e.target.checked; save(); } });
      ctrlRefs[d.k] = inp; el = h('label', { class: 'chk', for: id }, inp, h('span', null, d.l));
    } else if (d.t === 'range') {
      const out = h('output', { for: id }, fx[d.k] + d.u);
      const inp = h('input', { type: 'range', id, min: d.min, max: d.max, step: d.step, value: fx[d.k], oninput: e => { fx[d.k] = parseFloat(e.target.value); out.textContent = fx[d.k] + d.u; save(); if (d.k === 'pad') recalc(); } });
      if (d.reload) inp.addEventListener('change', () => { if (S.files.some(f => f.fmt === 'MIDI')) msg('Bend range applies to MIDI files added from now on.'); });
      inp.nextOutput = out; inp.u = d.u; ctrlRefs[d.k] = inp;
      el = h('div', { class: 'row r' }, h('label', { for: id }, d.l), out, inp);
    } else {
      const sel = h('select', { id, onchange: e => { fx[d.k] = e.target.value; if (d.k === 'wfStyle') syncWf(); save(); } }, d.opts.map(o => h('option', { value: o[0] }, o[1])));
      sel.value = fx[d.k]; ctrlRefs[d.k] = sel; el = h('div', { class: 'row' }, h('label', { for: id }, d.l), sel);
      el.style.gridTemplateColumns = 'minmax(0,1fr)';
    }
    if (d.show) { el.dataset.show = d.show; wfRows.push(el); }
    box.append(el);
  }
  syncWf();
  pane.append(h('button', { class: 'btn small', type: 'button', onclick: () => { fx = { ...FX0 }; for (const k in ctrlRefs) syncControl(k); syncVisInputs(); syncWf(); save(); recalc(); } }, 'Reset effects'));
}
const COLORDEF = [['bg1', 'Background top'], ['bg2', 'Background bottom'], ['rowW', 'Row, white key'], ['rowB', 'Row, black key'], ['grid', 'Grid lines'], ['keyW', 'Key, white'], ['keyB', 'Key, black'], ['play', 'Playhead'], ['pitch', 'Pitch curve'], ['act', 'Active outline'], ['edge', 'Note outline'], ['fg', 'Text']];
const colorRefs = {}, palRefs = [];
function syncColorInputs() {
  for (const [k] of COLORDEF) { const v = S.P[k]; colorRefs[k].value = /^#[0-9a-f]{6}$/i.test(v || '') ? v : (k === 'pitch' ? '#ffffff' : '#808080'); }
  S.P.palette.forEach((c, i) => { if (palRefs[i]) palRefs[i].value = c; });
}
function buildColorUI() {
  const grid = $('#colorGrid'), pal = $('#palette');
  for (const [k, l] of COLORDEF) {
    const id = 'col-' + k, inp = h('input', { type: 'color', id, oninput: e => { look.colors = look.colors || {}; look.colors[k] = e.target.value; updateP(); save(); } });
    colorRefs[k] = inp; grid.append(h('label', { class: 'cell', for: id }, h('span', null, l), inp));
  }
  for (let i = 0; i < 6; i++) {
    const inp = h('input', { type: 'color', 'aria-label': 'Palette color ' + (i + 1), oninput: () => { look.palette = palRefs.map(r => r.value); updateP(); save(); } });
    palRefs.push(inp); pal.append(inp);
  }
}
function recolorTracks(all) { const pal = S.P.palette; let i = 0; if (all) look.tc = {}; for (const { f, t } of allTracks()) { const c = look.tc[tkey(f, t)]; t.color = c || pal[i % pal.length]; i++; } S.ci = i; renderProjects(); if (all) save(); }
function applyPreset(name, auto) {
  if (!PRESETS[name]) return;
  look.preset = name; look.colors = {}; look.palette = null; if (!auto) look.auto = false;
  const p = presetOf(name);
  for (const k of STYLEKEYS) fx[k] = (p.fx && p.fx[k] !== undefined) ? p.fx[k] : FX0[k];
  updateP(); recolorTracks();
  for (const k in ctrlRefs) syncControl(k);
  syncColorInputs(); $('#autoStyle').checked = !!look.auto; save(); buildPresets(); syncShade();
}
function buildPresets() {
  const box = $('#presetGroups'); box.replaceChildren();
  const groups = [['Yours', 'Yours'], ['Editors', 'Editor styles'], ['Characters', 'Characters'], ['Moods', 'Monochrome']];
  for (const [g, title] of groups) {
    const names = Object.keys(PRESETS).filter(n => PRESETS[n].g === g); if (!names.length) continue;
    box.append(h('div', { class: 'sec' }, title));
    const wrap = h('div', { class: 'presets' });
    for (const name of names) {
      const P = presetOf(name);
      wrap.append(h('button', { class: 'preset', type: 'button', 'aria-pressed': String(look.preset === name), onclick: () => applyPreset(name) },
        h('div', { class: 'sw' }, h('i', { style: 'background:' + P.bg1 }), P.palette.slice(0, 4).map(c => h('i', { style: 'background:' + c }))), h('span', null, name)));
    }
    box.append(wrap);
  }
}
function syncShade() {
  const has = !!(PRESETS[look.preset] && PRESETS[look.preset].alt);
  document.querySelectorAll('#shade button').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.v === look.shade)); b.disabled = !has; });
  $('#themeRemove').hidden = !look.themes[look.preset];
  $('#shadeHint').textContent = has ? 'Only changes the piano roll and exported video. The app theme (top right) stays separate.' : 'Light and dark versions are available for the character themes.';
}
document.querySelectorAll('#shade button').forEach(b => b.addEventListener('click', () => { look.shade = b.dataset.v; applyPreset(look.preset, look.auto); syncShade(); }));
$('#autoStyle').addEventListener('change', e => { look.auto = e.target.checked; save(); });
$('#applyPal').addEventListener('click', () => recolorTracks(true));
$('#resetColors').addEventListener('click', () => applyPreset(look.preset, true));
$('#saveMine').addEventListener('click', () => {
  const o = {}; for (const k of STYLEKEYS) o[k] = fx[k];
  const P = {}; for (const k in S.P) if (!['light', 'pitchRgb', 'edgeRgb', 'actC'].includes(k)) P[k] = S.P[k];
  PRESETS['My theme'] = Object.assign(P, { g: 'Yours', fx: o }); look.mine = PRESETS['My theme'];
  look.preset = 'My theme'; look.colors = {}; look.palette = null; updateP(); save(); buildPresets(); msg('Saved as My theme.', 'ok');
});
function setSize() { const [w, hh] = look.size.split('x').map(Number); cv.width = w; cv.height = hh; }
$('#size').value = look.size; $('#size').addEventListener('change', e => { look.size = e.target.value; setSize(); save(); });
$('#caption').value = look.caption; $('#caption').addEventListener('input', e => { look.caption = e.target.value; save(); });
$('#fps').value = look.fps; $('#fps').addEventListener('change', e => { look.fps = e.target.value; save(); });
$('#mbps').value = look.mbps; $('#mbps').addEventListener('change', e => { look.mbps = e.target.value; save(); });

// tabs
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
  document.querySelectorAll('.pane').forEach(p => { p.hidden = p.dataset.pane !== b.dataset.tab; });
}));

// file inputs and drag/drop
$('#btnProj').addEventListener('click', () => $('#fileProj').click());
$('#btnAudio').addEventListener('click', () => $('#fileAudio').click());
$('#fileProj').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
$('#fileAudio').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
const scr = $('#screen');
['dragenter', 'dragover'].forEach(ev => window.addEventListener(ev, e => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) { e.preventDefault(); scr.classList.add('over'); } }));
['dragleave', 'drop'].forEach(ev => window.addEventListener(ev, e => { if (ev === 'drop') { e.preventDefault(); if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files); } scr.classList.remove('over'); }));

// export
function pickMime() {
  if (look.bgMode === 'alpha') { const w = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']; return w.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || ''; }
  const c = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return c.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
}
async function startExport(opts) {
  if (S.exporting) return null;
  if (!window.MediaRecorder || !cv.captureStream) { msg('This browser cannot record the canvas. Try a current Chrome, Edge or Safari.', 'err'); return null; }
  const mime = pickMime(); if (!mime) { msg('No supported video recording format was found in this browser.', 'err'); return null; }
  const whole = !!(opts && opts.whole);
  const from = whole ? 0 : clamp(parseFloat($('#expFrom').value) || 0, 0, S.duration);
  const toRaw = parseFloat($('#expTo').value), to = whole || !isFinite(toRaw) ? S.duration : clamp(toRaw, 0, S.duration);
  if (to - from < 0.5) { msg('The end of the range has to be at least half a second after the start.', 'err'); return null; }
  pause(); await ensureCtx(); S.parts.length = 0;
  const stream = cv.captureStream(parseInt(look.fps, 10));
  S.dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
  let rec; try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: parseFloat(look.mbps) * 1e6, audioBitsPerSecond: 192000 }); } catch (e) { msg('Recording could not start: ' + e.message, 'err'); return null; }
  const chunks = [], type = mime.split(';')[0];
  let done; const finished = new Promise(r => { done = r; });
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  rec.onstop = () => {
    const ex = S.exporting; S.exporting = null; $('#recState').hidden = true; $('#rec').disabled = false;
    const res = ex && !ex.cancel ? { blob: new Blob(chunks, { type }), ext: type.includes('mp4') ? 'mp4' : 'webm' } : null;
    if (res) showResult(res.blob, res.ext);
    done(res);
  };
  S.exporting = { rec, cancel: false, from, to }; $('#rec').disabled = true; $('#recState').hidden = false; $('#result').hidden = true;
  seek(from); rec.start(250); await play(); msg('');
  return finished;
}
function finishExport() { const ex = S.exporting; if (ex) setTimeout(() => { try { ex.rec.stop(); } catch (e) {} }, 400); }
$('#rec').addEventListener('click', () => startExport());
$('#recCancel').addEventListener('click', () => { const ex = S.exporting; if (!ex) return; S.qstop = true; ex.cancel = true; pause(); try { ex.rec.stop(); } catch (e) {} msg('Recording cancelled.'); });
let lastBlob = null, lastExt = 'mp4', lastUrl = null;
function showResult(blob, ext) {
  lastBlob = blob; lastExt = ext;
  const base = ((S.files[0] || {}).name || 'utaviewer').replace(/\.[^.]+$/, '');
  $('#result').hidden = false;
  $('#resInfo').textContent = (blob.size / 1048576).toFixed(1) + ' MB, ' + ext.toUpperCase() + (ext === 'webm' ? '. This browser records WebM only; convert to MP4 with HandBrake or ffmpeg if you need one.' : '.');
  const v = $('#resVideo'); v.hidden = true;
  if (lastUrl) URL.revokeObjectURL(lastUrl);
  try { lastUrl = URL.createObjectURL(blob); v.onloadedmetadata = () => { v.hidden = false; }; v.src = lastUrl; } catch (e) {}
  $('#resSave').dataset.name = base + '-utaviewer.' + ext; $('#resSave').hidden = false;
  msg('Recording finished.', 'ok');
}
$('#resSave').addEventListener('click', async () => {
  if (!lastBlob) return;
  if (!S.dl) { const a = document.createElement('a'); a.href = URL.createObjectURL(lastBlob); a.download = $('#resSave').dataset.name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); msg('Saved.', 'ok'); return; }
  try { await S.dl.save({ filename: $('#resSave').dataset.name, data: lastBlob }); msg('Saved.', 'ok'); }
  catch (e) { if (e && e.code === 'declined') return; msg('The file could not be saved (' + (e && e.code || 'error') + ').', 'err'); }
});

// ---- 1.2: background, portraits, lyric box, look files ----
function readAsDataURL(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(file); }); }
function imgFromSrc(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image')); i.src = src; }); }
// shrink big images so the look file and memory stay small
async function shrink(src, max, type, q) {
  const img = await imgFromSrc(src), k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  if (k === 1 && src.length < 400000) return { data: src, img };
  const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const data = c.toDataURL(type, q); return { data, img: await imgFromSrc(data) };
}
async function setPortrait(name, file) {
  try { const p = await shrink(await readAsDataURL(file), 1024, 'image/png'); S.ports.set(name, p); renderVis(); msg('Portrait set for ' + name + '.' + (fx.portShow ? '' : ' Tick Show portraits to see it.'), 'ok'); }
  catch (e) { msg('That image could not be read.', 'err'); }
}
function pickPortrait(name) {
  const inp = $('#filePort'); inp.onchange = () => { if (inp.files[0]) setPortrait(name, inp.files[0]); inp.value = ''; }; inp.click();
}
function clearBg() { if (S.bg && S.bg.url) URL.revokeObjectURL(S.bg.url); S.bg = null; renderVis(); }
async function setBg(file) {
  try {
    if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file), v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
      await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('video')); });
      if (S.bg && S.bg.url) URL.revokeObjectURL(S.bg.url);
      S.bg = { kind: 'video', el: v, url, name: file.name }; bgSync(true);
    } else {
      const p = await shrink(await readAsDataURL(file), 1920, 'image/jpeg', 0.86);
      if (S.bg && S.bg.url) URL.revokeObjectURL(S.bg.url);
      S.bg = { kind: 'image', el: p.img, data: p.data, name: file.name };
    }
    renderVis(); msg('Background set.', 'ok');
  } catch (e) { msg('That background file could not be opened.', 'err'); }
}
function bgSync(jump) {
  const b = S.bg; if (!b || b.kind !== 'video') return;
  const v = b.el;
  if (jump && v.duration) { try { v.currentTime = S.time % v.duration; } catch (e) {} }
  if (S.playing) v.play().catch(() => {}); else v.pause();
}
function drawBg(W, H, P) {
  const b = S.bg; if (!b) return;
  const el = b.el, v = b.kind === 'video', iw = v ? el.videoWidth : el.naturalWidth, ih = v ? el.videoHeight : el.naturalHeight;
  if (!iw || !ih || (v && el.readyState < 2)) return;
  const k = Math.max(W / iw, H / ih), blur = fx.bgBlur * Math.min(W, H) / 720, m = blur * 2;
  if (blur > 0) ctx.filter = 'blur(' + blur + 'px)';
  ctx.drawImage(el, (W - iw * k) / 2 - m, (H - ih * k) / 2 - m, iw * k + 2 * m, ih * k + 2 * m);
  ctx.filter = 'none';
  ctx.globalAlpha = fx.bgDim / 100; ctx.fillStyle = css(hex2rgb(P.bg1)); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
}

// audio visualizer: scope line, spectrum bars and a spectrum laid along the piano rows. Reads the loaded audio at the current time, so it scrubs and exports exactly.
const FFTN = 4096, FFT = (() => {
  const rev = new Uint16Array(FFTN), cs = new Float32Array(FFTN / 2), sn = new Float32Array(FFTN / 2), win = new Float32Array(FFTN);
  for (let i = 0; i < FFTN; i++) { let r = 0, x = i; for (let b = 0; b < 12; b++) { r = (r << 1) | (x & 1); x >>= 1; } rev[i] = r; win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (FFTN - 1)); }
  for (let i = 0; i < FFTN / 2; i++) { cs[i] = Math.cos(2 * Math.PI * i / FFTN); sn[i] = -Math.sin(2 * Math.PI * i / FFTN); }
  const re = new Float32Array(FFTN), im = new Float32Array(FFTN), mag = new Float32Array(FFTN / 2);
  return function (x) {
    for (let i = 0; i < FFTN; i++) { re[rev[i]] = x[i] * win[i]; im[rev[i]] = 0; }
    for (let size = 2; size <= FFTN; size <<= 1) {
      const half = size >> 1, step = FFTN / size;
      for (let i = 0; i < FFTN; i += size) for (let j = 0, k = 0; j < half; j++, k += step) {
        const a = i + j, b = a + half, tr = re[b] * cs[k] - im[b] * sn[k], ti = re[b] * sn[k] + im[b] * cs[k];
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
      }
    }
    for (let i = 0; i < FFTN / 2; i++) mag[i] = Math.hypot(re[i], im[i]) / FFTN * 4;
    return mag;
  };
})();
const wfBuf = new Float32Array(FFTN);
function audioSamples(from, n, out) {
  const b = S.buf, a0 = b.getChannelData(0), a1 = b.numberOfChannels > 1 ? b.getChannelData(1) : null, s0 = Math.round(from);
  for (let i = 0; i < n; i++) { const k = s0 + i; out[i] = k < 0 || k >= a0.length ? 0 : (a1 ? (a0[k] + a1[k]) * 0.5 : a0[k]); }
  return out;
}
const dbNorm = (v, floor, range, gain) => clamp((20 * Math.log10(v * gain + 1e-6) + floor) / range, 0, 1);
function binMax(mag, f0, f1, hz) { let i0 = Math.floor(f0 / hz), i1 = Math.ceil(f1 / hz); if (i1 <= i0) i1 = i0 + 1; let m = 0; for (let i = Math.max(1, i0); i <= Math.min(mag.length - 1, i1); i++) if (mag[i] > m) m = mag[i]; return m; }
function drawWave(W, H, keysW, P, T, hi, loI, hiI, rowH, sc, playX, over) {
  if (!S.buf || fx.wfStyle === 'off' || !!fx.wfOver !== over) return;
  const sr = S.buf.sampleRate, a = (T + S.shift) * sr, gain = fx.wfGain / 100;
  const cA = fx.wfColor === 'custom' ? fx.wfColA : (P.palette[0] || '#39c5bb'), cB = fx.wfColor === 'custom' ? fx.wfColB : (P.palette[1] || P.palette[0] || '#ff6fae');
  ctx.save(); ctx.globalAlpha = fx.wfOpacity / 100; ctx.shadowBlur = 0;
  const left = keysW, span = W - keysW;
  if (fx.wfStyle === 'scope') {
    const N = Math.round(sr * 0.045), pts = 512; const buf = audioSamples(a - N / 2, N, S.wfScope && S.wfScope.length >= N ? S.wfScope : (S.wfScope = new Float32Array(N + 4)));
    let st = 0; for (let i = 1; i < N * 0.3; i++) if (buf[i - 1] < 0 && buf[i] >= 0) { st = i; break; }
    const len = N - st - 1, cy = H * (1 - fx.wfScopeY / 100), amp = H * 0.3 * gain;
    ctx.strokeStyle = cA; ctx.lineWidth = fx.wfScopeW * sc; ctx.lineJoin = 'round'; ctx.shadowColor = cA; ctx.shadowBlur = 14 * sc;
    ctx.beginPath(); for (let i = 0; i < pts; i++) { const v = buf[st + Math.floor(i / (pts - 1) * len)], x = left + span * i / (pts - 1), y = cy - clamp(v, -1, 1) * amp; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.shadowBlur = 0;
  }
  if (fx.wfStyle === 'bars' || fx.wfStyle === 'keys') {
    const key = Math.round(a) + '|' + S.buf.length;
    if (S.wfKey !== key) { S.wfMag = FFT(audioSamples(a - FFTN / 2, FFTN, wfBuf)); S.wfKey = key; }
    const mag = S.wfMag, hz = sr / FFTN;
    if (fx.wfStyle === 'bars') {
      const n = fx.wfBarN, bw = span / n, maxH = H * fx.wfBarH / 100, f0 = 50, f1 = Math.min(12000, sr / 2 - 1), r = Math.pow(f1 / f0, 1 / n), pos = fx.wfBarPos;
      const g = ctx.createLinearGradient(0, pos === 'top' ? 0 : H - maxH, 0, pos === 'top' ? maxH : H);
      if (pos === 'top') { g.addColorStop(0, cA); g.addColorStop(1, cB); } else { g.addColorStop(0, cB); g.addColorStop(1, cA); }
      if (pos === 'center') { const g2 = ctx.createLinearGradient(0, H / 2 - maxH / 2, 0, H / 2 + maxH / 2); g2.addColorStop(0, cB); g2.addColorStop(0.5, cA); g2.addColorStop(1, cB); ctx.fillStyle = g2; } else ctx.fillStyle = g;
      for (let i = 0; i < n; i++) {
        const v = dbNorm(binMax(mag, f0 * Math.pow(r, i), f0 * Math.pow(r, i + 1), hz), 70, 60, gain), hh = Math.max(0, v * maxH); if (hh < 1) continue;
        const x = left + i * bw + bw * 0.08, w = Math.max(1, bw * 0.84);
        if (pos === 'center') rr(x, H / 2 - hh / 2, w, hh, Math.min(w / 2, 3 * sc)); else rr(x, pos === 'top' ? 0 : H - hh, w, hh, Math.min(w / 2, 3 * sc)); ctx.fill();
      }
    }
    if (fx.wfStyle === 'keys') {
      const maxL = span * fx.wfKeyLen / 100, right = fx.wfKeySide === 'right';
      for (let p = loI; p <= hiI; p++) {
        const f = 440 * Math.pow(2, (p - 69) / 12); if (f < 30 || f > sr / 2 - 1) continue;
        const v = dbNorm(binMax(mag, f * Math.pow(2, -0.5 / 12), f * Math.pow(2, 0.5 / 12), hz), 72, 55, gain), len = Math.pow(v, 1.15) * maxL; if (len < 1) continue;
        const x0 = right ? W - len : left, g = ctx.createLinearGradient(right ? W : left, 0, right ? W - len : left + len, 0);
        g.addColorStop(0, cB); g.addColorStop(1, cA); ctx.globalAlpha = fx.wfOpacity / 100 * 0.85; ctx.fillStyle = g;
        ctx.fillRect(x0, (hi - p) * rowH + rowH * 0.1, len, rowH * 0.8);
      }
    }
  }
  ctx.restore();
}

// portraits are laid under the notes, full height, at the chosen opacity. Several tracks share the width.
function drawPortraits(W, H, keysW, P) {
  if (!fx.portShow || !S.ports.size) return;
  const list = [];
  for (const { t } of allTracks()) { const p = S.ports.get(t.name); if (t.on && p && !list.some(x => x.p === p)) list.push({ t, p }); }
  if (!list.length) return;
  const dt = S.dt || 0.016, left = keysW, span = W - keysW, n = list.length, hh = H * fx.portSize / 100;
  ctx.save(); ctx.beginPath(); ctx.rect(left, 0, span, H); ctx.clip();
  list.forEach((it, i) => {
    const t = it.t, on = S.act && S.act.some(a => a.t === t), im = it.p.img;
    t._pa = (t._pa || 0) + ((on ? 1 : 0) - (t._pa || 0)) * (1 - Math.exp(-dt * (on ? 14 : 5)));
    const w = hh * im.naturalWidth / im.naturalHeight, slot = span / n;
    const cx = n > 1 ? left + slot * (i + 0.5) : fx.portPos === 'l' ? left + w / 2 + span * 0.04 : fx.portPos === 'c' ? left + span / 2 : W - w / 2 - span * 0.04;
    ctx.globalAlpha = clamp(fx.portOpacity / 100 * (fx.portReact ? 0.7 + 0.6 * t._pa : 1), 0, 1);
    ctx.drawImage(im, cx - w / 2, H - hh, w, hh);
  });
  ctx.restore();
}

// lyric lines are rebuilt only when something they depend on changes
function lyricTrack() {
  const on = allTracks().filter(x => x.t.on), sel = look.lyrTrack;
  if (sel && sel !== 'auto') { const [fi, ti] = sel.split(':').map(Number), f = S.files[fi], t = f && f.tracks[ti]; if (t && t.on) return { f, t }; }
  let best = null, bc = 0;
  for (const x of on) { const c = UVLyrics.lyricCount(x.t); if (c > bc) { bc = c; best = x; } }
  return best;
}
function refreshLines() {
  const src = lyricTrack(), ph = src ? UVLyrics.phrases(src.t, src.f.offset / 1000) : [];
  S.lines = UVLyrics.buildLines(fx.lyrSrc, ph, look.lyricText || '', S.duration); S.linesDirty = false;
  S.lines2 = (look.lyricText2 || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const info = $('#lyrInfo'); if (!info) return;
  const rows = (look.lyricText || '').split(/\r?\n/).filter(x => x.trim()).length;
  if (fx.lyrSrc === 'notes') info.textContent = ph.length ? ph.length + ' phrases found in the notes.' : 'No lyrics found in the loaded notes.';
  else if (UVLyrics.parseLRC(look.lyricText || '').length) info.textContent = S.lines.length + ' timed lines (LRC timestamps in use).';
  else if (fx.lyrSrc === 'text') info.textContent = rows + ' text lines, ' + ph.length + ' note phrases.' + (rows > ph.length ? ' Lines past the last phrase are not shown.' : '');
  else info.textContent = rows + ' text lines spread over ' + fmt(S.duration) + '.';
}
function drawLyricBox(W, H, sc, keysW, P, T) {
  if (!fx.lyrShow || !S.lines.length) return;
  const cur = UVLyrics.current(S.lines, T); if (!cur || cur.alpha <= 0.01) return;
  const L = cur.line, mg = Math.max(14 * sc, H * 0.025), fs = 28 * sc * fx.lyrSize / 100, maxW = Math.min(W * 0.42, W - keysW - 2 * mg);
  ctx.save(); ctx.font = '650 ' + fs + 'px ' + FONT; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const spW = ctx.measureText(' ').width, sepAfter = tk => (L.join === ' ' || tk.gap ? spW : 0), rows = [];
  let row = { items: [], w: 0 };
  for (const tk of L.tokens) {
    const tw = ctx.measureText(tk.text).width, lead = row.items.length ? sepAfter(row.items[row.items.length - 1].tk) : 0;
    if (row.items.length && row.w + lead + tw > maxW && rows.length < 2) { rows.push(row); row = { items: [], w: 0 }; }
    const gapBefore = row.items.length ? sepAfter(row.items[row.items.length - 1].tk) : 0;
    row.w += gapBefore + tw; row.items.push({ tk, tw, gapBefore });
  }
  rows.push(row);
  // optional second line: romaji of the kana, or a line the user typed
  const fs2 = fs * 0.62, lh2 = fs2 * 1.45; let sec = null, w2 = 0;
  if (fx.lyr2 === 'romaji') {
    const rt = UVLyrics.romajiTokens(L);
    if (rt.some((x, i) => x.text !== L.tokens[i].text)) { ctx.font = '600 ' + fs2 + 'px ' + FONT; const sp2 = ctx.measureText(' ').width; sec = rt.map(x => { const tw = ctx.measureText(x.text).width; return { x, tw, sp: x.sp ? sp2 : 0 }; }); w2 = sec.reduce((a, o) => a + o.tw + o.sp, 0) - (sec.length ? sec[sec.length - 1].sp : 0); }
  } else if (fx.lyr2 === 'typed' && S.lines2[cur.idx]) {
    ctx.font = '600 ' + fs2 + 'px ' + FONT; const txt = S.lines2[cur.idx]; sec = [{ x: { text: txt, t: -1 }, tw: ctx.measureText(txt).width, sp: 0, plain: true }]; w2 = sec[0].tw;
  }
  const wid = Math.max(...rows.map(r => r.w), w2), k = Math.min(1, maxW / wid), lh = fs * 1.3, padX = 18 * sc, padY = 12 * sc;
  const nextTxt = fx.lyrNext && cur.next ? cur.next.tokens.map(t => t.text).join(cur.next.join) : '';
  const bw = wid * k + padX * 2, bh = (rows.length * lh + (sec ? lh2 : 0) + (nextTxt ? lh * 0.8 : 0)) * k + padY * 2;
  const left = fx.lyrPos === 'bl' || fx.lyrPos === 'tl', center = fx.lyrPos === 'bc', top = fx.lyrPos === 'tl' || fx.lyrPos === 'tr';
  const x = center ? (W + keysW - bw) / 2 : left ? keysW + mg : W - mg - bw;
  const capOff = top && left && look.caption ? 44 * sc : 0;
  const y = top ? mg + capOff : H - mg - bh;
  ctx.globalAlpha = cur.alpha;
  if (fx.lyrBox) { ctx.fillStyle = css(hex2rgb(P.bg1), 0.8); rr(x, y, bw, bh, 14 * sc); ctx.fill(); ctx.strokeStyle = css(hex2rgb(P.grid), 0.4); ctx.lineWidth = Math.max(1, sc); ctx.stroke(); }
  else { ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 8 * sc; }
  ctx.translate(x + padX, y + padY); ctx.scale(k, k);
  const sung = css(hex2rgb(P.act || P.hi)), idle = P.fg;
  ctx.font = '650 ' + fs + 'px ' + FONT;
  rows.forEach((r, ri) => {
    let px = 0; const cy = (ri + 0.5) * lh;
    r.items.forEach(it => {
      px += it.gapBefore;
      ctx.fillStyle = fx.lyrKaraoke && T >= it.tk.t ? sung : idle;
      ctx.globalAlpha = cur.alpha * (fx.lyrKaraoke && T < it.tk.t ? 0.62 : 1);
      ctx.fillText(it.tk.text, px, cy); px += it.tw;
    });
  });
  let yy = rows.length * lh;
  if (sec) {
    ctx.font = '600 ' + fs2 + 'px ' + FONT; let px = 0;
    for (const o of sec) {
      const on = !o.plain && fx.lyrKaraoke && T >= o.x.t;
      ctx.fillStyle = on ? sung : idle; ctx.globalAlpha = cur.alpha * (on ? 0.95 : 0.55);
      ctx.fillText(o.x.text, px, yy + lh2 / 2); px += o.tw + o.sp;
    }
    yy += lh2;
  }
  if (nextTxt) { ctx.font = '600 ' + fs * 0.7 + 'px ' + FONT; ctx.globalAlpha = cur.alpha * 0.5; ctx.fillStyle = idle; ctx.fillText(fitText(nextTxt, wid), 0, yy + lh * 0.4); }
  ctx.restore();
}

// visuals tab
function renderVis() {
  const box = $('#portList'); if (!box) return;
  box.replaceChildren();
  const names = []; for (const { t } of allTracks()) if (!names.includes(t.name)) names.push(t.name);
  if (!names.length) box.append(h('div', { class: 'empty' }, 'Load a project to add portraits for its tracks.'));
  for (const n of names) {
    const p = S.ports.get(n);
    box.append(h('div', { class: 'prow' }, h('div', { class: 'th', style: p ? 'background-image:url(' + p.data + ')' : null }), h('span', { class: 'tn', title: n }, n),
      h('button', { class: 'btn small', type: 'button', onclick: () => pickPortrait(n) }, p ? 'Change' : 'Choose'),
      p ? h('button', { class: 'btn small', type: 'button', onclick: () => { S.ports.delete(n); renderVis(); } }, 'Clear') : null));
  }
  const bg = $('#bgBox'); bg.replaceChildren();
  bg.append(h('div', { class: 'prow' }, h('span', { class: 'tn', title: S.bg ? S.bg.name : '' }, S.bg ? S.bg.name : 'No background'),
    h('button', { class: 'btn small', type: 'button', onclick: () => { $('#fileBg').click(); } }, S.bg ? 'Change' : 'Choose image or video'),
    S.bg ? h('button', { class: 'btn small', type: 'button', onclick: clearBg }, 'Clear') : null));
  const sel = $('#lyrTrack'); sel.replaceChildren(h('option', { value: 'auto' }, 'Auto (most lyrics)'));
  S.files.forEach((f, fi) => f.tracks.forEach((t, ti) => sel.append(h('option', { value: fi + ':' + ti }, t.name + (S.files.length > 1 ? ' (' + f.name + ')' : '')))));
  sel.value = [...sel.options].some(o => o.value === look.lyrTrack) ? look.lyrTrack : 'auto';
  $('#lyrTrack').disabled = !S.files.length;
}
function syncVisInputs() { $('#portShow').checked = !!fx.portShow; $('#lyrShow').checked = !!fx.lyrShow; $('#lyrSrc').value = fx.lyrSrc; $('#lyrText').value = look.lyricText || ''; $('#lyr2').value = fx.lyr2; $('#lyrText2').value = look.lyricText2 || ''; $('#lyrText2').hidden = fx.lyr2 !== 'typed'; }
$('#fileBg').addEventListener('change', e => { if (e.target.files[0]) setBg(e.target.files[0]); e.target.value = ''; });
$('#portShow').addEventListener('change', e => { fx.portShow = e.target.checked; save(); });
$('#lyrShow').addEventListener('change', e => { fx.lyrShow = e.target.checked; save(); });
$('#lyrSrc').addEventListener('change', e => { fx.lyrSrc = e.target.value; save(); refreshLines(); });
$('#lyrTrack').addEventListener('change', e => { look.lyrTrack = e.target.value; save(); refreshLines(); });
$('#lyrText').addEventListener('input', e => { look.lyricText = e.target.value; save(); refreshLines(); });
$('#lyrClear').addEventListener('click', () => { look.lyricText = ''; $('#lyrText').value = ''; save(); refreshLines(); });
$('#lyrFile').addEventListener('click', () => $('#fileLyr').click());
$('#fileLyr').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  look.lyricText = (await f.text()).replace(/^﻿/, ''); $('#lyrText').value = look.lyricText;
  if (fx.lyrSrc === 'notes') { fx.lyrSrc = UVLyrics.parseLRC(look.lyricText).length ? 'even' : 'text'; $('#lyrSrc').value = fx.lyrSrc; }
  fx.lyrShow = true; syncVisInputs(); save(); refreshLines(); msg('Lyrics loaded from ' + f.name + '.', 'ok');
});

// export shape and range
function syncAspect() { document.querySelectorAll('#aspect button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.size === look.size))); }
document.querySelectorAll('#aspect button').forEach(b => b.addEventListener('click', () => { look.size = b.dataset.size; $('#size').value = look.size; setSize(); save(); syncAspect(); }));
$('#size').addEventListener('change', syncAspect);
$('#fromHere').addEventListener('click', () => { $('#expFrom').value = S.time.toFixed(1); });
$('#toHere').addEventListener('click', () => { $('#expTo').value = S.time.toFixed(1); });

// look files
function saveBlobAs(blob, name) {
  if (S.dl) return S.dl.save({ filename: name, data: blob });
  const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000); return Promise.resolve();
}
$('#themeName').value = look.preset === 'Default' || look.preset === 'My theme' ? '' : look.preset;
$('#themeSave').addEventListener('click', async () => {
  const cur = PRESETS[look.preset] || PRESETS.Default;
  const name = ($('#themeName').value.trim() || (look.preset === 'Default' ? 'My theme' : look.preset)).slice(0, 40);
  const mine = Object.assign({}, S.P); if (look.palette) mine.palette = look.palette.slice();
  const cv_ = variantOut(mine), other = cur.alt ? (look.shade === 'light' ? variantOut(cur) : variantOut(cur.alt)) : null;
  const o = {}; for (const k of STYLEKEYS) o[k] = fx[k];
  const doc = { utaviewer: 'theme', version: VERSION, name };
  if (other) { doc[look.shade === 'light' ? 'light' : 'dark'] = cv_; doc[look.shade === 'light' ? 'dark' : 'light'] = other; } else doc[S.P.light ? 'light' : 'dark'] = cv_;
  doc.fx = o;
  try { await saveBlobAs(new Blob([JSON.stringify(doc, null, 1)], { type: 'application/json' }), name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.utatheme.json'); msg('Theme saved.', 'ok'); }
  catch (e) { if (!(e && e.code === 'declined')) msg('The theme file could not be saved.', 'err'); }
});
$('#themeLoad').addEventListener('click', () => $('#fileTheme').click());
$('#fileTheme').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    if (f.size > 200000) throw new Error('big');
    const d = JSON.parse(await f.text()); if (!d || d.utaviewer !== 'theme') throw new Error('not a theme');
    const P = cleanTheme(d); if (!P) throw new Error('empty');
    const name = registerTheme(String(d.name || f.name.replace(/\.utatheme\.json$|\.json$/i, '') || 'Imported theme').slice(0, 40), P);
    if (d.dark && !d.light) look.shade = 'dark'; else if (d.light && !d.dark) look.shade = 'light';
    applyPreset(name); msg('Theme "' + name + '" added.', 'ok'); $('#themeName').value = name;
  } catch (er) { msg('That is not a UtaViewer theme file.', 'err'); }
});
$('#themeRemove').addEventListener('click', () => { const n = look.preset; if (!look.themes[n]) return; delete look.themes[n]; delete PRESETS[n]; applyPreset('Default'); msg('Theme removed.', 'ok'); });

// light / dark: follows the system until you pick one
const THEMES = ['auto', 'light', 'dark'];
let theme = 'auto'; try { theme = localStorage.getItem('utaviewer.theme') || 'auto'; } catch (e) {}
if (!THEMES.includes(theme)) theme = 'auto';
function applyTheme() {
  if (theme === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme;
  $('#btnTheme').textContent = 'Theme: ' + theme[0].toUpperCase() + theme.slice(1);
  try { localStorage.setItem('utaviewer.theme', theme); } catch (e) {}
}
$('#btnTheme').addEventListener('click', () => { theme = THEMES[(THEMES.indexOf(theme) + 1) % 3]; applyTheme(); });
applyTheme();

// ---- 1.3: loop region, background modes, second lyric line, render queue ----
// loop
function syncLoopUI() {
  const l = S.loop, ok = l.a != null && l.b != null && l.b > l.a;
  $('#loopBtn').setAttribute('aria-pressed', String(ok && l.on));
  const band = $('#loopBand'); band.hidden = !ok;
  if (ok) { band.style.left = l.a * tlPps + 'px'; band.style.width = (l.b - l.a) * tlPps + 'px'; band.style.opacity = l.on ? 0.22 : 0.08; }
}
function setLoop(a, b) { S.loop.a = a; S.loop.b = b; S.loop.on = b > a + 0.2; if (!S.loop.on) { S.loop.a = S.loop.b = null; } syncLoopUI(); }
function loopPoint(which) {
  const t = S.time, l = S.loop;
  if (which === 'a') { l.a = t; if (l.b == null || l.b <= t + 0.2) l.b = Math.min(S.duration, t + 4); }
  else { l.b = t; if (l.a == null || l.a >= t - 0.2) l.a = Math.max(0, t - 4); }
  l.on = true; syncLoopUI(); msg('Loop ' + fmt(l.a) + ' to ' + fmt(l.b) + '.');
}
function toggleLoop() {
  const l = S.loop;
  if (l.a == null) { msg('Shift-drag on the timeline, or press [ and ] to mark the loop.'); return; }
  l.on = !l.on; syncLoopUI();
}
function clearLoop() { S.loop.a = S.loop.b = null; S.loop.on = false; syncLoopUI(); }
$('#loopBtn').addEventListener('click', toggleLoop);
let loopDrag = null;
tlBody.addEventListener('pointerdown', e => {
  if (!e.shiftKey) return;
  const r = tlBody.getBoundingClientRect(); loopDrag = (e.clientX - r.left) / tlPps; e.stopImmediatePropagation(); tlBody.setPointerCapture(e.pointerId);
}, true);
tlBody.addEventListener('pointermove', e => {
  if (loopDrag == null) return;
  const r = tlBody.getBoundingClientRect(), t = clamp((e.clientX - r.left) / tlPps, 0, S.duration);
  S.loop.a = Math.min(loopDrag, t); S.loop.b = Math.max(loopDrag, t); S.loop.on = false; syncLoopUI();
}, true);
tlBody.addEventListener('pointerup', () => { if (loopDrag == null) return; loopDrag = null; if (S.loop.b - S.loop.a > 0.2) { S.loop.on = true; syncLoopUI(); } else clearLoop(); }, true);

// video background: normal, transparent or green screen
function syncBgMode() {
  $('#bgMode').value = look.bgMode; cv.classList.toggle('alpha', look.bgMode === 'alpha');
  $('#bgHint').textContent = look.bgMode === 'alpha' ? 'Saved as WebM with a transparent background. Turn off Piano keys in Effects if you only want the notes. Use an editor that reads alpha, like Premiere, DaVinci Resolve or AviUtl2 with a WebM plugin.'
    : look.bgMode === 'green' ? 'Fills the video with pure green (#00ff00) so you can key it out in any editor.' : '';
}
$('#bgMode').addEventListener('change', e => { look.bgMode = e.target.value; save(); syncBgMode(); });

// second lyric line
$('#lyr2').addEventListener('change', e => { fx.lyr2 = e.target.value; $('#lyrText2').hidden = fx.lyr2 !== 'typed'; save(); });
$('#lyrText2').addEventListener('input', e => { look.lyricText2 = e.target.value; save(); refreshLines(); });

// render queue: several songs, one after another, each saved as it finishes
const AUDIO_EXT = ['wav', 'mp3', 'ogg', 'flac', 'm4a', 'aac', 'opus'];
const baseName = n => n.replace(/\.[^.]+$/, '');
function addToQueue(list) {
  let added = 0;
  for (const f of Array.from(list)) {
    const ext = f.name.split('.').pop().toLowerCase(), base = baseName(f.name), isAudio = !PROJ_EXT.includes(ext) && (AUDIO_EXT.includes(ext) || f.type.startsWith('audio/'));
    let it = S.queue.find(q => q.base === base);
    if (!it) { it = { base, proj: null, audio: null, state: '' }; S.queue.push(it); }
    if (isAudio) it.audio = f; else { it.proj = f; added++; }
  }
  const orphans = S.queue.filter(q => !q.proj); S.queue = S.queue.filter(q => q.proj);
  renderQueue();
  if (orphans.length) msg('Audio without a project of the same name was skipped: ' + orphans.map(o => o.audio.name).join(', '), 'err');
}
function renderQueue() {
  const box = $('#queueList'); box.replaceChildren();
  if (!S.queue.length) box.append(h('div', { class: 'empty' }, 'Nothing queued.'));
  for (const q of S.queue) {
    box.append(h('div', { class: 'qrow' }, h('span', { class: 'tn', title: q.proj.name }, q.proj.name), h('span', { class: 'st' }, q.audio ? '+ audio' : 'no audio'),
      h('span', { class: 'st ' + (q.state === 'done' ? 'ok' : q.state === 'error' ? 'err' : '') }, q.state === 'done' ? 'saved' : q.state === 'error' ? 'failed' : q.state === 'working' ? 'rendering' : ''),
      h('button', { class: 'btn small', type: 'button', disabled: !!S.qrun, onclick: () => { S.queue = S.queue.filter(x => x !== q); renderQueue(); } }, 'Remove')));
  }
  $('#qRun').disabled = !!S.qrun || !S.queue.length; $('#qAdd').disabled = !!S.qrun; $('#qClear').disabled = !!S.qrun;
}
async function runQueue() {
  if (S.exporting || S.qrun || !S.queue.length) return;
  S.qrun = true; S.qstop = false; S.queue.forEach(q => { q.state = ''; });
  const auto0 = look.auto, cap0 = look.caption; look.auto = false;
  let ok = 0;
  for (let i = 0; i < S.queue.length && !S.qstop; i++) {
    const q = S.queue[i]; q.state = 'working'; renderQueue();
    $('#qState').textContent = 'Rendering ' + (i + 1) + ' of ' + S.queue.length + ': ' + q.proj.name;
    try {
      pause(); S.files = []; S.ci = 0; S.buf = null; S.bufName = ''; S.shift = 0; S.time = 0;
      addProject(await parseProjectFile(q.proj, fx.bend), q.proj.name);
      if (q.audio) await loadAudio(q.audio);
      look.caption = $('#qCaption').checked ? q.base : cap0;
      recalc(); renderProjects(); renderAudio();
      const res = await startExport({ whole: true });
      if (!res) { q.state = ''; break; }
      await saveBlobAs(res.blob, q.base + '-utaviewer.' + res.ext); q.state = 'done'; ok++;
    } catch (e) { q.state = 'error'; if (e && e.code === 'declined') { S.qstop = true; } }
  }
  look.auto = auto0; look.caption = cap0; S.qrun = false;
  $('#qState').textContent = S.qstop ? 'Stopped after ' + ok + ' of ' + S.queue.length + '.' : 'Done: ' + ok + ' of ' + S.queue.length + ' saved.';
  renderQueue(); msg('Queue finished.', ok === S.queue.length ? 'ok' : 'err');
}
$('#qAdd').addEventListener('click', () => $('#fileQueue').click());
$('#fileQueue').addEventListener('change', e => { addToQueue(e.target.files); e.target.value = ''; });
$('#qRun').addEventListener('click', runQueue);
$('#qClear').addEventListener('click', () => { S.queue = []; $('#qState').textContent = ''; renderQueue(); });

// init
$('#ver').textContent = 'v' + VERSION;
updateP(); setSize(); buildFx(); buildColorUI(); buildPresets(); syncShade(); recalc(); renderProjects(); setPlayIcon(); syncColorInputs(); syncVisInputs(); syncAspect(); syncBgMode(); renderQueue(); $('#autoStyle').checked = !!look.auto;
msg('Add project files or drop them on the preview to begin. Only UST files layer together.');
try { const p = window.claude && window.claude.use ? window.claude.use('downloads') : null; if (p) p.then(d => { S.dl = d; }).catch(() => {}); } catch (e) {}
requestAnimationFrame(loop);
})();
