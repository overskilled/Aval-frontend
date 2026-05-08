import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { OtpInput, FormHeader, PrimaryButton } from "./fields.jsx";
import { api } from "./api.js";
import { useAuth } from "./AuthContext.jsx";

const EXPIRES_SEC = 600;
const RESEND_COOLDOWN_SEC = 30;

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function OtpVerify() {
  const { t, common, lang, setLang } = useOutletContext();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const context = params.get("context") || "signup"; // "signup" | "forgot" | "login"
  const { refresh, verifyLoginOtp } = useAuth();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expiresIn, setExpiresIn] = useState(EXPIRES_SEC);
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setExpiresIn((s) => Math.max(0, s - 1));
      setCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  async function handle(ev) {
    ev?.preventDefault();
    if (code.length !== 6) {
      setError(common.otp_invalid);
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (context === "forgot") {
        // Just navigate to reset-password with the code in the URL.
        navigate(
          `/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
          { replace: true },
        );
        return;
      }
      if (context === "login") {
        // Step 2 of login: complete the session and land on the dashboard.
        await verifyLoginOtp(email, code);
        setSuccess(true);
        setTimeout(() => navigate("/dashboard", { replace: true }), 400);
        return;
      }
      await api.verifyEmail({ email, code });
      await refresh();
      setSuccess(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 600);
    } catch (err) {
      setError(err.message || common.otp_wrong);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      const purpose =
        context === "forgot" ? "password_reset"
        : context === "login" ? "login_2fa"
        : "email_verify";
      await api.resendOtp({ email, purpose });
      setExpiresIn(EXPIRES_SEC);
      setCooldown(RESEND_COOLDOWN_SEC);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handle} noValidate>
      <FormHeader
        step={t.verify.step}
        title={t.verify.title}
        sub={
          <>
            {t.verify.sub_a} <b>{email}</b>
            {t.verify.sub_b}
          </>
        }
        lang={lang}
        setLang={setLang}
      />

      {success ? <div className="auth-flash">{t.verify.success}</div> : null}

      <div className="auth-otp-wrap">
        <OtpInput value={code} onChange={setCode} length={6} error={!!error} />
        {error ? <div className="af-err otp-err">{error}</div> : null}
        <div className="auth-otp-meta">
          <span>
            {t.verify.sub_resend} <b>{fmt(expiresIn)}</b>
          </span>
          <Link
            to={context === "forgot" ? "/forgot-password" : "/signup"}
            className="auth-link"
          >
            {t.verify.change_email}
          </Link>
        </div>
      </div>

      <PrimaryButton loading={loading}>{t.verify.submit}</PrimaryButton>

      <div className="auth-foot">
        {t.verify.didnt}{" "}
        <button
          type="button"
          className="auth-link strong"
          disabled={cooldown > 0 || resending}
          onClick={handleResend}
        >
          {resending
            ? common.resending
            : cooldown > 0
              ? `${t.verify.resend_cooldown} ${cooldown}s`
              : t.verify.resend}
        </button>
      </div>
    </form>
  );
}
