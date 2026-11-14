import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { labs } from "../src/content.js";
import { atlasTopics } from "../src/atlas-content.js";
import { labGuideHref } from "../src/atlas-labs.js";
import {
  tutorContext,
  labLessonId,
  tutorTopics,
} from "../src/tutor-context.js";
import { searchCourse } from "../server/tutor-mcp.js";

test("36 from-scratch labs cover every atlas topic with a scoped proof editorial", () => {
  assert.equal(labs.length, 36);
  assert.equal(new Set(labs.map((l) => l.id)).size, 36);
  assert.equal(new Set(labs.map((l) => l.number)).size, 36);
  assert.equal(labs.filter((l) => l.hybrid).length, 33);
  for (const topic of atlasTopics)
    assert.ok(
      labs.some((l) => l.atlasTopic === topic.id),
      topic.id,
    );
  for (const lab of labs) {
    assert.ok(
      lab.proofSteps.length >= (lab.id.startsWith("atlas-") ? 3 : 2),
      lab.id,
    );
    assert.ok(
      lab.complexity && lab.assumptions.length && lab.sources.length,
      lab.id,
    );
    assert.equal(labGuideHref(lab), "/#atlas/" + lab.atlasTopic);
    if (lab.hybrid) assert.ok(lab.proof && lab.checks.length >= 3, lab.id);
  }
});
test("every new lab has isolated tutor context and is available through course MCP search", () => {
  for (const lab of labs.filter((l) => l.id.startsWith("atlas-"))) {
    const lessonId = labLessonId(lab);
    const context = tutorContext({
      lessonId,
      labId: lab.id,
      sectionKey: "lab",
    });
    assert.equal(context.link, "/lab.html#" + lab.id);
    assert.equal(context.labId, lab.id);
    assert.equal(
      context.material.selectedContent.signature,
      `def ${lab.fn}(${lab.args}):`,
    );
    assert.ok(tutorTopics(lessonId, lab.id).some((t) => t.key === "proof"));
    assert.ok(
      !JSON.stringify(context).includes(lab.solution),
      "reference implementation is not sent automatically",
    );
    assert.equal(
      tutorContext({
        lessonId: "atlas-returns",
        labId: lab.id,
        sectionKey: "lab",
      }),
      null,
    );
  }
  assert.ok(
    searchCourse("C51 categorical projection").some(
      (s) => s.url === "/lab.html#atlas-distributional",
    ),
  );
});
function pythonInvariants(script) {
  const source =
    `import json,sys,math\nL=json.load(sys.stdin)\nF={}\nfor lab in L:\n ns={}\n exec(lab['solution'],ns)\n F[lab['id']]=ns[lab['fn']]\n` +
    script;
  execFileSync("python3", ["-c", source], {
    input: JSON.stringify(labs),
    encoding: "utf8",
  });
}
test("analytic DQN, PPO, CQL, cloning and DPO gradients agree with independent finite-difference objectives", () => {
  pythonInvariants(String.raw`
def close(x,y):
 assert abs(x-y)<1e-5*max(1,abs(y)), (x,y)
def derivative(f,x,j):
 h=1e-5
 lo,hi=x[:],x[:]
 lo[j]-=h;hi[j]+=h
 return (f(hi)-f(lo))/(2*h)
def lse(z):
 m=max(z)
 return m+math.log(sum(math.exp(x-m) for x in z))
x=[0.3,-0.4,0.8]
d=[0.2,0.5,0.3]
pen,grad=F['atlas-offline-cql'](x,d)
for j in range(3): close(grad[j],derivative(lambda z:lse(z)-sum(p*q for p,q in zip(d,z)),x,j))
loss,grad,bound=F['atlas-imitation'](x,d,10,0.1)
for j in range(3): close(grad[j],derivative(lambda z:sum(p*(lse(z)-q) for p,q in zip(d,z)),x,j))
for r,a in [(0.5,2),(1.5,2),(0.5,-2),(1.5,-2)]:
 objective,gradient=F['atlas-ppo']([r],[a],0.2)
 def f(z):
  rr=math.exp(z[0]);return min(rr*a,min(1.2,max(0.8,rr))*a)
 close(gradient[0],derivative(f,[math.log(r)],0))
p=[-2.3,-3.1];q=[-2.5,-2.7];beta=0.7
loss,gc,gr=F['atlas-dpo'](*p,*q,beta)
def f(z):
 margin=beta*((z[0]-q[0])-(z[1]-q[1]))
 return math.log1p(math.exp(-margin))
close(gc,derivative(f,p,0));close(gr,derivative(f,p,1))
weights=[[0.3,-0.2],[0.7,0.1]];xs=[[1,2],[-1,1]];actions=[0,1];rs=[1,-2];nx=[[2,1],[1,1]];done=[False,True];target=[[0.5,0.1],[-0.2,0.8]];gamma=0.9;rate=0.01
updated=F['atlas-dqn'](weights,xs,actions,rs,nx,done,target,gamma,rate)
ys=[r+gamma*(0 if d else max(sum(w*v for w,v in zip(row,n)) for row in target)) for r,n,d in zip(rs,nx,done)]
flat=sum(weights,[])
def objective(z):
 return sum((sum(z[a*2+j]*x[j] for j in range(2))-y)**2 for a,x,y in zip(actions,xs,ys))/(2*len(xs))
for a in range(2):
 for j in range(2): close((weights[a][j]-updated[a][j])/rate,derivative(objective,flat,2*a+j))
`);
});
test("returns, categorical mass, replay correction, expectiles and trust-region invariants hold beyond public fixtures", () => {
  pythonInvariants(String.raw`
def close(x,y):
 assert abs(x-y)<1e-7*max(1,abs(y)), (x,y)
for gamma in [0,0.5,0.99,1]:
 for terminals in [[False,False,False],[False,True,False],[True,False,True]]:
  rewards=[2,-1,4];values=[0.7,1.2,-0.4,3]
  targets=F['atlas-monte-carlo-td'](rewards,values,terminals,gamma,10)
  advantages,gae_targets=F['atlas-gae'](rewards,values,terminals,gamma,1)
  for a,b in zip(targets,gae_targets):close(a,b)
atoms=[-2,-1,0,1,2];p=[0.1,0.2,0.3,0.3,0.1]
for reward,gamma in [(0,1),(0.2,0.5),(-4,0.9),(0.4,0)]:
 out=F['atlas-distributional'](atoms,p,reward,gamma,False)
 close(sum(out),1);assert min(out)>=0
 clipped_mean=sum(m*min(2,max(-2,reward+gamma*z)) for z,m in zip(atoms,p))
 close(sum(z*m for z,m in zip(atoms,out)),clipped_mean)
p,w=F['atlas-prioritized-replay']([0,-4,2],0.7,1,0.01)
close(sum(pi*wi*gi for pi,wi,gi in zip(p,w,[3,-2,8])),3)
v,weights=F['atlas-offline-iql']([0,2,5],[0.2,0.3,0.5],0.8,0.6)
vv,ww=F['atlas-offline-iql']([100,102,105],[0.2,0.3,0.5],0.8,0.6)
close(vv-v,100)
for a,b in zip(weights,ww):close(a,b)
for g,f,budget in [([1,-2,3],[2,1,4],0.03),([0,0],[1,2],1)]:
 step=F['atlas-trpo'](g,f,budget)
 cost=sum(fi*xi*xi/2 for fi,xi in zip(f,step))
 assert cost<=budget+1e-12
 if any(g):close(cost,budget)
r,a=F['atlas-rubric-grpo']([[1,0.2],[0,0.7],[0.8,0.3]],[2,1],[True,False,True],0.01)
assert all(0<=x<=1 for x in r);close(sum(a),0)
`);
});
