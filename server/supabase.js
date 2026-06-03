import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Write a completed budget session to the budget_sessions table.
 *
 * Required table schema (run once in Supabase SQL editor):
 *
 *   CREATE TABLE IF NOT EXISTS budget_sessions (
 *     id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     created_at      timestamptz DEFAULT now(),
 *     client_name     text,
 *     client_email    text,
 *     session_data    jsonb,
 *     budget_output   jsonb,
 *     total_estimate  numeric
 *   );
 */
export async function writeBudgetSession({ sessionData, budget }) {
  const record = {
    client_name:    sessionData?.name    || null,
    client_email:   sessionData?.email   || null,
    client_phone:   sessionData?.phone   || null,
    session_data:   sessionData          || null,
    budget_output:  budget               || null,
    total_estimate: budget?.total        || null,
  };

  const { data, error } = await supabase
    .from("budget_sessions")
    .insert(record)
    .select();

  if (error) {
    console.error("Supabase budget_sessions write error:", error);
    throw error;
  }
  return data;
}
