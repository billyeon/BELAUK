import "server-only";
import { callTool, isAiConfigured, type ImageRef } from "./claude";
import { RECOGNIZE_SYSTEM, LISTING_SYSTEM, REDACT_SYSTEM, listingUserPrompt } from "./prompts";
import {
  recognitionSchema,
  listingSchema,
  redactionSchema,
  toolInputSchema,
  type Recognition,
  type Listing,
  type RedactionResult,
} from "./schema";

const MOCK_RECOGNITION: Recognition = {
  category_slug: "phones",
  brand: null,
  model: null,
  condition: "good",
  attributes: {},
  confidence: 0.2,
  missing_shots: ["Photo of the back", "Screen turned on", "Close-up of the brand/model label"],
  summary: "Could not recognise the item automatically — please fill in the details.",
};

export async function recognizeItem(images: ImageRef[]): Promise<{
  data: Recognition;
  model: string;
  modelVersion: string | null;
}> {
  if (!isAiConfigured()) {
    return { data: MOCK_RECOGNITION, model: "mock:no-key", modelVersion: null };
  }
  try {
    const res = await callTool({
      system: RECOGNIZE_SYSTEM,
      images: images.slice(0, 6),
      toolName: "report_item",
      toolDescription:
        "Report the recognised item's category, brand, model, condition and attributes.",
      jsonSchema: toolInputSchema(recognitionSchema),
      schema: recognitionSchema,
      maxTokens: 1200,
    });
    return { data: res.data, model: res.model, modelVersion: res.modelVersion };
  } catch (e) {
    // AI is best-effort (PRD: the user can always edit). Degrade instead of failing the flow.
    console.error("recognizeItem fell back to mock:", e instanceof Error ? e.message : e);
    return { data: MOCK_RECOGNITION, model: "mock:error", modelVersion: null };
  }
}

export async function generateListing(facts: Parameters<typeof listingUserPrompt>[0]): Promise<{
  data: Listing;
  model: string;
}> {
  const fallback = () => {
    const name = [facts.brand, facts.model].filter(Boolean).join(" ") || "Item";
    const attrs = Object.entries(facts.attributes)
      .map(([k, v]) => `${k}: ${v}`)
      .join(". ");
    return {
      data: {
        title: name,
        description: `${name}. Condition: ${facts.condition}.${attrs ? ` ${attrs}.` : ""}`.trim(),
      },
      model: "mock",
    };
  };
  if (!isAiConfigured()) return fallback();
  try {
    const res = await callTool({
      system: LISTING_SYSTEM,
      text: listingUserPrompt(facts),
      toolName: "write_listing",
      toolDescription: "Write the marketplace listing title and description.",
      jsonSchema: toolInputSchema(listingSchema),
      schema: listingSchema,
      maxTokens: 800,
    });
    return { data: res.data, model: res.model };
  } catch (e) {
    console.error("generateListing fell back:", e instanceof Error ? e.message : e);
    return fallback();
  }
}

export async function detectRedactions(image: ImageRef): Promise<RedactionResult> {
  if (!isAiConfigured()) return { boxes: [] };
  try {
    const res = await callTool({
      system: REDACT_SYSTEM,
      images: [image],
      toolName: "report_redactions",
      toolDescription: "Report bounding boxes covering personal / sensitive info.",
      jsonSchema: toolInputSchema(redactionSchema),
      schema: redactionSchema,
      maxTokens: 700,
    });
    return res.data;
  } catch (e) {
    console.error("detectRedactions fell back:", e instanceof Error ? e.message : e);
    return { boxes: [] };
  }
}
