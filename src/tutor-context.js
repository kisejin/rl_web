import {
  paperTutorContext,
  researchLibraryContext,
  paperSections,
} from "./paper-context.js";
import { atlasTopics } from "./atlas-content.js";
import { atlasSources } from "./atlas-sources.js";
import { lessons, labs } from "./content.js";
export const tutorLessonCatalog = [
  { id: "research", title: "Research · Collected papers" },
  ...lessons,
  ...atlasTopics.map((t) => ({
    id: "atlas-" + t.id,
    title: "Atlas · " + t.title,
  })),
];
function atlasFor(id) {
  return typeof id === "string" && id.startsWith("atlas-")
    ? atlasTopics.find((t) => t.id === id.slice(6))
    : null;
}
function labMaterial(lab) {
  return {
    description: lab.desc,
    input: lab.input,
    output: lab.output,
    equation: lab.equation,
    signature: `def ${lab.fn}(${lab.args}):`,
    example: lab.example,
    hint: lab.hint,
    proof: lab.proof,
    checks: lab.checks,
    complexity: lab.complexity,
    assumptions: lab.assumptions,
  };
}
export function tutorTopics(lessonId, labId, paper) {
  if (lessonId === "research")
    return paper
      ? paperSections.map((s) => ({
          ...s,
          content: paperTutorContext(paper, s.key)?.material,
        }))
      : [
          {
            key: "overview",
            title: "Search and discuss collected papers",
            content: researchLibraryContext().material,
          },
        ];
  const advanced = atlasFor(lessonId);
  if (advanced)
    return [
      {
        key: "overview",
        title: "Concept overview",
        content: {
          summary: advanced.summary,
          symbols: advanced.symbols,
          assumptions: advanced.assumptions,
          example: advanced.example,
        },
      },
      {
        key: "intuition",
        title: "Intuition and example",
        content: {
          summary: advanced.summary,
          example: advanced.example,
          pitfall: advanced.pitfall,
        },
      },
      {
        key: "equations",
        title: "Equations and their meaning",
        content: advanced.equations,
      },
      {
        key: "equation",
        title: "The central equation",
        content: advanced.equations[0],
      },
      {
        key: "proof",
        title: advanced.derivation.claim,
        content: advanced.derivation,
      },
      {
        key: "practice",
        title: "Derivation and implementation practice",
        content: {
          practice: advanced.practice,
          check: advanced.check.question,
          assumptions: advanced.assumptions,
        },
      },
      ...(labId &&
      labs.some((l) => l.id === labId && labLessonId(l) === lessonId)
        ? [
            {
              key: "lab",
              title: "Python lab: " + labs.find((l) => l.id === labId).title,
              content: labMaterial(labs.find((l) => l.id === labId)),
            },
          ]
        : []),
    ];
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) return [];
  const topics = [
    {
      key: "overview",
      title: "Lesson overview",
      content: {
        description: lesson.desc,
        intuition: lesson.intuition,
        takeaway: lesson.takeaway,
      },
    },
    {
      key: "intuition",
      title: "Build the intuition",
      content: lesson.intuition,
    },
    ...lesson.sections.map(([title, text], i) => ({
      key: "section-" + i,
      title,
      content: text,
    })),
    { key: "equation", title: "The core equation", content: lesson.eq },
    {
      key: "proof",
      title: lesson.proofTitle,
      content: { assumptions: lesson.assume, steps: lesson.proof },
    },
    {
      key: "practice",
      title: "Proof practice",
      content: { task: lesson.proofTitle, assumptions: lesson.assume },
    },
  ];
  if (lesson.extraProof)
    topics.push({
      key: "extra-proof",
      title: lesson.extraProof.title,
      content: lesson.extraProof,
    });
  const lab = labs.find((item) => item.id === labId);
  if (lab)
    topics.push({
      key: "lab",
      title: "Python lab: " + lab.title,
      content: {
        description: lab.desc,
        input: lab.input,
        output: lab.output,
        equation: lab.equation,
        signature: `def ${lab.fn}(${lab.args}):`,
        example: lab.example,
        hint: lab.hint,
        proof: lab.proof,
        checks: lab.checks,
      },
    });
  return topics;
}
export function labLessonId(lab) {
  return (
    lab.lesson ||
    { return: "foundations", expectation: "probability", "q-learning": "td" }[
      lab.id
    ] ||
    "foundations"
  );
}
export function tutorContext({
  lessonId,
  sectionKey = "overview",
  labId,
  paperId,
  paper,
}) {
  if (lessonId === "research") {
    if (labId) return null;
    return paperId
      ? paper?.id === paperId
        ? paperTutorContext(paper, sectionKey)
        : null
      : researchLibraryContext(sectionKey);
  }
  if (paperId) return null;
  const advanced = atlasFor(lessonId);
  if (advanced) {
    const lab = labId ? labs.find((item) => item.id === labId) : null;
    if (labId && (!lab || labLessonId(lab) !== lessonId)) return null;
    const topic = tutorTopics(lessonId, labId).find(
      (t) => t.key === sectionKey,
    );
    if (!topic) return null;
    return {
      lessonId,
      ...(lab ? { labId: lab.id } : {}),
      sectionKey,
      title: advanced.title,
      sectionTitle: topic.title,
      link:
        lab && sectionKey === "lab"
          ? "/lab.html#" + lab.id
          : "/#atlas/" + advanced.id,
      material: {
        lessonTitle: advanced.title,
        selectedSection: topic.title,
        selectedContent: topic.content,
        coreEquation: advanced.equations[0].tex,
        assumptions: advanced.assumptions,
        lessonSections: advanced.equations.map((e) => [e.name, e.explain]),
        takeaway: advanced.pitfall,
        numericalExample: advanced.example,
        references: advanced.sources.map((id) => atlasSources[id]),
        illustrationNote:
          "The animation is an illustrative numerical model. Changed slider values are not sent to the tutor unless the learner shares them.",
      },
    };
  }
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) return null;
  const lab = labId ? labs.find((item) => item.id === labId) : null;
  if (labId && (!lab || labLessonId(lab) !== lessonId)) return null;
  const topic = tutorTopics(lessonId, labId).find(
    (item) => item.key === sectionKey,
  );
  if (!topic) return null;
  return {
    lessonId,
    labId: lab?.id,
    sectionKey,
    title: lesson.title,
    sectionTitle: topic.title,
    link:
      lab && sectionKey === "lab"
        ? "/lab.html#" + lab.id
        : "/#lesson/" + lessonId,
    material: {
      lessonTitle: lesson.title,
      selectedSection: topic.title,
      selectedContent: topic.content,
      coreEquation: lesson.eq,
      assumptions: lesson.assume,
      lessonSections: lesson.sections,
      takeaway: lesson.takeaway,
    },
  };
}
