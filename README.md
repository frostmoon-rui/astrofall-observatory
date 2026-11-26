# Astrofall Observatory

A night attendant restores a silent observatory by mastering landing impact, phase, and momentum. The solo campaign has 92 connected rooms. The original 25 form the central map, and 11 new sectors branch into 55 circuitry, traversal, and timing rooms. Each sector forks, recombines, and opens a shortcut back to the rotunda. The rotunda also leads to twelve optional expedition rooms across the Aurora Conservatory, Cinder Works, and Tidal Reservoir.

Four star cores and the Foundry, Mirror, Viaduct, and Cavern seals open the dome. The hidden ending needs four stardust fragments and every sector seal, including the ring off the dome. Completed circuits stay unlocked on return visits.

**[Play Astrofall Observatory](https://frostmoonrui.com/en/play/astrofall/)**

Move with A/D or the arrow keys, jump with Space, and interact with E. Press R to restart the room, or M to open the map. Phones can use separate direction, jump, and interact buttons with two fingers. The game offers four languages, layered hints, and adjustable touch controls and audio.

Progress saves automatically. Export a code in Settings to transfer this edition across devices. Saves from the 25-room build retain the original room progress. The added sectors start unexplored.

## Online co-op

[Join the public playtest](https://frostmoonrui.com/play/astrofall/co-op/) or run the local server. Pick a mode and share the room code or invite link. One to six players can enter mid-game. Co-op has a separate map and leaves solo saves independent.

- **Constellation Relay** spans nine scrolling sectors. Stand at numbered doors, activate relay stations in turn, and hold Link with a partner of the opposite phase to bridge gaps or boost jumps. Doors track the active roster. Mid-game arrivals start at the shared checkpoint.
- **Endless Run** streams course segments ahead of each runner. Race for distance or play alongside friends. Falling returns the runner to their most recent checkpoint.
- **Jump Race** keeps the legacy double jump and gives everyone the same obstacles. Compare round scores and join an active room without starting a separate course.
- **Platform Co-op** uses the eight legacy stages, shared checkpoints, ordered switches, and partner boosts. Reach the flag with the whole party to advance. The original single-player games keep their own saves.

Use A/D or the arrows, Space to jump, E to link, and F to act. Phones have separate multitouch controls.

## Run locally

Requires Node.js 20+ for online rooms.

    npm ci
    npm run dev

Open http://127.0.0.1:8789/ for solo or http://127.0.0.1:8789/co-op/ for co-op. The server binds to loopback by default. The hosted website uses the same game rules in a Cloudflare Durable Object. The solo game can also be served with any static server.

    npm test

Tests replay the 55 original branch circuits with movement, jump and interaction inputs, verify the original routes, and exercise real WebSocket joins and departures.

## Project notes

- [Playtest notes and controls](https://frostmoonrui.com/en/notes/astrofall-playtest/)


### Additional multiplayer modes

| Mode | Players | Rules |
| --- | --- | --- |
| Opposite Orbits | 2 | Flip gravity, hold a numbered rail switch for your partner, and finish together on opposite rails in four rooms. |
| Ricochet Garage | 1–6 | Aim by moving and fire bouncing rounds. A computer opponent fills an otherwise empty room. The first to three knockouts wins. |
| Bell Tower Brawl | 2–6 | Jump between ledges, strike and guard. Knockback increases with damage. The first to five ring-outs wins. |
| Comet Circuit | 1–6 | Flip gravity around obstacles. Complete three sprints to win the round. The obstacle layout rotates between rounds. |

F activates each mode’s signature action. Tanks use all four movement directions. Touch players have the same actions on screen.
