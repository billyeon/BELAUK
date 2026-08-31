import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { detectRedactions } from "@/lib/ai/recognize";

export const maxDuration = 30;

/**
 * Detect personal info in a product-media image (e.g. a receipt) and record the
 * bounding boxes. The client masks the pixels on a canvas and re-uploads.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { mediaId?: string };
  if (!body.mediaId) return NextResponse.json({ error: "missing_media" }, { status: 400 });

  const admin = createAdminClient();
  const { data: media } = await admin
    .from("product_media")
    .select("id, storage_path, product_id")
    .eq("id", body.mediaId)
    .maybeSingle();
  if (!media) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: product } = await admin
    .from("products")
    .select("seller_id")
    .eq("id", media.product_id)
    .maybeSingle();
  if (product?.seller_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: file } = await admin.storage.from("product-media").download(media.storage_path);
  if (!file) return NextResponse.json({ error: "file_missing" }, { status: 404 });
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const result = await detectRedactions({ base64, mediaType: file.type || "image/jpeg" });

  await admin
    .from("product_media")
    .update({ redaction: result.boxes })
    .eq("id", media.id);

  return NextResponse.json(result);
}
