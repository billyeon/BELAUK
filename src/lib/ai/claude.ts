import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export type ImageRef = { url: string } | { base64: string; mediaType: string };

type ToolCallArgs<T> = {
  system: string;
  text?: string;
  images?: ImageRef[];
  toolName: string;
  toolDescription: string;
  jsonSchema: Record<string, unknown>;
  schema: z.ZodType<T>;
  maxTokens?: number;
};

export type ToolCallResult<T> = {
  data: T;
  raw: unknown;
  model: string;
  modelVersion: string | null;
};

/** Call Claude, force a single tool call, validate its input against `schema`. */
export async function callTool<T>(args: ToolCallArgs<T>): Promise<ToolCallResult<T>> {
  const content: Anthropic.ContentBlockParam[] = [];
  for (const img of args.images ?? []) {
    content.push({
      type: "image",
      source:
        "url" in img
          ? { type: "url", url: img.url }
          : { type: "base64", media_type: img.mediaType as "image/jpeg", data: img.base64 },
    });
  }
  if (args.text) content.push({ type: "text", text: args.text });
  if (content.length === 0) content.push({ type: "text", text: "(no content)" });

  const message = await getClient().messages.create({
    model: AI_MODEL,
    max_tokens: args.maxTokens ?? 1024,
    system: args.system,
    tools: [
      {
        name: args.toolName,
        description: args.toolDescription,
        input_schema: args.jsonSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: args.toolName },
    messages: [{ role: "user", content }],
  });

  const toolUse = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!toolUse) throw new Error("Claude did not return a tool call");

  const data = args.schema.parse(toolUse.input);
  return {
    data,
    raw: toolUse.input,
    model: message.model,
    modelVersion: (message as { model?: string }).model ?? null,
  };
}
