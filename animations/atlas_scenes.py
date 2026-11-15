"""35 original, data-driven Manim lessons. Reproduce with render_atlas.py.

The numerical snapshots are exported from the same explicit models as the live
website. Coordinates remain fixed across stages, so changing values remain
comparable. No training runs or third-party video are represented here.
"""
import json
import os
from pathlib import Path
import numpy as np
from manim import *
from rl_scenes import AtlasFilm, formula, fit, B, G, Y

DATA = json.loads((Path(__file__).parent / 'atlas-film-data.json').read_text())


def label(text, size=19, color=WHITE, width=12):
    return fit(Text(str(text), font_size=size, color=color), width)


class TopicFilm(AtlasFilm):
    def setup(self):
        self.topic = next(t for t in DATA if t['id'] == os.environ['RL_ATLAS_FILM_ID'])
        self.film_id = self.topic['id']
        self.film_title = self.topic['title']
        super().setup()
        frames = self.topic['frames']
        first = frames[0]
        if first.get('network'):
            return
        self.xr = first.get('x', [0, max(1, len(first['bars']))])
        if 'y' in first:
            self.yr = first['y']
        else:
            values = [b['value'] for m in frames for b in m['bars']]
            low, high = min(0, *values), max(.1, *values)
            pad = max(.12, (high-low)*.16)
            self.yr = [low-pad if low < 0 else 0, high+pad]

    def xy(self, x, y):
        return np.array([-5.1+(x-self.xr[0])/(self.xr[1]-self.xr[0])*10.2,
                         -1.05+(y-self.yr[0])/(self.yr[1]-self.yr[0])*2.9, 0])

    def chart(self, m):
        group = VGroup()
        zero = min(max(0, self.yr[0]), self.yr[1])
        for y in np.linspace(*self.yr, 5):
            group.add(Line(self.xy(self.xr[0],y), self.xy(self.xr[1],y), color='#33445f', stroke_width=1))
            group.add(label(f'{y:.2g}', 16, '#b4c2d7').move_to(self.xy(self.xr[0],y)+LEFT*.43))
        group.add(Line(self.xy(self.xr[0],zero), self.xy(self.xr[1],zero), color='#7289a6'))
        count = len(m['bars'])
        for i, bar in enumerate(m['bars']):
            x = self.xr[0] + (i+.5)*(self.xr[1]-self.xr[0])/count
            a, b = self.xy(x,zero), self.xy(x,bar['value'])
            rect = Rectangle(width=10.2/count*.55, height=max(.012,abs(b[1]-a[1])),
                fill_color=bar['color'], fill_opacity=.85, stroke_width=0).move_to((a+b)/2)
            group.add(rect, label(f"{bar['value']:.3g}", 22, bar['color']).move_to(b+(UP if bar['value']>=0 else DOWN)*.21))
            group.add(label(bar['name'],17,width=10/count*.95).move_to([b[0],-1.4,0]))
        for curve in m['plots']:
            path = VMobject(color=curve['color'], stroke_width=3.4)
            path.set_points_as_corners([self.xy(x,y) for x,y in curve['points']])
            group.add(path)
        for point in m['points']:
            group.add(Dot(self.xy(point['x'],point['y']), radius=.075, color=point.get('color',G)))
        if m['plots']:
            for x in np.linspace(*self.xr, 5):
                group.add(label(f'{x:.2g}',16,'#b4c2d7').move_to(self.xy(x,self.yr[0])+DOWN*.2))
            legends = VGroup(*[label(c['name'],17,c['color'],width=3.6) for c in m['plots']]).arrange(RIGHT,buff=.45)
            group.add(legends.move_to([0,-1.8,0]))
        group.add(label(m['xLabel'],17,'#b4c2d7').move_to([0,-1.57 if count else -1.48,0]))
        group.add(label(m['yLabel'],17,'#b4c2d7').move_to([-4,2.1,0]))
        return group

    def network(self, m):
        n = m['network']
        group = VGroup()
        if n['kind'] == 'fork':
            coords = [np.array([-4,0,0]),np.array([3.8,1.3,0]),np.array([3.8,-.8,0])]
            for end in coords[1:]:
                group.add(Arrow(coords[0]+RIGHT*.65,end- RIGHT*.8,color='#7289a6',buff=0))
            for pos, text, color in zip(coords,['State s','Reward 10','Reward 2'],[B,G,Y]):
                group.add(Circle(.69,color=color,fill_color='#152238',fill_opacity=1).move_to(pos),label(text,21,color).move_to(pos))
            group.add(label(f"p = {n['p']:.2f}",25,G).move_to([0,1.15,0]),label(f"1 - p = {1-n['p']:.2f}",25,Y).move_to([0,-.9,0]))
            alpha = m['frame']/4
            group.add(Dot((1-alpha)*(coords[0]+RIGHT*.7)+alpha*(coords[1]-RIGHT*.8),color=G,radius=.1))
        else:
            for i, v in enumerate(n['values']):
                pos=np.array([-4.8+i*2.4,.4,0])
                if i<4: group.add(Arrow(pos+RIGHT*.6,pos+RIGHT*1.8,color='#7289a6',buff=0))
                color=Y if i==4 else G if v else B
                group.add(Circle(.56,color=color,fill_color='#152238',fill_opacity=1).move_to(pos),label('goal' if i==4 else f's{i}',23,color).move_to(pos),label(f'V = {v:.3g}',24,G).move_to(pos+DOWN*1.1))
            group.add(label('One edge per synchronous Bellman sweep',23,'#b4c2d7').move_to([0,1.85,0]))
        return group

    def construct(self):
        t=self.topic
        parameter=t['parameter']
        self.add(label(f"Fixed example: {parameter['label']} = {parameter['value']}",20,Y).move_to([0,2.4,0]))
        picture, equation, stage = None, None, None
        for i,m in enumerate(t['frames']):
            metrics='; '.join(f"{v['name']}: {v['value']:.3g}" for v in m['metrics'])
            self.cue(m['caption']+'. '+metrics+'.')
            next_picture = self.network(m) if m.get('network') else self.chart(m)
            next_equation = formula(m['tex'],size=31).move_to([0,-2.42,0])
            next_stage=label(f"{i+1}/5  {m['caption']}",24,G).move_to([0,-3.12,0])
            if i == 0:
                self.play(Create(next_picture),Write(next_equation),FadeIn(next_stage),run_time=2)
            else:
                self.play(Transform(picture,next_picture),TransformMatchingTex(equation,next_equation),FadeOut(stage),FadeIn(next_stage),run_time=1.7)
            picture=next_picture if i==0 else picture
            equation,stage=next_equation,next_stage
        self.end()
