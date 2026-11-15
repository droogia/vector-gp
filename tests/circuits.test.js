const test = require('node:test');
const assert = require('node:assert');
const { loadCore } = require('./helpers/load-core');

const core = loadCore();
const { TRACKS, buildTrack, HALF, K_SCALE } = core;

test('calendar and past championships are all present', () => {
  assert.strictEqual(TRACKS.length, 40);
  const ids = TRACKS.map(t => t.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'ids are unique');
  const cur = TRACKS.filter(t => t.g === '2026');
  assert.strictEqual(cur.length, 24);
  assert.deepStrictEqual(Array.from(cur, t => t.r), Array.from(cur, (_, i) => i + 1), 'rounds numbered 1..24 in order');
  assert.deepStrictEqual(Array.from(TRACKS.filter(t => t.canc), t => t.id).sort(), ['BHR', 'SAU']);
  assert.ok(ids.includes('IMO'), 'Imola is included');
});

for (const t of TRACKS) {
  test(`${t.id} geometry is drivable`, () => {
    const T = buildTrack(t);
    for (const a of [T.X, T.Y, T.WR, T.V]) assert.ok(a.every(Number.isFinite), 'no NaN');
    const want = t.km * K_SCALE;
    assert.ok(Math.abs(T.len - want) / want < 0.01, `length ${T.len.toFixed(0)} vs ${want.toFixed(0)}`);
    // the inner track edge must not fold over itself in corners
    let minR = Infinity;
    for (let i = 0; i < T.N; i++) minR = Math.min(minR, 1 / Math.max(Math.abs(T.K[i]), 1e-9));
    assert.ok(minR > HALF, `tightest radius ${minR.toFixed(1)} must exceed half width ${HALF}`);
    assert.ok(T.WR.every(w => w >= HALF + 8), 'barriers stay off the track');
  });
}
