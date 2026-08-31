import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveOwner, createValueCheck } from "@/lib/scan";
import { recognizeItem } from "@/lib/ai/recognize";
import { BUCKET_SCAN } from "@/lib/storage";
import type { ImageRef } from "@/lib/ai/claude";
import type { Enums, Json } from "@/types/db";

export const maxDuration = 60;

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"];

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "bad_form" }, { status: 400 });

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "no_files" }, { status: 400 });

  const owner = await resolveOwner(true);
  const admin = createAdminClient();
  const check = await createValueCheck(owner);

  const images: ImageRef[] = [];
  let ordinal = 0;
  for (const file of files.slice(0, 8)) {
    if (!ALLOWED.includes(file.type)) continue;
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = file.type.split("/")[1]?.replace("quicktime", "mov") ?? "bin";
    const path = `${check.id}/${ordinal}.${ext}`;
    const { error: upErr } = await admin.storage
      .from(BUCKET_SCAN)
      .upload(path, buf, { contentType: file.type, upsert: true });
    if (upErr) return NextResponse.json({ error: "upload_failed", detail: upErr.message }, { status: 500 });

    const kind: Enums<"media_kind"> = file.type.startsWith("video") ? "video" : "photo";
    await admin.from("media").insert({
      value_check_id: check.id,
      storage_path: path,
      kind,
      bytes: buf.byteLength,
      ai_ordinal: ordinal,
    });
    if (kind === "photo" && images.length < 6) {
      images.push({ base64: buf.toString("base64"), mediaType: file.type });
    }
    ordinal += 1;
  }

  if (images.length === 0) {
    return NextResponse.json({ error: "no_photos" }, { status: 400 });
  }

  let recognition;
  try {
    recognition = await recognizeItem(images);
  } catch (e) {
    return NextResponse.json(
      { error: "recognize_failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }

  const { data: cat } = await admin
    .from("categories")
    .select("id")
    .eq("slug", recognition.data.category_slug)
    .maybeSingle();

  await admin.from("ai_recognitions").insert({
    value_check_id: check.id,
    model: recognition.model,
    model_version: recognition.modelVersion,
    prompt_version: (await import("@/lib/ai/prompts")).PROMPT_VERSION,
    raw_response: recognition.data as unknown as Json,
    detected_category_id: cat?.id ?? null,
    detected_brand: recognition.data.brand,
    detected_model: recognition.data.model,
    detected_condition: recognition.data.condition,
    detected_attributes: recognition.data.attributes,
    missing_shots: recognition.data.missing_shots,
    confidence: recognition.data.confidence,
  });

  await admin.from("value_checks").update({ status: "recognized" }).eq("id", check.id);

  return NextResponse.json({ checkId: check.id });
}
