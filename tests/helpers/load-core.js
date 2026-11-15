// Loads the game logic (circuits, physics, AI) straight from vector-gp.html, without the UI.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadCore() {
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'vector-gp.html'), 'utf8');
  const script = html.split('<script>')[1].split('</script>')[0];
  const core = script.split('// ===== UI')[0];   // tracks, core, music data
  return vm.runInNewContext(core + '\n({ TRACKS, SCORES, makeField, liveDelta, ghostAt, lapTime, raceTime, LIMIT_PENALTY, DRAFT_GAIN, TRACK_MUSIC, parseScore, trackMusic, buildTrack, makeCar, simTick, standings, recover, canRecover, encodeSettings, decodeSettings, SETTINGS_DEFAULT, RECOVER_WAIT, REVERSE_DELAY, HALF, WALL, K_SCALE, STEP });');
}

// Runs a race with all cars AI-driven; returns stats.
function race(core, track, { cars = 4, laps = 2, maxTime = 400, limits = false } = {}) {
  const T = core.buildTrack(track);
  const list = cars === 1 ? [core.makeCar(T, 0, false, 1, 1)] : core.makeField(T, cars, 'PRO', 'BACK', () => 0.5);
  for (const c of list) { if (c.isP) { c.auto = true; c.skill = 0.97; } }
  const r = { T, cars: list, laps, t: 0, limits };
  let steps = 0, off = 0, wallHits = 0;
  while (r.t < maxTime && !list.every(c => c.fin)) {
    core.simTick(r, null, 1 / 120); steps++;
    for (const c of list) { if (c.off) off++; if (c.hit > 0.29) wallHits++; }
  }
  return { T, cars: list, finished: list.every(c => c.fin), offShare: off / steps / cars, wallHits, best: Math.min(...list.map(c => c.best)) };
}

module.exports = { loadCore, race };
