import React, { useRef, useState } from "react";

// Renders contact + home_details form components
export default function FieldCard({ component, onSubmit, onUpload }) {
  const { type, fields = [], upload_label, upload_hint } = component;
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map(f => [f.key, f.default ?? ""]))
  );
  const fileRef = useRef(null);

  const handleChange = (key, value) => setValues(v => ({ ...v, [key]: value }));

  const handleSubmit = () => {
    const filled = fields.filter(f => values[f.key]?.toString().trim() !== "" && values[f.key] !== undefined);
    if (!filled.length) return;
    const parts = filled.map(f => {
      const v = values[f.key];
      if (f.type === "boolean") return v === "yes" || v === true ? f.label : null;
      return `${f.label}: ${v}`;
    }).filter(Boolean);
    onSubmit(parts.join(", "), { key: type, values });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
  };

  const inputStyle = {
    padding: "8px 10px", borderRadius: 8, border: "1px solid #3a3a3a",
    background: "#1a1a1a", color: "#fff", fontSize: 14,
    fontFamily: "'Inter',sans-serif", outline: "none", width: "100%", boxSizing: "border-box",
  };
  const labelStyle = {
    fontSize: 11, color: "#B8860B", fontFamily: "'Inter',sans-serif",
    fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
  };

  return (
    <div style={{
      background: "#242424", border: "1px solid #B8860B", borderRadius: 12,
      padding: "16px 18px", marginBottom: 8,
    }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        {fields.map(f => (
          <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4, flex: f.flex || "1 1 160px", minWidth: 110 }}>
            <label style={labelStyle}>{f.label}</label>

            {f.type === "select" ? (
              <select value={values[f.key]} onChange={e => handleChange(f.key, e.target.value)} style={inputStyle}>
                <option value="">Select…</option>
                {(f.options || []).map(o => (
                  <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
                ))}
              </select>

            ) : f.type === "boolean" ? (
              <div style={{ display: "flex", gap: 6 }}>
                {["yes", "no"].map(opt => (
                  <button key={opt} onClick={() => handleChange(f.key, opt)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                      border: `1px solid ${values[f.key] === opt ? "#B8860B" : "#3a3a3a"}`,
                      background: values[f.key] === opt ? "#B8860B22" : "#1a1a1a",
                      color: values[f.key] === opt ? "#B8860B" : "#888",
                      fontSize: 13, fontFamily: "'Inter',sans-serif",
                    }}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>

            ) : (
              <input
                type={f.type === "number" ? "number" : "text"}
                placeholder={f.placeholder || ""}
                value={values[f.key]}
                onChange={e => handleChange(f.key, e.target.value)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
              />
            )}
          </div>
        ))}
      </div>

      {/* Optional plan upload button (shown on contact step) */}
      {upload_label && onUpload && (
        <div style={{ marginBottom: 12 }}>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { onUpload(f); e.target.value = ""; } }} />
          <button onClick={() => fileRef.current?.click()}
            style={{
              width: "100%", padding: "9px 14px", borderRadius: 8, cursor: "pointer",
              border: "1px dashed #444", background: "#1a1a1a", color: "#888",
              fontSize: 12, fontFamily: "'Inter',sans-serif", textAlign: "left",
            }}>
            📄 {upload_label}
            {upload_hint && <span style={{ display: "block", fontSize: 10, color: "#555", marginTop: 2 }}>{upload_hint}</span>}
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={handleSubmit}
          style={{
            padding: "9px 22px", borderRadius: 8, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg,#B8860B,#DAA520)", color: "#1a1a1a",
            fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif",
          }}>
          Continue →
        </button>
      </div>
    </div>
  );
}
