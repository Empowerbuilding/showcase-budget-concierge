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

// Distance-from-Lake-LBJ logistics premium
const LOCATION_PREMIUMS = {
  "Horseshoe Bay":   0,
  "Kingsland":       0,
  "Granite Shoals":  0,
  "Marble Falls":    6000,
  "Burnet":          12000,
  "Llano":           14000,
  "Lampasas":        14000,
  "Fredericksburg":  20000,
  "Other Hill Country": 8000,
};

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

  // ── Location logistics premium ────────────────────────────────────────────
  const locationPremium = LOCATION_PREMIUMS[data.build_location] || 0;
  if (locationPremium > 0) {
    lineItems.push({
      id: 110,
      name: `Location Logistics (${data.build_location})`,
      amount: locationPremium,
      notes: "Subcontractor travel & site access",
    });
  }

  // ── Site terrain ─────────────────────────────────────────────────────────
  const terrain = data.site_terrain || {};
  if (terrain.steep_site) {
    lineItems.push({ id: 111, name: "Steep Site — Grading & Retaining", amount: 55000, notes: "Significant grade change — excavation, retaining walls, engineered foundation" });
  } else if (terrain.sloped_site) {
    lineItems.push({ id: 111, name: "Sloped Site — Grading & Retaining", amount: 25000, notes: "Hillside lot — additional excavation & retaining" });
  }

  // ── Stories surcharge (stairs, structural complexity) ────────────────────
  const stories = String(data.stories || "1");
  if (stories === "1.5") {
    lineItems.push({ id: 301, name: "1.5-Story Structural Premium",  amount: 15000, notes: "Staircase & partial upper structural" });
  } else if (stories === "2") {
    lineItems.push({ id: 302, name: "Two-Story Structural Premium",  amount: 22000, notes: "Full staircase, upper-floor structural & MEP extensions" });
  } else if (stories === "3") {
    lineItems.push({ id: 303, name: "Three-Story Structural Premium", amount: 45000, notes: "Two staircases, structural & MEP extensions" });
  }

  // ── Special features ─────────────────────────────────────────────────────
  if (features.fireplace) {
    lineItems.push({ id: 1205, name: "Fireplace (indoor)",           amount: [10000, 14000, 22000][ii], notes: "Includes surround & hearth" });
  }
  if (features.outdoor_kitchen) {
    lineItems.push({ id: 1710, name: "Outdoor Kitchen",              amount: [22000, 35000, 55000][ei], notes: "Grill, counter & utility connections" });
  }
  if (features.pool_spa) {
    lineItems.push({ id: 1730, name: "Pool / Spa",                   amount: [65000, 100000, 180000][ei], notes: "Gunite pool; elevated includes spa; premium includes infinity edge & water features" });
  }
  if (features.dock) {
    lineItems.push({ id: 1740, name: "Boat Dock",                    amount: [35000, 65000, 120000][ei], notes: "Lake LBJ dock — permitted, covered" });
  }
  if (features.covered_outdoor_living) {
    lineItems.push({ id: 1750, name: "Covered Outdoor Living",       amount: [22000, 38000, 65000][ei], notes: "Covered patio/deck with ceiling fans & lighting" });
  }
  if (features.home_automation) {
    lineItems.push({ id: 810,  name: "Home Automation / Smart Home", amount: [12000, 22000, 40000][ii], notes: "Lighting, security & AV integration" });
  }
  if (features.media_room) {
    lineItems.push({ id: 1610, name: "Media Room / Home Theater",    amount: [18000, 35000, 65000][ii], notes: "AV wiring, acoustic treatment, projector or TV, seating" });
  }
  if (features.wine_cellar) {
    lineItems.push({ id: 1620, name: "Wine Cellar / Wet Bar",        amount: [12000, 25000, 50000][ii], notes: "Climate-controlled cellar or custom wet bar" });
  }
  if (features.generator) {
    lineItems.push({ id: 830,  name: "Whole-Home Generator",         amount: [12000, 18000, 28000][ii], notes: "Propane or natural gas standby generator" });
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

  const low  = Math.round(total * 0.90);
  const high = Math.round(total * 1.15);

  return {
    lineItems,
    subtotal,
    contingency,
    total,
    low,
    high,
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
