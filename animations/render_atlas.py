"""Render independent atlas films with bounded parallelism; no web runtime dependency."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import os
import subprocess
import sys
import manim
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public/animations/atlas-manim'
DATA=json.loads((ROOT/'animations/atlas-film-data.json').read_text())
IDS=[t['id'] for t in DATA]
selected=sys.argv[1:] or IDS
if any(x not in IDS for x in selected): raise SystemExit('Unknown topic')
OUT.mkdir(parents=True,exist_ok=True)
def render(key):
    cache=Path('/tmp/rl-atlas-manim')/key
    cache.mkdir(parents=True,exist_ok=True)
    env={**os.environ,'RL_ATLAS_FILM_ID':key,'RL_FILM_OUTPUT':str(OUT)}
    with (cache/'render.log').open('w') as log:
        subprocess.run([sys.executable,'-m','manim','render',str(ROOT/'animations/atlas_scenes.py'),'TopicFilm','--renderer','cairo','--resolution','960,540','--fps','24','--media_dir',str(cache),'--disable_caching','--verbosity','WARNING'],cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,check=True)
    candidates=list((cache/'videos').rglob('TopicFilm.mp4'))
    if len(candidates)!=1: raise RuntimeError(f'Expected one movie for {key}')
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(candidates[0]),'-an','-c:v','libx264','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/(key+'.mp4'))],check=True)
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','10','-i',str(OUT/(key+'.mp4')),'-frames:v','1','-update','1',str(OUT/(key+'.jpg'))],check=True)
    captions=OUT/(key+'.vtt')
    captions.write_text(captions.read_text().rstrip()+'\n')
    print(f'Finished {key}',flush=True)
with ThreadPoolExecutor(max_workers=int(os.environ.get('RL_RENDER_JOBS','3'))) as pool:
    list(pool.map(render,selected))
if all((OUT/(key+'.json')).exists() for key in IDS):
    manifest={'renderer':'Manim Community','version':manim.__version__,'resolution':[960,540],'fps':24,'license':'MIT','source':'https://github.com/ManimCommunity/manim','films':[json.loads((OUT/(key+'.json')).read_text()) for key in IDS]}
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (ROOT/'src/atlas-film-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
