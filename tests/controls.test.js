const test = require('node:test');
const assert = require('node:assert');
const { loadCore } = require('./helpers/load-core');

const core = loadCore();
const { TRACKS, buildTrack, makeCar, simTick, recover, canRecover, encodeSettings, decodeSettings, SETTINGS_DEFAULT, RECOVER_WAIT, HALF } = core;
const plain = o => JSON.parse(JSON.stringify(o));   // objects from the game's sandbox -> this realm

test('URL code: readable round trip for every option', () => {
  for (const track of ['AUS', 'MON', 'IMO']) for (const laps of [1, 3, 5, 10]) for (const diff of ['ROOKIE', 'NORMAL', 'PRO'])
    for (const cam of ['FIXED', 'CHASE']) for (let steer = 1; steer <= 5; steer++) for (const brake of [1, 5]) for (const zoom of [1, 7]) {
      const o = { track, laps, diff, cam, steer, brake, zoom };
      assert.deepStrictEqual(plain(decodeSettings('#' + encodeSettings(o), TRACKS)), o);
    }
  assert.strictEqual(encodeSettings(SETTINGS_DEFAULT), 'AUS-L3-N-F-S3-B3-Z7');
});

test('URL code: case-insensitive, invalid parts fall back to defaults', () => {
  assert.deepStrictEqual(plain(decodeSettings('#mon-l10-p-c-s1-b5-z2', TRACKS)),
    { track: 'MON', laps: 10, diff: 'PRO', cam: 'CHASE', steer: 1, brake: 5, zoom: 2 });
  // codes saved by v2.1-2.2 (E = easy, H = hard) still work
  assert.strictEqual(decodeSettings('AUS-E', TRACKS).diff, 'ROOKIE');
  assert.strictEqual(decodeSettings('AUS-H', TRACKS).diff, 'PRO');
  assert.strictEqual(encodeSettings(decodeSettings('AUS-R', TRACKS)), 'AUS-L3-R-F-S3-B3-Z7');
  assert.deepStrictEqual(plain(decodeSettings('#XYZ-L4-S9-B0-Z8-Q', TRACKS)), plain(SETTINGS_DEFAULT));
  assert.deepStrictEqual(plain(decodeSettings('', TRACKS)), plain(SETTINGS_DEFAULT));
});

function player(id = 'MON') {
  const T = buildTrack(TRACKS.find(t => t.id === id));
  const c = makeCar(T, 3, true, 1, 1);
  return { T, c, race: { T, cars: [c], laps: 3, t: 0 } };
}
const run = (r, input, s) => { for (let i = 0; i < s * 120; i++) simTick(r, input, 1 / 120); };
const GAS = { thr: 1, brk: 0, steer: 0 }, BRAKE = { thr: 0, brk: 1, steer: 0 };

test('recover: only when off track or facing backwards', () => {
  const { T, c } = player();
  assert.strictEqual(canRecover(c, T), false, 'on the grid, facing forward');
  c.a += Math.PI; assert.strictEqual(canRecover(c, T), true, 'facing backwards');
  c.a -= Math.PI; c.off = true; assert.strictEqual(canRecover(c, T), true, 'off track');
});

test('recover: back on the centre line, frozen for 3 s, ghost to other cars', () => {
  const { T, c, race } = player();
  run(race, GAS, 1);
  const i = c.idx;
  c.x += T.NX[i] * (HALF + 30); c.y += T.NY[i] * (HALF + 30); c.off = true;
  assert.ok(recover(c, T));
  assert.strictEqual(c.wait, RECOVER_WAIT);
  assert.ok(Math.hypot(c.x - T.X[c.idx], c.y - T.Y[c.idx]) < 1e-6, 'on the centre line');
  assert.ok(Math.abs(c.a - Math.atan2(T.TY[c.idx], T.TX[c.idx])) < 1e-9, 'facing the race direction');
  // another car parked on top of it does not push it while it waits
  const o = makeCar(T, 0, false, 1, 2); o.x = c.x; o.y = c.y; o.idx = c.idx; race.cars.push(o); o.wait = 0; o.auto = true;
  const x0 = c.x, y0 = c.y;
  run(race, GAS, RECOVER_WAIT - 0.1);
  assert.ok(Math.hypot(c.x - x0, c.y - y0) < 1e-6, 'still frozen and untouched');
  assert.strictEqual(recover(c, T), false, 'cannot recover again while waiting');
  run(race, GAS, 1);
  assert.ok(c.f > 50, 'moves again after the wait');
});

test('brake levels: stronger brakes stop sooner', () => {
  const dist = [];
  for (let lv = 1; lv <= 5; lv++) {
    const { c, race } = player('ITA'); c.brakeLv = lv;
    run(race, GAS, 4); const x0 = c.x, y0 = c.y;
    let s = 0; while (c.f > 1 && s < 2000) { simTick(race, BRAKE, 1 / 120); s++; }
    dist.push(Math.hypot(c.x - x0, c.y - y0));
  }
  for (let k = 1; k < 5; k++) assert.ok(dist[k] < dist[k - 1], `level ${k + 1} stops shorter than level ${k}: ${dist.map(d => d.toFixed(0))}`);
});

test('steering levels: higher levels turn faster', () => {
  const turned = [];
  for (let lv = 1; lv <= 5; lv++) {
    const { c, race } = player('ITA'); c.steerLv = lv;
    run(race, GAS, 1.5); const a0 = c.a;
    run(race, { thr: 1, brk: 0, steer: 1 }, 0.4);
    turned.push(c.a - a0);
  }
  for (let k = 1; k < 5; k++) assert.ok(turned[k] > turned[k - 1], `level ${k + 1} turns more than level ${k}`);
});

test('AI cars are not affected by the player settings', () => {
  const T = buildTrack(TRACKS[0]);
  const ai = makeCar(T, 0, false, 1, 2);
  assert.strictEqual(ai.steerLv, undefined); assert.strictEqual(ai.brakeLv, undefined);
});
