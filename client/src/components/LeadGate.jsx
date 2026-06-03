import React, { useState } from "react";

const LOGO_URL =
  "https://ozhkjwcjsifdhfdexayd.supabase.co/storage/v1/object/public/website-images/Showcase/showcase-builders-logo.png";

const s = {
  overlay: {
    minHeight: "100%",
    width: "100%",
    background: "#FAFAF8",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 20px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
  },
  logo: {
    height: 56,
    width: "auto",
    display: "block",
    marginBottom: 20,
  },
  logoFallback: {
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
    letterSpacing: "0.04em",
    fontFamily: "'Playfair Display', serif",
    marginBottom: 20,
    textAlign: "center",
  },
  logoAccent: { color: "#C5A572" },
  headline: {
    fontSize: 26,
    fontWeight: 700,
    color: "#111827",
    fontFamily: "'Playfair Display', serif",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 1.25,
  },
  subheadline: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "'Inter', sans-serif",
    textAlign: "center",
    lineHeight: 1.6,
    marginBottom: 32,
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  row: {
    display: "flex",
    gap: 12,
  },
  fieldWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
    fontFamily: "'Inter', sans-serif",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 10,
    border: "1.5px solid #E5E0D8",
    background: "#FFFFFF",
    color: "#111827",
    fontSize: 15,
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  btn: {
    width: "100%",
    padding: "16px",
    borderRadius: 12,
    border: "none",
    background: "#C5A572",
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    letterSpacing: "0.02em",
    cursor: "pointer",
    marginTop: 6,
    transition: "background 0.2s, opacity 0.2s",
  },
  btnDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  divider: {
    width: "100%",
    height: 1,
    background: "#E5E0D8",
    margin: "28px 0 0",
  },
  trust: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "'Inter', sans-serif",
    textAlign: "center",
    marginTop: 16,
  },
};

function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

export default function LeadGate({ onSubmit }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [touched, setTouched]     = useState({});
  const [logoErr, setLogoErr]     = useState(false);
  const [loading, setLoading]     = useState(false);

  const errors = {
    firstName: !firstName.trim() ? "Required" : null,
    lastName:  !lastName.trim()  ? "Required" : null,
    email:     !email.trim()     ? "Required" : !isValidEmail(email) ? "Invalid email" : null,
    phone:     !phone.trim()     ? "Required" : null,
  };

  const isValid = Object.values(errors).every(e => e === null);

  const blur = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true, phone: true });
    if (!isValid || loading) return;
    setLoading(true);
    onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim() });
  };

  const fieldStyle = (name) => ({
    ...s.input,
    ...(touched[name] && errors[name] ? s.inputError : {}),
  });

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        {!logoErr ? (
          <img
            src={LOGO_URL}
            alt="Showcase Builders"
            style={s.logo}
            onError={() => setLogoErr(true)}
          />
        ) : (
          <div style={s.logoFallback}>
            SHOWCASE <span style={s.logoAccent}>BUILDERS</span>
          </div>
        )}

        <div style={s.headline}>Your Custom Build Starts Here</div>
        <div style={s.subheadline}>
          Get your custom build baseline estimate in 60 seconds.
        </div>

        <form style={s.form} onSubmit={handleSubmit} noValidate>
          <div style={s.row}>
            <div style={s.fieldWrap}>
              <label style={s.label}>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                onBlur={() => blur("firstName")}
                placeholder="Jane"
                style={fieldStyle("firstName")}
                onFocus={e => (e.target.style.borderColor = "#C5A572")}
              />
            </div>
            <div style={s.fieldWrap}>
              <label style={s.label}>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                onBlur={() => blur("lastName")}
                placeholder="Smith"
                style={fieldStyle("lastName")}
                onFocus={e => (e.target.style.borderColor = "#C5A572")}
              />
            </div>
          </div>

          <div style={s.fieldWrap}>
            <label style={s.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => blur("email")}
              placeholder="jane@example.com"
              style={fieldStyle("email")}
              onFocus={e => (e.target.style.borderColor = "#C5A572")}
            />
          </div>

          <div style={s.fieldWrap}>
            <label style={s.label}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onBlur={() => blur("phone")}
              placeholder="(512) 000-0000"
              style={fieldStyle("phone")}
              onFocus={e => (e.target.style.borderColor = "#C5A572")}
            />
          </div>

          <button
            type="submit"
            style={{ ...s.btn, ...((!isValid || loading) ? s.btnDisabled : {}) }}
            disabled={!isValid || loading}
            onMouseEnter={e => { if (isValid && !loading) e.currentTarget.style.background = "#B39460"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#C5A572"; }}
          >
            {loading ? "Starting…" : "Start My Blueprint →"}
          </button>
        </form>

        <div style={s.divider} />
        <div style={s.trust}>
          🔒 Your information is private and never shared.
        </div>
      </div>
    </div>
  );
}
