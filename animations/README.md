# Manim films for RL Atlas

These are original animated mathematical explanations rendered with **Manim Community 0.22.1**. All ten core-course visual modules have a film, an English caption track, a poster, and a timestamped transcript. No footage, audio, characters, or artwork from 3Blue1Brown is included.

## Library research and choice

| Library                                                    | What it provides                                                                                                                          | Fit for this project                                                                     |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [ManimGL / 3b1b's Manim](https://github.com/3b1b/manim)    | The animation engine developed for 3Blue1Brown's explanatory mathematics videos.                                                          | Closest original reference; a Python/OpenGL rendering workflow.                          |
| [Manim Community](https://docs.manim.community/en/stable/) | A community-maintained version of Manim with mathematical objects, LaTeX, path creation, matching transforms, and Cairo/OpenGL rendering. | Selected. Render original mathematical scenes offline and embed browser-compatible MP4s. |
| [Motion Canvas](https://motioncanvas.io/docs/)             | TypeScript generators and an editor for explanatory vector animations and audiovisual timing.                                             | A viable web-oriented alternative, but not the original 3Blue1Brown engine.              |

Manim does not run as a JavaScript library inside the page. Python renders the films during authoring. The website embeds those actual outputs with native HTML video. The existing SVG models remain available under **Explore parameters** so students can change numbers, step, and inspect the math. The film is an authored example and does not change when a simulation slider moves.

## Reproduce the films

Python 3.12 is used here. Install native Cairo/Pango libraries, a working LaTeX installation with `standalone` and AMS packages, `dvisvgm`, and FFmpeg. See the [official installation guide](https://docs.manim.community/en/stable/installation.html).

```sh
python3 -m venv .venv-render
. .venv-render/bin/activate
pip install -r animations/requirements.txt
python animations/render.py
```

To rebuild only one scene:

```sh
python animations/render.py bellman
```

A normal `npm run build` does not render films or require Python. The generated assets are retained in `public/animations/manim/` and copied by Vite to `dist/animations/manim/`.

This cloud machine also has a prepared rendering environment at `/workspace/rl-animation-env` and a verified TeX Live `dvisvgm` binary at `/workspace/rl-animation-tools/texlive/bin/x86_64-linux`. The latter was verified against the SHA-512 container checksum in the official TeX Live package database. Use the system LaTeX rather than Conda's partial TeX installation:

```sh
PATH=/workspace/rl-animation-tools/texlive/bin/x86_64-linux:/usr/bin:/bin:/workspace/rl-animation-env/bin:$PATH \
MPLCONFIGDIR=/tmp/rl-mpl XDG_CACHE_HOME=/tmp/rl-render-cache \
TEXMFCNF=/etc/texmf/web2c:/usr/share/texlive/texmf-dist/web2c \
TEXMFROOT=/usr/share/texlive TEXMFVAR=/tmp/rl-texmf-var TEXMFCONFIG=/tmp/rl-texmf-config \
/workspace/rl-animation-env/bin/python animations/render.py
```

## Output and integration

- `rl_scenes.py`: the Manim scene source, including `Write`, `Create`, `TransformMatchingTex`, `ValueTracker`, `MoveAlongPath`, and `Cross`.
- `render.py`: renders at 960×540 and 24 fps, then encodes H.264/yuv420p MP4 with fast-start metadata for streaming and seeking.
- `public/animations/manim/*.vtt`: English WebVTT captions generated from each scene's actual rendered timestamps. Every caption is held for at least four seconds.
- `public/animations/manim/*.json`: render durations and transcript cue times.
- `public/animations/manim/manifest.json` and `src/film-manifest.json`: generated metadata shared with the player.
- `src/films.js`: lazy-loading native player, playback speed, replay, transcript seeking, accessible tab navigation, error fallback, and lifecycle cleanup.

Videos do not autoplay. Switching to the interactive model pauses the video; switching back stops the interactive timer. Navigation pauses both. Captions and a transcript make the silent films readable without narration.

Manim is MIT licensed. The upstream and Community copyright notices are retained in `LICENSE-Manim.txt` and `LICENSE-Manim-Community.txt`.

The extended visual RL & Deep RL atlas uses 35 additional original SVG/requestAnimationFrame models in `src/atlas-scenes.js` and `src/atlas-visuals.js`. These are live numerical illustrations with parameter controls and reduced-motion support; they are not prerecorded Manim films. They complement the ten core-course films above.
