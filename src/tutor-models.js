// API IDs verified against the provider's model catalog on 2026-11-14:
// https://www.qwencoder.cloud/models?usagePackageId=6a3c217ae8bba3ee79f177f2
// Shared by the UI and server; credentials never belong in this catalog.
export const DEFAULT_TUTOR_MODEL = "qwen3.8-flash";
export const tutorModels = [
  { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash" },
  { id: "qwen3.8-flash", name: "Qwen 3.8 Flash" },
  { id: "qwen3.5-122b-10b", name: "Qwen 3.5 122B" },
  { id: "qwen3.6-27b", name: "Qwen 3.6 27B" },
  { id: "deepseek-v4.1-flash-1017", name: "Deepseek V4.1 Flash" },
  { id: "qwen3.7-max", name: "Qwen 3.7 Max" },
  { id: "kimi-2.7-code", name: "Kimi 2.7 Code" },
  { id: "glm-5.3-flash", name: "GLM 5.3 Flash" },
  { id: "mimo-2.6-flash", name: "Mimo 2.6 Flash" },
  { id: "gpt-6.1-terra", name: "GPT 6.1 Terra" },
  { id: "glm-5.3", name: "GLM-5.3" },
  { id: "qwen3.8-max", name: "Qwen 3.8 Max" },
  { id: "claude-haiku-5-5", name: "Claude Haiku 5.5" },
];
export function findTutorModel(id) {
  return tutorModels.find((model) => model.id === id);
}
