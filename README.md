# Octavia

A four-key rhythm game that runs in the browser, in the style of osu!mania. Notes fall down four lanes and you press the matching key as each one crosses the hit line. It has single-player charts and multiplayer rooms with lobby chat.

Built with vanilla JavaScript and the HTML5 Canvas, with a Node.js, Express and Socket.IO server. I made it as my A-level Computer Science coursework project (NEA).

## Features

- **Four-lane gameplay** drawn on an HTML5 canvas, played with `D` `F` `J` `K`.
- **Timing-based judgement:** each key press is compared with the note's ideal hit time and graded GREAT, GOOD, OK, MEH or MISS.
- **Normalised scoring:** every chart is worth 1,000,000 points for a perfect run, with later notes in a combo worth more.
- **Accuracy and grades:** accuracy uses the osu!mania formula, and a finished chart is graded from SS down to F.
- **Health:** misses drain health and accurate hits restore it. The run ends if health reaches zero.
- **Adjustable scroll speed** from 1.0x to 6.0x, saved between sessions in the browser.
- **Ten charts**, from a beginner warm-up to chords, note spam and an extreme chart.
- **Multiplayer rooms:** create a room, share its code, chat in the lobby, and start the same chart for everyone in the room.

## Getting started

You need [Node.js](https://nodejs.org/) installed.

```bash
git clone https://github.com/ezawn/Octavia.git
cd Octavia
npm install
node socketServer.js
```

Then open <http://localhost:3000> in your browser.

The server uses port 3000 unless you set the `PORT` environment variable.

## Controls

| Where | Key | Action |
| --- | --- | --- |
| In game | `D` `F` `J` `K` | Hit a note in lanes 1 to 4 |
| In game | `Esc` | Return to the menu or lobby |
| Level select | `Up` / `Down` | Choose a chart |
| Level select | `Enter` | Start the chart |
| Settings | `Left` / `Right` | Change scroll speed |
| Menus | `Esc` | Go back |

## How scoring works

### Judgement

A press is judged by how far it lands from the note's ideal hit time.

| Judgement | Timing window | Base score | Health restored |
| --- | --- | --- | --- |
| GREAT | within 80 ms | 300 | 5 |
| GOOD | within 100 ms | 200 | 2 |
| OK | within 120 ms | 100 | 1 |
| MEH | within 150 ms | 50 | 0.5 |
| MISS | anything later, or no press | 0 | none |

A note that passes the hit line unpressed costs 10 health. A badly timed press costs 5.

### Score

Each note's base score is multiplied by `1 + (current combo / total notes in the chart)`, so holding a combo makes later notes worth more. The total is then scaled so that a full combo of GREATs on any chart comes to exactly 1,000,000.

### Accuracy and grade

```
accuracy = (300 × GREAT + 200 × GOOD + 100 × OK + 50 × MEH)
           ÷ (300 × total notes judged) × 100
```

| Grade | Accuracy |
| --- | --- |
| SS | 100% |
| S | 95% or above |
| A | 90% or above |
| B | 80% or above |
| C | 70% or above |
| D | 60% or above |
| F | below 60% |

## Multiplayer

1. Choose **Multiplayer** from the main menu.
2. Click **Create New Room** and share the room code that appears, or enter a friend's code and click **Join Room**.
3. Chat in the lobby while you wait.
4. Click **Start Game** and pick a chart. It starts for everyone in the room.

The server keeps rooms in memory and deletes a room once the last player leaves.

## Adding a chart

A chart is a JSON file in `public/charts/` listing each note's time in milliseconds from the start and its lane (0 to 3, left to right). Notes must be in time order.

```json
{
  "notes": [
    { "time": 1000, "lane": 0 },
    { "time": 1500, "lane": 1 },
    { "time": 1500, "lane": 3 }
  ]
}
```

To make it appear in the level select, add an entry to `public/levels.json`:

```json
{
  "id": "my-chart",
  "name": "My Chart",
  "description": "Shown under the name in the menu",
  "chart": "my-chart.json"
}
```

## Project structure

```
socketServer.js                    Express static server and Socket.IO room, game and chat events
public/
  index.html                       Main menu, multiplayer lobby and game canvas
  main.js                          Switches between screens and wires up input and multiplayer
  game.js                          Game loop, score, combo, health and accuracy
  noteManager.js                   Note class, chart loading, note spawning and hit detection
  inputHandler.js                  Maps key presses to lanes and applies the judgement
  renderer.js                      Canvas drawing for lanes, notes, HUD and result screens
  menu.js                          Level select, settings screen and room info display
  multiplayerClientSocket.js       Client wrapper around the Socket.IO connection
  constants.js                     Timing windows, speeds, lane positions and colours
  levels.json                      List of charts shown in the level select
  charts/                          Chart files
```

## Limitations and next steps

- **No audio yet.** Charts are timed note patterns without a backing track, so syncing notes to music is the main thing to add.
- **Multiplayer does not show other players' scores.** The server already relays live game state and final results, but the game client does not send them yet.
- **Multiplayer only works locally.** The client connects to `localhost:3000`, so the server address needs to be configurable before the game can be hosted online.
- **Player names** are generated automatically. Letting players choose one would make the chat easier to follow.
