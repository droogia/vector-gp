const test = require('node:test');
const assert = require('node:assert');
const { loadCore } = require('./helpers/load-core');

const { TRACKS, SCORES, parseScore, trackMusic } = loadCore();

test('every circuit has music', () => {
  for (const t of TRACKS) assert.ok(trackMusic(t), `${t.id} has music`);
});

for (const [id, sc] of Object.entries(SCORES)) {
  test(`score ${id} parses into a playable phrase`, () => {
    parseScore(sc);
    assert.ok(sc.ev.length >= 10, 'has a melody');
    assert.ok(sc.bass.length >= 3, 'has a bass line');
    const secs = sc.len * 60 / sc.bpm;
    assert.ok(secs > 5 && secs < 40, `opening phrase lasts ${secs.toFixed(1)} s`);
    for (const e of sc.ev) assert.ok(e.m >= 48 && e.m <= 90, `melody note ${e.m} in a comfortable range`);
    assert.ok(['ANTHEM', 'MUSIC'].includes(sc.kind) && sc.title.length > 3);
  });
}
