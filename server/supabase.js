import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Write a lead (from the gate form) to showcase_leads.
 */
export async function writeLead({ firstName, lastName, email, phone }) {
  const { error } = await supabase.from("showcase_leads").insert({
    first_name: firstName,
    last_name:  lastName,
    email,
    phone:      phone || null,
  });
  if (error) console.error("Supabase lead insert error:", error);
}

/**
 * Write a completed budget session to the budget_sessions table.
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
