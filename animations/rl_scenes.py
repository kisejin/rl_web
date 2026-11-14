"""Original RL Atlas films rendered with Manim Community (MIT).

No 3Blue1Brown footage or artwork is used. Reproduce with render.py.
These are deliberately small, explicit mathematical examples, not training runs.
"""
from pathlib import Path
import json
import math
import os
import numpy as np
from manim import *

BG = "#0b1020"
B, G, Y, P = "#65b9ff", "#74e0bd", "#f7cf72", "#ef91b8"
OUT = Path(os.environ.get("RL_FILM_OUTPUT", "public/animations/manim"))

def fit(mobject, width=12.2):
    if mobject.width > width:
        mobject.scale_to_fit_width(width)
    return mobject

def formula(*parts, size=40):
    return fit(MathTex(*parts, font_size=size))

def stamp(seconds):
    millis = round(seconds * 1000)
    h, millis = divmod(millis, 3600000)
    m, millis = divmod(millis, 60000)
    s, ms = divmod(millis, 1000)
    return f"{h:02}:{m:02}:{s:02}.{ms:03}"

class AtlasFilm(Scene):
    film_id = "base"
    film_title = "RL Atlas"

    def setup(self):
        self.camera.background_color = BG
        self.cues = []
        title = fit(Text(self.film_title, font_size=37, weight=BOLD, color=WHITE), 12)
        title.to_edge(UP, buff=.5)
        self.add(title, Line(LEFT*6.1, RIGHT*6.1, color=B, stroke_opacity=.3).shift(UP*2.65))

    def cue(self, text):
        # Keep every caption readable before advancing to the next idea.
        if self.cues:
            elapsed = float(self.renderer.time) - self.cues[-1][0]
            if elapsed < 4:
                self.wait(4 - elapsed)
        self.cues.append((float(self.renderer.time), text))

    def end(self):
        remaining = max(1.5, 4 - (float(self.renderer.time) - self.cues[-1][0]))
        self.wait(remaining)

    def tear_down(self):
        OUT.mkdir(parents=True, exist_ok=True)
        duration = float(self.renderer.time)
        vtt = "WEBVTT\n\n"
        for i, (start, text) in enumerate(self.cues):
            end = self.cues[i+1][0] if i+1<len(self.cues) else duration
            vtt += f"{i+1}\n{stamp(start)} --> {stamp(end)}\n{text}\n\n"
        (OUT / f"{self.film_id}.vtt").write_text(vtt)
        (OUT / f"{self.film_id}.json").write_text(json.dumps({
            "id": self.film_id, "title": self.film_title,
            "duration": round(duration, 3), "renderer": "Manim Community",
            "chapters": [{"time": round(t,3), "text": s} for t,s in self.cues],
        }, indent=2))
        super().tear_down()

class DiscountedReturn(AtlasFilm):
    film_id, film_title = "foundations", "A reward now. A reward later."
    def construct(self):
        self.cue("An episode produces rewards 1, 2, 3, and 4. Return combines their consequences.")
        rewards = VGroup(*[formula(str(i),size=54).set_color(c) for i,c in zip([1,2,3,4],[B,G,Y,P])]).arrange(RIGHT,buff=1.6).shift(UP*.7)
        names=VGroup(*[formula(f"r_{i}",size=28).next_to(r,DOWN,buff=.4) for i,r in enumerate(rewards,1)])
        self.play(LaggedStart(*[Write(x) for x in rewards],lag_ratio=.3),FadeIn(names),run_time=2)
        self.wait(1)
        self.cue("At gamma = 0.8, each later reward receives another power of the discount.")
        expanded=formula("G_0", "=", "1", "+", r"\gamma\,2", "+", r"\gamma^2\,3", "+", r"\gamma^3\,4").shift(DOWN*1.1)
        expanded.set_color_by_tex("G_0",G).set_color_by_tex(r"\gamma",Y)
        self.play(Write(expanded),run_time=2)
        weights=[1,1.6,1.92,2.048]
        bars=VGroup(*[Rectangle(width=.7,height=v*.6,fill_color=c,fill_opacity=.8,stroke_width=0).move_to(np.array([x,-.05+v*.3,0])) for x,v,c in zip([-3.9,-1.3,1.3,3.9],weights,[B,G,Y,P])])
        self.play(FadeOut(rewards),FadeOut(names),LaggedStart(*[GrowFromEdge(x,DOWN) for x in bars],lag_ratio=.2),run_time=2)
        self.cue("The discounted contributions are 1, 1.6, 1.92, and 2.048. Their sum is 6.568.")
        numeric=formula("G_0", "=", "1", "+", "1.6", "+", "1.92", "+", "2.048").move_to(expanded)
        numeric.set_color_by_tex("G_0",G)
        self.play(TransformMatchingTex(expanded,numeric),run_time=2)
        total=formula("G_0", "=", "6.568",size=54).set_color(G).move_to(numeric)
        self.play(TransformMatchingTex(numeric,total),Circumscribe(bars,color=Y),run_time=2)
        self.cue("Reward is immediate feedback. Return is the discounted sum across time.")
        self.wait(2); self.end()

class ExpectedReward(AtlasFilm):
    film_id, film_title = "probability", "Expectation is a moving balance point"
    def construct(self):
        self.cue("There are two outcomes: zero or ten. Probability determines their weighted average.")
        p=ValueTracker(.25)
        baseline=Line(LEFT*5,RIGHT*5,color=GRAY).shift(DOWN*.4)
        rects=always_redraw(lambda: VGroup(*[Rectangle(width=1.5,height=max(.01,3*v),fill_opacity=.8,fill_color=c,stroke_width=0).move_to([x,-.4+1.5*v,0]) for v,c,x in [(1-p.get_value(),B,-3),(p.get_value(),G,3)]]))
        labels=VGroup(Text("Reward 0",font_size=27).move_to([-3,-.9,0]),Text("Reward 10",font_size=27).move_to([3,-.9,0]))
        eq=formula(r"\mathbb E[R]", "=", r"(1-p)\,0", "+", r"p\,10").shift(DOWN*1.8)
        eq.set_color_by_tex("p",Y)
        self.play(Create(baseline),FadeIn(rects),Write(labels),Write(eq),run_time=2)
        scale=NumberLine(x_range=[0,10,2],length=10,include_numbers=True,font_size=24,label_direction=UP).shift(UP*2)
        dot=always_redraw(lambda: Dot(scale.n2p(10*p.get_value()),color=Y,radius=.12))
        self.play(Create(scale),FadeIn(dot),run_time=1.5)
        value=always_redraw(lambda: DecimalNumber(10*p.get_value(),num_decimal_places=2,font_size=40,color=Y).next_to(eq,DOWN,buff=.25))
        self.add(value);self.wait(1)
        self.cue("At p = 0.25 the expectation is 2.5. It need not be an outcome you can observe.")
        self.wait(2)
        self.cue("Increase p to 0.75. Mass moves to the ten-point outcome and the balance point moves to 7.5.")
        self.play(p.animate.set_value(.75),run_time=4,rate_func=smooth)
        self.cue("At equal probabilities, the expectation is 5. The probabilities always sum to one.")
        self.play(p.animate.set_value(.5),run_time=3);self.end()

class MarkovTransition(AtlasFilm):
    film_id, film_title = "mdp", "One action. Two possible futures."
    def construct(self):
        self.cue("Fix one action in the current state. The transition model branches into two outcomes.")
        coords=[[-4,0,0],[3,1.4,0],[3,-1.1,0]]
        nodes=VGroup(*[Circle(.58,color=c,fill_color=c,fill_opacity=.14).move_to(pos) for c,pos in zip([B,G,P],coords)])
        labels=VGroup(*[formula(x,size=35).move_to(n) for x,n in zip(["s_0","A","B"],nodes)])
        a=Arrow(nodes[0].get_right(),nodes[1].get_left(),buff=.15,color=G)
        b=Arrow(nodes[0].get_right(),nodes[2].get_left(),buff=.15,color=P)
        weights=VGroup(formula("0.7",size=32).set_color(G).next_to(a.get_center(),UP),formula("0.3",size=32).set_color(P).next_to(b.get_center(),DOWN))
        rewards=VGroup(formula("+10",size=36).set_color(G).next_to(nodes[1],RIGHT),formula("-5",size=36).set_color(P).next_to(nodes[2],RIGHT))
        self.play(Create(nodes),Write(labels),GrowArrow(a),GrowArrow(b),Write(weights),Write(rewards),run_time=2.5)
        self.cue("Branch A has probability 0.7 and reward +10. Branch B has probability 0.3 and reward -5.")
        tracer=Dot(a.get_start(),color=Y,radius=.12);self.add(tracer)
        self.play(MoveAlongPath(tracer,a),run_time=2)
        self.play(tracer.animate.move_to(b.get_start()),run_time=.4)
        self.play(MoveAlongPath(tracer,b),run_time=2)
        self.cue("An expectation includes both futures, not only the most likely one.")
        eq=formula(r"\mathbb E[R\mid s_0,a]", "=", "0.7(10)", "+", "0.3(-5)").shift(DOWN*2.35)
        eq.set_color_by_tex("0.7",G).set_color_by_tex("0.3",P)
        self.play(Write(eq),run_time=2)
        answer=formula(r"\mathbb E[R\mid s_0,a]", "=", "5.5").set_color(Y).move_to(eq)
        self.play(TransformMatchingTex(eq,answer),run_time=2)
        self.cue("The transition probabilities sum to one. A Markov state contains the information needed to predict the next step.")
        self.wait(2);self.end()

class BellmanContraction(AtlasFilm):
    film_id, film_title = "bellman", "Two guesses. One fixed point."
    def construct(self):
        self.cue("Consider one state with reward 1 and a deterministic self-loop. Set gamma to 0.75.")
        eq=formula("T(V)","=","1", "+", "0.75V").shift(UP*1.8)
        self.play(Write(eq),run_time=1.5)
        scale=NumberLine(x_range=[0,12,2],length=11,include_numbers=True,font_size=26).shift(DOWN*.1)
        a,b=ValueTracker(0),ValueTracker(12)
        dots=always_redraw(lambda:VGroup(Dot(scale.n2p(a.get_value()),color=B,radius=.13),Dot(scale.n2p(b.get_value()),color=P,radius=.13)))
        bracket=always_redraw(lambda:Line(scale.n2p(a.get_value())+UP*.6,scale.n2p(b.get_value())+UP*.6,color=Y,stroke_width=4))
        gap=always_redraw(lambda:DecimalNumber(b.get_value()-a.get_value(),num_decimal_places=2,color=Y,font_size=40).move_to(UP*1.05))
        fixed=DashedLine(scale.n2p(4)+UP*.15,scale.n2p(4)+UP*.8,color=G)
        label=formula("V^*=4",size=34).set_color(G).move_to(scale.n2p(4)+DOWN*1.2)
        self.play(Create(scale),FadeIn(dots),Create(fixed),Write(label),FadeIn(bracket),FadeIn(gap),run_time=2)
        self.cue("Start from guesses zero and twelve. Each Bellman backup multiplies their separation by gamma.")
        for k in range(5):
            self.play(a.animate.set_value(1+.75*a.get_value()),b.animate.set_value(1+.75*b.get_value()),run_time=1.3,rate_func=smooth)
            self.wait(.2)
        self.cue("Both estimates approach four. The distance contracts even though their initial guesses differ.")
        bound=formula(r"\|T V-T W\|_\infty",r"\leq",r"\gamma\|V-W\|_\infty",size=36).shift(DOWN*2.2)
        bound.set_color_by_tex(r"\gamma",Y)
        self.play(Write(bound),run_time=2)
        self.cue("For a finite discounted MDP, the same contraction inequality gives a unique value function and convergence.")
        self.wait(2);self.end()

class ValuePropagation(AtlasFilm):
    film_id, film_title = "dp", "Let value travel backward"
    def construct(self):
        self.cue("Five states form a deterministic chain. Only entering the terminal state gives reward +10.")
        nodes=VGroup(*[RoundedRectangle(width=1.55,height=1.3,corner_radius=.15,color=G if i==4 else B,fill_opacity=.12,fill_color=G if i==4 else B).move_to([-4.8+i*2.4,.4,0]) for i in range(5)])
        arrows=VGroup(*[Arrow(nodes[i].get_right(),nodes[i+1].get_left(),buff=.1,color=GRAY) for i in range(4)])
        vals=[0,0,0,0,0]
        labels=VGroup(*[formula("0",size=40).move_to(n) for n in nodes])
        terminal=Text("TERMINAL",font_size=20,color=G).next_to(nodes[-1],DOWN)
        reward=formula("+10",size=30).set_color(Y).next_to(arrows[-1],UP)
        self.play(Create(nodes),LaggedStart(*[GrowArrow(a) for a in arrows],lag_ratio=.2),Write(labels),Write(terminal),Write(reward),run_time=2.5)
        sweep=Text("Sweep 0",font_size=30,color=Y).shift(UP*1.9);self.add(sweep)
        self.cue("Initialize every value to zero. Terminal continuation value stays zero.")
        self.wait(1.5)
        for k in range(1,5):
            vals=[0 if i==4 else 10 if i==3 else .9*vals[i+1] for i in range(5)]
            new=VGroup(*[formula(f"{v:.2f}",size=32).set_color(G if v else WHITE).move_to(n) for v,n in zip(vals,nodes)])
            newsweep=Text(f"Sweep {k}",font_size=30,color=Y).move_to(sweep)
            self.cue(f"Sweep {k}: all new values read the previous sweep. Reward information moves back one edge.")
            self.play(Transform(labels,new),Transform(sweep,newsweep),Indicate(arrows[4-k],color=Y),run_time=1.7)
            self.wait(.5)
        self.cue("The start value is gamma cubed times ten: 7.29. This is synchronous dynamic programming.")
        eq=formula("V(s_0)","=",r"\gamma^3\cdot10","=","7.29").set_color(G).shift(DOWN*1.9)
        self.play(Write(eq),run_time=2);self.end()

class TemporalDifference(AtlasFilm):
    film_id, film_title = "td", "A target. An error. An update."
    def construct(self):
        self.cue("A sample gives reward 1 and next-state estimate 4. Current V is 2 and gamma is 0.9.")
        scale=NumberLine(x_range=[0,5,1],length=10,include_numbers=True,font_size=26).shift(DOWN*.1)
        estimate=ValueTracker(2)
        dot=always_redraw(lambda:Dot(scale.n2p(estimate.get_value()),color=B,radius=.14))
        self.play(Create(scale),FadeIn(dot),run_time=1.5)
        target=Dot(scale.n2p(4.6),color=Y,radius=.14)
        target_eq=formula("y", "=", "1+0.9(4)","=","4.6").set_color(Y).shift(UP*1.7)
        self.cue("For a nonterminal transition, bootstrap: target equals 1 plus 0.9 times 4, or 4.6.")
        self.play(Write(target_eq),FadeIn(target),run_time=2)
        error=Arrow(scale.n2p(2)+UP*.5,scale.n2p(4.6)+UP*.5,color=P,buff=0)
        delta=formula(r"\delta", "=", "4.6-2", "=", "2.6").set_color(P).shift(DOWN*1.5)
        self.cue("The TD error is 2.6. Its sign tells the estimate which way to move.")
        self.play(GrowArrow(error),Write(delta),run_time=2)
        self.cue("With learning rate 0.5, move halfway toward the target: new V equals 3.3.")
        updated=formula("V_{new}","=","2+0.5(2.6)","=","3.3").set_color(G).move_to(delta)
        self.play(estimate.animate.set_value(3.3),TransformMatchingTex(delta,updated),run_time=3)
        self.cue("If the transition is terminal, there is no future value. The target becomes the immediate reward, 1.")
        terminal=formula("y_{terminal}","=","r","=","1").set_color(Y).move_to(target_eq)
        self.play(TransformMatchingTex(target_eq,terminal),target.animate.move_to(scale.n2p(1)),FadeOut(error),run_time=2)
        self.wait(2);self.end()

class PolicyGradient(AtlasFilm):
    film_id, film_title = "policy", "Feedback becomes probability"
    def construct(self):
        self.cue("Start with equal action probabilities, obtained by softmax of logits zero and zero.")
        p=ValueTracker(.5)
        base=Line(LEFT*4.5,RIGHT*4.5,color=GRAY).shift(DOWN*.6)
        bars=always_redraw(lambda:VGroup(*[Rectangle(width=1.8,height=3*v,fill_color=c,fill_opacity=.85,stroke_width=0).move_to([x,-.6+1.5*v,0]) for v,c,x in [(p.get_value(),B,-2.3),(1-p.get_value(),P,2.3)]]))
        labels=VGroup(Text("ACTION A",font_size=26,color=B).move_to([-2.3,-1.1,0]),Text("ACTION B",font_size=26,color=P).move_to([2.3,-1.1,0]))
        self.play(Create(base),FadeIn(bars),Write(labels),run_time=2)
        selected=Text("Sample A: reward 1, baseline 0",font_size=29,color=Y).shift(UP*2)
        self.cue("Observe one sample: action A received reward 1, with baseline zero.")
        self.play(Write(selected),run_time=1.5)
        grad=formula(r"\nabla_z\log\pi(A)","=","[1,0]-[0.5,0.5]","=","[0.5,-0.5]",size=34).shift(DOWN*2)
        self.cue("The REINFORCE score-function gradient is one-hot A minus the probability vector.")
        self.play(Write(grad),run_time=2)
        self.wait(1)
        self.cue("With learning rate one, logits become 0.5 and -0.5. Softmax now assigns A probability about 0.731.")
        new=formula("z'","=","[0.5,-0.5]",r",\quad\pi'(A)","=","0.731",size=36).move_to(grad)
        self.play(TransformMatchingTex(grad,new),p.animate.set_value(1/(1+math.exp(-1))),run_time=3)
        self.cue("This is a single sampled update. It increases the rewarded action's probability, not a guarantee of overall improvement.")
        self.wait(2);self.end()

class PotentialShaping(AtlasFilm):
    film_id, film_title = "reward", "A sum that cancels itself"
    def construct(self):
        self.cue("Potential shaping adds F = gamma times next potential minus current potential.")
        definition=formula("F_t", "=",r"\gamma\Phi(s_{t+1})", "-",r"\Phi(s_t)").shift(UP*1.7)
        definition.set_color_by_tex(r"\Phi",B)
        self.play(Write(definition),run_time=2)
        terms=["G'-G", "=",r"-\Phi_0",r"+\gamma\Phi_1",r"-\gamma\Phi_1",r"+\gamma^2\Phi_2",r"-\gamma^2\Phi_2",r"+\gamma^3\Phi_3"]
        total=formula(*terms,size=30)
        for i in [3,4]:total[i].set_color(G)
        for i in [5,6]:total[i].set_color(Y)
        self.cue("Expand the discounted shaping rewards over three transitions. Keep the terminal boundary term.")
        self.play(LaggedStart(*[Write(x) for x in total],lag_ratio=.25),run_time=3)
        self.wait(1)
        self.cue("The middle potential terms appear once positively and once negatively. They cancel pair by pair.")
        crosses=VGroup(*[Cross(total[i],stroke_color=P,stroke_width=3) for i in [3,4,5,6]])
        self.play(Create(crosses),run_time=1.5)
        terminal=formula(r"\Phi_3=0",size=35).set_color(G).shift(DOWN*1.5)
        self.cue("For this finite episode, terminal potential is zero. Only minus the starting potential remains.")
        self.play(Write(terminal),run_time=1.5)
        short=formula("G'-G","=",r"-\Phi_0",size=48).set_color(G)
        self.play(FadeOut(crosses),TransformMatchingTex(total,short),run_time=2)
        result=formula(r"V'^{\pi}(s)","=",r"V^\pi(s)","-",r"\Phi(s)",size=40).move_to(definition)
        self.cue("For a fixed starting state, every policy has the same shift. Policy ordering is preserved under these assumptions.")
        self.play(TransformMatchingTex(definition,result),run_time=2)
        self.wait(2);self.end()

class RubricReward(AtlasFilm):
    film_id, film_title = "rubric", "Make every part of reward visible"
    def construct(self):
        self.cue("A rubric separates correctness, reasoning, and clarity. Here the scores are 0.9, 0.5, and 0.8.")
        xs=[-4,0,4];colors=[B,G,Y]
        titles=VGroup(*[Text(s,font_size=25,color=c).move_to([x,1.7,0]) for s,c,x in zip(["CORRECTNESS","REASONING","CLARITY"],colors,xs)])
        scores=VGroup(*[formula(s,size=53).set_color(c).move_to([x,.6,0]) for s,c,x in zip(["0.9","0.5","0.8"],colors,xs)])
        self.play(Write(titles),LaggedStart(*[Write(x) for x in scores],lag_ratio=.3),run_time=2)
        weights=VGroup(*[formula(s,size=31).move_to([x,-.4,0]) for s,x in zip([r"\times0.5",r"\times0.3",r"\times0.2"],xs)])
        self.cue("Apply weights 0.5, 0.3, and 0.2. Nonnegative weights sum to one.")
        self.play(Write(weights),run_time=1.5)
        parts=VGroup(*[formula(s,size=48).set_color(c).move_to([x,.6,0]) for s,c,x in zip(["0.45","0.15","0.16"],colors,xs)])
        contribution_label=Text("Weighted contributions",font_size=26,color=GRAY_A).shift(DOWN*.4)
        self.play(Transform(scores,parts),FadeOut(weights),FadeIn(contribution_label),run_time=2)
        eq=formula("R","=","g",r"(0.45+0.15+0.16)",size=38).shift(DOWN*1.9)
        self.cue("The weighted score is 0.76. A passing hard gate retains this score.")
        self.play(Write(eq),run_time=2)
        passed=formula("R","=","1",r"\cdot0.76","=","0.76",size=44).set_color(G).move_to(eq)
        self.play(TransformMatchingTex(eq,passed),run_time=2)
        self.cue("A failed essential criterion sets the hard gate to zero and the final reward to zero.")
        failed=formula("R","=","0",r"\cdot0.76","=","0",size=44).set_color(P).move_to(eq)
        self.play(TransformMatchingTex(passed,failed),run_time=2)
        self.cue("Bounded scores and normalized weights do not guarantee a trustworthy judge or eliminate reward hacking.")
        self.wait(2);self.end()

class KLRegularization(AtlasFilm):
    film_id, film_title = "kl", "Reward pulls. KL pulls back."
    def construct(self):
        self.cue("A reference policy gives both answers probability 0.5. The current policy gives A probability 0.8.")
        p=ValueTracker(.8)
        bars=always_redraw(lambda:VGroup(*[Rectangle(width=1.7,height=3*v,fill_color=c,fill_opacity=.85,stroke_width=0).move_to([x,-1+1.5*v,0]) for v,c,x in [(p.get_value(),B,-2.5),(1-p.get_value(),P,2.5)]]))
        ref=DashedLine([-4.5,.5,0],[4.5,.5,0],color=G)
        label=formula("q=0.5",size=28).set_color(G).next_to(ref,RIGHT,buff=.15)
        self.play(FadeIn(bars),Create(ref),Write(label),run_time=2)
        kl=.8*math.log(1.6)+.2*math.log(.4)
        eq=formula(r"D_{KL}(\pi\|q)","=",r"0.8\log1.6+0.2\log0.4","=","0.1927",size=32).shift(UP*2)
        self.cue("KL averages weighted log-ratios. A contribution can be negative, while total KL is nonnegative.")
        self.play(Write(eq),run_time=2)
        objective=formula("J","=",r"\mathbb E[R]","-",r"\beta D_{KL}(\pi\|q)",size=37).shift(DOWN*1.6)
        objective.set_color_by_tex(r"\beta",Y)
        self.cue("Optimize expected rubric reward minus beta times KL from the reference.")
        self.play(Write(objective),run_time=2)
        self.cue("With beta zero, an exact gradient step increases A's probability from 0.8 to about 0.846.")
        low=1/(1+math.exp(-(math.log(4)+2*.16)))
        self.play(p.animate.set_value(low),run_time=2.5)
        self.wait(.8)
        self.cue("Return to the same starting policy. With beta two, the KL penalty reverses the update direction.")
        self.play(p.animate.set_value(.8),run_time=.8)
        gradient=.8*(.2-2*(math.log(1.6)-kl))
        high=1/(1+math.exp(-(math.log(4)+2*gradient)))
        penalty=formula(r"\beta=2",r",\quad\partial_{z_A}J=-0.2836",size=34).set_color(Y).move_to(eq)
        self.play(TransformMatchingTex(eq,penalty),p.animate.set_value(high),run_time=3)
        self.cue("Both steps use exact gradients for a finite two-answer bandit. This illustrates regularization, not full LLM training.")
        self.wait(2);self.end()
