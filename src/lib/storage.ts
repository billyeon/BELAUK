export const BUCKET_SCAN = "scan-media";
export const BUCKET_PRODUCT = "product-media";

const base = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Public URL for an object in the public product-media bucket. */
export function productMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${base()}/storage/v1/object/public/${BUCKET_PRODUCT}/${path}`;
}
