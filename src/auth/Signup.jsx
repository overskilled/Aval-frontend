import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { Field, PasswordField, FormHeader, PrimaryButton, isEmail } from "./fields.jsx";
import { useAuth } from "./AuthContext.jsx";

export default function Signup() {
  const { t, common, lang, setLang } = useOutletContext();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [roleIdx, setRoleIdx] = useState("");
  const [org, setOrg] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const roles = t.signup.role_options;

  function validate() {
    const e = {};
    if (!first) e.first = common.required;
    if (!last) e.last = common.required;
    if (!email) e.email = common.required;
    else if (!isEmail(email)) e.email = common.email_invalid;
    if (roleIdx === "") e.role = common.required;
    if (!password) e.password = common.required;
    else if (password.length < 8) e.password = common.password_short;
    if (!agreed) e.agreed = common.required;
    return e;
  }

  async function handle(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    const role = roles[Number(roleIdx)]?.value;
    setLoading(true);
    try {
      await register({
        firstName: first.trim(),
        lastName: last.trim(),
        email: email.trim(),
        organisation: org.trim() || undefined,
        roleTitle: roles[Number(roleIdx)]?.label,
        phone: phone.trim() || undefined,
        role,
        password,
      });
      navigate(`/verify-email?email=${encodeURIComponent(email)}&context=signup`, {
        replace: true,
      });
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handle} noValidate>
      <FormHeader
        step={t.signup.step}
        title={t.signup.title}
        sub={t.signup.sub}
        lang={lang}
        setLang={setLang}
      />

      {errors.form ? <div className="alert">{errors.form}</div> : null}

      <div className="auth-fields">
        <div className="auth-grid-2">
          <Field id="su-first" label={t.signup.first} autoComplete="given-name" value={first} onChange={setFirst} error={errors.first} autoFocus />
          <Field id="su-last" label={t.signup.last} autoComplete="family-name" value={last} onChange={setLast} error={errors.last} />
        </div>
        <Field id="su-email" label={t.signup.email} type="email" autoComplete="email" value={email} onChange={setEmail} error={errors.email} />
        <div className={`af-field${errors.role ? " has-error" : ""}${roleIdx !== "" ? " is-filled" : ""}`}>
          <label htmlFor="su-role">{t.signup.role_label}</label>
          <div className="af-input-wrap">
            <select
              id="su-role"
              value={roleIdx}
              onChange={(e) => setRoleIdx(e.target.value)}
              aria-invalid={errors.role ? "true" : "false"}
              required
            >
              <option value="" disabled hidden>—</option>
              {roles.map((o, i) => (
                <option key={i} value={i}>{o.label}</option>
              ))}
            </select>
          </div>
          {errors.role ? <div className="af-err">{errors.role}</div> : null}
        </div>
        <Field id="su-org" label={t.signup.org} autoComplete="organization" value={org} onChange={setOrg} required={false} error={errors.org} />
        <Field id="su-phone" label="Téléphone" autoComplete="tel" value={phone} onChange={setPhone} required={false} />
        <PasswordField id="su-password" label={t.signup.password} autoComplete="new-password" value={password} onChange={setPassword} error={errors.password} hint={t.signup.password_hint} />
        <label className={`auth-check terms${errors.agreed ? " has-error" : ""}`}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>
            {t.signup.terms_a}<Link to="/" className="auth-link strong">{t.signup.terms_link_a}</Link>{t.signup.terms_b}<Link to="/" className="auth-link strong">{t.signup.terms_link_b}</Link>{t.signup.terms_c}
          </span>
        </label>
      </div>

      <PrimaryButton loading={loading}>{t.signup.submit}</PrimaryButton>

      <div className="auth-foot">
        {t.signup.have_account}{" "}
        <Link to="/login" className="auth-link strong">{t.signup.login}</Link>
      </div>
    </form>
  );
}
