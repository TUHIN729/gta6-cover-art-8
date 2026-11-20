// Leonida Nights — the cover engine. Draws a diagonal split-panel poster:
// a large hero panel, two stacked side panels, a neon divider, a skyline-and-palm
// band, and a bold condensed title block. Everything is drawn on canvas; the
// only pictures it ever shows are the photos the user loads (or the app's own
// canvas-drawn samples). No Rockstar logo, artwork or font anywhere.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide 1920 x 1080' },
};

export const GRADES = {
  neon: {
    name: 'Neon Dusk',
    top: '#ff2e88', mid: '#7b1e6e', bottom: '#0e2a3a',
    line: '#22d3ee', line2: '#ff2e88', title: '#ffffff',
    subtitle: '#ff5da2', date: '#8fe8ff', band: '#12061f', band2: '#1e0a33',
  },
  sunset: {
    name: 'Sunset Gold',
    top: '#ff7a3c', mid: '#c22e5e', bottom: '#3a1030',
    line: '#ffd166', line2: '#ff5e3a', title: '#fff7e6',
    subtitle: '#ffd166', date: '#ffb347', band: '#1c0a14', band2: '#33122a',
  },
  midnight: {
    name: 'Midnight Teal',
    top: '#22d3ee', mid: '#155e75', bottom: '#06121f',
    line: '#7de3ff', line2: '#22d3ee', title: '#eafcff',
    subtitle: '#7de3ff', date: '#a5f3fc', band: '#04101c', band2: '#0a2436',
  },
};

// The three panels as fractions of the cover, sharing their diagonal edges
// exactly so no background shows through between them.
export function panelPolygons(w, h) {
  const heroEdge = (y) => 0.68 - 0.14 * (y / 0.7); // hero right edge, y in 0..0.7
  const splitY = 0.33;
  const splitX = heroEdge(splitY);
  return [
    // Hero: the big diagonal panel on the left.
    [[0, 0], [0.68, 0], [0.54, 0.7], [0, 0.7]],
    // Top side panel.
    [[0.68, 0], [1, 0], [1, 0.385], [splitX, splitY]],
    // Bottom side panel.
    [[splitX, splitY], [1, 0.385], [1, 0.7], [0.54, 0.7]],
  ].map((poly) => poly.map(([fx, fy]) => [fx * w, fy * h]));
}

function polyPath(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]; const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Which panel (0, 1 or 2) holds the point, or -1 for the title band. */
export function panelAt(x, y, w, h) {
  const polys = panelPolygons(w, h);
  for (let i = 0; i < polys.length; i++) if (pointInPoly(x, y, polys[i])) return i;
  return -1;
}

// A palm silhouette: a leaning trunk and seven drooping fronds.
function drawPalm(ctx, x, y, s, lean, color) {
  const topX = x + lean * s, topY = y - 1.12 * s;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round';
  const segs = 8;
  let px = x, py = y;
  for (let k = 1; k <= segs; k++) {
    const t = k / segs;
    const nx = x + lean * s * t * t, ny = y - 1.12 * s * t;
    ctx.lineWidth = Math.max(1.5, s * 0.05 * (1 - t * 0.6));
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke();
    px = nx; py = ny;
  }
  for (let f = 0; f < 7; f++) {
    const ang = Math.PI * (0.06 + (f / 6) * 0.88);
    const len = s * (0.55 + 0.22 * Math.sin(f * 2.3));
    const dir = lean >= 0 ? 1 : -1;
    const dx = Math.cos(ang) * dir, dy = Math.sin(ang);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    for (let k = 1; k <= 6; k++) {
      const t = k / 6;
      ctx.lineTo(topX + dx * len * t, topY + dy * len * 0.14 * t + len * 0.5 * t * t);
    }
    for (let k = 6; k >= 0; k--) {
      const t = k / 6;
      ctx.lineTo(topX + dx * len * t * 0.94, topY + dy * len * 0.14 * t + len * 0.5 * t * t + s * 0.05);
    }
    ctx.closePath(); ctx.fill();
  }
}

// A city skyline silhouette with a few lit windows, drawn along a baseline.
function drawSkyline(ctx, x0, yBase, w, h, color, lit, seed) {
  let s = seed;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  let x = x0;
  ctx.fillStyle = color;
  while (x < x0 + w) {
    const bw = w * (0.05 + rnd() * 0.07), bh = h * (0.35 + rnd() * 0.65);
    ctx.fillRect(x, yBase - bh, bw, bh);
    if (lit) {
      ctx.fillStyle = '#ffd27a';
      for (let wy = yBase - bh + h * 0.08; wy < yBase - h * 0.05; wy += h * 0.14)
        for (let wx = x + bw * 0.18; wx < x + bw * 0.8; wx += bw * 0.24)
          if (rnd() < 0.4) ctx.fillRect(wx, wy, Math.max(2, bw * 0.08), Math.max(2, h * 0.05));
      ctx.fillStyle = color;
    }
    x += bw + w * 0.012;
  }
}

// Grain: a small random-noise tile, stamped over the cover at low alpha.
let grainTile = null;
function grain(ctx, w, h) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 140; grainTile.height = 140;
    const g = grainTile.getContext('2d');
    const img = g.createImageData(140, 140);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + Math.floor(Math.random() * 90);
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grainTile, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function fitTitleFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `900 ${size}px ${family}`;
  while (size > 20 && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = `900 ${size}px ${family}`;
  }
  return size;
}

/**
 * Draws the whole cover for `state` onto `canvas` (any size; the layout is
 * proportional). state: { size, grade, title, subtitle, dateLine, panels }.
 * A panel: { photo: Image|null, zoom, ox, oy } — ox/oy in -1..1, the photo's
 * offset inside its panel.
 */
export function drawCover(canvas, state) {
  const { w, h } = SIZES[state.size] ?? SIZES['1080x1350'];
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] ?? GRADES.neon;
  const titleFont = '"Leonida Black", "Arial Black", sans-serif';
  const scriptFont = '"Leonida Script", "Arial Narrow", sans-serif';

  ctx.fillStyle = grade.band;
  ctx.fillRect(0, 0, w, h);

  const polys = panelPolygons(w, h);
  for (let p = 0; p < 3; p++) {
    const panel = state.panels[p];
    const poly = polys[p];
    ctx.save();
    polyPath(ctx, poly);
    ctx.clip();
    if (panel.photo) {
      const iw = panel.photo.naturalWidth, ih = panel.photo.naturalHeight;
      const base = Math.max(w / iw, h / ih) * 1.05;
      const scale = base * (panel.zoom || 1);
      const pw = iw * scale, ph = ih * scale;
      const slackX = Math.max(0, (pw - w) / 2), slackY = Math.max(0, (ph - h) / 2);
      const cx = w / 2 + (panel.ox || 0) * slackX;
      const cy = h * 0.35 + (panel.oy || 0) * slackY;
      ctx.drawImage(panel.photo, cx - pw / 2, cy - ph / 2, pw, ph);
    } else {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, grade.mid); g.addColorStop(1, grade.bottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    // The neon grade: a diagonal wash plus a dark foot for the lettering.
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, grade.top + '59');
    wash.addColorStop(0.55, grade.mid + '26');
    wash.addColorStop(1, grade.bottom + '66');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const foot = ctx.createLinearGradient(0, h * 0.45, 0, h * 0.72);
    foot.addColorStop(0, 'rgba(5, 2, 12, 0)');
    foot.addColorStop(1, 'rgba(5, 2, 12, 0.45)');
    ctx.fillStyle = foot;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Neon divider lines along every shared diagonal edge.
  ctx.save();
  ctx.lineJoin = 'round';
  const edges = [
    { a: [0.68, 0], b: [0.54, 0.7], color: grade.line },
    { a: [0.614, 0.33], b: [1, 0.385], color: grade.line2 },
    { a: [0, 0.7], b: [1, 0.7], color: grade.line },
  ];
  for (const { a, b, color } of edges) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, w * 0.005);
    ctx.shadowColor = color;
    ctx.shadowBlur = w * 0.012;
    ctx.beginPath();
    ctx.moveTo(a[0] * w, a[1] * h);
    ctx.lineTo(b[0] * w, b[1] * h);
    ctx.stroke();
  }
  ctx.restore();

  // Title band: skyline and palms rising out of its top edge.
  const bandY = h * 0.7;
  const bandGrad = ctx.createLinearGradient(0, bandY, 0, h);
  bandGrad.addColorStop(0, grade.band2);
  bandGrad.addColorStop(1, grade.band);
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandY, w, h - bandY);
  drawSkyline(ctx, w * 0.06, bandY + 2, w * 0.5, h * 0.075, '#0a0512', true, 41);
  drawPalm(ctx, w * 0.045, bandY + 2, h * 0.11, 0.12, '#08040f');
  drawPalm(ctx, w * 0.955, bandY + 2, h * 0.11, -0.12, '#08040f');
  drawSkyline(ctx, w * 0.62, bandY + 2, w * 0.32, h * 0.05, '#0a0512', false, 97);

  // Title: bold condensed caps, magenta outline, cyan drop shadow, slight tilt.
  const title = (state.title || 'LEONIDA NIGHTS').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  const date = (state.dateLine || '').trim().toUpperCase();
  ctx.save();
  ctx.translate(w / 2, bandY + (h - bandY) * 0.44);
  ctx.rotate(-0.026);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const titleSize = fitTitleFont(ctx, title, w * 0.92, h * 0.085, titleFont);
  ctx.shadowColor = grade.line;
  ctx.shadowBlur = titleSize * 0.12;
  ctx.shadowOffsetX = titleSize * 0.035;
  ctx.shadowOffsetY = titleSize * 0.035;
  ctx.lineWidth = Math.max(2, titleSize * 0.055);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = grade.line2;
  ctx.strokeText(title, 0, 0);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = grade.title;
  ctx.fillText(title, 0, 0);
  if (sub) {
    ctx.font = `italic 700 ${Math.round(titleSize * 0.34)}px ${scriptFont}`;
    try { ctx.letterSpacing = `${Math.round(titleSize * 0.06)}px`; } catch { /* older canvas */ }
    ctx.fillStyle = grade.subtitle;
    ctx.shadowColor = grade.subtitle;
    ctx.shadowBlur = titleSize * 0.18;
    ctx.fillText(sub.toUpperCase(), 0, titleSize * 0.62);
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
  ctx.restore();

  // Date line, small caps along the foot.
  if (date) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `700 ${Math.round(h * 0.016)}px ${scriptFont}`;
    try { ctx.letterSpacing = `${Math.round(h * 0.004)}px`; } catch { /* older canvas */ }
    ctx.fillStyle = grade.date;
    ctx.fillText(date, w / 2, h - h * 0.022);
    ctx.restore();
  }

  grain(ctx, w, h);
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}
