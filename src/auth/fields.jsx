import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// Floating-label text/email/password field with built-in error slot.
export function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  error,
  hint,
  required = true,
  rightSlot,
  inputMode,
  onBlur,
  autoFocus,
}) {
  const filled = value != null && value !== "";
  return (
    <div className={`af-field${error ? " has-error" : ""}${filled ? " is-filled" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="af-input-wrap">
        <input
          id={id}
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          inputMode={inputMode}
          autoFocus={autoFocus}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          required={required}
        />
        {rightSlot ? <div className="af-right">{rightSlot}</div> : null}
      </div>
      {error ? (
        <div id={`${id}-err`} className="af-err">
          {error}
        </div>
      ) : hint ? (
        <div id={`${id}-hint`} className="af-hint">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

// Password with show/hide toggle.
export function PasswordField(props) {
  const [shown, setShown] = useState(false);
  return (
    <Field
      {...props}
      type={shown ? "text" : "password"}
      rightSlot={
        <button
          type="button"
          className="af-toggle"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          tabIndex={0}
        >
          {shown ? "Hide" : "Show"}
        </button>
      }
    />
  );
}

// 6-digit OTP input. Auto-advance, paste support, backspace navigation.
export function OtpInput({ value, onChange, length = 6, error, autoFocus = true }) {
  const refs = useRef([]);

  useEffect(() => {
    if (autoFocus && refs.current[0]) refs.current[0].focus();
  }, [autoFocus]);

  const setAt = (i, ch) => {
    const arr = value.padEnd(length, " ").split("");
    arr[i] = ch;
    const next = arr.join("").replace(/\s+$/g, "").slice(0, length);
    onChange(next);
  };

  const onKey = (i, e) => {
    if (e.key === "Backspace" && !e.target.value && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const onInput = (i, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setAt(i, "");
      return;
    }
    if (raw.length === 1) {
      setAt(i, raw);
      if (i < length - 1) refs.current[i + 1]?.focus();
    } else {
      const chars = raw.slice(0, length - i).split("");
      const arr = value.padEnd(length, " ").split("");
      chars.forEach((c, k) => {
        arr[i + k] = c;
      });
      const next = arr.join("").replace(/\s+$/g, "").slice(0, length);
      onChange(next);
      const target = Math.min(i + chars.length, length - 1);
      refs.current[target]?.focus();
    }
  };

  const onPaste = (e) => {
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    onChange(text.slice(0, length));
    const target = Math.min(text.length, length - 1);
    refs.current[target]?.focus();
  };

  return (
    <div className={`af-otp${error ? " has-error" : ""}`} onPaste={onPaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => onInput(i, e)}
          onKeyDown={(e) => onKey(i, e)}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

// Step header for the form column.
export function FormHeader({ step, title, sub, lang, setLang, t }) {
  return (
    <div className="auth-head">
      <div className="auth-head-row">
        <Link to="/" className="auth-brand" aria-label="Aval">
          <SealMini />
          <span>Aval</span>
        </Link>
        <div className="lang-toggle" role="group" aria-label="Language">
          <button aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>
            FR
          </button>
          <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>
            EN
          </button>
        </div>
      </div>
      <div className="auth-step">{step}</div>
      <h1 className="auth-title">{title}</h1>
      {sub ? <p className="auth-sub">{sub}</p> : null}
    </div>
  );
}

function starPoints(cx, cy, r) {
  const inner = r * 0.4;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    pts.push(
      `${(cx + Math.cos(ang) * rad).toFixed(2)},${(cy + Math.sin(ang) * rad).toFixed(2)}`
    );
  }
  return pts.join(" ");
}

function SealMini() {
  return (
    <svg viewBox="0 0 40 40" className="auth-seal-mini" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="none" stroke="#14181f" strokeWidth="0.8" />
      <circle cx="20" cy="20" r="15" fill="none" stroke="#14181f" strokeWidth="0.6" />
      <circle cx="20" cy="20" r="8" fill="#14181f" />
      <polygon points={starPoints(20, 20, 5)} fill="#fcd116" />
      <g stroke="#14181f" strokeWidth="0.6">
        <line x1="20" y1="0.5" x2="20" y2="3" />
        <line x1="20" y1="37" x2="20" y2="39.5" />
        <line x1="0.5" y1="20" x2="3" y2="20" />
        <line x1="37" y1="20" x2="39.5" y2="20" />
      </g>
    </svg>
  );
}

// Submit button with arrow.
export function PrimaryButton({ children, loading, disabled, type = "submit" }) {
  return (
    <button type={type} className="auth-btn" disabled={disabled || loading}>
      <span>{children}</span>
      <span className="auth-btn-arrow">{loading ? "…" : "→"}</span>
    </button>
  );
}

export function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}
