import { lessons, labs } from "./content.js";
export function tutorTopics(lessonId, labId) {
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
export function tutorContext({ lessonId, sectionKey = "overview", labId }) {
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
