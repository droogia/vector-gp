# VECTOR GP

A single-file, no-dependency HTML racing game (green-on-black "acid" interface) in the
style of 80s monochrome vector arcade games. Four Formula 1-style cars race top-down on
real Grand Prix circuits: the full 2026 calendar plus circuits from past championships.

Everything runs locally in the browser: open `vector-gp.html` and play. Nothing is
uploaded anywhere.

## Usage

1. Pick a circuit from the menu (click, or arrow keys), the number of laps (1, 3, 5, 10),
   the AI level (Easy, Normal, Hard) and the camera (Fixed or Chase).
2. Press **Start** or Enter (double-clicking a circuit also starts the race).
3. Wait for the five red lights to go out, then race. You start from the back of the grid.

| Key | Action |
|---|---|
| Arrows / WASD | Drive (up = throttle, down = brake / reverse, left/right = steer) |
| Space | Brake |
| C | Switch camera: Fixed (north up) or Chase (car points up) |
| M | Full circuit view |
| V | Sound on/off |
| P | Pause |
| R | Restart the race |
| Esc | Pause, then back to the menu |

On a touch screen, on-screen buttons appear (steer left/right, brake, throttle).

The HUD shows lap, position, race time, last and best lap, the circuit record, a speedometer,
a mini-map and the running order. The best lap on each circuit is kept as the circuit record
in the browser's local storage.

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
  partial grip, so the car slides a little when turning hard. Off the track (beyond the
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
touching a barrier, and that a full field of four finishes a race on every circuit.

## License

MIT, see [LICENSE](LICENSE). Circuit geometry is derived from bacinger/f1-circuits,
Copyright (c) 2019-2025 Tomislav Bacinger, MIT License, see
[THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
