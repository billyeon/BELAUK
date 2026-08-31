import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { reviewPrice } from "@/lib/pricing/range";
import { latestRecognition, effectiveValues } from "@/lib/scan";
import { computeChecked } from "@/lib/checked/score";
import { parseMMK } from "@/lib/format/money";

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    productId?: string;
    price?: string | number;
  };
  const desired = typeof body.price === "number" ? body.price : parseMMK(String(body.price ?? ""));
  if (!body.productId || !desired) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, seller_id, category_id, brand, model, condition, purchase_period, checked, value_check_id")
    .eq("id", body.productId)
    .maybeSingle();
  if (!product || product.seller_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let categorySlug: string | null = null;
  if (product.category_id) {
    const { data: cat } = await admin
      .from("categories")
      .select("slug")
      .eq("id", product.category_id)
      .maybeSingle();
    categorySlug = cat?.slug ?? null;
  }

  let attributes: Record<string, string> | null = null;
  let damageText: string | null = null;
  if (product.value_check_id) {
    const rec = await latestRecognition(product.value_check_id);
    if (rec) {
      const eff = effectiveValues(rec.recognition, rec.edits);
      attributes = eff.attributes;
      const raw = rec.recognition.raw_response as { summary?: string } | null;
      damageText = raw?.summary ?? null;
    }
  }

  const range = await reviewPrice(
    {
      categoryId: product.category_id,
      categorySlug,
      brand: product.brand,
      model: product.model,
      condition: product.condition,
      purchasePeriod: product.purchase_period,
      attributes,
      damageText,
      desiredPrice: desired,
      web: true,
    },
    { productId: product.id, valueCheckId: product.value_check_id },
  );

  const prevChecked = (product.checked ?? {}) as Record<string, boolean>;
  await admin
    .from("products")
    .update({
      current_price_mmk: desired,
      checked: computeChecked({
        photoCount: prevChecked.photos_ok ? 3 : 0,
        hasCondition: Boolean(prevChecked.condition_provided),
        hasPurchasePeriod: Boolean(prevChecked.purchase_period_provided),
        hasVideo: Boolean(prevChecked.has_video),
        hasPurchaseProof: Boolean(prevChecked.has_purchase_proof),
        priceReviewed: true,
      }),
    })
    .eq("id", product.id);

  return NextResponse.json({ range });
}
