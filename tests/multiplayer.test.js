const test = require('node:test');
const assert = require('node:assert');
const { loadCore } = require('./helpers/load-core');
const { makeRoom, runRace, deliverAll, lcg } = require('./helpers/netsim');

const core = loadCore();
const CFG = { track: 'MON', laps: 3, diff: 'PRO', cars: 6, grid: 'BACK', limits: 0 };

test('room codes: six unambiguous characters, typed any way', () => {
  const rnd = lcg(3);
  for (let i = 0; i < 200; i++) {
    const c = core.newCode(rnd);
    assert.match(c, /^[A-HJKMNP-Z2-9]{6}$/);
    assert.strictEqual(core.normCode(core.showCode(c).toLowerCase()), c);
    assert.strictEqual(core.normCode(' ' + c.slice(0, 2) + ' - ' + c.slice(2) + ' '), c);
  }
  for (const bad of ['', 'ABC', 'ABCDEFG', 'ABC-DE0', 'ABCDEI', null, undefined, 'ABC!DE']) assert.strictEqual(core.normCode(bad), null, String(bad));
});

test('the same room code and race number always give the same grid', () => {
  const plan = n => core.planField(8, [0, 1, 2], 'PRO', 'RANDOM', core.mulberry32(core.hashSeed('K7QF2M:' + n)));
  assert.deepStrictEqual(plan(1), plan(1));
  assert.notDeepStrictEqual(plan(1), plan(2));
});

test('grid planning: humans at the back, the front or anywhere; AI skills fastest first', () => {
  const rnd = core.mulberry32(5);
  for (const [grid, n, pids] of [['BACK', 8, [0, 1, 2]], ['POLE', 6, [0, 3]], ['RANDOM', 8, [0, 1, 2, 3, 4]], ['RANDOM', 4, [0, 1, 2, 3]], ['BACK', 2, [0, 1]]]) {
    const { slots, skills } = core.planField(n, pids, 'NORMAL', grid, rnd);
    assert.strictEqual(slots.length, n);
    assert.deepStrictEqual(Array.from(slots.filter(s => s >= 0)).sort(), pids.slice().sort(), 'every human has exactly one slot');
    assert.strictEqual(skills.length, n - pids.length);
    for (let i = 1; i < skills.length; i++) assert.ok(skills[i] <= skills[i - 1], 'skills fall toward the back');
    const hs = slots.map((s, i) => s >= 0 ? i : -1).filter(i => i >= 0);
    if (grid === 'BACK') assert.deepStrictEqual(Array.from(hs), Array.from({ length: pids.length }, (_, k) => n - pids.length + k));
    if (grid === 'POLE') assert.deepStrictEqual(Array.from(hs), Array.from({ length: pids.length }, (_, k) => k));
  }
});

test('buildField: players are named, AI cars are numbered after them', () => {
  const T = core.buildTrack(core.TRACKS.find(t => t.id === 'MON'));
  const cars = core.buildField(T, { slots: [-1, 3, -1, 0], skills: [0.99, 0.9] });
  assert.deepStrictEqual(Array.from(cars, c => c.name || null), [null, 'P4', null, 'P1']);
  assert.deepStrictEqual(Array.from(cars.filter(c => !c.human), c => c.num), [5, 6], 'no clash with P1..P4');
  assert.ok(cars.filter(c => c.human).every(c => !c.auto && c.pid >= 0));
});

test('what a guest accepts from the network is checked', () => {
  assert.ok(core.cleanCfg(CFG));
  for (const bad of [null, 5, {}, { ...CFG, track: 'XXX' }, { ...CFG, laps: 2 }, { ...CFG, cars: 5 }, { ...CFG, diff: 'constructor' }, { ...CFG, grid: 'X' }]) assert.strictEqual(core.cleanCfg(bad), null);
  const plan = { slots: [-1, 1, 0], skills: [0.9] };
  assert.ok(core.cleanPlan(plan, 1));
  for (const bad of [null, { slots: [1, 1], skills: [] }, { slots: [-1, 0], skills: [] }, { slots: [0, 9], skills: [] }, { slots: [0, 1], skills: [0.9] }, { slots: [0, 1, -1], skills: [3] }, { slots: new Array(9).fill(-1), skills: [] }]) assert.strictEqual(core.cleanPlan(bad, 1), null);
});

test('inputs pack into one number and back; a lost message is made up by the next', () => {
  for (const thr of [0, 1]) for (const brk of [0, 1]) for (const steer of [-1, 0, 1]) assert.deepStrictEqual({ ...core.unpackIn(core.packIn({ thr, brk, steer })) }, { thr, brk, steer });
  const car = { inq: [], nextSeq: 1 };
  core.pushInputs(car, 3, [1, 1, 1]);                       // seq 1..3
  core.pushInputs(car, 7, [5, 5, 5, 5]);                    // seq 4..7
  core.pushInputs(car, 9, [5, 5, 5, 5]);                    // 6..9: 6 and 7 are known, 8 and 9 are new
  core.pushInputs(car, 2, [1, 1]);                          // old: ignored
  assert.deepStrictEqual(car.inq.map(e => e.seq), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  core.pushInputs(car, 20, [99, -1, 1.5, 'x']);             // garbage is ignored
  assert.strictEqual(car.inq.length, 9);
});

test('a host with no input yet holds the last one, and skips ahead when it falls behind', () => {
  const c = { remote: true, inq: [], inp: { thr: 1, brk: 0, steer: 0 }, ack: 0 };
  core.feedInputs({ cars: [c] });
  assert.strictEqual(c.inp.thr, 1); assert.strictEqual(c.ack, 0);
  for (let s = 1; s <= 20; s++) c.inq.push({ seq: s, inp: { thr: 0, brk: 1, steer: 0 } });
  core.feedInputs({ cars: [c] });
  assert.ok(c.ack >= 19, 'jumped to the newest inputs, ack ' + c.ack);
});

for (const [name, net] of [['a clean link', { latency: 0.02, jitter: 0, loss: 0 }], ['80 ms and jitter', { latency: 0.04, jitter: 0.02, loss: 0 }], ['100 ms, jitter and 10% loss', { latency: 0.05, jitter: 0.03, loss: 0.1 }]]) {
  test(`a race with 3 players and 3 AI over ${name}: everyone sees the same result`, () => {
    const room = makeRoom(core, { guests: 2, ...net });
    const { race, corr } = runRace(core, room, CFG, { seconds: 300 });
    deliverAll(room, 1.5);                                  // last messages arrive
    assert.ok(race.cars.every(c => c.fin), 'the host sees everyone finish');
    const order = r => core.standings(r.cars).map(c => c.name || c.num + '').join(',');
    const times = r => core.standings(r.cars).map(c => core.raceTime(c).toFixed(3)).join(',');
    for (const g of room.guests) {
      assert.strictEqual(order(g.race), order(race), 'same finishing order');
      assert.strictEqual(times(g.race), times(race), 'same times');
      assert.ok(g.race.player.fin);
    }
    const mean = corr.reduce((a, b) => a + b, 0) / corr.length, p95 = corr.slice().sort((a, b) => a - b)[Math.floor(corr.length * 0.95)];
    assert.ok(mean < 3, `prediction stays close to the host: mean correction ${mean.toFixed(2)} units`);
    assert.ok(p95 < 12, `p95 correction ${p95.toFixed(1)} units`);
  });
}

test('other cars are drawn a short, steady time behind the host', () => {
  const room = makeRoom(core, { guests: 1, latency: 0.03, jitter: 0.005 });
  const hist = [];                                          // host car 0 position over time
  const errs = [];
  const g = room.guests[0];
  runRace(core, room, CFG, {
    seconds: 40,
    onStep(step, race) {
      const t = room.clock.t, c = race.player;
      hist.push([t, c.x, c.y]);
      if (step % 2 || !g.race || !g.snaps.length || t < 15) return;
      const target = t - 0.1 - 0.03 - 0.005;                // INTERP + one-way latency (+ half the jitter)
      const i = hist.findIndex(h => h[0] >= target);
      if (i <= 0) return;
      const a = hist[i - 1], b = hist[i], u = (target - a[0]) / (b[0] - a[0]);
      const hx = a[1] + (b[1] - a[1]) * u, hy = a[2] + (b[2] - a[2]) * u;
      const view = g.race.cars.find(x => x.pid === 0);
      errs.push(Math.hypot(view.x - hx, view.y - hy));
    }
  });
  const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
  assert.ok(errs.length > 100);
  assert.ok(mean < 6, `mean distance from where the host car was ${mean.toFixed(2)} units`);
});

test('a player who disconnects mid-race is replaced by an AI that finishes', () => {
  const room = makeRoom(core, { guests: 2, latency: 0.03, jitter: 0.01 });
  let dropped = false;
  const { race } = runRace(core, room, CFG, {
    seconds: 300,
    onStep(step, r) { if (!dropped && r.t > 10) { dropped = true; room.host.drop(2); room.guests[1].race = null; } }
  });
  const car = race.cars.find(c => c.pid === 2);
  assert.ok(car.auto && !car.human && !car.remote, 'now an AI car');
  assert.ok(car.fin, 'and it finished');
  assert.ok(room.notes.includes('P3 LEFT'));
  assert.deepStrictEqual(Array.from(room.host.list(), p => p.pid), [0, 1]);
});

test('a guest that goes back to the menu hands its car to the AI but stays in the room', () => {
  const room = makeRoom(core, { guests: 1 });
  deliverAll(room, 0.5);
  const { race } = room.host.startRace(CFG);
  deliverAll(room, 0.5);
  const g = room.guests[0];
  assert.ok(g.race);
  g.leaveRace(); deliverAll(room, 0.5);
  assert.ok(race.cars.find(c => c.pid === 1).auto);
  assert.strictEqual(room.host.peers.size, 1);
  room.host.endRace(); deliverAll(room, 0.5);
  assert.ok(room.host.accepting);
  const second = room.host.startRace(CFG);                  // next race: the guest is a driver again
  deliverAll(room, 0.5);
  assert.ok(g.race && second.race.cars.find(c => c.pid === 1).human);
});

test('the room refuses a ninth player and anyone arriving during a race', () => {
  const room = makeRoom(core, { guests: 7 });
  assert.strictEqual(room.host.peers.size, 7);
  assert.match(room.host.join(() => {}).why, /FULL/);
  const small = makeRoom(core, { guests: 1 });
  small.host.startRace(CFG);
  assert.match(small.host.join(() => {}).why, /RACE IN PROGRESS/);
  small.host.endRace();
  assert.ok(small.host.join(() => {}).pid);
});

test('eight players on one grid race to the end', () => {
  const room = makeRoom(core, { guests: 7, latency: 0.03, jitter: 0.01 });
  const { race } = runRace(core, room, { ...CFG, cars: 8, laps: 1 }, { seconds: 300 });
  deliverAll(room, 1.5);
  assert.strictEqual(race.cars.length, 8);
  assert.ok(race.cars.every(c => c.human && c.fin));
  for (const g of room.guests) assert.deepStrictEqual(Array.from(core.standings(g.race.cars), c => c.name), Array.from(core.standings(race.cars), c => c.name));
});

test('junk from the network is ignored', () => {
  const room = makeRoom(core, { guests: 1 });
  deliverAll(room, 0.5);
  room.host.startRace(CFG); deliverAll(room, 0.5);
  const g = room.guests[0], before = JSON.stringify(room.host.race.cars.map(c => [c.x, c.y, c.nextSeq]));
  const junk = ['', 'x', '{', 'null', '[]', '42', '{"t":"i"}', '{"t":"i","s":"a","a":5}', '{"t":"i","s":1.5,"a":[1]}', '{"t":"nope"}', '{"t":"pong","ts":"x"}', 'x'.repeat(5000)];
  for (const j of junk) { room.host.receive(1, 'g', j); room.host.receive(1, 'c', j); room.host.receive(99, 'c', j); }
  assert.strictEqual(JSON.stringify(room.host.race.cars.map(c => [c.x, c.y, c.nextSeq])), before);
  const junkG = ['', '{', 'null', '{"t":"S"}', '{"t":"S","rt":1,"c":[]}', '{"t":"S","rt":1,"c":[[1],[2],[3],[4],[5],[6]]}', '{"t":"m","m":[[99,{}],[0,5]]}', '{"t":"start","cfg":{},"plan":{}}', '{"t":"welcome","v":99}', '{"t":"players","list":[null,{"pid":"x"}]}'];
  for (const j of junkG) g.receive('c', j);
  assert.ok(g.race, 'the guest is still in its race');
  assert.ok(g.race.cars.every(c => Number.isFinite(c.x) && Number.isFinite(c.y)));
});
