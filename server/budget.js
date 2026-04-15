/**
 * Budget calculation engine.
 * Categories 100–2100 matching Truelock estimate structure.
 */

// Per-sqft rates [standard, elevated, premium]
const RATES = [
  { id: 100,  name: "Site Work / Excavation",          tier: "ext", rates: [4,  5,  7]  },
  { id: 200,  name: "Foundation",                       tier: "ext", rates: [10, 16, 22] },
  { id: 300,  name: "Structural Framing",               tier: "ext", rates: [14, 22, 30] },
  { id: 400,  name: "Roofing",                          tier: "ext", rates: [8,  12, 16] },
  { id: 500,  name: "Windows & Exterior Doors",         tier: "ext", rates: [6,  11, 18] },
  { id: 600,  name: "Exterior Finishes / Siding",       tier: "ext", rates: [7,  12, 20] },
  { id: 700,  name: "Plumbing Rough-In",                tier: "int", rates: [8,  11, 14] },
  { id: 800,  name: "Electrical Rough-In",              tier: "int", rates: [6,  10, 14] },
  { id: 900,  name: "HVAC System",                      tier: "int", rates: [8,  11, 15] },
  { id: 1000, name: "Insulation",                       tier: "int", rates: [4,  5,  7]  },
  { id: 1100, name: "Drywall & Finish",                 tier: "int", rates: [8,  10, 13] },
  { id: 1200, name: "Interior Trim & Doors",            tier: "int", rates: [5,  9,  14] },
  { id: 1300, name: "Flooring",                         tier: "int", rates: [8,  14, 22] },
  { id: 1400, name: "Cabinets & Countertops",           tier: "int", rates: [12, 22, 40] },
  { id: 1500, name: "Interior Paint",                   tier: "int", rates: [4,  5,  7]  },
  { id: 1600, name: "Fixtures, Appliances & Hardware",  tier: "int", rates: [9,  15, 24] },
  { id: 1700, name: "Concrete / Flatwork",              tier: "ext", rates: [3,  4,  6]  },
  { id: 1800, name: "Mechanical Finals",                tier: "int", rates: [3,  4,  5]  },
  { id: 1900, name: "Landscaping & Final Grade",        tier: "ext", rates: [2,  3,  5]  },
  { id: 2000, name: "Miscellaneous Allowances",         tier: "avg", rates: [5,  7,  10] },
  { id: 2100, name: "Permits & Fees",                   tier: "ext", rates: [3,  4,  6]  },
];

const TIER_IDX = { standard: 0, elevated: 1, premium: 2 };

function tierIdx(name) { return TIER_IDX[name] ?? 0; }

export function calculateBudget(data) {
  const sqft        = Math.max(Number(data.sqft) || 2000, 500);
  const garageBays  = Number(data.garage_bays) || 0;
  const bonusRoom   = data.bonus_room === true || data.bonus_room === "true";
  const site        = data.site_conditions || {};
  const ei          = tierIdx(data.exterior_tier);
  const ii          = tierIdx(data.interior_tier);
  const features    = data.special_features || {};

  const lineItems = [];

  // ── Base per-sqft categories ─────────────────────────────────────────────
  for (const cat of RATES) {
    const idx   = cat.tier === "ext" ? ei : cat.tier === "int" ? ii : Math.round((ei + ii) / 2);
    const rate  = cat.rates[idx];
    const amount = Math.round(rate * sqft);
    lineItems.push({ id: cat.id, name: cat.name, amount, notes: `$${rate}/sf × ${sqft.toLocaleString()} sf` });
  }

  // ── Garage ───────────────────────────────────────────────────────────────
  if (garageBays > 0) {
    const perBay = [25000, 32000, 42000][ei];
    lineItems.push({
      id: 2050, name: `Garage (${garageBays}-bay)`,
      amount: perBay * garageBays,
      notes: `${garageBays} bay${garageBays > 1 ? "s" : ""} @ $${perBay.toLocaleString()} ea.`,
    });
  }

  // ── Bonus room ───────────────────────────────────────────────────────────
  if (bonusRoom) {
    lineItems.push({
      id: 2060, name: "Bonus Room (above main level)",
      amount: [28000, 40000, 60000][ii],
      notes: "Finished bonus room",
    });
  }

  // ── Site conditions ──────────────────────────────────────────────────────
  if (!site.city_water && !site.well) {
    lineItems.push({ id: 105, name: "Well Drilling & Pump",          amount: 18000, notes: "No city water — estimated" });
  }
  if (!site.city_sewer) {
    lineItems.push({ id: 106, name: "Septic System & Drain Field",   amount: 15000, notes: "No city sewer — estimated" });
  }
  if (!site.electric_at_property) {
    lineItems.push({ id: 107, name: "Electric Service Extension",    amount: 12000, notes: "Electric not at property" });
  }
  if (site.lp_propane) {
    lineItems.push({ id: 108, name: "LP / Propane System",           amount: 8000,  notes: "Tank, regulator & distribution lines" });
  }
  if (site.rock_hammering) {
    lineItems.push({ id: 109, name: "Rock Excavation / Hammering",   amount: 30000, notes: "Estimated — varies by site geology" });
  }

  // ── Special features ─────────────────────────────────────────────────────
  if (features.fireplace) {
    lineItems.push({ id: 1205, name: "Fireplace (indoor)",           amount: [10000, 14000, 22000][ii], notes: "Includes surround & hearth" });
  }
  if (features.outdoor_kitchen) {
    lineItems.push({ id: 1710, name: "Outdoor Kitchen",              amount: [22000, 35000, 55000][ei], notes: "Grill, counter & utility connections" });
  }
  if (features.home_automation) {
    lineItems.push({ id: 810,  name: "Home Automation / Smart Home", amount: [12000, 22000, 40000][ii], notes: "Lighting, security & AV integration" });
  }
  if (features.solar) {
    lineItems.push({ id: 820,  name: "Solar System",                 amount: [28000, 35000, 45000][ei], notes: "Grid-tie system with battery option" });
  }
  if (features.screen_porch) {
    lineItems.push({ id: 1720, name: "Screened Porch",               amount: [18000, 28000, 42000][ei], notes: "Structural screen porch addition" });
  }
  if (features.bonus_room_over_garage) {
    lineItems.push({ id: 2055, name: "Bonus Room over Garage",       amount: [32000, 45000, 62000][ii], notes: "Conditioned finished space" });
  }

  // ── Totals ───────────────────────────────────────────────────────────────
  lineItems.sort((a, b) => a.id - b.id);
  const subtotal    = lineItems.reduce((s, li) => s + li.amount, 0);
  const contingency = Math.round(subtotal * 0.10);
  const total       = subtotal + contingency;

  return {
    lineItems,
    subtotal,
    contingency,
    total,
    meta: {
      sqft,
      exterior_tier: data.exterior_tier || "standard",
      interior_tier: data.interior_tier || "standard",
    },
  };
}

export function formatCurrency(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}
