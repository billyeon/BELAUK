import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { generateListing } from "@/lib/ai/recognize";

export const maxDuration = 30;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    productId?: string;
    language?: string;
  };
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

  let categorySlug: string | null = null;
  if (product.category_id) {
    const { data: cat } = await admin
      .from("categories")
      .select("slug")
      .eq("id", product.category_id)
      .maybeSingle();
    categorySlug = cat?.slug ?? null;
  }

  let attributes: Record<string, string> = {};
  if (product.value_check_id) {
    const { data: rec } = await admin
      .from("ai_recognitions")
      .select("detected_attributes")
      .eq("value_check_id", product.value_check_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    attributes = (rec?.detected_attributes ?? {}) as Record<string, string>;
  }

  const { data: listing } = await generateListing({
    category: categorySlug,
    brand: product.brand,
    model: product.model,
    condition: product.condition,
    attributes,
    purchasePeriod: product.purchase_period,
    language: body.language ?? "my",
  });

  await admin
    .from("products")
    .update({ title: listing.title, description: listing.description, ai_generated: true })
    .eq("id", product.id);

  return NextResponse.json({ title: listing.title, description: listing.description });
}
