const test = require('node:test');
const assert = require('node:assert');
const { loadCore, race } = require('./helpers/load-core');

const core = loadCore();

for (const t of core.TRACKS) {
  test(`${t.id}: a single AI car laps cleanly`, () => {
    const r = race(core, t, { cars: 1, laps: 2 });
    assert.ok(r.finished, 'finishes');
    assert.strictEqual(r.wallHits, 0, 'never touches a barrier');
    assert.ok(r.offShare < 0.10, `off track ${(r.offShare * 100).toFixed(1)}% of the time`);
    assert.ok(r.best > 15 && r.best < 90, `lap time ${r.best.toFixed(1)} s is plausible`);
  });
  test(`${t.id}: a full field of 8 finishes`, () => {
    const r = race(core, t, { cars: 8, laps: 2 });
    assert.ok(r.finished, 'every car finishes');
    const order = core.standings(r.cars);
    for (let i = 1; i < order.length; i++) assert.ok(core.raceTime(order[i]) >= core.raceTime(order[i - 1]), 'classification follows finish times');
  });
}
