import imageCompression from "browser-image-compression";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i;

/** A phone camera file that is really an image even when `type` is blank or HEIC. */
function looksLikeImage(file: File): boolean {
  return file.type.startsWith("image/") || (file.type === "" && IMAGE_EXT.test(file.name));
}

/**
 * Shrink + normalise images before upload:
 *  - always re-encode to JPEG (iPhone HEIC / HEIF is not accepted by the API or Claude)
 *  - cap the long edge at 1600px and the size near 0.9 MB (Vercel body limit + slow networks)
 *  - retry on the main thread if the web-worker path fails (Safari can't decode HEIC in a worker)
 * Videos pass through untouched.
 */
export async function compressForUpload(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (const file of files) {
    if (looksLikeImage(file)) {
      out.push(await compressOne(file));
    } else {
      out.push(file);
    }
  }
  return out;
}

const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);

async function compressOne(file: File): Promise<File> {
  const jpgName = file.name.replace(IMAGE_EXT, "").replace(/\.$/, "") + ".jpg" || "photo.jpg";
  for (const useWebWorker of [true, false]) {
    try {
      const blob = await withTimeout(
        imageCompression(file, {
          maxSizeMB: 0.9,
          maxWidthOrHeight: 1600,
          useWebWorker,
          fileType: "image/jpeg",
        }),
        15000, // a hung worker must not freeze the upload — the server can still transcode
      );
      return new File([blob], jpgName, { type: "image/jpeg" });
    } catch {
      // fall through to the next strategy
    }
  }
  // Give up converting on the client — the server will transcode HEIC as a fallback.
  return file;
}

/** Compress → upload to Storage → run AI recognition (POST /api/scan). */
export async function submitScan(
  files: File[],
): Promise<{ checkId?: string; error?: string }> {
  let compressed: File[];
  try {
    compressed = await compressForUpload(files);
  } catch {
    compressed = files;
  }

  const form = new FormData();
  compressed.forEach((f) => form.append("files", f));

  let res: Response;
  try {
    res = await fetch("/api/scan", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(90000), // don't let a stuck request spin forever
    });
  } catch {
    return { error: "network" };
  }

  const data = (await res.json().catch(() => ({}))) as {
    checkId?: string;
    error?: string;
    detail?: string;
  };
  if (!res.ok) return { error: data.detail || data.error || `http_${res.status}` };
  if (!data.checkId) return { error: "no_check" };
  return { checkId: data.checkId };
}
