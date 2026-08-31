import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/session";
import {
  resolveOwner,
  assertOwnsValueCheck,
  latestRecognition,
  effectiveValues,
} from "@/lib/scan";
import { computeChecked } from "@/lib/checked/score";
import type { Enums } from "@/types/db";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    checkId?: string;
    purchasePeriod?: string | null;
    hasProof?: boolean;
    hasVideo?: boolean;
  };
  if (!body.checkId) return NextResponse.json({ error: "missing_check" }, { status: 400 });

  const owner = await resolveOwner(true);
  const check = await assertOwnsValueCheck(body.checkId, { ...owner, userId: user.id });
  if (!check) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const admin = createAdminClient();

  // Claim the anonymous value_check for this user.
  if (check.user_id !== user.id) {
    await admin.from("value_checks").update({ user_id: user.id }).eq("id", check.id);
  }

  const rec = await latestRecognition(body.checkId);
  if (!rec) return NextResponse.json({ error: "no_recognition" }, { status: 400 });
  const eff = effectiveValues(rec.recognition, rec.edits);

  const { data: profile } = await admin
    .from("profiles")
    .select("primary_area_id")
    .eq("id", user.id)
    .maybeSingle();

  const { count: photoCount } = await admin
    .from("media")
    .select("id", { count: "exact", head: true })
    .eq("value_check_id", body.checkId)
    .eq("kind", "photo");

  const condition = (eff.condition ?? "good") as Enums<"product_condition">;
  const title =
    [eff.brand, eff.model].filter(Boolean).join(" ") ||
    (rec.recognition.raw_response as { summary?: string })?.summary ||
    "Item";

  const checked = computeChecked({
    photoCount: photoCount ?? 0,
    hasCondition: true,
    hasPurchasePeriod: Boolean(body.purchasePeriod),
    hasVideo: Boolean(body.hasVideo),
    hasPurchaseProof: Boolean(body.hasProof),
    priceReviewed: false,
  });

  const patch = {
    seller_id: user.id,
    value_check_id: body.checkId,
    title,
    category_id: eff.categoryId,
    brand: eff.brand,
    model: eff.model,
    condition,
    purchase_period: body.purchasePeriod || null,
    has_purchase_proof: Boolean(body.hasProof),
    has_video: Boolean(body.hasVideo),
    area_id: profile?.primary_area_id ?? null,
    status: "draft" as const,
    ai_generated: true,
    checked,
    current_price_mmk: 0,
  };

  const { data: existing } = await admin
    .from("products")
    .select("id")
    .eq("value_check_id", body.checkId)
    .eq("seller_id", user.id)
    .maybeSingle();

  let productId: string;
  if (existing) {
    await admin.from("products").update(patch).eq("id", existing.id);
    productId = existing.id;
  } else {
    const { data: created, error } = await admin
      .from("products")
      .insert(patch)
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    productId = created.id;

    // Copy scan photos into the product's media (public bucket).
    const { data: media } = await admin
      .from("media")
      .select("storage_path, kind, ai_ordinal")
      .eq("value_check_id", body.checkId)
      .order("ai_ordinal");
    for (const m of media ?? []) {
      const { data: file } = await admin.storage.from("scan-media").download(m.storage_path);
      if (!file) continue;
      const ext = m.storage_path.split(".").pop() ?? "jpg";
      const dest = `${productId}/${m.ai_ordinal}.${ext}`;
      await admin.storage
        .from("product-media")
        .upload(dest, file, { contentType: file.type, upsert: true });
      await admin.from("product_media").insert({
        product_id: productId,
        storage_path: dest,
        kind: m.kind,
        sort: m.ai_ordinal,
      });
    }
  }

  await admin.from("value_checks").update({ status: "priced" }).eq("id", body.checkId);

  return NextResponse.json({ productId });
}
