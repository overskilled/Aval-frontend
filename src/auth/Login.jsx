import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { Field, PasswordField, FormHeader, PrimaryButton, isEmail } from "./fields.jsx";
import { useAuth } from "./AuthContext.jsx";

export default function Login() {
  const { t, common, lang, setLang } = useOutletContext();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate() {
    const e = {};
    if (!email) e.email = common.required;
    else if (!isEmail(email)) e.email = common.email_invalid;
    if (!password) e.password = common.required;
    return e;
  }

  async function handle(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const res = await login(email, password);
      // Non-admin users now get a 6-digit OTP by email — finalize on /login-verify.
      if (res?.requiresOtp) {
        navigate(
          `/login-verify?email=${encodeURIComponent(res.email)}&context=login`,
          { replace: true },
        );
        return;
      }
      setSuccess(true);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setErrors({ form: err.message || common.email_invalid });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handle} noValidate>
      <FormHeader
        step={t.login.step}
        title={t.login.title}
        sub={t.login.sub}
        lang={lang}
        setLang={setLang}
      />

      {success ? <div className="auth-flash">{t.login.success}</div> : null}
      {errors.form ? <div className="alert">{errors.form}</div> : null}

      <div className="auth-fields">
        <Field
          id="login-email"
          label={t.login.email}
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoFocus
        />
        <PasswordField
          id="login-password"
          label={t.login.password}
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />
        <div className="auth-row-between">
          <label className="auth-check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>{t.login.remember}</span>
          </label>
          <Link to="/forgot-password" className="auth-link">
            {t.login.forgot}
          </Link>
        </div>
      </div>

      <PrimaryButton loading={loading}>{t.login.submit}</PrimaryButton>

      <div className="auth-foot">
        {t.login.no_account}{" "}
        <Link to="/signup" className="auth-link strong">
          {t.login.create}
        </Link>
      </div>
    </form>
  );
}
