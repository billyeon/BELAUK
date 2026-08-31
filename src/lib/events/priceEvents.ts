import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums, Json } from "@/types/db";

/** Append an immutable price event. Never updates/deletes (DB triggers enforce). */
export async function appendPriceEvent(params: {
  productId: string;
  eventType: Enums<"price_event_type">;
  amountMmk: number;
  actorId?: string | null;
  actorRole?: Enums<"price_event_source">;
  context?: Json;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("price_events")
    .insert({
      product_id: params.productId,
      event_type: params.eventType,
      amount_mmk: params.amountMmk,
      actor_id: params.actorId ?? null,
      actor_role: params.actorRole ?? "system",
      context: params.context ?? {},
    })
    .select("id")
    .single();
  if (error) throw new Error(`price_events insert failed: ${error.message}`);
  return data.id;
}

export async function writeAudit(params: {
  entity: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  diff?: Json;
}) {
  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    entity: params.entity,
    entity_id: params.entityId,
    action: params.action,
    actor_id: params.actorId ?? null,
    diff: params.diff ?? {},
  });
}
