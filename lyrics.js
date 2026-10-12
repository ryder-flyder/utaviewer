// Lyric lines for the lyric box: built from the project's notes, or from text the user typed.
// Every line is { t0, t1, tokens: [{ text, t }] }. Tokens light up (karaoke) once T passes token.t.
(function (root) {
  const CJK = /[぀-ヿ㐀-鿿ｦ-ﾟ]/;
  const STAMP = /^\s*\[(\d+):(\d+(?:\.\d+)?)\]/;

  // Group a track's notes into phrases, splitting on silences. "+" and "-" notes only hold the previous syllable.
  function phrases(track, shift, gap) {
    gap = gap || 0.7;
    const notes = track.notes.filter(n => !n.rest).map(n => ({ t0: n.t0 + shift, t1: n.t1 + shift, lyric: (n.lyric || '').trim() }));
    notes.sort((a, b) => a.t0 - b.t0);
    const out = []; let cur = null, last = -1e9;
    for (const n of notes) {
      if (!cur || n.t0 - last > gap || cur.count >= 10) { cur = { t0: n.t0, t1: n.t1, syl: [], count: 0 }; out.push(cur); }
      cur.count++; cur.t1 = Math.max(cur.t1, n.t1); last = Math.max(last, n.t1);
      if (!n.lyric) continue;
      if (/^[+\-ー~]$/.test(n.lyric)) { const s = cur.syl[cur.syl.length - 1]; if (s) s.t1 = n.t1; continue; }
      cur.syl.push({ text: n.lyric, t0: n.t0, t1: n.t1 });
    }
    return out.filter(p => p.syl.length);
  }

  function lyricCount(track) { let c = 0; for (const n of track.notes) if (!n.rest && n.lyric && n.lyric.trim()) c++; return c; }

  function split(line) {
    line = line.trim();
    return CJK.test(line) ? Array.from(line.replace(/\s+/g, '')) : line.split(/\s+/).filter(Boolean);
  }
  const joiner = tokens => (tokens.some(t => CJK.test(t)) ? '' : ' ');

  function parseLRC(text) {
    const rows = [];
    for (const raw of text.split(/\r?\n/)) {
      const m = raw.match(STAMP); if (!m) continue;
      const t = parseInt(m[1], 10) * 60 + parseFloat(m[2]);
      const body = raw.replace(/\[\d+:\d+(?:\.\d+)?\]/g, '').trim();
      rows.push({ t, body });
    }
    rows.sort((a, b) => a.t - b.t);
    return rows;
  }

  // mode: 'notes' | 'text' | 'even'. ph = phrases of the chosen track.
  function buildLines(mode, ph, text, duration) {
    const lines = [];
    if (mode === 'notes') {
      for (const p of ph) lines.push({ t0: p.t0, t1: p.t1, tokens: p.syl.map(s => ({ text: s.text, t: s.t0 })), join: joiner(p.syl.map(s => s.text)) });
      return lines;
    }
    const lrc = parseLRC(text || '');
    if (lrc.length) {
      lrc.forEach((r, i) => {
        if (!r.body) return;
        const t1 = i + 1 < lrc.length ? lrc[i + 1].t : Math.min(duration, r.t + 6), tk = split(r.body);
        lines.push({ t0: r.t, t1, tokens: tk.map((x, k) => ({ text: x, t: r.t + (t1 - r.t) * 0.9 * k / tk.length })), join: joiner(tk) });
      });
      return lines;
    }
    const rows = (text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    rows.forEach((row, i) => {
      const tk = split(row); let t0, t1, times;
      if (mode === 'text') {
        const p = ph[i]; if (!p) return;
        t0 = p.t0; t1 = p.t1; const N = p.syl.length;
        times = tk.map((_, k) => p.syl[Math.min(N - 1, Math.floor(k * N / tk.length))].t0);
      } else {
        t0 = i * duration / rows.length; t1 = (i + 1) * duration / rows.length;
        times = tk.map((_, k) => t0 + (t1 - t0) * 0.9 * k / tk.length);
      }
      lines.push({ t0, t1, tokens: tk.map((x, k) => ({ text: x, t: times[k] })), join: joiner(tk) });
    });
    return lines;
  }

  // Which line to show at time T: the latest one that has started (with a short lead-in), until a hold after it ends.
  function current(lines, T, lead, hold) {
    lead = lead == null ? 0.35 : lead; hold = hold == null ? 0.9 : hold;
    let i = -1;
    for (let k = 0; k < lines.length; k++) { if (lines[k].t0 - lead <= T) i = k; else break; }
    if (i < 0) return null;
    const L = lines[i], next = lines[i + 1] || null;
    if (T > L.t1 + hold) return null;
    let a = 1;
    if (T < L.t0) a = Math.max(0, 1 - (L.t0 - T) / lead);
    else if (T > L.t1) a = Math.max(0, 1 - (T - L.t1) / hold);
    if (next && next.t0 - lead <= T + 0.0) return { line: next, next: lines[i + 2] || null, alpha: 1, idx: i + 1 };
    return { line: L, next, alpha: a, idx: i };
  }

  root.UVLyrics = { phrases, lyricCount, buildLines, current, parseLRC };
  if (typeof module !== 'undefined') module.exports = root.UVLyrics;
})(typeof window !== 'undefined' ? window : globalThis);
