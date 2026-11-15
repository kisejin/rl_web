import { DEFAULT_TUTOR_MODEL, findTutorModel } from "../src/tutor-models.js";
export function chatProviderConfig(env = process.env) {
  return {
    apiKey: env.QWENCODER_API_KEY,
    baseUrl: env.QWENCODER_BASE_URL || "https://api.qwencoder.cloud/api/v1",
    model: env.QWENCODER_MODEL || DEFAULT_TUTOR_MODEL,
  };
}
export function researchProviderConfig(env = process.env) {
  const common = chatProviderConfig(env),
    model = env.RESEARCH_SUMMARY_MODEL || "gemini-3.8-flash";
  if (!findTutorModel(model))
    throw new Error("Choose a supported research summary model");
  return { ...common, model };
}
