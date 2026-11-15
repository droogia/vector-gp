# VECTOR GP

A single-file, no-dependency HTML racing game (green-on-black "acid" interface) in the
style of 80s monochrome vector arcade games. Four Formula 1-style cars race top-down on
real Grand Prix circuits: the full 2026 calendar plus circuits from past championships.

Everything runs in the browser: open `vector-gp.html` (or `index.html`, which forwards to
it) and play. Nothing is uploaded anywhere.

## Usage

Online: https://droogia.github.io/vector-gp/

1. Pick a circuit in the list (click or arrow keys). Enter or a double click opens the
   circuit box: a large map with a marker driving a lap, and the circuit's data (Grand Prix,
   location, 2026 round or F1 years, length, direction, race distance).
2. In the box, set laps (1, 3, 5, 10), AI level (Rookie, Normal, Pro) and camera (Fixed,
   Chase). Left/Right move to the previous/next circuit; Esc goes back to the list.
   About 2 seconds after a circuit is highlighted, its music starts (see below).
3. **Start** or Enter starts the race. Wait for the five lights to go out. You start from
   the back of the grid.

In the menu (circuit list and circuit box) these keys change the race options without
moving the selection:

| Key | Action |
|---|---|
| 1 3 5 0 | Laps 1 / 3 / 5 / 10 |
| R N P | AI level Rookie / Normal / Pro |
| F / C | Camera Fixed / Chase |
| O | Options |
| H | Help (keys; the race stats stay empty) |
| V | Music and sound on/off |

In the race:

| Key | Action |
|---|---|
| ↑ / W | Throttle |
| ↓ / S | Brake, then reverse once stopped |
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
| Esc | Pause, then back to the menu (the box of the circuit just raced) |

All driving controls are on the arrow keys, so the game can be played with one hand.
On a touch screen, on-screen buttons appear (steer, brake, throttle, back on track).

### Options

| Setting | Levels | Effect |
|---|---|---|
| Steering | 1–5, default 3 | How quickly the steering reaches full lock and how sharply the car can turn |
| Brakes | 1–5, default 3 | Braking force, about ±15% per level |
| Zoom | 1–7, default 7 | Each level down shows about 40% more track |

Steering and brakes apply to your car only; the AI cars are set by the AI level.

### Settings in the address

The game uses no browser storage. All settings live in the page address, in a readable
code that updates as you change them, for example:

```
https://droogia.github.io/vector-gp/#MON-L5-N-C-S2-B4-Z6
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

Bookmark the address to keep a setup, or share it. Parts can be in any order and are not
case-sensitive; missing or invalid parts use the defaults (`AUS-L3-N-F-S3-B3-Z7`). Lap times
are not stored: the HUD and the help box show this race's last, best and fastest laps.

## Music

In the menu, the highlighted circuit's music plays after about 2 seconds: the opening phrase,
looped, as a chiptune (square-wave melody, triangle bass), written note by note in
`vector-gp.html` (`SCORES`). Browsers allow sound only after the first click or key press.
V turns it off.

National anthems are used where the music is in the public domain (published before 1929).
Elsewhere the circuit gets a public-domain piece or an original theme in the style of the
region. The melodies were written from memory, so some may differ from the originals.

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
  skill, and moves aside to pass a slower car in front.
- **Collisions**: each car is two circles; contacts push the cars apart and exchange some
  speed.

## Known limitations

- The circuits are smoothed and widened, so some details (tight chicanes, kerb lines) are
  simplified.
- No pit stops, tyre wear, damage or penalties.
- The AI does not defend its position.
- The web font (Share Tech Mono) loads from Google Fonts; offline, a local monospace font is
  used instead.

## Tests

Requires Node 22.2 or newer. No dependencies.

```
npm test
```

The tests load the game logic straight from `vector-gp.html` and check that every circuit
has the right length and drivable geometry, that a single AI car laps each circuit without
touching a barrier, that a full field of four finishes a race on every circuit, the
settings code in the address (round trip, invalid input), the back-on-track rules, and that
higher steering and brake levels turn faster and stop sooner.

## License

MIT, see [LICENSE](LICENSE). Circuit geometry is derived from bacinger/f1-circuits,
Copyright (c) 2019-2025 Tomislav Bacinger, MIT License, see
[THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
