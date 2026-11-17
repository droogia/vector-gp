// A loopback network for the multiplayer tests: a host and guests exchange messages through links
// with latency, jitter and packet loss (unreliable channel only), on a virtual clock.
const { loadCore } = require('./load-core');

function lcg(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

function makeRoom(core, { guests = 2, latency = 0.04, jitter = 0.01, loss = 0, seed = 7, code = 'TEST42' } = {}) {
  const rnd = lcg(seed), clock = { t: 0 }, now = () => clock.t * 1000;
  const queue = [], lastAt = new Map();
  const wire = (key, deliver, lossy) => (chan, text) => {
    if (typeof text !== 'string') throw new Error('messages must be strings');
    if (chan === 'g' && lossy && rnd() < loss) return;
    const k = key + chan, at = Math.max(lastAt.get(k) || 0, clock.t + latency + rnd() * jitter);   // ordered, like the real channels
    lastAt.set(k, at); queue.push({ at, fn: () => deliver(chan, text) });
  };
  const host = new core.HostSession(code, now), gs = [], notes = [];
  host.onNote = n => notes.push(n);
  for (let i = 0; i < guests; i++) {
    const g = new core.GuestSession(now);
    const toGuest = wire('h>' + i, (chan, text) => g.receive(chan, text), true);
    const r = host.join(toGuest);
    if (r.why) throw new Error(r.why);
    g.send = wire('g' + i + '>h', (chan, text) => host.receive(r.pid, chan, text), true);
    g.pidAssigned = r.pid; gs.push(g);
  }
  const deliver = () => {
    for (let i = 0; i < queue.length;) { if (queue[i].at <= clock.t) { const m = queue.splice(i, 1)[0]; m.fn(); } else i++; }
  };
  return { host, guests: gs, clock, deliver, notes, now };
}

// Everyone drives with the AI's steering and throttle; hosts and guests run the same loop as the game.
function runRace(core, room, cfg, { seconds = 400, onStep = null } = {}) {
  deliverAll(room, 0.5);                                   // welcome / hello / players
  const { race } = room.host.startRace(cfg);
  deliverAll(room, 0.5);                                   // start message
  const H = core.SIM_H, T = race.T, hostCar = race.player;
  const corr = [];
  let step = 0, done = null;
  while (room.clock.t < seconds + 1) {
    room.clock.t += H; room.deliver(); step++;
    room.host.preStep();
    core.simTick(race, core.aiControl(hostCar, T, race.cars), H);
    room.host.postStep();
    for (const g of room.guests) if (g.race && g.driving) g.stepLocal(core.aiControl(g.pred.s, T, [g.pred.s]));
    if (step % 2 === 0) for (const g of room.guests) if (g.race) {
      g.frame(2 * H);
      if (g.pred && g.driving) corr.push(g.pred.corr);
    }
    if (onStep) onStep(step, race);
    if (done === null && race.cars.every(c => c.fin) && room.guests.every(g => !g.race || g.race.player.fin)) done = room.clock.t;
    if (done !== null && room.clock.t > done + 1) break;       // the host keeps streaming for a second after the last finish
  }
  return { race, corr, step };
}
function deliverAll(room, secs) { const end = room.clock.t + secs; while (room.clock.t < end) { room.clock.t += 0.005; room.deliver(); } }

module.exports = { makeRoom, runRace, deliverAll, lcg };
