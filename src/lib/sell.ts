import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getDraftProduct(checkId: string, userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("*")
    .eq("value_check_id", checkId)
    .eq("seller_id", userId)
    .maybeSingle();
  return data;
}
