# The Night Observatory

A browser puzzle platformer about landing impact, light, and gravity. The full edition has 38 rooms, three wings, eight echoes, and three endings. It is based on the Night Observatory prototype supplied by the site owner.

- [Play the full edition](https://frostmoonrui.com/en/play/astrofall/)
- [Play the 16-room classic edition](https://frostmoonrui.com/en/play/astrofall/classic/)

## Run locally

Start a static server from this directory. The game has no build step or external assets.

    python -m http.server 8000 --bind 127.0.0.1

Open http://127.0.0.1:8000/. The classic version is also available from classic/index.html.

## Controls and saves

- Move with the arrow keys or A/D, jump with Space, brace with Down, S, or Shift, and interact with E or Enter.
- Phones support a touch joystick, separate jump and brace buttons, and fullscreen where the browser permits it.
- Choose Chinese, English, Russian, or Japanese. The layered hints are available in the pause menu.
- The full edition saves to three browser slots. Export a file or copy a code from the pause menu and import it in Settings. The classic edition uses its own saves.

## Verify the game

Run the route test:

    node --test tests/night-observatory.test.mjs

The recorded input sequences start in Nightwatch Hall with an empty save, solve the three wings using the game physics, and check both ordinary endings and the hidden ending.
