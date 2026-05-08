import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { Field, FormHeader, PrimaryButton, isEmail } from "./fields.jsx";
import { api } from "./api.js";

export default function ForgotPassword() {
  const { t, common, lang, setLang } = useOutletContext();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(ev) {
    ev.preventDefault();
    if (!email) { setError(common.required); return; }
    if (!isEmail(email)) { setError(common.email_invalid); return; }
    setError("");
    setLoading(true);
    try {
      await api.forgotPassword({ email });
      navigate(`/verify-email?email=${encodeURIComponent(email)}&context=forgot`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handle} noValidate>
      <FormHeader step={t.forgot.step} title={t.forgot.title} sub={t.forgot.sub} lang={lang} setLang={setLang} />
      <div className="auth-fields">
        <Field
          id="fp-email"
          label={t.forgot.email}
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={error}
          autoFocus
        />
      </div>
      <PrimaryButton loading={loading}>{t.forgot.submit}</PrimaryButton>
      <div className="auth-foot">
        {t.forgot.remember}{" "}
        <Link to="/login" className="auth-link strong">{t.forgot.login}</Link>
      </div>
    </form>
  );
}
