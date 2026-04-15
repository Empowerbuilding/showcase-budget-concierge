import { formatCurrency } from "./budget.js";

function buildEmailHTML({ name, budget, sessionData }) {
  const { lineItems, subtotal, contingency, total, meta } = budget;
  const tierLabel = (t) => t ? t.charAt(0).toUpperCase() + t.slice(1) : "Standard";

  const rows = lineItems.map(li => `
    <tr>
      <td style="padding:8px 12px;color:#ccc;font-size:13px;border-bottom:1px solid #2a2a2a;">${li.id} &mdash; ${li.name}</td>
      <td style="padding:8px 12px;color:#ccc;font-size:13px;border-bottom:1px solid #2a2a2a;text-align:right;">${formatCurrency(li.amount)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Budget Estimate</title></head>
<body style="margin:0;padding:0;background:#111;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#1a1a1a;border-radius:8px;overflow:hidden;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#B8860B,#DAA520);padding:28px 32px;">
      <div style="font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:0.04em;">BARNHAUS</div>
      <div style="font-size:12px;color:#5a3a00;letter-spacing:0.14em;text-transform:uppercase;margin-top:2px;">Budget Concierge</div>
    </div>

    <!-- Intro -->
    <div style="padding:28px 32px 16px;">
      <p style="color:#f0f0f0;font-size:16px;margin:0 0 8px;">Hi ${name || "there"},</p>
      <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Here is your preliminary construction budget estimate based on the details you provided.
        This is a planning-level estimate — final pricing is subject to site conditions, design development, and current material costs.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        <tr>
          <td style="padding:6px 12px;background:#222;color:#888;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;">Square Footage</td>
          <td style="padding:6px 12px;background:#222;color:#fff;font-size:13px;text-align:right;">${(meta.sqft || 0).toLocaleString()} sf</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;color:#888;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;">Exterior Tier</td>
          <td style="padding:6px 12px;color:#fff;font-size:13px;text-align:right;">${tierLabel(meta.exterior_tier)}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;background:#222;color:#888;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;">Interior Tier</td>
          <td style="padding:6px 12px;background:#222;color:#fff;font-size:13px;text-align:right;">${tierLabel(meta.interior_tier)}</td>
        </tr>
      </table>
    </div>

    <!-- Line items -->
    <div style="padding:0 32px 16px;">
      <div style="font-size:11px;color:#B8860B;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;margin-bottom:8px;">Cost Breakdown</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:8px 12px;background:#242424;color:#666;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;text-align:left;font-weight:600;">Category</th>
            <th style="padding:8px 12px;background:#242424;color:#666;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;text-align:right;font-weight:600;">Estimate</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td style="padding:10px 12px;color:#aaa;font-size:13px;border-top:1px solid #333;">Subtotal</td>
            <td style="padding:10px 12px;color:#aaa;font-size:13px;border-top:1px solid #333;text-align:right;">${formatCurrency(subtotal)}</td>
          </tr>
          <tr>
            <td style="padding:6px 12px;color:#888;font-size:12px;">Contingency (10%)</td>
            <td style="padding:6px 12px;color:#888;font-size:12px;text-align:right;">${formatCurrency(contingency)}</td>
          </tr>
          <tr>
            <td style="padding:12px;color:#DAA520;font-size:16px;font-weight:700;border-top:2px solid #B8860B;">TOTAL ESTIMATE</td>
            <td style="padding:12px;color:#DAA520;font-size:16px;font-weight:700;border-top:2px solid #B8860B;text-align:right;">${formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Disclaimer -->
    <div style="padding:16px 32px 28px;">
      <p style="color:#555;font-size:11px;line-height:1.6;margin:0;">
        This estimate is preliminary and for planning purposes only. Actual costs will vary based on final plans, site conditions, material selections, and local labor markets.
        Contact your builder for a detailed bid based on construction documents.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#111;text-align:center;">
      <div style="color:#555;font-size:11px;">Powered by Barnhaus Budget Concierge &mdash; empowerbuilding.ai</div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendBudgetEmail({ name, email, budget, sessionData }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email");
    return { skipped: true };
  }
  if (!email) {
    console.warn("No email address — skipping");
    return { skipped: true };
  }

  const sqft = sessionData?.sqft || budget?.meta?.sqft || 0;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Budget Concierge <mitchell@empowerbuilding.ai>",
      to: email,
      subject: `Your Preliminary Budget Estimate — ${sqft.toLocaleString()} sf Custom Home`,
      html: buildEmailHTML({ name, budget, sessionData }),
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error("Resend error:", json);
    throw new Error(json.message || "Email send failed");
  }
  console.log("Email sent:", json.id);
  return json;
}
