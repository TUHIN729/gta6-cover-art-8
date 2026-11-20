// Fixed scenes for screenshots: ?shot=editor shows the editor with photos
// loaded; ?shot=cover shows the cover the app exported, drawn by the app's own
// cover engine at the export size. `size`, `grade`, `title`, `subtitle` and
// `date` come from the query. window.__shotReady is set once painted.
import { SIZES, GRADES } from './cover.js';

async function waitForFonts() {
  try {
    await Promise.all([
      document.fonts.load('900 100px "Leonida Black"'),
      document.fonts.load('italic 700 40px "Leonida Script"'),
    ]);
    await document.fonts.ready;
  } catch { /* system fallbacks still draw */ }
}

export async function runShot(shot, query, api) {
  const { state, loadImage, redraw, titleInput, subtitleInput, dateInput } = api;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (query.get('size') && SIZES[query.get('size')]) state.size = query.get('size');
  if (query.get('grade') && GRADES[query.get('grade')]) state.grade = query.get('grade');
  if (query.get('title')) { state.title = query.get('title'); titleInput.value = state.title; }
  if (query.get('subtitle')) { state.subtitle = query.get('subtitle'); subtitleInput.value = state.subtitle; }
  if (query.get('date')) { state.dateLine = query.get('date'); dateInput.value = state.dateLine; }
  const samples = (query.get('photos') ?? 'skyline,boulevard,skyline').split(',');
  for (let i = 0; i < 3; i++) {
    const name = samples[i] ?? 'skyline';
    try { state.panels[i].photo = await loadImage(`samples/${name}.png`); } catch { /* keep graded panel */ }
    state.panels[i].sample = null;
  }
  // Per-panel framing for the shot, so each panel shows a different crop.
  state.panels[0].zoom = 1.15; state.panels[0].ox = 0.05; state.panels[0].oy = -0.05;
  state.panels[1].zoom = 1.35; state.panels[1].ox = -0.15; state.panels[1].oy = 0.1;
  state.panels[2].zoom = 1.3; state.panels[2].ox = 0.12; state.panels[2].oy = -0.08;
  document.querySelectorAll('#sizes button').forEach((b) => b.classList.toggle('on', b.dataset.size === state.size));
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
  await waitForFonts();
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
