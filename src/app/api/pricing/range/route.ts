import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { reviewPrice } from "@/lib/pricing/range";
import { computeChecked } from "@/lib/checked/score";
import { parseMMK } from "@/lib/format/money";

export const maxDuration = 30;

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
    .select("id, seller_id, category_id, brand, model, checked, value_check_id")
    .eq("id", body.productId)
    .maybeSingle();
  if (!product || product.seller_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const range = await reviewPrice(
    {
      categoryId: product.category_id,
      brand: product.brand,
      model: product.model,
      desiredPrice: desired,
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
