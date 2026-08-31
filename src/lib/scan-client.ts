import imageCompression from "browser-image-compression";

/** Client-side: shrink images before upload (videos pass through untouched). */
export async function compressForUpload(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (const file of files) {
    if (file.type.startsWith("image/")) {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.9,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        });
        out.push(
          new File([compressed], file.name.replace(/\.\w+$/, ".jpg"), {
            type: compressed.type || "image/jpeg",
          }),
        );
      } catch {
        out.push(file);
      }
    } else {
      out.push(file);
    }
  }
  return out;
}

/** Compress → upload to Storage → run AI recognition (POST /api/scan). */
export async function submitScan(
  files: File[],
): Promise<{ checkId?: string; error?: string }> {
  const compressed = await compressForUpload(files);
  const form = new FormData();
  compressed.forEach((f) => form.append("files", f));
  const res = await fetch("/api/scan", { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as {
    checkId?: string;
    error?: string;
    detail?: string;
  };
  if (!res.ok) return { error: data.detail || data.error || "scan_failed" };
  return { checkId: data.checkId };
}
