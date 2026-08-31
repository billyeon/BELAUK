import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    productId?: string;
    title?: string;
    description?: string;
  };
  if (!body.productId) return NextResponse.json({ error: "missing_product" }, { status: 400 });

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, seller_id, status")
    .eq("id", body.productId)
    .maybeSingle();
  if (!product || product.seller_id !== user.id || product.status !== "draft") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await admin
    .from("products")
    .update({
      title: (body.title ?? "").trim().slice(0, 120) || "Item",
      description: (body.description ?? "").trim().slice(0, 2000),
      ai_generated: false,
    })
    .eq("id", product.id);

  return NextResponse.json({ ok: true });
}
