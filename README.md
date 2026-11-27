# Green Pitch

A team penalty-shootout game for the phone, played in front of a real goal.

The questions are on **real paper cards**. The app draws the level, runs the shots with animations and sound, and keeps the score. The rear camera is shown full screen behind every page, so the virtual goal sits on top of the real one.

Built as a one-week student project (B3 Web & Multimedia).

## How to play

1. **Menu**: tap PLAY. The app goes full screen. If you leave full screen, the menu comes back with CONTINUE, which resumes where you were.
2. **Place the goal**: drag the virtual goal over the real one and resize it with the round handle (width and height are independent).
3. **Choose the players**: 2 to 6 players, at most 3 per team. Type a name (8 letters max) and pick Random, Blue or Green. Numbers are automatic: the smallest free number from 1 to 6. "Draw teams" splits the Random players and shuffles the order. "Kick off" needs at least one player per team and no Random player left.
4. **Play the shots**. Blue shoots on even turns, Green on odd turns, and each team's players take turns.

### One shot

| Phase | What happens |
|---|---|
| Shoot | Three balls spin and draw a level: Easy, Medium or Hard (1/3 each). |
| Shooter's question | The **keeper** draws a paper card of that level and reads it. The **shooter** answers. Tap Correct or Incorrect. |
| Keeper's question | The **shooter** draws a card one level above (Medium, Hard or Extreme) and reads it. The **keeper** answers. |
| Pick your spot | Only if the shooter was correct: choose Left, Center or Right. |
| Shot | The shooter runs up, kicks, the ball flies and the keeper dives. Then the result is shown. |

The opponent always draws and reads the card. The Correct / Incorrect buttons judge the answer of the player who answers.

### Chances

| Shooter | Keeper | Goal chance (Easy / Medium / Hard) | Save chance | Result |
|---|---|---|---|---|
| Correct | Wrong | 30 % / 60 % / 90 % | 0 | Goal or off target |
| Correct | Correct | 20 % / 40 % / 60 % | 10 % / 20 % / 30 % | Goal, save or off target |
| Wrong | Wrong | - | - | "No shot" |
| Wrong | Correct | - | - | "Keeper bonus" (shown, not implemented yet) |

The chosen spot only decides the direction: the ball goes to a random point of the chosen zone, or outside the goal if it misses (beside the post on the sides, over the bar in the middle).

### Bonuses

The players decide when to use them (round gold button, bottom right):
- **Double Goal**: if the current shot is a goal, it counts 2.
- **Power Shot**: +20 % chance to score on the current shot (capped at 100 %).
- **VAR Decision**: at any time, removes 1 goal from the chosen team (never below 0).

Double Goal and Power Shot reset after every shot.

### End of the match

The match ends when a team reaches **7 goals**, or after **10 minutes**: when the time is up, the shot in progress (or the next one) is the last. Then "See result" shows the winners on top and the losers below, with their players.

## Run it

You need Node.js (the project uses Vite 8, so a recent version).

```bash
npm install
npm run dev
```

- `npm run dev` starts Vite with `--host` and a self-signed HTTPS certificate (`@vitejs/plugin-basic-ssl`). The camera only works on HTTPS or on `localhost`.
- To test on a phone, open `https://<your-computer-ip>:5173` on the same Wi-Fi and accept the certificate warning.
- `npm run lint` runs ESLint, `npm run build` builds for production, `npm run preview` serves the build.

To test the end of the match quickly, lower `MATCH_SECONDS` in `src/constants.js` (for example to `30`) and put it back to `10 * 60` before pushing.

## Tech stack

- **React 19** and **Vite 8** (JavaScript, no TypeScript), **ESLint**
- **Tailwind CSS v4**: the theme is in `src/index.css` (`@theme`), there is no `tailwind.config.js`
- **Howler.js** for the sound effects
- **Fontsource**: Bebas Neue, Barlow Condensed and Barlow are bundled (no request to Google Fonts)

## Project structure

```
public/sounds/        sound effects (mp3, one wav)
src/
  App.jsx             global state (step, goal, players, turn, score) and page choice
  index.css           Tailwind, theme tokens, shared component classes (.btn, .panel, .sb...)
  constants.js        shared constants: levels, chances, zones, match rules
  sounds.js           one Howl per file, playSound / stopSounds / RESULT_SOUNDS
  viewport.js         screen size hook, goal fractions to pixels
  pages/
    menu.jsx          PLAY / CONTINUE overlay
    camera.jsx        rear camera in the background (720p max)
    putgoal.jsx       place and resize the goal
    choosing_players.jsx
    game.jsx          the match: phases, shot, keeper, timer
    result.jsx        winners and losers
  component/          ball, player pictogram, scoreboard, bonus menu, buttons, markers...
```

Naming rule: folders and files are lowercase. Vercel runs on Linux, which is case-sensitive, so an import with the wrong case works on Windows but breaks the deployment.

## Design

The brand guidelines drive the look (the PDF is not in this repository):
- **Colors**: Pitch Navy `#061A40`, Royal Blue `#0B3B8F`, Kit White, Trophy Gold `#DBA111`. Levels: Easy `#2FB463`, Medium `#F28C1E`, Hard `#D7263D`, Extreme `#121417`. All of them are tokens in `src/index.css`.
- **Type**: Bebas Neue (titles, scores, big moments), Barlow Condensed (labels, buttons), Barlow (text). Always uppercase for the first two.
- **Buttons**: gold pill with navy text. Big moments: white text with a flat navy outline and a gold exclamation mark.
- **Text**: English only, short, in the voice of a commentator.
- **Green IT**: flat SVG shapes, no heavy photos, no blur, camera limited to 720p, sounds around 2 MB in total.

## Deployment

The site is deployed on **Vercel** from the `main` branch of the GitHub repository. Every push to `main` triggers a new deployment (usually one or two minutes). Hard refresh the page on the phone to be sure to get the new version.

## Known limits

- **Camera zoom**: the camera starts at its minimum zoom when the browser allows it. A website cannot zoom out below what the browser exposes, so on some phones (for example a Redmi Note 10 Pro in Chrome) the ultra-wide lens is not available. Stepping back from the goal is the only fix there.
- **Sound** starts after the first tap on the screen (browser rule). PLAY counts as that tap.
- **Keeper bonus** is only displayed: it does not give anything yet.
- **No saved game**: reloading the page starts again from the menu.

## Ideas for later

Keeper bonus, saving the game in `localStorage`, and a PWA so the game can be installed on the home screen.
