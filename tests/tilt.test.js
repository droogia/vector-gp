const test = require('node:test');
const assert = require('node:assert');
const { loadCore } = require('./helpers/load-core');

const core = loadCore();
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const mul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
const Rz = a => [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]];
const Rx = a => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
// World: x east, y north, z up. A phone held upright in portrait, screen facing a user who looks north:
// device x = east, device y = up, device z (out of the screen) = south. Columns of R are the device axes.
const UPRIGHT = [[1, 0, 0], [0, 0, -1], [0, 1, 0]];

// What the browser reports (beta, gamma) for a phone that is turned `screenAngle` degrees counter-clockwise
// (90 = landscape with the top of the phone on the left), then rolled `wheel` degrees clockwise as the user
// sees it (a steering wheel), and leaned back by `lean` degrees.
function pose(screenAngle, wheel, lean = 0) {
  const R = mul(Rx(rad(lean)), mul(UPRIGHT, Rz(rad(screenAngle - wheel))));
  return { beta: deg(Math.asin(R[2][1])), gamma: deg(Math.atan2(-R[2][0], R[2][2])) };
}

for (const [name, scr] of [['portrait', 0], ['landscape (top of the phone on the left)', 90], ['landscape (top on the right)', 270], ['upside-down portrait', 180]]) {
  test(`tilt angle in ${name}: turning the phone like a wheel gives the wheel angle`, () => {
    for (const lean of [0, 25, -20]) for (const wheel of [-60, -30, -10, 0, 12, 35, 70]) {
      const { beta, gamma } = pose(scr, wheel, lean);
      const a = core.tiltAngle(beta, gamma, scr);
      assert.ok(a !== null, `lean ${lean}`);
      assert.ok(Math.abs(a - wheel) < 1e-6, `${name}, lean ${lean}: wheel ${wheel} read as ${a}`);
    }
  });
}

test('the same pose read with the wrong screen angle gives a different answer (the screen angle matters)', () => {
  const { beta, gamma } = pose(90, 30);
  assert.ok(Math.abs(core.tiltAngle(beta, gamma, 90) - 30) < 1e-6);
  assert.ok(Math.abs(core.tiltAngle(beta, gamma, 0) - 30) > 20);
});

test('a phone lying flat has no wheel angle', () => {
  assert.strictEqual(core.tiltAngle(2, 3, 0), null);
  assert.strictEqual(core.tiltAngle(0, 0, 90), null);
  assert.ok(core.tiltAngle(60, 0, 0) !== null, 'leaned back 30 degrees from upright is fine');
});

test('screen angles outside 0/90/180/270 (e.g. -90 from window.orientation) are understood', () => {
  const { beta, gamma } = pose(270, 20);
  assert.ok(Math.abs(core.tiltAngle(beta, gamma, -90) - 20) < 1e-6);
});

test('steering: dead zone, linear to full lock, symmetric, relative to the neutral position', () => {
  for (const level of [1, 2, 3, 4, 5]) {
    const r = core.TILT_RANGE[level - 1];
    assert.strictEqual(core.tiltSteer(0, 0, level), 0);
    assert.strictEqual(core.tiltSteer(core.TILT_DEAD, 0, level), 0, 'inside the dead zone');
    assert.strictEqual(core.tiltSteer(r, 0, level), 1);
    assert.strictEqual(core.tiltSteer(r + 40, 0, level), 1, 'clamped');
    assert.strictEqual(core.tiltSteer(-r, 0, level), -1);
    const mid = core.tiltSteer((r + core.TILT_DEAD) / 2, 0, level);
    assert.ok(Math.abs(mid - 0.5) < 1e-9, `level ${level} halfway ${mid}`);
    assert.ok(core.tiltSteer(-20, 0, level) <= 0 && core.tiltSteer(20, 0, level) >= 0);
  }
  assert.ok(core.TILT_RANGE.every((v, i, a) => !i || v < a[i - 1]), 'a higher level needs less turning');
  assert.strictEqual(core.tiltSteer(50, 50, 3), 0, 'neutral is wherever the phone was held at the start');
  assert.strictEqual(core.tiltSteer(50 + core.TILT_RANGE[2], 50, 3), 1);
});

test('steering: the neutral position works across the +-180 degree wrap', () => {
  assert.strictEqual(core.tiltSteer(-175, 175, 3), core.tiltSteer(10, 0, 3));
  assert.strictEqual(core.tiltSteer(175, -175, 3), core.tiltSteer(-10, 0, 3));
});

test('settings: tilt is on by default, and only the non-default values appear in the address', () => {
  const D = core.SETTINGS_DEFAULT;
  assert.strictEqual(D.tilt, 1); assert.strictEqual(D.tiltRange, 3);
  const plain = o => JSON.parse(JSON.stringify(o));
  assert.strictEqual(core.decodeSettings('AUS-GY0', core.TRACKS).tilt, 0);
  assert.strictEqual(core.decodeSettings('AUS-Y5', core.TRACKS).tiltRange, 5);
  assert.deepStrictEqual(plain(core.decodeSettings('AUS-Y9-GY1', core.TRACKS)), plain(D), 'invalid parts are ignored');
  const o = Object.assign({}, D, { tilt: 0, tiltRange: 2 });
  assert.match(core.encodeSettings(o), /-GY0-Y2$/);
  assert.deepStrictEqual(plain(core.decodeSettings(core.encodeSettings(o), core.TRACKS)), plain(o));
});

test('online: analog steering travels in quarter steps and arrives as sent', () => {
  for (const steer of [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]) {
    const back = core.unpackIn(core.packIn({ thr: 1, brk: 0, steer }));
    assert.strictEqual(back.steer, steer); assert.strictEqual(back.thr, 1);
  }
  assert.strictEqual(core.unpackIn(core.packIn({ thr: 0, brk: 1, steer: 0.3 })).steer, 0.25, 'rounded to the nearest quarter');
  assert.strictEqual(core.unpackIn(core.packIn({ thr: 0, brk: 0, steer: 9 })).steer, 1, 'clamped');
  for (let n = 0; n < 36; n++) { const s = core.unpackIn(n).steer; assert.ok(s >= -1 && s <= 1, String(n)); }
});
