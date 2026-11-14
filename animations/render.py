"""Render the original Manim films, posters, captions, and a manifest.

Usage: /path/to/manim-python animations/render.py [scene-id ...]
No Python server or Manim installation is needed when viewing the website.
"""
from pathlib import Path
import json
import os
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'public/animations/manim'
CACHE = Path(os.environ.get('RL_RENDER_CACHE', '/tmp/rl-manim-render'))
SCENES = {
 'foundations':'DiscountedReturn', 'probability':'ExpectedReward',
 'mdp':'MarkovTransition', 'bellman':'BellmanContraction',
 'dp':'ValuePropagation', 'td':'TemporalDifference',
 'policy':'PolicyGradient', 'reward':'PotentialShaping',
 'rubric':'RubricReward', 'kl':'KLRegularization',
}
selected = sys.argv[1:] or list(SCENES)
OUTPUT.mkdir(parents=True, exist_ok=True)
for key in selected:
 if key not in SCENES: raise SystemExit(f'Unknown scene: {key}')
 name = SCENES[key]
 print(f'Rendering {key} with Manim...', flush=True)
 subprocess.run([sys.executable,'-m','manim','render',str(ROOT/'animations/rl_scenes.py'),name,
  '--renderer','cairo','--resolution','960,540','--fps','24','--media_dir',str(CACHE),
  '--disable_caching','--verbosity','WARNING'],check=True,cwd=ROOT)
 candidates=list((CACHE/'videos').rglob(name+'.mp4'))
 if len(candidates)!=1:raise RuntimeError(f'Expected one movie for {name}, got {candidates}')
 # Web playback: H.264 + yuv420p + fast-start metadata. Native controls support seeking.
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(candidates[0]),
  '-an','-c:v','libx264','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',str(OUTPUT/(key+'.mp4'))],check=True)
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','5','-i',str(OUTPUT/(key+'.mp4')),
  '-frames:v','1','-update','1',str(OUTPUT/(key+'.jpg'))],check=True)
 print(f'Finished {key}',flush=True)
if all((OUTPUT/(key+'.json')).exists() for key in SCENES):
 import manim
 manifest={'renderer':'Manim Community','version':manim.__version__,'resolution':[960,540],'fps':24,
  'license':'MIT','source':'https://github.com/ManimCommunity/manim',
  'films':[json.loads((OUTPUT/(key+'.json')).read_text()) for key in SCENES]}
 (OUTPUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
 (ROOT/'src/film-manifest.json').write_text(json.dumps(manifest,indent=2))
