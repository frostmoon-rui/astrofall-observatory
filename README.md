# Astrofall Observatory

A night attendant returns to a quiet observatory and follows the brass conduits through 25 interconnected rooms. A light step, a normal jump, and a long fall have different effects. Try them in the porch, then carry what you learn into the workshop, moonlit archive, belfry, and wells. Four cores restore the astrolabe. Four optional fragments reveal a second ending.

**[Play Astrofall Observatory](https://frostmoonrui.com/en/play/astrofall/)**

Move with A/D or the arrow keys, jump with Space, and interact with E. Press R to restart the room, or M to open the map. Phones can use separate direction, jump, and interact buttons with two fingers. The game offers four languages, layered hints, and adjustable touch controls and audio.

Progress saves automatically. Export a code in Settings to transfer this edition across devices. Earlier editions use separate browser save keys because their room and puzzle layouts differ.

## Run locally

From this checkout, run:

    python -m http.server 8000 --bind 127.0.0.1

Open http://127.0.0.1:8000/. The game uses Canvas and Web Audio without external runtime dependencies.

    node --test tests/exploration.test.mjs

The replays use the gameplay engine with timed movement, jump, and interaction inputs. One route reaches the ordinary ending, and the other visits all 25 rooms and reaches the hidden ending.

## Project notes

- [Playtest notes and controls](https://frostmoonrui.com/en/notes/astrofall-playtest/)
