const BLICK = 705600000;
const ease = { l: u => u, io: u => (1 - Math.cos(Math.PI * u)) / 2, i: u => u * u, o: u => 1 - (1 - u) * (1 - u) };

function decodeText(bytes) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch (e) { try { return new TextDecoder('shift_jis').decode(bytes); } catch (e2) { return new TextDecoder().decode(bytes); } }
}

function makeTempoMap(list, res) {
  list = list.filter(t => isFinite(t.bpm) && t.bpm > 0).slice().sort((a, b) => a.tick - b.tick);
  if (!list.length) list = [{ tick: 0, bpm: 120 }];
  if (list[0].tick > 0) list.unshift({ tick: 0, bpm: list[0].bpm });
  const segs = []; let sec = 0;
  for (let i = 0; i < list.length; i++) {
    if (i > 0) { const p = list[i - 1]; sec += (list[i].tick - p.tick) / res * 60 / p.bpm; }
    segs.push({ tick: list[i].tick, sec, bpm: list[i].bpm });
  }
  const t2s = tick => { let i = segs.length - 1; while (i > 0 && segs[i].tick > tick) i--; const s = segs[i]; return s.sec + (tick - s.tick) / res * 60 / s.bpm; };
  const s2t = s => { let i = segs.length - 1; while (i > 0 && segs[i].sec > s) i--; const g = segs[i]; return g.tick + (s - g.sec) * g.bpm / 60 * res; };
  return { segs, res, t2s, s2t };
}

// curve through points (xs in seconds, ys in semitones), shapes[i] eases segment i to i+1
function pointsFn(xs, ys, shapes, zeroEnds) {
  const n = xs.length; if (!n) return null;
  return t => {
    if (t <= xs[0]) return zeroEnds ? 0 : ys[0];
    if (t >= xs[n - 1]) return zeroEnds ? 0 : ys[n - 1];
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= t) lo = m; else hi = m; }
    const u = (t - xs[lo]) / ((xs[hi] - xs[lo]) || 1e-9);
    const f = ease[shapes && shapes[lo]] || ease.l;
    return ys[lo] + (ys[hi] - ys[lo]) * f(u);
  };
}

// vibrato like OpenUtau/UTAU: length as % of note, period in ms, depth in cents, fades in %
function vibFn(t0, t1, v) {
  if (!v || !v.length || !v.depth) return null;
  const len = (t1 - t0) * v.length / 100; if (len <= 0) return null;
  const vs = t1 - len, per = (v.period || 175) / 1000;
  const fi = len * (v.in == null ? 10 : v.in) / 100, fo = len * (v.out == null ? 10 : v.out) / 100;
  return t => {
    if (t < vs || t > t1) return 0;
    let e = 1; const a = t - vs, b = t1 - t;
    if (fi > 0 && a < fi) e = a / fi;
    if (fo > 0 && b < fo) e = Math.min(e, b / fo);
    return v.depth / 100 * e * Math.sin(2 * Math.PI * a / per);
  };
}

function mkNote(t0, t1, pitch, lyric, offs) {
  const n = { t0, t1: Math.max(t1, t0 + 0.01), pitch, lyric: lyric || '', curve: null };
  const fs = (offs || []).filter(Boolean);
  if (fs.length) {
    const a = t0 - 0.05, step = 0.01, len = Math.max(2, Math.ceil((n.t1 - a) / step) + 1);
    const v = new Float32Array(len); let any = false;
    for (let i = 0; i < len; i++) {
      let o = 0; const t = a + i * step;
      for (const f of fs) o += f(t);
      if (Math.abs(o) > 1e-4) any = true;
      v[i] = pitch + o;
    }
    if (any) n.curve = { a, step, v };
  }
  return n;
}

function parseUSTX(text) {
  const y = jsyaml.load(text); if (!y || typeof y !== 'object') throw new Error('Not a USTX file');
  const res = y.resolution || 480;
  const tempos = (y.tempos && y.tempos.length ? y.tempos : [{ position: 0, bpm: y.bpm || 120 }]).map(t => ({ tick: t.position || 0, bpm: t.bpm }));
  const tm = makeTempoMap(tempos, res);
  const tracks = (y.tracks || []).map((t, i) => ({ name: t.track_name || ('Track ' + (i + 1)), notes: [] }));
  for (const p of y.voice_parts || []) {
    const ti = p.track_no || 0;
    while (tracks.length <= ti) tracks.push({ name: 'Track ' + (tracks.length + 1), notes: [] });
    const pos = p.position || 0;
    const pd = (p.curves || []).find(c => c.abbr === 'pitd');
    let pdf = null;
    if (pd && pd.xs && pd.xs.length) pdf = pointsFn(pd.xs.map(x => tm.t2s(pos + x)), pd.ys.map(v => v / 100), null, true);
    for (const n of p.notes || []) {
      const a = pos + (n.position || 0), t0 = tm.t2s(a), t1 = tm.t2s(a + (n.duration || 0));
      const offs = [pdf];
      const pts = n.pitch && n.pitch.data;
      if (pts && pts.length) offs.push(pointsFn(pts.map(q => t0 + (q.x || 0) / 1000), pts.map(q => (q.y || 0) / 10), pts.map(q => q.shape || 'io')));
      const vb = n.vibrato && n.vibrato.length > 0 ? vibFn(t0, t1, { length: n.vibrato.length, period: n.vibrato.period, depth: n.vibrato.depth, in: n.vibrato.in, out: n.vibrato.out }) : null;
      offs.push(vb);
      const rest = isRest(n.lyric), nn = mkNote(t0, t1, n.tone, rest ? 'R' : cleanLyric(n.lyric), offs);
      if (rest) nn.rest = true;
      nn.u = { k: utauLyric(n.lyric), old: nn.lyric, oldRest: !!rest, raw: n.lyric };
      tracks[ti].notes.push(nn);
    }
  }
  return { fmt: 'USTX', title: y.name || '', tm, tracks };
}

function parseUST(bytes) {
  const text = decodeText(bytes);
  const secs = []; let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim(), m = line.match(/^\[#(.+)\]$/);
    if (m) { cur = { id: m[1], kv: {} }; secs.push(cur); }
    else if (cur) { const i = line.indexOf('='); if (i > 0) cur.kv[line.slice(0, i)] = line.slice(i + 1); }
  }
  const setting = secs.find(s => s.id === 'SETTING');
  const bpm0 = parseFloat(setting && setting.kv.Tempo) || 120, res = 480;
  const tempos = [{ tick: 0, bpm: bpm0 }], raws = []; let tick = 0;
  for (const s of secs) {
    if (!/^\d+$/.test(s.id)) continue;
    const len = parseInt(s.kv.Length, 10) || 0;
    const tp = parseFloat(s.kv.Tempo); if (tp > 0) tempos.push({ tick, bpm: tp });
    raws.push({ tick, len, kv: s.kv }); tick += len;
  }
  const tm = makeTempoMap(tempos, res), notes = [];
  const shapeMap = { '': 'io', s: 'l', r: 'i', j: 'o' };
  for (const r of raws) {
    const kv = r.kv, raw = (kv.Lyric || '').trim();
    if (!raw || isRest(raw)) continue;   // rests are skipped
    const rest = false;
    const tok = raw.split(/\s+/), lyr0 = rest ? 'R' : tok.length > 1 ? (/^r$/i.test(tok[tok.length - 1]) ? tok[0] : tok[tok.length - 1]) : raw, lyr = rest ? 'R' : cleanLyric(lyr0);
    const uk = utauLyric(raw);
    const t0 = tm.t2s(r.tick), t1 = tm.t2s(r.tick + r.len), offs = [];
    if (kv.PBW && kv.PBW.trim()) {
      const parts = (kv.PBS || '0').split(';'), x0 = parseFloat(parts[0]) || 0, y0 = parseFloat(parts[1]) || 0;
      const ws = kv.PBW.split(',').map(v => parseFloat(v) || 0), yy = (kv.PBY || '').split(',').map(v => parseFloat(v) || 0), ms = (kv.PBM || '').split(',');
      const xs = [x0], ys = [y0 / 10], sh = [];
      ws.forEach((w, i) => { xs.push(xs[i] + w); ys.push(i < ws.length - 1 ? (yy[i] || 0) / 10 : 0); sh.push(shapeMap[(ms[i] || '').trim()] || 'io'); });
      offs.push(pointsFn(xs.map(x => t0 + x / 1000), ys, sh));
    }
    if (kv.VBR) { const v = kv.VBR.split(',').map(Number); offs.push(vibFn(t0, t1, { length: v[0], period: v[1], depth: v[2], in: v[3], out: v[4] })); }
    const nn = mkNote(t0, t1, parseInt(kv.NoteNum, 10) || 60, lyr, offs);
    if (rest) nn.rest = true;
    nn.u = { k: uk, old: nn.lyric, oldRest: false, raw };
    notes.push(nn);
  }
  return { fmt: 'UST', title: (setting && setting.kv.ProjectName) || '', tm, tracks: [{ name: 'UST notes', notes }] };
}

function parseMIDI(buf, bendRange) {
  bendRange = bendRange || 2;
  const u = new Uint8Array(buf), dv = new DataView(buf);
  if (String.fromCharCode(u[0], u[1], u[2], u[3]) !== 'MThd') throw new Error('Not a MIDI file');
  const div = dv.getUint16(12); if (div & 0x8000) throw new Error('SMPTE time division is not supported');
  let p = 8 + dv.getUint32(4); const tempos = [], trks = [];
  while (p + 8 <= u.length) {
    const id = String.fromCharCode(u[p], u[p + 1], u[p + 2], u[p + 3]), len = dv.getUint32(p + 4);
    let q = p + 8; const end = Math.min(u.length, q + len); p = end;
    if (id !== 'MTrk') continue;
    let tick = 0, run = 0; const tr = { name: '', notes: [], lyr: [], txt: [], bends: [] }, open = new Map();
    const vlq = () => { let v = 0, b; do { b = u[q++]; v = (v << 7) | (b & 127); } while ((b & 128) && q < end); return v; };
    while (q < end) {
      tick += vlq(); let st = u[q];
      if (st < 0x80) st = run; else { q++; if (st < 0xF0) run = st; }
      if (st === 0xFF) {
        const type = u[q++], l = vlq(), d = u.subarray(q, q + l); q += l;
        if (type === 0x51 && l === 3) tempos.push({ tick, bpm: 60000000 / ((d[0] << 16) | (d[1] << 8) | d[2]) });
        else if (type === 0x03) tr.name = decodeText(d);
        else if (type === 0x05) tr.lyr.push({ tick, text: decodeText(d) });
        else if (type === 0x01) tr.txt.push({ tick, text: decodeText(d) });
        else if (type === 0x2F) break;
      } else if (st === 0xF0 || st === 0xF7) { q += vlq(); }
      else {
        const hi = st & 0xF0, ch = st & 15, a = u[q++], b = (hi === 0xC0 || hi === 0xD0) ? 0 : u[q++];
        const key = ch * 128 + a;
        if (hi === 0x90 && b > 0) { if (!open.has(key)) open.set(key, []); open.get(key).push(tick); }
        else if (hi === 0x80 || (hi === 0x90 && b === 0)) { const arr = open.get(key); if (arr && arr.length) tr.notes.push({ s: arr.shift(), e: tick, p: a }); }
        else if (hi === 0xE0) tr.bends.push({ tick, v: ((b << 7) | a) - 8192 });
      }
    }
    trks.push(tr);
  }
  const tm = makeTempoMap(tempos.length ? tempos : [{ tick: 0, bpm: 120 }], div), tracks = []; let title = '';
  trks.forEach((tr, i) => {
    if (!tr.notes.length) { if (!title && tr.name) title = tr.name; return; }
    const lm = new Map(); (tr.lyr.length ? tr.lyr : tr.txt).forEach(l => { if (!lm.has(l.tick)) lm.set(l.tick, l.text); });
    let bf = null;
    if (tr.bends.some(b => b.v !== 0)) bf = pointsFn(tr.bends.map(b => tm.t2s(b.tick)), tr.bends.map(b => b.v / 8192 * bendRange), null);
    tr.notes.sort((a, b) => a.s - b.s);
    tracks.push({ name: tr.name || ('Track ' + (i + 1)), notes: tr.notes.map(n => mkNote(tm.t2s(n.s), tm.t2s(n.e), n.p, (lm.get(n.s) || '').replace(/^[-+]$/, ''), [bf])) });
  });
  return { fmt: 'MIDI', title, tm, tracks };
}

function xmlKid(el, names) { for (const c of el.children) if (names.includes(c.localName)) return c; return null; }
function xmlTxt(el, names) { const c = xmlKid(el, names); return c ? c.textContent.trim() : ''; }

function stepFn(xs, ys) {
  const n = xs.length; if (!n) return null;
  return t => {
    if (t < xs[0]) return 0;
    let lo = 0, hi = n - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (xs[m] <= t) lo = m; else hi = m - 1; }
    return ys[lo];
  };
}

// pitch bend events are [tick, -8192..8191], scaled by a sensitivity in semitones that can change over time
function bendFn(tm, base, bends, sens) {
  if (!bends.length) return null;
  bends = bends.slice().sort((a, b) => a[0] - b[0]); sens = sens.slice().sort((a, b) => a[0] - b[0]);
  const xs = [], ys = []; let si = -1;
  for (const [tk, v] of bends) {
    while (si + 1 < sens.length && sens[si + 1][0] <= tk) si++;
    xs.push(tm.t2s(base + tk)); ys.push(v / 8192 * (si >= 0 ? sens[si][1] : 2));
  }
  return stepFn(xs, ys);
}

// UTAU lyrics hold more than the sung syllable: VCV ("a ka"), CVVC ("a k"), breaths, arrows and voice-color suffixes.
// Returns what to show, and what kind of note it is: 'lyric', 'hold' (+ and -), 'conn' (a connector part that is not a syllable) or 'rest' (breath, R, symbols).
const U_BREATH = /^(?:[aiueonN]?(?:息|吸)|ブレス|息継ぎ|br\d*|breath)$/i;
const U_REST = /^(?:r|x|息|吸|ブレス|息継ぎ|br\d*|breath|sil|pau|cl|[-－]{2,}|[・･…\.。、,]+)$/i;
const U_PRE = /^(?:[aiueo]|n|ng|m|N|ん|ン|[あいうえおアイウエオ]|[-－ー]|r|R|息|吸)$/;
const U_CONS = /^(?:[kgsztdnhbpmyrwfvj]|ch|sh|ts|ny|hy|ky|gy|by|py|my|ry|dz|dj|kw|gw|ng|th|c|l|q|x|ʃ|ɕ|ʒ|ʤ|ɲ|ɾ|ŋ)$/i;
function utauLyric(raw) {
  let s = (raw || '').replace(/[↑↓⇧⇩↗↘]/g, '').replace(/^[?？]+/, '').trim();
  if (!s) return { t: '', k: 'rest' };
  if (/^[+\-~ー]~?$/.test(s)) return { t: s[0], k: 'hold' };
  if (/^[\[(<（【《].*[\])>）】》]$/.test(s)) return { t: '', k: 'rest' };
  let tok = s.split(/\s+/).map(x => x.replace(/[_＿].*$/, '').replace(/(?<=.)[A-G][#♯]?\d$/, '').replace(/(?<=[^\d])\d{1,2}$/, '')).filter(Boolean);
  if (tok.some(x => U_BREATH.test(x))) return { t: '', k: 'rest' };
  if (!tok.length) return { t: '', k: 'rest' };
  if (tok.length === 1) {
    const w = tok[0];
    if (U_REST.test(w) || U_BREATH.test(w) || /^[\p{P}\p{S}]+$/u.test(w)) return { t: '', k: 'rest' };
    return { t: w, k: 'lyric' };
  }
  // a trailing rest marker, or a lone consonant after a vowel or consonant, is only the connecting half of a part
  const last = tok[tok.length - 1], first = tok[0];
  if (U_REST.test(last)) return { t: '', k: 'conn' };
  if (U_CONS.test(last) && (U_PRE.test(first) || U_CONS.test(first))) return { t: '', k: 'conn' };
  let i = 0; while (i < tok.length - 1 && (U_PRE.test(tok[i]) || U_REST.test(tok[i]))) i++;
  const rest = tok.slice(i).join(' ');
  if (U_CONS.test(rest)) return { t: '', k: 'conn' };
  return { t: rest, k: 'lyric' };
}

const cleanLyric = s => { s = (s || '').trim(); return /^[+\-]~?$/.test(s) ? s[0] : s; };
const isRest = s => /^r$/i.test((s || '').trim());

// tempo events moved back by `pre` ticks; whatever tempo is in force at the new start becomes the first one
function shiftTempos(list, pre) {
  if (!pre) return list;
  const s = list.slice().sort((a, b) => a.tick - b.tick); let cur = null; const out = [];
  for (const t of s) { if (t.tick <= pre) cur = t; else out.push({ tick: t.tick - pre, bpm: t.bpm }); }
  if (cur) out.unshift({ tick: 0, bpm: cur.bpm });
  return out;
}

function parseVSQX(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('Invalid XML');
  const mt = doc.getElementsByTagName('masterTrack')[0]; if (!mt) throw new Error('No masterTrack found');
  const res = parseInt(xmlTxt(mt, ['resolution']), 10) || 480;
  const tempos = Array.from(mt.children).filter(c => c.localName === 'tempo').map(c => ({ tick: parseInt(xmlTxt(c, ['posTick', 't']), 10) || 0, bpm: (parseFloat(xmlTxt(c, ['bpm', 'v'])) || 12000) / 100 }));
  // the pre-measure is a count-in bar that rendered audio does not contain, so the song starts after it
  const ts = Array.from(mt.children).find(c => c.localName === 'timeSig'), nu = ts ? parseInt(xmlTxt(ts, ['nu']), 10) || 4 : 4, de = ts ? parseInt(xmlTxt(ts, ['de']), 10) || 4 : 4;
  const pre = Math.max(0, parseInt(xmlTxt(mt, ['preMeasure']), 10) || 0) * Math.round(res * 4 * nu / de);
  const tm = makeTempoMap(shiftTempos(tempos.length ? tempos : [{ tick: 0, bpm: 120 }], pre), res), tracks = [];
  Array.from(doc.getElementsByTagName('vsTrack')).forEach((tr, i) => {
    const notes = [];
    for (const part of Array.from(tr.children).filter(c => c.localName === 'musicalPart' || c.localName === 'vsPart')) {
      const pp = parseInt(xmlTxt(part, ['posTick', 't']), 10) || 0, bends = [], sens = [];
      for (const cc of Array.from(part.children).filter(c => c.localName === 'cc')) {
        const v = xmlKid(cc, ['v']); if (!v) continue;
        const tk = parseInt(xmlTxt(cc, ['t', 'posTick']), 10) || 0, id = v.getAttribute('id'), val = parseFloat(v.textContent);
        if (id === 'P') bends.push([tk, val]); else if (id === 'S') sens.push([tk, val]);
      }
      const bf = bendFn(tm, pp - pre, bends, sens);
      for (const n of Array.from(part.children).filter(c => c.localName === 'note')) {
        const a = pp - pre + (parseInt(xmlTxt(n, ['posTick', 't']), 10) || 0), d = parseInt(xmlTxt(n, ['durTick', 'dur', 'd']), 10) || 0, num = parseInt(xmlTxt(n, ['noteNum', 'n']), 10);
        if (!isFinite(num)) continue;
        notes.push(mkNote(tm.t2s(a), tm.t2s(a + d), num, cleanLyric(xmlTxt(n, ['lyric', 'y'])), [bf]));
      }
    }
    if (notes.length) { notes.sort((a, b) => a.t0 - b.t0); tracks.push({ name: xmlTxt(tr, ['trackName', 'name']) || ('Track ' + (i + 1)), notes }); }
  });
  return { fmt: 'VSQX', title: '', tm, tracks };
}

// Synthesizer V Studio 1 keeps pitch as a pitchDelta list (cents). Studio 2 (file version 190+) keeps it in pitchControls:
// curves of absolute pitch (time = pos + x, pitch = pitch + y) plus single anchor points, and its pitchDelta is all zeros.
function svControlsFn(controls, off, tm) {
  const pairs = [];
  for (const c of controls) {
    if (c.type === 'curve' && c.points) for (let k = 0; k + 1 < c.points.length; k += 2) pairs.push([tm.t2s(off + c.pos + c.points[k]), c.pitch + c.points[k + 1]]);
    else if (c.type === 'point') pairs.push([tm.t2s(off + c.pos), c.pitch]);
  }
  if (!pairs.length) return null;
  pairs.sort((a, b) => a[0] - b[0]);
  const xs = pairs.map(p => p[0]), ys = pairs.map(p => p[1]), n = xs.length;
  // absolute pitch at t, or null where there is no control data close by
  return t => {
    if (t < xs[0] || t > xs[n - 1]) return null;
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= t) lo = m; else hi = m; }
    if (xs[hi] - xs[lo] > 0.5) return null;
    return ys[lo] + (ys[hi] - ys[lo]) * ((t - xs[lo]) / ((xs[hi] - xs[lo]) || 1e-9));
  };
}
const SV_SPECIAL = /^(br|cl|sil|pau)$/i;

// Synthesizer V note properties: depth in semitones, rate in Hz, start and fade times in seconds.
// A depth of 0 means vibrato is off; a missing depth next to a rate or start means the default depth of 1.
function svVibFn(n, t0, t1) {
  const a = n.attributes; if (!a) return null;
  const has = ['dF0Vbr', 'fF0Vbr', 'tF0VbrStart', 'tF0VbrLeft', 'tF0VbrRight', 'pF0Vbr'].some(k => a[k] != null); if (!has) return null;
  const depth = a.dF0Vbr != null ? a.dF0Vbr : 1; if (!(Math.abs(depth) > 0)) return null;
  const freq = a.fF0Vbr > 0 ? a.fF0Vbr : 5.5, start = a.tF0VbrStart != null ? Math.max(0, a.tF0VbrStart) : 0.25;
  const fi = a.tF0VbrLeft != null ? Math.max(0, a.tF0VbrLeft) : 0.2, fo = a.tF0VbrRight != null ? Math.max(0, a.tF0VbrRight) : 0.2, ph = a.pF0Vbr || 0;
  const vs = t0 + start; if (vs >= t1) return null;
  return t => {
    if (t < vs || t > t1) return 0;
    let e = 1; const x = t - vs, y = t1 - t;
    if (fi > 0 && x < fi) e = x / fi;
    if (fo > 0 && y < fo) e = Math.min(e, y / fo);
    return depth * e * Math.sin(2 * Math.PI * freq * x + ph);
  };
}

function parseSVP(bytes) {
  const j = JSON.parse(decodeText(bytes).replace(/\0+$/, ''));
  const tempos = ((j.time && j.time.tempo) || [{ position: 0, bpm: 120 }]).map(t => ({ tick: t.position || 0, bpm: t.bpm }));
  const tm = makeTempoMap(tempos, BLICK), lib = new Map((j.library || []).map(g => [g.uuid, g])), tracks = [];
  const v2 = (j.version || 0) >= 160 || (j.library || []).some(g => Array.isArray(g.pitchControls));
  (j.tracks || []).forEach((tr, i) => {
    const notes = [];
    const addGroup = (g, ref) => {
      if (!g || !g.notes) return;
      const off = (ref && ref.blickOffset) || 0, shift = (ref && ref.pitchOffset) || 0;
      const lo = ref && ref.blickAbsoluteBegin != null ? ref.blickAbsoluteBegin : -Infinity, hi = ref && ref.blickAbsoluteEnd > 0 ? ref.blickAbsoluteEnd : Infinity;
      const pd = g.parameters && g.parameters.pitchDelta && g.parameters.pitchDelta.points; let pf = null;
      if (pd && pd.length >= 2) { const xs = [], ys = []; for (let k = 0; k + 1 < pd.length; k += 2) { xs.push(tm.t2s(off + pd[k])); ys.push(pd[k + 1] <= -1199 ? 0 : pd[k + 1] / 100); } pf = pointsFn(xs, ys, null, true); }
      const abs = g.pitchControls && g.pitchControls.length ? svControlsFn(g.pitchControls, off, tm) : null;
      for (const n of g.notes) {
        const a = off + n.onset; if (a < lo || a >= hi) continue;
        const p = n.pitch + shift + (n.detune || 0) / 100;
        const f = abs ? (t => { const v = abs(t); return v == null ? 0 : v + shift - p; }) : pf;
        const raw = (n.lyrics || '').trim(), phon = raw[0] === '.', lyric = cleanLyric(phon ? raw.slice(1) : raw);
        const s0 = tm.t2s(a), s1 = tm.t2s(a + n.duration);
        const nn = mkNote(s0, s1, p, lyric, [f, svVibFn(n, s0, s1)]);
        if (SV_SPECIAL.test(raw)) nn.rest = true;
        notes.push(nn);
      }
    };
    addGroup(tr.mainGroup, tr.mainRef);
    for (const r of tr.groups || []) addGroup(lib.get(r.groupID), r);
    if (notes.length) { notes.sort((a, b) => a.t0 - b.t0); tracks.push({ name: tr.name || ('Track ' + (i + 1)), notes }); }
  });
  return { fmt: 'SVP', variant: v2 ? 'Studio 2' : 'Studio 1', title: (j.meta && j.meta.name) || '', tm, tracks };
}

async function parseVPR(buf) {
  const zip = await JSZip.loadAsync(buf);
  const entry = zip.file(/sequence\.json$/i)[0]; if (!entry) throw new Error('No sequence.json inside this VPR');
  const j = JSON.parse(await entry.async('string')), res = 480;
  const evs = (j.masterTrack && j.masterTrack.tempo && j.masterTrack.tempo.events) || [];
  const tm = makeTempoMap(evs.length ? evs.map(e => ({ tick: e.pos, bpm: e.value / 100 })) : [{ tick: 0, bpm: 120 }], res), tracks = [];
  (j.tracks || []).forEach((tr, i) => {
    const notes = [];
    for (const part of tr.parts || []) {
      if (!part.notes || !part.notes.length) continue;
      const ctl = name => { const c = (part.controllers || []).find(x => x.name === name); return c ? (c.events || []).map(e => [e.pos, e.value]) : []; };
      const bf = bendFn(tm, part.pos || 0, ctl('pitchBend'), ctl('pitchBendSens'));
      for (const n of part.notes) { const a = (part.pos || 0) + n.pos; notes.push(mkNote(tm.t2s(a), tm.t2s(a + n.duration), n.number, cleanLyric(n.lyric), [bf])); }
    }
    if (notes.length) { notes.sort((a, b) => a.t0 - b.t0); tracks.push({ name: tr.name || ('Track ' + (i + 1)), notes }); }
  });
  return { fmt: 'VPR', title: j.title || '', tm, tracks };
}

function parseCCS(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('Invalid XML');
  const res = 960, cast = {};
  for (const s of Array.from(doc.getElementsByTagName('SoundSource'))) if (s.getAttribute('Id')) cast[s.getAttribute('Id')] = s.getAttribute('Name') || s.getAttribute('Id');
  const secs = v => { const m = (v || '').match(/^(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)$/); return m ? (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : 0; };
  const kid = (el, name) => Array.from(el.children).find(c => c.localName === name);
  const tracks = [], seen = {}; let firstTm = null;
  for (const unit of Array.from(doc.getElementsByTagName('Unit'))) {
    const song = kid(unit, 'Song'); if (!song) continue;
    const tEl = kid(song, 'Tempo'), tempos = [];
    if (tEl) for (const d of Array.from(tEl.children)) tempos.push({ tick: parseFloat(d.getAttribute('Clock')) || 0, bpm: parseFloat(d.getAttribute('Tempo')) || 120 });
    const tm = makeTempoMap(tempos.length ? tempos : [{ tick: 0, bpm: 120 }], res); if (!firstTm) firstTm = tm;
    const off = secs(unit.getAttribute('StartTime')), score = kid(song, 'Score'); if (!score) continue;
    // LogF0 is ln(Hz) every 5 ms, Repeat is how many samples share a value
    let f0 = null; const lf = song.getElementsByTagName('LogF0')[0];
    if (lf) {
      f0 = new Float32Array(parseInt(lf.getAttribute('Length'), 10) || 0).fill(NaN); let idx = 0;
      for (const d of Array.from(lf.children)) {
        if (d.getAttribute('Index') != null) idx = parseInt(d.getAttribute('Index'), 10);
        const rep = Math.max(1, parseInt(d.getAttribute('Repeat'), 10) || 1), v = parseFloat(d.textContent);
        for (let k = 0; k < rep; k++) { if (idx + k < f0.length) f0[idx + k] = v; }
        idx += rep;
      }
      let last = -1;
      for (let i = 0; i < f0.length; i++) {
        if (!(f0[i] === f0[i])) continue;
        if (last >= 0 && i - last > 1 && i - last <= 30) for (let k = last + 1; k < i; k++) f0[k] = f0[last] + (f0[i] - f0[last]) * (k - last) / (i - last);
        last = i;
      }
    }
    const L440 = Math.log(440), L2 = Math.log(2), notes = [];
    for (const n of Array.from(score.children).filter(c => c.localName === 'Note')) {
      const step = parseInt(n.getAttribute('PitchStep'), 10), oct = parseInt(n.getAttribute('PitchOctave'), 10);
      if (!isFinite(step) || !isFinite(oct)) continue;
      const a = parseFloat(n.getAttribute('Clock')) || 0, d = parseFloat(n.getAttribute('Duration')) || 0, pitch = (oct + 1) * 12 + step;
      const t0 = off + tm.t2s(a), t1 = off + tm.t2s(a + d);
      const pf = f0 ? (t => {
        const f = (t - off - 0.045) / 0.005, i = Math.floor(f); if (i < 0 || i + 1 >= f0.length) return 0;
        const x = f0[i], y = f0[i + 1]; if (!(x === x) || !(y === y)) return 0;
        const m = 69 + 12 * ((x + (y - x) * (f - i)) - L440) / L2 - pitch;
        return Math.abs(m) > 12 ? 0 : m;
      }) : null;
      notes.push(mkNote(t0, t1, pitch, n.getAttribute('Lyric') || '', [pf]));
    }
    if (!notes.length) continue;
    notes.sort((a, b) => a.t0 - b.t0);
    const base = cast[unit.getAttribute('CastId')] || 'CeVIO track'; seen[base] = (seen[base] || 0) + 1;
    tracks.push({ name: seen[base] > 1 ? base + ' ' + seen[base] : base, notes, tm });
  }
  return { fmt: 'CCS', title: '', tm: firstTm || makeTempoMap([{ tick: 0, bpm: 120 }], res), tracks };
}

// VoiSona files are a binary property tree. Instead of decoding all of it we scan for the key names we need.
function parseTSSLN(bytes) {
  let s = ''; for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  if (s.slice(0, 10) !== 'TSSolution') throw new Error('Not a VoiSona project');
  const re = /(?<![A-Za-z])(?:(Song|Note|Dynamics|Key|Time|Beat|Sound)\0|(Clock|Duration|PitchStep|PitchOctave|Lyric|Tempo|Name)\0\x01)/g;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), res = 960, songs = []; let pend = '', cur = null, note = null, mode = '', lastClock = 0, m;
  while ((m = re.exec(s))) {
    if (m[1]) {
      if (m[1] === 'Song') { cur = { name: pend, tempos: [], notes: [], pos: m.index, f0: null }; songs.push(cur); mode = ''; note = null; }
      else if (m[1] === 'Note') { if (!cur) continue; note = { c: 0, d: 0, st: 0, o: 4, l: '' }; cur.notes.push(note); mode = 'note'; }
      else if (m[1] === 'Sound') mode = 'tempo';
      else mode = 'other';
      continue;
    }
    const key = m[2], p = m.index + m[0].length, size = bytes[p], ty = bytes[p + 1];
    // values are [size][type][payload]: type 1 = int32, 4 = float64, 5 = null-terminated string
    if (ty === 1 && size === 5) {
      const v = dv.getInt32(p + 2, true);
      if (key === 'Clock') { if (mode === 'note' && note) note.c = v; else lastClock = v; }
      else if (mode === 'note' && note) { if (key === 'Duration') note.d = v; else if (key === 'PitchStep') note.st = v; else if (key === 'PitchOctave') note.o = v; }
    } else if (ty === 4 && size === 9) {
      if (key === 'Tempo' && cur) cur.tempos.push({ tick: lastClock, bpm: dv.getFloat64(p + 2, true) });
    } else if (ty === 5) {
      let e = p + 2; while (e < bytes.length && bytes[e] !== 0) e++;
      const str = decodeText(bytes.subarray(p + 2, e));
      if (key === 'Lyric' && mode === 'note' && note) note.l = str; else if (key === 'Name') pend = str;
    }
  }
  // pitch: LogF0CTick is ln(Hz) per control tick (10 clock ticks). Data entries have an optional Index and Repeat
  { const rx = /LogF0CTick\0/g; let mm;
    while ((mm = rx.exec(s))) {
      const li = s.indexOf('Length\0', mm.index); if (li < 0 || li - mm.index > 30) continue;
      const len = dv.getInt32(li + 10, true); if (!(len > 0 && len < 5e6)) continue;
      let sg = null; for (const q of songs) if (q.pos <= mm.index) sg = q; if (!sg) continue;
      const arr = new Float32Array(len).fill(NaN), tk = /(Data|Index|Value|Repeat)\0/g; tk.lastIndex = li + 14;
      let idx = 0, last = li + 14, cu = null, e;
      const flush = () => { if (cu && cu.v !== null) { for (let k = 0; k < cu.r; k++) if (idx + k < len) arr[idx + k] = cu.v; idx += cu.r; } };
      while ((e = tk.exec(s)) && e.index - last <= 12) {
        const q = e.index + e[0].length;
        if (e[1] === 'Data') { flush(); cu = { v: null, r: 1 }; last = q; continue; }
        if (!cu) break;
        if (e[1] === 'Value') { cu.v = dv.getFloat64(q + 3, true); last = q + 11; }
        else { const v = dv.getInt32(q + 3, true); if (e[1] === 'Index') idx = v; else cu.r = Math.max(1, v); last = q + 7; }
        tk.lastIndex = last;
      }
      flush();
      let prev = -1;
      for (let i = 0; i < len; i++) { if (!(arr[i] === arr[i])) continue; if (prev >= 0 && i - prev > 1 && i - prev <= 30) for (let k = prev + 1; k < i; k++) arr[k] = arr[prev] + (arr[i] - arr[prev]) * (k - prev) / (i - prev); prev = i; }
      const sm = Float32Array.from(arr);   // median filter to get rid of single frame jumps
      for (let i = 3; i < len - 3; i++) { if (!(arr[i] === arr[i])) continue; const w = []; for (let k = -3; k <= 3; k++) if (arr[i + k] === arr[i + k]) w.push(arr[i + k]); if (w.length >= 5) { w.sort((x, y) => x - y); sm[i] = w[w.length >> 1]; } }
      sg.f0 = sm;
    }
  }
  const tracks = []; let firstTm = null;
  songs.forEach((sg, i) => {
    const tm = makeTempoMap(sg.tempos.length ? sg.tempos : [{ tick: 0, bpm: 120 }], res); if (!firstTm) firstTm = tm;
    const f0 = sg.f0, L440 = Math.log(440), L2 = Math.log(2);
    const notes = sg.notes.filter(n => n.d > 0).map(n => {
      const pitch = (n.o + 1) * 12 + n.st;
      const pf = f0 ? (t => {
        const f = tm.s2t(t) / 10, i0 = Math.floor(f); if (i0 < 0 || i0 + 1 >= f0.length) return 0;
        const x = f0[i0], y = f0[i0 + 1]; if (!(x === x) || !(y === y)) return 0;
        const m = 69 + 12 * ((x + (y - x) * (f - i0)) - L440) / L2 - pitch;
        return Math.abs(m) > 8 ? 0 : m;
      }) : null;
      return mkNote(tm.t2s(n.c), tm.t2s(n.c + n.d), pitch, cleanLyric(n.l.replace(/\[[^\]]*\]/g, '')), [pf]);
    });
    if (notes.length) { notes.sort((a, b) => a.t0 - b.t0); tracks.push({ name: sg.name || ('Track ' + (i + 1)), notes, tm }); }
  });
  return { fmt: 'TSSLN', title: '', tm: firstTm || makeTempoMap([{ tick: 0, bpm: 120 }], res), tracks };
}

// VOCALOID 1/2 .vsq: a standard MIDI file whose vocal tracks carry an INI document, cut into "DM:0000:" text events
function readSMF(buf) {
  const u = new Uint8Array(buf), dv = new DataView(buf);
  if (u.length < 14 || String.fromCharCode(u[0], u[1], u[2], u[3]) !== 'MThd') throw new Error('Not a MIDI based file');
  const div = dv.getUint16(12); if (div & 0x8000) throw new Error('SMPTE time division is not supported');
  let p = 8 + dv.getUint32(4); const tracks = [], tempos = []; let sig = null;
  while (p + 8 <= u.length) {
    const id = String.fromCharCode(u[p], u[p + 1], u[p + 2], u[p + 3]), len = dv.getUint32(p + 4);
    let q = p + 8; const end = Math.min(u.length, q + len); p = end;
    if (id !== 'MTrk') continue;
    const tr = { name: '', texts: [] }; let tick = 0, run = 0;
    const vlq = () => { let v = 0, b; do { b = u[q++]; v = (v * 128) + (b & 127); } while ((b & 128) && q < end); return v; };
    while (q < end) {
      tick += vlq(); let st = u[q];
      if (st < 0x80) st = run; else { q++; if (st < 0xF0) run = st; }
      if (st === 0xFF) {
        const type = u[q++], l = vlq(), d = u.subarray(q, q + l); q += l;
        if (type === 0x51 && l === 3) tempos.push({ tick, bpm: 60000000 / ((d[0] << 16) | (d[1] << 8) | d[2]) });
        else if (type === 0x58 && l >= 2 && !sig) sig = { nu: d[0] || 4, de: Math.pow(2, d[1]) || 4 };
        else if (type === 0x03) tr.name = decodeText(d);
        else if (type === 0x01) tr.texts.push(d);
        else if (type === 0x2F) break;
      } else if (st === 0xF0 || st === 0xF7) q += vlq();
      else q += (st & 0xF0) === 0xC0 || (st & 0xF0) === 0xD0 ? 1 : 2;
    }
    tracks.push(tr);
  }
  return { div, tracks, tempos, sig: sig || { nu: 4, de: 4 } };
}

// splits the INI text into { section: { key: value } } (keys keep their order for the list sections)
function parseIni(text) {
  const out = {}; let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue;
    const m = /^\[(.+)\]$/.exec(line);
    if (m) { cur = out[m[1]] = []; continue; }
    const i = line.indexOf('='); if (cur && i > 0) cur.push([line.slice(0, i), line.slice(i + 1)]);
  }
  return out;
}
const iniGet = (sec, k) => { if (!sec) return undefined; for (const [a, b] of sec) if (a === k) return b; };
function firstCsv(v) {
  const m = /^\s*"((?:[^"]|"")*)"/.exec(v || ''); if (m) return m[1].replace(/""/g, '"');
  return (v || '').split(',')[0].trim();
}

function parseVSQ(buf) {
  const smf = readSMF(buf), res = smf.div, tracks = [];
  const bar = Math.round(res * 4 * smf.sig.nu / smf.sig.de);
  let pre = 0, tm = null; const parsed = [];
  smf.tracks.forEach((tr, i) => {
    // the text events of one track, in order, with the "DM:0000:" tag taken off
    const parts = [];
    for (const d of tr.texts) {
      if (d.length >= 8 && d[0] === 0x44 && d[1] === 0x4D && d[2] === 0x3A && d[7] === 0x3A) parts.push(d.subarray(8));
    }
    if (!parts.length) return;
    const all = new Uint8Array(parts.reduce((n, a) => n + a.length, 0)); let o = 0; for (const a of parts) { all.set(a, o); o += a.length; }
    const ini = parseIni(decodeText(all));
    if (!ini.Common && !ini.EventList) return;
    parsed.push({ i, ini, name: iniGet(ini.Common, 'Name') || tr.name });
    if (!pre) pre = Math.max(0, parseInt(iniGet(ini.Master, 'PreMeasure'), 10) || 0) * bar;
  });
  if (!parsed.length) throw new Error('No VOCALOID data found in this file');
  tm = makeTempoMap(shiftTempos(smf.tempos.length ? smf.tempos : [{ tick: 0, bpm: 120 }], pre), res);
  for (const tr of parsed) {
    const ini = tr.ini, notes = [], bends = [], sens = [];
    for (const [k, v] of ini.PitchBendBPList || []) bends.push([(parseInt(k, 10) || 0) - pre, parseFloat(v) || 0]);
    for (const [k, v] of ini.PitchBendSensBPList || []) sens.push([(parseInt(k, 10) || 0) - pre, parseFloat(v) || 0]);
    const bf = bendFn(tm, 0, bends, sens);
    for (const [k, v] of ini.EventList || []) {
      const at = parseInt(k, 10), id = /^ID#\d+$/.test(v.trim()) ? v.trim() : null; if (!id || !isFinite(at)) continue;
      const ev = ini[id]; if (!ev || iniGet(ev, 'Type') !== 'Anote') continue;
      const len = parseInt(iniGet(ev, 'Length'), 10), num = parseInt(iniGet(ev, 'Note#'), 10); if (!(len > 0) || !isFinite(num)) continue;
      const a = at - pre, lh = iniGet(ev, 'LyricHandle'), lyric = lh && ini[lh] ? firstCsv(iniGet(ini[lh], 'L0')) : '';
      const t0 = tm.t2s(a), t1 = tm.t2s(a + len);
      let vf = null; const vh = iniGet(ev, 'VibratoHandle');
      if (vh && ini[vh]) {
        // Vibrato depth and rate run 0..127. The exact curve is not documented, so this is an estimate of the normal vibrato.
        const vs = ini[vh], vl = parseInt(iniGet(vs, 'Length'), 10) || len, delay = parseInt(iniGet(ev, 'VibratoDelay'), 10) || 0;
        const depth = parseFloat(iniGet(vs, 'StartDepth')), rate = parseFloat(iniGet(vs, 'StartRate'));
        const span = Math.max(0, Math.min(vl, len - delay));
        if (span > 0 && depth > 0) vf = vibFn(t0, t1, { length: span / len * 100, period: 1000 / (3 + (isFinite(rate) ? rate : 50) / 127 * 6), depth: depth / 127 * 100, in: 10, out: 10 });
      }
      notes.push(mkNote(t0, t1, num, cleanLyric(lyric), [bf, vf]));
    }
    if (notes.length) { notes.sort((x, y) => x.t0 - y.t0); tracks.push({ name: tr.name || ('Track ' + tr.i), notes }); }
  }
  return { fmt: 'VSQ', title: '', tm, tracks };
}

const KIND = { ustx: 'an OpenUtau project', ust: 'a UST file', mid: 'a MIDI file', midi: 'a MIDI file', vsq: 'a VOCALOID 2 project', vsqx: 'a VOCALOID 4 project', vpr: 'a VOCALOID 6 project', svp: 'a Synthesizer V project', ccs: 'a CeVIO project', tssln: 'a VoiSona project' };
async function parseProjectFile(file, bendRange) {
  const ext = file.name.split('.').pop().toLowerCase(), buf = await file.arrayBuffer();
  if (!KIND[ext]) throw new Error('Unsupported file type .' + ext);
  if (!buf.byteLength) throw new Error('The file is empty');
  let r;
  try {
    if (ext === 'ustx') r = parseUSTX(decodeText(new Uint8Array(buf)));
    else if (ext === 'ust') r = parseUST(new Uint8Array(buf));
    else if (ext === 'mid' || ext === 'midi') r = parseMIDI(buf, bendRange);
    else if (ext === 'vsq') r = parseVSQ(buf);
    else if (ext === 'vsqx') r = parseVSQX(decodeText(new Uint8Array(buf)));
    else if (ext === 'vpr') r = await parseVPR(buf);
    else if (ext === 'svp') r = parseSVP(new Uint8Array(buf));
    else if (ext === 'ccs') r = parseCCS(decodeText(new Uint8Array(buf)));
    else r = parseTSSLN(new Uint8Array(buf));
  } catch (e) {
    // our own messages are already readable, parser internals are not
    if (e && /^(No |Not |Invalid |Unsupported)/.test(e.message)) throw e;
    throw new Error('This does not look like ' + KIND[ext] + ', or it is damaged');
  }
  r.tracks = r.tracks.filter(t => t.notes.length);
  if (!r.tracks.length) throw new Error('No notes found');
  return r;
}
