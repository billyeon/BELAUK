import { z } from "zod";

export const CONDITIONS = ["new", "like_new", "good", "fair", "poor"] as const;

/** JSON Schema for an Anthropic tool `input_schema` (object schema, no `$schema` key). */
export function toolInputSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { target: "draft-7" }) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

export const recognitionSchema = z.object({
  category_slug: z
    .enum([
      "phones",
      "laptops",
      "audio",
      "kitchen",
      "laundry",
      "bags",
      "shoes",
      "electronics",
      "home",
      "fashion",
      "vehicles",
      "hobby",
      "other",
    ])
    .describe("Best-matching BELAUK category slug"),
  brand: z.string().nullable().describe("Brand / maker, null if unknown"),
  model: z.string().nullable().describe("Model or product name, null if unknown"),
  condition: z.enum(CONDITIONS).describe("Overall physical condition"),
  attributes: z
    .record(z.string(), z.string())
    .default({})
    .describe("Notable specifics: storage, color, size, battery health, defects"),
  confidence: z.number().min(0).max(1).describe("Overall confidence 0..1"),
  missing_shots: z
    .array(z.string())
    .default([])
    .describe("Short phrases telling the seller which extra photos would improve accuracy"),
  summary: z.string().describe("One neutral sentence describing the item"),
});
export type Recognition = z.infer<typeof recognitionSchema>;

export const listingSchema = z.object({
  title: z.string().max(80),
  description: z.string().max(1200),
});
export type Listing = z.infer<typeof listingSchema>;

export const redactionSchema = z.object({
  boxes: z
    .array(
      z.object({
        label: z.enum(["name", "phone", "address", "card_number", "order_number", "other"]),
        // Normalised 0..1 coordinates relative to the image.
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        w: z.number().min(0).max(1),
        h: z.number().min(0).max(1),
      }),
    )
    .default([]),
});
export type RedactionResult = z.infer<typeof redactionSchema>;
