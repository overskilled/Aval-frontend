import { useState } from "react";
import { Link, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { PasswordField, FormHeader, PrimaryButton } from "./fields.jsx";
import { api } from "./api.js";

export default function ResetPassword() {
  const { t, common, lang, setLang } = useOutletContext();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const code = params.get("code") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate() {
    const e = {};
    if (!password) e.password = common.required;
    else if (password.length < 8) e.password = common.password_short;
    if (!confirm) e.confirm = common.required;
    else if (confirm !== password) e.confirm = common.password_mismatch;
    return e;
  }

  async function handle(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await api.resetPassword({ email, code, password });
      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 800);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handle} noValidate>
      <FormHeader step={t.reset.step} title={t.reset.title} sub={t.reset.sub} lang={lang} setLang={setLang} />
      {success ? <div className="auth-flash">{t.reset.success}</div> : null}
      {errors.form ? <div className="alert">{errors.form}</div> : null}
      <div className="auth-fields">
        <PasswordField id="rp-password" label={t.reset.password} autoComplete="new-password" value={password} onChange={setPassword} error={errors.password} autoFocus />
        <PasswordField id="rp-confirm" label={t.reset.confirm} autoComplete="new-password" value={confirm} onChange={setConfirm} error={errors.confirm} />
      </div>
      <PrimaryButton loading={loading}>{t.reset.submit}</PrimaryButton>
      <div className="auth-foot">
        <Link to="/login" className="auth-link strong">{common.back_login}</Link>
      </div>
    </form>
  );
}
