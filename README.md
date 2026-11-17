# VECTOR GP

A single-file, no-dependency HTML racing game (green-on-black "acid" interface) in the
style of 80s monochrome vector arcade games. Four Formula 1-style cars race top-down on
real Grand Prix circuits: the full 2026 calendar plus circuits from past championships.
Races of 2 to 8 cars, a time trial alone against the clock and your ghost, or an online race
with friends.

Everything runs in the browser, on a computer or a phone: open `vector-gp.html` (or `index.html`, which forwards to
it) and play. Solo play uploads nothing anywhere; online play is described under
[Multiplayer](#multiplayer).

## Usage

Online: https://droogia.github.io/vector-gp/

1. Pick a circuit in the list (click or arrow keys). Enter or a double click opens the
   circuit box: a large map with a marker driving a lap, and the circuit's data (Grand Prix,
   location, 2026 round or F1 years, length, direction, race distance).
2. In the box, set laps (1, 3, 5, 10), AI level (Rookie, Normal, Pro), camera (Fixed,
   Chase), number of cars (2, 4, 6, 8), your grid position (Back, Random, Pole), track
   limits (Off, On) and mode (Race, Time trial). Left/Right move to the previous/next circuit; Esc goes back to the list.
   About a second after a circuit is highlighted, its music starts (see below).
3. **Start** or Enter starts the race. Wait for the five lights to go out. In time trial
   there are no lights and no other cars: the clock starts when you press the throttle, laps
   are unlimited, and Esc ends the run with a summary of every lap and sector.

In the menu (circuit list and circuit box) these keys change the race options without
moving the selection:

| Key | Action |
|---|---|
| 1 3 5 0 | Laps 1 / 3 / 5 / 10 |
| 2 4 6 8 | Number of cars |
| G | Grid position: Back / Random / Pole |
| L | Track limits on/off |
| Q | Race / Time trial |
| R N P | AI level Rookie / Normal / Pro |
| F / C | Camera Fixed / Chase |
| M | Multiplayer: host or join a game |
| O | Options |
| H | Help (keys; the race stats stay empty) |
| T | Circuit music on/off |
| V | All sound on/off |

In the race:

| Key | Action |
|---|---|
| ↑ / W | Throttle |
| ↓ / S | Brake; keep it held for 1 second after stopping to reverse |
| ← → / A D | Steer |
| Space | Back on track: when off the track or facing backwards, the car is put on the centre line, facing the race direction, and waits 3 seconds (other cars drive through it meanwhile) |
| + / - | Zoom in / out, 7 levels (7 = closest, the default) |
| M | Whole circuit view |
| F / C | Camera: Fixed (north up) / Chase (car points up) |
| H | Help box: keys, race status and leaderboard (pauses the race) |
| O | Options (pauses the race; also available in the menu) |
| P | Pause |
| V | Sound on/off |
| R | Restart the race |
| Esc | Pause, then back to the menu (the box of the circuit just raced); in time trial, end the run |

All driving controls are on the arrow keys, so the game can be played with one hand.
On a touch screen, on-screen buttons appear (steer, brake, throttle, back on track).

## Phones, tablets and installing

The game is a progressive web app (PWA) and has a touch interface.

- **Install**: in Chrome, Edge or Samsung Internet use the INSTALL button in the menu (or the
  browser's install / "Add to Home screen" option); on iPhone and iPad use Share, then
  "Add to Home Screen". It then opens full screen like an app, with its own icon.
- **Offline**: after one visit over `https` (or `localhost`) the game is cached and starts
  without a connection; solo races and time trial work offline. Online multiplayer still needs
  the network. The page is always fetched fresh when you are online, so updates arrive on the
  next load. (Opening the file straight from disk works too, but without installing or caching.)
- **Touch controls**: during a race, buttons for steer left / right, brake, gas and back on
  track (↺) appear on touch screens; they scale with the screen and keep clear of notches.
- **Tilt steering** (on by default on phones): turn the phone like a steering wheel to steer, in
  portrait or in landscape (either way up); gas and brake stay buttons. The posture you hold
  under the start lights is "straight ahead" (so just hold the phone how you like to drive),
  a small dead zone ignores tiny movements, and a dot at the top of the screen shows the wheel.
  While tilt is working the ◀ ▶ buttons disappear. On iPhone and iPad the browser asks for
  motion access on your first tap (refuse it, or turn off TILT STEERING in Options, and the
  buttons stay). TILT RANGE in Options sets how far you turn for full lock (40° to 16°); the pause
  box has RECENTER TILT. If the phone is lying flat the angle is undefined and steering holds.
  Tilt works in solo races, time trial and online.
  If it does not work, open Options during a race or in the menu: a status line says why (no
  permission yet, refused, page not on `https`, no sensor data, phone lying flat) and ENABLE
  MOTION ACCESS asks again. Motion sensors only work on `https` pages (or `localhost`), so a
  copy served over plain `http` on your network will not get them; on iPhone a refused prompt is
  only asked again after the browser is closed and reopened.
  The ☰ button at the top opens the pause box (online the race keeps running behind it) with
  tappable RESUME, HELP, OPTIONS, CAMERA, RESTART and MENU. Pinch on the playfield to zoom.
  The speedometer moves out of the way of the buttons, and the screen stays on during a race
  where the browser allows it.
- **Menus**: the menu, the circuit box and the boxes for pause, results, options and
  multiplayer have phone layouts (portrait and landscape); tapping a circuit opens its box.
  FULLSCREEN is offered where the browser supports it. Landscape gives the widest view.

### Trying it on a phone from your own computer (HTTPS)

Phones give motion sensors (tilt steering), install and offline mode only to secure pages, so
`python -m http.server` on your network is not enough. Use the included HTTPS server instead:

```
python tools/serve.py          # or: npm run serve
```

It prints the addresses to open, such as `https://192.168.1.20:8443/vector-gp.html`. The first run
makes a certificate in `.certs/` (ignored by git) that covers every address of your machine, and
makes a new one if those addresses change. Options: `--port`, `--ip ADDRESS` (add one to the
certificate), `--cert` and `--key` (your own).

- **Quickest**: the certificate is self-signed, so the phone warns once. On iPhone tap *Show
  Details*, then *visit this website*; on Android Chrome tap *Advanced*, then *Proceed*. Some
  features may still be refused on an untrusted certificate; if Options says the page is not
  secure, use the next option.
- **Trusted, works everywhere**: install [mkcert](https://github.com/FiloSottile/mkcert) and run
  `mkcert -install`; `tools/serve.py` then uses it automatically. Send the file
  `$(mkcert -CAROOT)/rootCA.pem` to the phone (AirDrop or email), install it (iPhone: Settings,
  *Profile Downloaded*), then turn it on under Settings, General, About, *Certificate Trust
  Settings*. Delete `.certs/` after installing mkcert so a trusted certificate is made.
- **No setup at all**: publish the page. GitHub Pages is `https`, so tilt, install and offline
  all work there.

## Multiplayer

Up to 8 people race on the same circuit. One player hosts; the others join with a short code.

1. **Host**: press **M** (or the MULTIPLAYER button), then HOST A GAME. You get a code such as
   `K7Q-F2M` and a link ending in `#JOIN-K7QF2M`. Send either to your friends.
2. **Join**: press **M**, then JOIN WITH A CODE, and type the code; or just open the link. The
   guest's menu then shows the host's circuit and race options (laps, AI level, cars, grid,
   track limits) and follows them when the host changes them. Guests still choose their own
   camera, steering, brakes and zoom.
3. **Start**: the host picks the circuit and options in the normal menu and presses START (or
   Enter). Everyone gets the five lights together. The race field is the host's CARS setting,
   or more if more people joined; places nobody takes are filled by AI cars. Players are
   labelled P1 (the host), P2, ...; your own car is YOU.
4. When the race is over everyone gets the results; the host presses R for another race with
   the same room, or Esc for the menu (which ends the race for those still racing).

Rules online: there is no pause (the race keeps running behind the Help and Options boxes), the
host's R restarts for everyone, a guest's Esc leaves the race and an AI takes the car, and the
room stays open between races. A player who drops out is replaced by an AI. No ghost or delta
online; time trial is solo only. The room code also seeds the host's random choices (grid
order, start-light delay), so the same code and race number always give the same grid.

**How it connects.** The host's browser runs the whole simulation, AI cars included, and sends
about 30 snapshots a second; guests send their steering, throttle and brake. Each guest
predicts its own car immediately and corrects it against every snapshot, so the controls feel
instant; the other cars are drawn about 0.1 s behind. Browsers connect to each other directly
over WebRTC data channels. To find each other they use the free public PeerJS broker
(`wss://0.peerjs.com`) as a meeting point, which only relays the connection handshake (the
room code and the technical connection details, including your IP address); it never sees the
race. Google's public STUN servers help get through home routers. This means:

- Online play needs those two public services to be up, and the page needs internet access.
- Players see each other's IP address, as in any peer-to-peer game.
- There is no relay (TURN) server, so some strict firewalls and mobile networks cannot connect.
- The host's tab must stay visible: browsers pause hidden tabs, and that stalls the race for
  everyone. The host's connection also sets the race's quality; a guest with a bad connection
  mostly just sees a rougher picture.
- The host's machine is trusted: there is no anti-cheat, and a host could bend its own rules.

### Race information

- **Sectors**: each lap is split into three equal-length sectors, marked by dashed ticks on
  the track and on the mini-map. The HUD shows the sector times of the current lap; ★ marks a
  best sector of the session on that circuit.
- **Delta**: once you have a best lap in the session, Δ shows live how far ahead (−) or
  behind (+) of it you are at the same point of the lap.
- **Ghost**: your best lap of the session on the circuit is replayed as a dashed car (can be
  turned off in Options). Best laps and sectors are kept only until the page is closed.
- **Slipstream**: close behind another car on a straight, lined up with it, you get less drag
  and up to 4% more top speed ("SLIPSTREAM" on screen). The AI cars get it too.
- **Track limits** (option, off by default): going off the track while moving for more than
  0.3 s adds 1 second to that lap and to the race time, for every car. The results show the
  penalties.
- **Effects and sound**: dotted skid marks when sliding or braking hard, sparks on barrier
  hits and contacts; an 8-gear engine sound whose pitch drops at each upshift.

### Options

| Setting | Levels | Effect |
|---|---|---|
| Steering | 1–5, default 3 | How quickly the steering reaches full lock and how sharply the car can turn |
| Brakes | 1–5, default 3 | Braking force, about ±15% per level |
| Zoom | 1–7, default 7 | Each level down shows about 40% more track |
| Ghost car | On / Off, default On | Show your best lap of the session as a dashed car |
| Tilt steering | On / Off, default On | Phones only: steer by turning the phone like a wheel |
| Tilt range | 1–5, default 3 | Phones only: wheel angle for full lock, 40° (1) to 16° (5) |

Steering and brakes apply to your car only; the AI cars are set by the AI level.

### Settings in the address

The game uses no browser storage. All settings live in the page address, in a readable
code that updates as you change them, for example:

```
https://droogia.github.io/vector-gp/#MON-L5-N-C-S2-B4-Z6-C6-GP-TL
```

| Part | Meaning |
|---|---|
| `MON` | Circuit id (see the lists below) |
| `L5` | Laps: 1, 3, 5 or 10 |
| `N` | AI level: `R`ookie, `N`ormal, `P`ro (the older `E` and `H` are still read) |
| `C` | Camera: `F`ixed, `C`hase |
| `S2` | Steering 1–5 |
| `B4` | Brakes 1–5 |
| `Z6` | Zoom 1–7 |
| `C6` | Cars: 2, 4, 6 or 8 |
| `GP` | Grid: `GB` back, `GR` random, `GP` pole |
| `TL` | Track limits on (left out when off) |
| `Q` | Time trial (left out for a race) |
| `GH0` | Ghost car off (left out when on) |
| `GY0` | Tilt steering off (left out when on) |
| `Y2` | Tilt range 1–5 (left out at 3) |

Bookmark the address to keep a setup, or share it. Parts can be in any order and are not
case-sensitive; missing or invalid parts use the defaults (`AUS-L3-N-F-S3-B3-Z7-C4-GB`). Lap times
are not stored: best laps, sectors and the ghost last only until the page is closed.

## Music

In the menu, the highlighted circuit's music plays after about a second: an opening section
of at least 15 seconds, looped, as a chiptune (square-wave melody, triangle bass), written note by note in
`vector-gp.html` (`SCORES`). Browsers allow sound only after the first click or key press.
T turns the music off (V turns off all sound).

National anthems are used where the music is in the public domain (published before 1929).
Elsewhere the circuit gets a public-domain piece or an original theme in the style of the
region. The melodies were written from memory, so some may differ from the originals; Il Canto
degli Italiani (Inno di Mameli) is transcribed from a score, from "Fratelli d'Italia" to the
end of the verse.

| Music | Circuits |
|---|---|
| Anthem: God Save the King | Silverstone |
| Anthem: The Star-Spangled Banner | Miami, Austin, Las Vegas, Indianapolis, Watkins Glen |
| Anthem: La Marseillaise | Magny-Cours, Paul Ricard |
| Anthem: Das Lied der Deutschen (Haydn) | Hockenheim, Nürburgring |
| Anthem: Il Canto degli Italiani | Monza, Imola, Mugello |
| Anthem: O Canada | Montreal |
| Anthem: Advance Australia Fair | Melbourne |
| Anthem: Kimigayo | Suzuka |
| J. Strauss II, The Blue Danube | Red Bull Ring |
| Bizet, Toreador Song | Barcelona, Madrid |
| Offenbach, Galop infernal | Monaco |
| Mozart, Rondo alla Turca | Istanbul |
| Korobeiniki (traditional) | Sochi |
| Mo Li Hua, Jasmine Flower (traditional) | Shanghai |
| La Cucaracha (traditional) | Mexico City |
| Original theme, Arabian (Hijaz mode) | Bahrain, Jeddah, Lusail, Yas Marina |
| Original theme, Malay pentatonic | Singapore, Sepang |
| Original themes | Spa (carillon), Hungaroring (csárdás), Zandvoort (street organ), Baku, Interlagos and Jacarepaguá (samba), Estoril and Portimão (fado), Kyalami (choral hymn), Buenos Aires (tango) |

## Circuits

### 2026 World Championship

All 24 rounds as originally scheduled, numbered R01 to R24 with their dates. Bahrain (R04)
and Saudi Arabia (R05) were cancelled in March 2026 and are marked as such, but they can
still be raced.

Australia, China, Japan, Bahrain, Saudi Arabia, Miami, Canada, Monaco, Barcelona-Catalunya,
Austria, Great Britain, Belgium, Hungary, Netherlands, Italy, Spain (Madring), Azerbaijan,
Singapore, United States, Mexico, Brazil, Las Vegas, Qatar, Abu Dhabi.

### Past championships

| Id | Circuit | F1 years |
|---|---|---|
| IMO | Imola | 1980–2006, 2020–25 |
| MAL | Sepang | 1999–2017 |
| TUR | Istanbul Park | 2005–11, 2020–21 |
| GER | Hockenheimring (post-2002 layout) | 2002–2019 |
| EUR | Nürburgring GP | 1984–2020 |
| FRA | Magny-Cours | 1991–2008 |
| PRI | Paul Ricard | 2018–2022 |
| POR | Estoril | 1984–1996 |
| ALG | Portimão | 2020–2021 |
| TUS | Mugello | 2020 |
| RUS | Sochi | 2014–2021 |
| IND | Indianapolis road course | 2000–2007 |
| WGI | Watkins Glen | 1961–1980 |
| RSA | Kyalami (current layout, not the one F1 raced) | 1967–85, 1992–93 |
| BRJ | Jacarepaguá | 1978, 1981–1989 |
| ARG | Buenos Aires | 1953–1998 |

### Where the shapes come from

Circuit outlines come from the surveyed GeoJSON of
[bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) (MIT licence). Each circuit
keeps its real length, start/finish line and racing direction (Singapore and Paul Ricard
are reversed relative to the dataset, which has them the wrong way round). For gameplay the
geometry is then adjusted:

- the track is wider than in reality, relative to its length;
- corners tighter than the track's half width are opened up, so the edges never fold;
- sections that run close together (Monaco, Baku, Jeddah, ...) are pushed apart;
- barriers sit at most 70 units from the track edge, closer where another part of the
  circuit runs alongside, so a car cannot cut across to it.

Suzuka keeps its figure-8 crossing; cars on the two levels of the crossover do not collide.

To rebuild the `TRACKS` table in `vector-gp.html` (needs Python with numpy and scipy):

```
git clone https://github.com/bacinger/f1-circuits
python tools/build_tracks.py f1-circuits
```

The circuit list, names, dates and the per-circuit options are at the top of
`tools/build_tracks.py`.

## How it works

- **Track**: the centre line is resampled every 10 units. For each sample the game stores the
  tangent, normal, curvature, barrier distance and a target speed for the AI (corner speed
  limit, then a braking pass backwards around the lap).
- **Cars**: arcade physics with throttle, brakes, drag, a speed-dependent steering rate and
  partial grip, so the car slides a little when turning hard. The steering and brake
  settings scale the player car's steering speed, turn rate and braking force. Off the track (beyond the
  edge lines) there is much more drag. Barriers bounce the car and turn its nose along the
  wall, so it never gets pinned.
- **AI**: steers toward a point ahead on its own line, follows the speed profile scaled by its
  skill, and moves aside to pass a slower car in front. In a field of several cars the skills
  are spread over the AI level's range, fastest at the front of the grid.
- **Collisions**: each car is two circles; contacts push the cars apart and exchange some
  speed.

## Known limitations

- The circuits are smoothed and widened, so some details (tight chicanes, kerb lines) are
  simplified.
- No pit stops, tyre wear or damage; the only penalty is for track limits.
- Online play has no ghost or delta, no pause, and no spectators or late joining: a race
  that has started cannot be joined.
- The AI does not defend its position.
- The web font (Share Tech Mono) loads from Google Fonts; offline, a local monospace font is
  used instead.

## Tests

Requires Node 22.2 or newer. No dependencies.

```
npm test
```

To redraw the app icons: `python tools/make_icons.py` (needs Pillow). When the version in
`package.json` changes, change `VERSION` in `sw.js` too (a test checks this), so installed copies
drop their old cache.

The tests load the game logic straight from `vector-gp.html` and check that every circuit
has the right length and drivable geometry, that a single AI car laps each circuit without
touching a barrier, that a full field of eight finishes a race on every circuit, the
grid and AI skill set-up, slipstream, track-limit penalties, sector times, ghost and delta, the
settings code in the address (round trip, invalid input), the back-on-track rules, and that
higher steering and brake levels turn faster and stop sooner. The tilt tests rebuild a phone physically held in each of the four screen orientations, leaned and
rolled by known angles, and check the wheel angle, dead zone, range levels and neutral position. The PWA tests check the manifest,
the icon sizes, the service worker's cache list and the phone meta tags. The multiplayer tests run a host and
guests in one process over a simulated link (latency, jitter, packet loss) and check that every
player ends with the same results, that prediction stays close to the host, that dropped and
leaving players are replaced by AI, that full or busy rooms refuse newcomers, and that malformed
network messages are ignored.

## License

MIT, see [LICENSE](LICENSE). Circuit geometry is derived from bacinger/f1-circuits,
Copyright (c) 2019-2025 Tomislav Bacinger, MIT License, see
[THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
