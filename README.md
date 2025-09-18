# Starbound Defender

Starbound Defender is an arcade-inspired space survival game built entirely with HTML, CSS, and vanilla JavaScript. Dodge asteroids, repel marauding raiders, and unleash devastating nova blasts to climb the scoreboard. The project ships with an Nginx configuration and a lightweight Alpine-based Docker image so it can be deployed as a drop-in static site.

## Gameplay highlights

- **Responsive canvas action** – Smooth 60 FPS animation with adaptive controls for desktop and touch devices.
- **Dynamic enemy waves** – Asteroids and raider ships scale in speed and density as your score increases.
- **Combo-driven scoring** – Chain eliminations to increase your multiplier and supercharge the nova gauge.
- **Power ups & boosts** – Collect shield repairs and instant novas, use boosters to dodge incoming fire, and watch energy levels.
- **Web audio effects** – Toggleable synthesized sound effects for lasers, explosions, and power-ups.

## Controls

| Action          | Desktop                                        | Mobile/touch                                      |
| --------------- | ---------------------------------------------- | ------------------------------------------------- |
| Move            | Arrow keys or WASD                             | Drag the virtual joystick                         |
| Fire            | Space bar                                      | Tap the **Fire** button                           |
| Boost           | Hold either Shift key                          | Drag the joystick further from the center         |
| Nova blast      | Build the gold meter to 100%, then tap fire    | Same as desktop (requires a fresh fire tap)       |
| Pause/Restart   | Click the on-screen buttons                    | Tap the on-screen buttons                         |

> Tip: nova blasts clear the entire screen—save them for overwhelming waves!

## Running locally

The game is a static site. You can open `public/index.html` directly in a browser, but for the best experience (fonts, audio, caching) run a tiny static server:

```bash
# from the repository root
yarn global add serve # or npm install --global serve
serve public
```

Then browse to `http://localhost:3000` (the default port for `serve`).

## Deploying with Nginx on Alpine Linux

A production-ready configuration is included for a minimal Alpine footprint.

### 1. Build the Docker image

```bash
# From the repository root
docker build -t starbound-defender .
```

The image uses [`nginx:1.25-alpine`](https://hub.docker.com/_/nginx) as the base and copies the static assets into `/usr/share/nginx/html`.

### 2. Run the container

```bash
docker run --rm -p 8080:80 starbound-defender
```

Navigate to `http://localhost:8080` to play.

### 3. Deploy on bare Alpine + Nginx

If you already have an Alpine server with Nginx installed:

1. Copy the contents of `public/` to `/usr/share/nginx/html/` (or your preferred `root`).
2. Replace `/etc/nginx/conf.d/default.conf` with the provided `nginx.conf`.
3. Reload Nginx: `sudo nginx -s reload`.

The supplied configuration enables gzip compression, sets sensible caching headers for static assets, and routes unknown paths back to `index.html` (useful for future SPA routing).

## Project structure

```
├── Dockerfile              # Alpine + Nginx deployment image
├── nginx.conf              # Server configuration tuned for static assets
└── public
    ├── game.js             # Game logic and rendering loop
    ├── index.html          # Markup and UI overlays
    └── styles.css          # Visual design and responsive layout
```

Enjoy defending the frontier! Contributions and enhancements are welcome—feel free to fork and expand the universe.
