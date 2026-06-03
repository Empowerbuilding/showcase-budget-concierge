import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SHOWCASE_WEBHOOK = "https://crm.showcasebuilders.com/api/leads/webhook";
const SHOWCASE_API_KEY = "showcase_webhook_k7x9m2p4q8r1w5";

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
 * Write lead into Showcase CRM via webhook.
 * This triggers the full pipeline: Trestle + Attom enrichment,
 * lead scoring, Facebook events, activity log.
 */
export async function writeShowcaseCrmLead({ sessionData, budget }) {
  const sd = sessionData || {};
  const site     = sd.site_conditions || {};
  const terrain  = sd.site_terrain    || {};
  const features = sd.special_features || {};
  const priorities = sd.priorities    || {};

  const fmt = obj => Object.entries(obj)
    .filter(([, v]) => v)
    .map(([k]) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    .join(', ') || 'None';

  const tierLabel = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Standard';

  const notes = [
    `--- Design Concierge Submission ---`,
    sd.build_location ? `Build Location: ${sd.build_location}` : null,
    sd.sqft           ? `Square Footage: ${Number(sd.sqft).toLocaleString()} sf` : null,
    sd.bedrooms       ? `Bedrooms: ${sd.bedrooms}` : null,
    (sd.full_baths || sd.half_baths) ? `Bathrooms: ${sd.full_baths || 0} full / ${sd.half_baths || 0} half` : null,
    sd.stories        ? `Stories: ${sd.stories}` : null,
    sd.garage_bays    ? `Garage Bays: ${sd.garage_bays}` : null,
    sd.bonus_room     ? `Bonus Room: Yes` : null,
    `Site Terrain: ${fmt(terrain)}`,
    `Site Conditions: ${fmt(site)}`,
    sd.exterior_tier  ? `Exterior Finish: ${tierLabel(sd.exterior_tier)}` : null,
    sd.interior_tier  ? `Interior Finish: ${tierLabel(sd.interior_tier)}` : null,
    `Special Features: ${fmt(features)}`,
    `Priorities: ${fmt(priorities)}`,
    budget?.low && budget?.high
      ? `Budget Range: $${budget.low.toLocaleString()} – $${budget.high.toLocaleString()} (Base: $${budget.total.toLocaleString()})` : null,
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch(SHOWCASE_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': SHOWCASE_API_KEY },
      body: JSON.stringify({
        first_name: sd.first_name || '',
        last_name:  sd.last_name  || '',
        email:      sd.email      || '',
        phone:      sd.phone      || null,
        source:     'design_concierge',
        metadata:   { notes },
      }),
    });
    const json = await res.json();
    if (!res.ok) console.error('Showcase CRM webhook error:', json);
    else console.log('Showcase CRM lead created:', json.contact_id);
  } catch (e) {
    console.error('Showcase CRM webhook error:', e);
  }
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
