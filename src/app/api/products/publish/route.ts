import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { appendPriceEvent, writeAudit } from "@/lib/events/priceEvents";
import { computeChecked } from "@/lib/checked/score";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { productId?: string };
  if (!body.productId) return NextResponse.json({ error: "missing_product" }, { status: 400 });

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("*")
    .eq("id", body.productId)
    .maybeSingle();
  if (!product || product.seller_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (product.status !== "draft") {
    return NextResponse.json({ ok: true, productId: product.id, already: true });
  }
  if (!product.current_price_mmk || product.current_price_mmk <= 0) {
    return NextResponse.json({ error: "price_required" }, { status: 400 });
  }

  const { count: photoCount } = await admin
    .from("product_media")
    .select("id", { count: "exact", head: true })
    .eq("product_id", product.id)
    .eq("kind", "photo");

  const checked = computeChecked({
    photoCount: photoCount ?? 0,
    hasCondition: true,
    hasPurchasePeriod: Boolean(product.purchase_period),
    hasVideo: product.has_video,
    hasPurchaseProof: product.has_purchase_proof,
    priceReviewed: true,
  });

  await admin
    .from("products")
    .update({ status: "selling", checked })
    .eq("id", product.id);

  await appendPriceEvent({
    productId: product.id,
    eventType: "initial_listing",
    amountMmk: product.current_price_mmk,
    actorId: user.id,
    actorRole: "seller",
    context: { source: "publish" },
  });

  await admin.from("value_checks").update({ status: "listed" }).eq("id", product.value_check_id ?? "");
  await writeAudit({
    entity: "product",
    entityId: product.id,
    action: "published",
    actorId: user.id,
    diff: { status: ["draft", "selling"] },
  });

  return NextResponse.json({ ok: true, productId: product.id });
}
