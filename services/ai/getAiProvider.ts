import { mockAiProvider } from "@/services/ai/mockProvider";
import { AiProviderError, type AiProvider } from "@/services/ai/provider";

export function getAiProvider(providerName = process.env.HTTPMAKER_AI_PROVIDER ?? "mock"): AiProvider {
  if (providerName === "mock") return mockAiProvider;
  throw new AiProviderError("PROVIDER_UNAVAILABLE", `AI provider "${providerName}" is not available.`);
}
