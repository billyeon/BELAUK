import { createClient } from "@/lib/supabase/server";

export type ProductSort = "new" | "price_asc" | "price_desc";

export type BrowseFilters = {
  q?: string;
  category?: string; // category slug
  sort?: ProductSort;
  limit?: number;
};

export async function listPublicProducts(filters: BrowseFilters = {}) {
  const supabase = await createClient();
  let query = supabase.from("public_products").select("*").limit(filters.limit ?? 40);

  if (filters.category && filters.category !== "all") {
    // A category chip may be a top-level category — expand to its child slugs too.
    const { data: cats } = await supabase
      .from("categories")
      .select("id, slug, parent_id");
    const match = (cats ?? []).find((c) => c.slug === filters.category);
    const slugs = match
      ? [match.slug, ...(cats ?? []).filter((c) => c.parent_id === match.id).map((c) => c.slug)]
      : [filters.category];
    query = query.in("category_slug", slugs);
  }
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(
      `title.ilike.${term},brand.ilike.${term},model.ilike.${term},description.ilike.${term}`,
    );
  }
  switch (filters.sort) {
    case "price_asc":
      query = query.order("current_price_mmk", { ascending: true });
      break;
    case "price_desc":
      query = query.order("current_price_mmk", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error("listPublicProducts failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getProduct(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getProductMedia(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_media")
    .select("id, storage_path, kind, sort")
    .eq("product_id", productId)
    .order("sort");
  return data ?? [];
}

export async function getPriceEvents(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("price_events")
    .select("id, event_type, amount_mmk, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function listCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort");
  return data ?? [];
}
