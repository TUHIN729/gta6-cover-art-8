// Leonida Nights — wires the editor: photos per panel (upload, drag to position,
// wheel to zoom), caption and date-line editing, three neon grades, three post
// sizes, one-click PNG export. A `?shot=` query sets up a fixed scene for a
// screenshot instead (./shots.js).
import { drawCover, panelAt, SIZES, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const dateInput = document.getElementById('dateLine');

export const state = {
  size: '1080x1350',
  grade: 'neon',
  title: 'LEONIDA NIGHTS',
  subtitle: 'Neon noir • Vice City',
  dateLine: 'Leonida — 2026',
  panels: [
    { photo: null, sample: 'skyline', zoom: 1.1, ox: 0, oy: 0 },
    { photo: null, sample: 'boulevard', zoom: 1.1, ox: 0, oy: 0 },
    { photo: null, sample: 'skyline', zoom: 1.25, ox: 0, oy: -0.1 },
  ],
  selected: 0,
};

function redraw() {
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSample(name) {
  return loadImage(`samples/${name}.png`);
}

async function loadDefaults() {
  for (let i = 0; i < state.panels.length; i++) {
    const panel = state.panels[i];
    if (!panel.photo && panel.sample) {
      try { panel.photo = await loadSample(panel.sample); } catch { /* sample missing: panel stays graded */ }
    }
  }
  redraw();
}

// ---- Controls: size, grade, text -------------------------------------------
function bindChoice(groupId, attr, apply) {
  document.querySelectorAll(`#${groupId} button`).forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(`#${groupId} button`).forEach((b) => b.classList.remove('on'));
      btn.classList.add('on');
      apply(btn.dataset[attr]);
      redraw();
    });
  });
}

bindChoice('sizes', 'size', (v) => { state.size = v; });
bindChoice('grades', 'grade', (v) => { state.grade = v; });

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
dateInput.addEventListener('input', () => { state.dateLine = dateInput.value; redraw(); });

// ---- Panels: select, upload, zoom, position --------------------------------
const panelTabs = document.querySelectorAll('#panels button');
const zoomInput = document.getElementById('zoom');
const xInput = document.getElementById('posx');
const yInput = document.getElementById('posy');

function refreshPanelControls() {
  panelTabs.forEach((b, i) => b.classList.toggle('on', i === state.selected));
  const p = state.panels[state.selected];
  zoomInput.value = p.zoom;
  xInput.value = p.ox;
  yInput.value = p.oy;
  document.getElementById('panelName').textContent =
    ['Hero panel', 'Top side panel', 'Bottom side panel'][state.selected];
}

panelTabs.forEach((btn, i) => {
  btn.addEventListener('click', () => { state.selected = i; refreshPanelControls(); });
});

document.getElementById('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const panel = state.panels[state.selected];
  panel.photo = await loadImage(URL.createObjectURL(file));
  panel.sample = null;
  redraw();
  status.textContent = `Photo loaded into ${['hero', 'top', 'bottom'][state.selected]} panel.`;
});

document.getElementById('fillAll').addEventListener('click', () => {
  const src = state.panels[state.selected];
  if (!src.photo) { status.textContent = 'Load a photo into this panel first.'; return; }
  for (const p of state.panels) { p.photo = src.photo; p.sample = null; }
  redraw();
  status.textContent = 'One photo now fills all three panels — drag each to reframe it.';
});

document.getElementById('sampleBtn').addEventListener('click', async () => {
  const panel = state.panels[state.selected];
  panel.sample = state.selected === 1 ? 'boulevard' : 'skyline';
  panel.photo = await loadSample(panel.sample);
  redraw();
});

zoomInput.addEventListener('input', () => {
  state.panels[state.selected].zoom = Number(zoomInput.value);
  redraw();
});
xInput.addEventListener('input', () => {
  state.panels[state.selected].ox = Number(xInput.value);
  redraw();
});
yInput.addEventListener('input', () => {
  state.panels[state.selected].oy = Number(yInput.value);
  redraw();
});

// Drag the photo inside its panel; wheel zooms it. Clicking a panel selects it.
let dragging = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  const { w, h } = SIZES[state.size];
  return { x: ((e.clientX - r.left) / r.width) * w, y: ((e.clientY - r.top) / r.height) * h, w, h };
}
canvas.addEventListener('pointerdown', (e) => {
  const { x, y, w, h } = canvasPoint(e);
  const hit = panelAt(x, y, w, h);
  if (hit >= 0) {
    state.selected = hit;
    refreshPanelControls();
    dragging = { x, y, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
    canvas.setPointerCapture(e.pointerId);
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const { x, y, w, h } = canvasPoint(e);
  const p = state.panels[state.selected];
  p.ox = Math.max(-1, Math.min(1, dragging.ox + ((x - dragging.x) / w) * 2));
  p.oy = Math.max(-1, Math.min(1, dragging.oy + ((y - dragging.y) / h) * 2));
  xInput.value = p.ox; yInput.value = p.oy;
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[state.selected];
  p.zoom = Math.max(0.6, Math.min(3, p.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  zoomInput.value = p.zoom;
  redraw();
}, { passive: false });

// ---- Export -----------------------------------------------------------------
function exportFileName() {
  const { w, h } = SIZES[state.size];
  return `leonida-nights-${w}x${h}.png`;
}

/** Renders the cover at its full export size and resolves the PNG blob. */
export function exportCover() {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    drawCover(off, state);
    off.toBlob(resolve, 'image/png');
  });
}

document.getElementById('export').addEventListener('click', async () => {
  status.textContent = 'Rendering your cover…';
  const blob = await exportCover();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = exportFileName();
  a.click();
  status.textContent = `Saved ${exportFileName()} — share it.`;
});

// Test hook for the headless selftest: renders every size and reports the PNGs.
window.__leonida = {
  state,
  redraw,
  async exportDataURL(size) {
    const keep = state.size;
    state.size = size;
    const blob = await exportCover();
    state.size = keep;
    redraw();
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
  },
};

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, { state, loadImage, redraw, loadDefaults, titleInput, subtitleInput, dateInput });
} else {
  loadDefaults();
}
