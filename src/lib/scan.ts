import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnonToken, getOrCreateAnonToken } from "@/lib/anon";

export type ScanOwner = { userId: string | null; anonToken: string | null };

export async function resolveOwner(create = false): Promise<ScanOwner> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const anonToken = create ? await getOrCreateAnonToken() : await getAnonToken();
  return { userId: user?.id ?? null, anonToken };
}

function ownerFilter(admin: ReturnType<typeof createAdminClient>, owner: ScanOwner) {
  const q = admin.from("value_checks").select("*");
  if (owner.userId) return q.eq("user_id", owner.userId);
  return q.eq("anon_token", owner.anonToken ?? "__none__");
}

export async function assertOwnsValueCheck(id: string, owner: ScanOwner) {
  const admin = createAdminClient();
  const { data } = await admin.from("value_checks").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const ok =
    (owner.userId && data.user_id === owner.userId) ||
    (owner.anonToken && data.anon_token === owner.anonToken);
  return ok ? data : null;
}

export async function createValueCheck(owner: ScanOwner) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("value_checks")
    .insert({ user_id: owner.userId, anon_token: owner.userId ? null : owner.anonToken })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function latestRecognition(valueCheckId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ai_recognitions")
    .select("*")
    .eq("value_check_id", valueCheckId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const { data: edits } = await admin
    .from("ai_recognition_edits")
    .select("field, new_value")
    .eq("ai_recognition_id", data.id)
    .order("created_at", { ascending: true });
  return { recognition: data, edits: edits ?? [] };
}

/** Effective (AI + user-edited) values for a recognition. */
export function effectiveValues(
  recognition: {
    detected_brand: string | null;
    detected_model: string | null;
    detected_condition: string | null;
    detected_category_id: string | null;
    detected_attributes: unknown;
  },
  edits: { field: string; new_value: string | null }[],
) {
  const overlay = new Map(edits.map((e) => [e.field, e.new_value]));
  return {
    brand: overlay.get("brand") ?? recognition.detected_brand,
    model: overlay.get("model") ?? recognition.detected_model,
    condition: (overlay.get("condition") ?? recognition.detected_condition) as string | null,
    categoryId: overlay.get("category_id") ?? recognition.detected_category_id,
    attributes: (recognition.detected_attributes ?? {}) as Record<string, string>,
  };
}

/** Latest market comparison for the current owner — powers the home hero card. */
export async function latestValueResult(owner: ScanOwner) {
  if (!owner.userId && !owner.anonToken) return null;
  const admin = createAdminClient();
  const { data: checks } = await ownerFilter(admin, owner)
    .order("created_at", { ascending: false })
    .limit(10);
  const ids = (checks ?? []).map((c) => c.id);
  if (ids.length === 0) return null;

  const { data: comparison } = await admin
    .from("market_comparisons")
    .select("*")
    .in("value_check_id", ids)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!comparison) return null;

  const rec = comparison.value_check_id
    ? await latestRecognition(comparison.value_check_id)
    : null;
  const effective = rec ? effectiveValues(rec.recognition, rec.edits) : null;
  return { comparison, effective, valueCheckId: comparison.value_check_id };
}
