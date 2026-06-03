import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Showcase CRM
const showcaseCrm = createClient(
  "https://dsonqphdvancfchuejuz.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb25xcGhkdmFuY2ZjaHVlanV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY2ODU1MSwiZXhwIjoyMDg0MjQ0NTUxfQ.yEF9Dz0-lzzbEidyZgoU9TkrcPj9HWjr_Pyg99hfuc4"
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
 * Write lead into Showcase CRM contacts table.
 */
export async function writeShowcaseCrmLead({ sessionData, budget }) {
  const notes = [
    sessionData.build_location ? `Build Location: ${sessionData.build_location}` : null,
    sessionData.sqft           ? `Sqft: ${sessionData.sqft}` : null,
    sessionData.stories        ? `Stories: ${sessionData.stories}` : null,
    sessionData.exterior_tier  ? `Exterior: ${sessionData.exterior_tier}` : null,
    sessionData.interior_tier  ? `Interior: ${sessionData.interior_tier}` : null,
    budget?.low && budget?.high ? `Budget Range: $${budget.low.toLocaleString()} – $${budget.high.toLocaleString()}` : null,
  ].filter(Boolean).join(" | ");

  const { error } = await showcaseCrm.from("contacts").insert({
    first_name:   sessionData.first_name || null,
    last_name:    sessionData.last_name  || null,
    email:        sessionData.email      || null,
    phone:        sessionData.phone      || null,
    lead_source:  "cost_calculator",
    notes,
  });

  if (error) console.error("Showcase CRM insert error:", error);
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
