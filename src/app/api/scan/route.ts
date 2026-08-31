import { NextResponse } from "next/server";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveOwner, createValueCheck } from "@/lib/scan";
import { recognizeItem } from "@/lib/ai/recognize";
import { BUCKET_SCAN } from "@/lib/storage";
import type { ImageRef } from "@/lib/ai/claude";
import type { Enums, Json } from "@/types/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/3gpp"];
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif|tiff?)$/i;

function isVideo(file: File): boolean {
  return file.type.startsWith("video/") || VIDEO_TYPES.includes(file.type);
}
function isImage(file: File): boolean {
  return file.type.startsWith("image/") || (file.type === "" && IMAGE_EXT.test(file.name));
}

/** Normalise any phone photo (HEIC, sideways EXIF, huge) → an upright JPEG under ~1600px. */
async function toJpeg(buf: Buffer): Promise<Buffer> {
  return sharp(buf)
    .rotate() // apply EXIF orientation so portrait photos aren't sideways
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "bad_form" }, { status: 400 });

  const uploads = form.getAll("files").filter((f): f is File => f instanceof File);
  if (uploads.length === 0) return NextResponse.json({ error: "no_files" }, { status: 400 });

  const owner = await resolveOwner(true);
  const admin = createAdminClient();
  const check = await createValueCheck(owner);

  const images: ImageRef[] = [];
  let ordinal = 0;
  let sawImage = false;

  for (const file of uploads.slice(0, 8)) {
    const video = isVideo(file);
    if (!video && !isImage(file)) continue;

    let bytes: Buffer = Buffer.from(await file.arrayBuffer());
    let contentType = file.type || (video ? "video/mp4" : "image/jpeg");
    let ext = contentType.split("/")[1]?.replace("quicktime", "mov") ?? "bin";

    if (!video) {
      sawImage = true;
      try {
        bytes = await toJpeg(bytes);
        contentType = "image/jpeg";
        ext = "jpg";
      } catch (e) {
        console.error("scan: image transcode failed", e instanceof Error ? e.message : e);
        continue; // unreadable image — skip it rather than feed Claude garbage
      }
    }

    const path = `${check.id}/${ordinal}.${ext}`;
    const { error: upErr } = await admin.storage
      .from(BUCKET_SCAN)
      .upload(path, bytes, { contentType, upsert: true });
    if (upErr) {
      return NextResponse.json(
        { error: "upload_failed", detail: upErr.message },
        { status: 500 },
      );
    }

    const kind: Enums<"media_kind"> = video ? "video" : "photo";
    await admin.from("media").insert({
      value_check_id: check.id,
      storage_path: path,
      kind,
      bytes: bytes.byteLength,
      ai_ordinal: ordinal,
    });
    if (kind === "photo" && images.length < 6) {
      images.push({ base64: bytes.toString("base64"), mediaType: "image/jpeg" });
    }
    ordinal += 1;
  }

  if (images.length === 0) {
    return NextResponse.json(
      { error: sawImage ? "unreadable_photo" : "no_photos" },
      { status: 400 },
    );
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
