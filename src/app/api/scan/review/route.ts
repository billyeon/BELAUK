import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveOwner,
  assertOwnsValueCheck,
  latestRecognition,
  effectiveValues,
} from "@/lib/scan";
import { reviewPrice } from "@/lib/pricing/range";
import { CONDITIONS } from "@/lib/ai/schema";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    checkId?: string;
    categorySlug?: string;
    brand?: string | null;
    model?: string | null;
    condition?: string | null;
  };
  if (!body.checkId) return NextResponse.json({ error: "missing_check" }, { status: 400 });

  const owner = await resolveOwner(true);
  const check = await assertOwnsValueCheck(body.checkId, owner);
  if (!check) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const rec = await latestRecognition(body.checkId);
  if (!rec) return NextResponse.json({ error: "no_recognition" }, { status: 400 });

  const admin = createAdminClient();
  const current = effectiveValues(rec.recognition, rec.edits);

  let categoryId = current.categoryId;
  if (body.categorySlug) {
    const { data: cat } = await admin
      .from("categories")
      .select("id")
      .eq("slug", body.categorySlug)
      .maybeSingle();
    categoryId = cat?.id ?? categoryId;
  }

  const edits: { field: string; old_value: string | null; new_value: string | null }[] = [];
  const consider = (field: string, oldVal: string | null, newVal: string | null | undefined) => {
    if (newVal === undefined) return;
    const n = newVal === "" ? null : newVal;
    if ((oldVal ?? null) !== (n ?? null)) edits.push({ field, old_value: oldVal, new_value: n });
  };
  consider("brand", current.brand, body.brand);
  consider("model", current.model, body.model);
  if (body.condition && CONDITIONS.includes(body.condition as (typeof CONDITIONS)[number])) {
    consider("condition", current.condition, body.condition);
  }
  if (categoryId && categoryId !== current.categoryId) {
    consider("category_id", current.categoryId, categoryId);
  }

  if (edits.length > 0) {
    await admin.from("ai_recognition_edits").insert(
      edits.map((e) => ({
        ai_recognition_id: rec.recognition.id,
        field: e.field,
        old_value: e.old_value,
        new_value: e.new_value,
        edited_by: owner.userId,
      })),
    );
  }

  const brand = body.brand === undefined ? current.brand : body.brand || null;
  const model = body.model === undefined ? current.model : body.model || null;

  const range = await reviewPrice(
    { categoryId: categoryId ?? null, brand, model, desiredPrice: null },
    { valueCheckId: body.checkId },
  );

  return NextResponse.json({ ok: true, range });
}
