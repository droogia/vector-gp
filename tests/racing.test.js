const test = require('node:test');
const assert = require('node:assert');
const { loadCore } = require('./helpers/load-core');

const core = loadCore();
const { TRACKS, buildTrack, makeField, makeCar, simTick, liveDelta, ghostAt, raceTime, LIMIT_PENALTY, DRAFT_GAIN } = core;
const track = id => buildTrack(TRACKS.find(t => t.id === id));
const run = (r, input, s) => { for (let i = 0; i < Math.round(s * 120); i++) simTick(r, input, 1 / 120); };

test('field: size, player grid slot, AI skills fastest at the front', () => {
  const T = track('AUS');
  for (const n of [2, 4, 6, 8]) {
    const back = makeField(T, n, 'NORMAL', 'BACK');
    assert.strictEqual(back.length, n);
    assert.strictEqual(back.filter(c => c.isP).length, 1);
    assert.ok(back[n - 1].isP, 'BACK: player last');
    assert.ok(makeField(T, n, 'NORMAL', 'POLE')[0].isP, 'POLE: player first');
    const ai = back.filter(c => !c.isP);
    for (let k = 1; k < ai.length; k++) assert.ok(ai[k].skill <= ai[k - 1].skill, 'skills decrease down the grid');
    assert.deepStrictEqual(Array.from(back, c => c.num).sort((a, b) => a - b), Array.from({ length: n }, (_, k) => k + 1), 'numbers 1..n');
  }
  const rnd = makeField(T, 8, 'NORMAL', 'RANDOM', () => 0.4);
  assert.ok(rnd[3].isP, 'RANDOM uses the random source');
});

test('slipstream: a car close behind reaches a higher top speed', () => {
  const T = track('ITA');
  const top = behind => {
    const lead = makeCar(T, 0, false, 1, 1), me = makeCar(T, 1, true, 1, 2);
    const r = { T, cars: behind ? [me, lead] : [me], laps: 99, t: 0 };
    // both on the main straight, flat out, the leader 70 units ahead on the same line
    for (const c of r.cars) { c.idx = 20; c.x = T.X[20]; c.y = T.Y[20]; c.a = Math.atan2(T.TY[20], T.TX[20]); c.vx = Math.cos(c.a) * 300; c.vy = Math.sin(c.a) * 300; }
    lead.x += Math.cos(lead.a) * 70; lead.y += Math.sin(lead.a) * 70;
    lead.auto = false;
    let vmax = 0;
    for (let i = 0; i < 120 * 3; i++) { simTick(r, { thr: 1, brk: 0, steer: 0 }, 1 / 120); vmax = Math.max(vmax, me.f); }
    return { vmax, draft: me.draft };
  };
  const alone = top(false), towed = top(true);
  assert.ok(towed.draft > 0.3, `draft ${towed.draft.toFixed(2)}`);
  assert.ok(towed.vmax > alone.vmax + 2, `towed ${towed.vmax.toFixed(1)} vs alone ${alone.vmax.toFixed(1)}`);
  assert.ok(DRAFT_GAIN > 0 && DRAFT_GAIN < 0.1);
});

test('track limits: +1 s per offence, only when enabled', () => {
  for (const limits of [true, false]) {
    const T = track('MON');
    const c = makeCar(T, 0, true, 1, 1), r = { T, cars: [c], laps: 3, t: 0, limits };
    run(r, { thr: 1, brk: 0, steer: 0 }, 1.5);
    // drive straight off the track twice, coming back in between
    for (let k = 0; k < 2; k++) {
      const i = c.idx; c.x = T.X[i] + T.NX[i] * (core.HALF + 15); c.y = T.Y[i] + T.NY[i] * (core.HALF + 15);
      c.vx = Math.cos(c.a) * 100; c.vy = Math.sin(c.a) * 100;
      for (let s = 0; s < 60; s++) { c.x = T.X[c.idx] + T.NX[c.idx] * (core.HALF + 15); c.y = T.Y[c.idx] + T.NY[c.idx] * (core.HALF + 15); simTick(r, { thr: 1, brk: 0, steer: 0 }, 1 / 120); }
      core.recover(c, T); c.wait = 0; run(r, { thr: 0, brk: 0, steer: 0 }, 0.2);
    }
    assert.strictEqual(c.pen, limits ? 2 * LIMIT_PENALTY : 0, `limits ${limits}: penalty ${c.pen}`);
  }
});

test('sectors add up to the lap time; penalties count in lap and race time', () => {
  const T = track('HUN');
  const cars = makeField(T, 2, 'PRO', 'POLE');
  const P = cars[0]; P.auto = true; P.skill = 0.97;
  const r = { T, cars, laps: 3, t: 0, limits: true };
  while (!cars.every(c => c.fin) && r.t < 300) simTick(r, null, 1 / 120);
  assert.ok(P.fin);
  assert.strictEqual(P.laps.length, 3);
  for (const l of P.laps) {
    assert.strictEqual(l.sec.length, 3);
    assert.ok(Math.abs(l.sec[0] + l.sec[1] + l.sec[2] - l.time) < 1e-6, 'S1+S2+S3 = lap');
  }
  assert.ok(Math.abs(raceTime(P) - (P.finT + P.pen)) < 1e-9);
});

test('ghost and live delta: recorded best lap is replayed and compared', () => {
  const T = track('AUT');
  const cars = makeField(T, 2, 'PRO', 'POLE');
  const P = cars[0]; P.auto = true; P.skill = 0.97;
  const r = { T, cars, laps: 4, t: 0 };
  const deltas = [];
  while (!P.fin && r.t < 300) { simTick(r, null, 1 / 120); const d = liveDelta(P, r); if (d !== null) deltas.push(d); }
  assert.ok(P.ref, 'best lap recorded');
  assert.strictEqual(P.ref.time, Math.min(...P.laps.map(l => l.time)));
  assert.ok(deltas.length > 100 && deltas.every(Number.isFinite), 'delta shown once a reference exists');
  assert.ok(Math.max(...deltas.map(Math.abs)) < 5, 'delta stays plausible for laps of similar pace');
  const g0 = ghostAt(P.ref, 0), g1 = ghostAt(P.ref, P.ref.time / 2), gEnd = ghostAt(P.ref, P.ref.time + 10);
  assert.ok(g0 && g1 && gEnd, 'ghost positions available');
  assert.ok(Math.hypot(g1.x - g0.x, g1.y - g0.y) > 100, 'ghost moves along the lap');
});
