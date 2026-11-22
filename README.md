# Astrofall Observatory

The beacon is dark and the cloud sea has stopped moving. The watchman wakes on a fogbound shore and follows the old workshop, moon mirrors, and belfry to learn why the last light went out.

**[Play Astrofall Observatory](https://frostmoonrui.com/en/play/astrofall/)**

One campaign connects the original Astrofall and Night Observatory rooms. It has 60 rooms, three endings, eight optional echoes, and 16 restorations. Landing impact, light, gravity, and springs carry from one wing to the next. The star map records repaired mechanisms, and wing sigils open shortcuts back to Nightwatch Hall.

## Controls and saves

- Move with the arrow keys or A/D. Jump with Space, brace with S, Down, or Shift, and interact with E or Enter.
- Phones support a joystick and separate jump and brace buttons. Fullscreen is available where the browser permits it.
- Choose Chinese, English, Russian, or Japanese. Reveal hints one layer at a time.
- Three slots save automatically. Export from Pause and import a file or code in Settings. Night Observatory saves retain their progress. Classic saves resume at the corresponding room and carry over discovered rooms.

## Run and verify locally

Serve this checkout and open http://127.0.0.1:8000/.

    python -m http.server 8000 --bind 127.0.0.1

Run the route tests separately.

    node --test tests/night-observatory.test.mjs

The tests start on the fogbound shore with an empty save and replay ordinary inputs. Both ordinary endings are tested. The hidden route visits all 60 rooms, collects all eight echoes, and records all 16 restorations.
