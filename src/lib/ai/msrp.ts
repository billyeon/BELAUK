import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AI_MODEL, isAiConfigured } from "./claude";
import { toMmk } from "@/lib/pricing/depreciation";

/** Rough per-unit costs for the monthly budget guard (USD). Update with pricing. */
const COST = {
  perSearch: 0.01,
  inputPerMTok: 3,
  outputPerMTok: 15,
};

export const MSRP_SYSTEM = `You research the ORIGINAL NEW / LAUNCH price of a consumer product for a Myanmar (Yangon) second-hand marketplace.

Use the web_search tool to find the manufacturer's official price, an authorised retailer's price, or a well-known launch price. Prefer, in order:
1. A price quoted in Myanmar Kyat (MMK / Ks) from a Myanmar retailer or news/tech site.
2. The official launch price in USD from the manufacturer or a reputable global source (GSMArena, The Verge, official newsroom, major retailer).

Hard rules:
- Only use pages a normal search engine returns. Never anything requiring a login. Do not use facebook.com, instagram.com, tiktok.com.
- This is the NEW price, not a used/second-hand price.
- If you cannot find a credible new price, set found=false. Do NOT guess or approximate a number.
- Give the single best source: its URL, page title, and the observation/launch date or year.
- Keep note short (<= 120 chars), e.g. "iPhone 11 64GB launch price, Apple, Sep 2019".

Finish by calling the "report_msrp" tool exactly once.`;

export const msrpReportSchema = z.object({
  found: z.boolean().describe("true only if a credible NEW price was found"),
  currency: z
    .string()
    .nullable()
    .describe("ISO code of the price you report, e.g. USD, MMK. null if not found"),
  amount: z
    .number()
    .positive()
    .nullable()
    .describe("The new price as a number in `currency`. null if not found"),
  amount_mmk: z
    .number()
    .positive()
    .nullable()
    .describe("Only if the source itself quotes MMK. Otherwise null (server converts)."),
  source_url: z.string().nullable(),
  source_title: z.string().nullable(),
  as_of: z.string().nullable().describe("Launch year or observation date, e.g. '2019' or '2026-03'"),
  note: z.string().nullable(),
});
export type MsrpReport = z.infer<typeof msrpReportSchema>;

export type MsrpWebResult = {
  report: MsrpReport;
  msrpMmk: number | null;
  fxRate: number | null;
  cost: { searches: number; inputTokens: number; outputTokens: number; usd: number };
  aiModel: string;
};

function jsonSchema(): Record<string, unknown> {
  const s = z.toJSONSchema(msrpReportSchema, { target: "draft-7" }) as Record<string, unknown>;
  delete s.$schema;
  return s;
}

/** One Claude call with server-side web search. Never throws — returns found:false on any error. */
export async function lookupMsrpViaWeb(args: {
  brand: string;
  model: string;
  categorySlug: string | null;
  attributes?: Record<string, string>;
}): Promise<MsrpWebResult> {
  const empty: MsrpWebResult = {
    report: {
      found: false,
      currency: null,
      amount: null,
      amount_mmk: null,
      source_url: null,
      source_title: null,
      as_of: null,
      note: null,
    },
    msrpMmk: null,
    fxRate: null,
    cost: { searches: 0, inputTokens: 0, outputTokens: 0, usd: 0 },
    aiModel: AI_MODEL,
  };
  if (!isAiConfigured()) return empty;

  const spec = Object.entries(args.attributes ?? {})
    .filter(([k]) => /storage|capacity|gb|tb|ram|size|model|variant|year/i.test(k))
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const prompt = [
    `Product: ${args.brand} ${args.model}`,
    args.categorySlug ? `Category: ${args.categorySlug}` : null,
    spec ? `Variant details: ${spec}` : null,
    "",
    "Find its original NEW / launch price. Search the web, then call report_msrp.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      system: MSRP_SYSTEM,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 4,
          // Anthropic web search does not support a Myanmar user_location, so we
          // steer toward MMK / Myanmar sources through the prompt instead.
          blocked_domains: [
            "facebook.com",
            "m.facebook.com",
            "instagram.com",
            "threads.net",
            "tiktok.com",
            "twitter.com",
            "x.com",
          ],
        },
        {
          name: "report_msrp",
          description: "Report the researched new / launch price (or found=false).",
          input_schema: jsonSchema() as Anthropic.Tool.InputSchema,
        },
      ],
      messages: [{ role: "user", content: prompt }],
    });

    const searches = msg.usage?.server_tool_use?.web_search_requests ?? 0;
    const inputTokens = msg.usage?.input_tokens ?? 0;
    const outputTokens = msg.usage?.output_tokens ?? 0;
    const usd =
      searches * COST.perSearch +
      (inputTokens / 1_000_000) * COST.inputPerMTok +
      (outputTokens / 1_000_000) * COST.outputPerMTok;
    const cost = { searches, inputTokens, outputTokens, usd: Number(usd.toFixed(4)) };

    const toolUse = msg.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "report_msrp",
    );
    let report: MsrpReport | null = null;
    if (toolUse) {
      const parsed = msrpReportSchema.safeParse(toolUse.input);
      if (parsed.success) report = parsed.data;
    }
    if (!report) {
      // fallback: a JSON object embedded in a text block
      const text = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = msrpReportSchema.safeParse(JSON.parse(m[0]));
        if (parsed.success) report = parsed.data;
      }
    }
    if (!report || !report.found) {
      return { ...empty, report: report ?? empty.report, cost, aiModel: msg.model };
    }

    // Normalise to MMK.
    let msrpMmk: number | null = null;
    let fxRate: number | null = null;
    if (report.amount_mmk && report.amount_mmk > 0) {
      msrpMmk = Math.round(report.amount_mmk);
      fxRate = 1;
    } else if (report.currency && report.amount) {
      const cur = report.currency.toUpperCase();
      if (cur === "MMK") {
        msrpMmk = Math.round(report.amount);
        fxRate = 1;
      } else {
        msrpMmk = toMmk(report.amount, cur);
        fxRate = msrpMmk ? Math.round((msrpMmk / report.amount) * 100) / 100 : null;
      }
    }
    if (!msrpMmk || msrpMmk <= 0) {
      return { ...empty, report: { ...report, found: false }, cost, aiModel: msg.model };
    }
    return { report, msrpMmk, fxRate, cost, aiModel: msg.model };
  } catch (e) {
    console.error("lookupMsrpViaWeb failed:", e instanceof Error ? e.message : e);
    return empty;
  }
}
