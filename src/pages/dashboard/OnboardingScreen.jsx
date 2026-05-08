import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { api } from "../../auth/api.js";
import { CACHE, readCache, writeCache } from "../../utils/cache.js";

/**
 * KYC-first onboarding for unapproved manufacturer / government users.
 *
 * State model — what the user actually needs to know, in order:
 *   1. Email verified?           → user does it
 *   2. Institution profile?      → user does it
 *   3. KYC dossier submitted?    → user does it (any status = done; rejected → resubmit)
 *   4. Admin reviewed?           → admin does it (passive for the user)
 *
 * The previous version conflated steps 3 and 4 ("Vérification KYC: en examen"
 * + "Revue: à faire") which made it look like the user had two pending tasks.
 * Now: when a dossier is submitted, step 3 is DONE and step 4 reflects the
 * review state directly.
 *
 * Stale-while-revalidate: the institution + KYC fetches read from session
 * cache first so navigations are instant; we always refetch in the background
 * to catch admin-side updates.
 */
export default function OnboardingScreen() {
  const { user, refresh: refreshUser } = useAuth();
  const navigate = useNavigate();

  // Hydrate from cache so the page paints instantly on subsequent loads.
  const [institution, setInstitution] = useState(() => readCache(CACHE.institution));
  const [kyc, setKyc] = useState(() => readCache(CACHE.kyc));
  const [loading, setLoading] = useState(institution === null && kyc === null);
  const [revalidating, setRevalidating] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const aliveRef = useRef(true);

  async function load({ background = false } = {}) {
    if (background) setRevalidating(true);
    else setLoading(true);
    setError("");
    try {
      const [inst, kycRes] = await Promise.all([
        api.getMyInstitution().catch(() => null),
        api.getMyKyc().catch(() => null),
      ]);
      if (!aliveRef.current) return;
      writeCache(CACHE.institution, inst);
      writeCache(CACHE.kyc, kycRes);
      setInstitution(inst);
      setKyc(kycRes);
      // Kick a /me refresh so AuthContext picks up an updated kycStatus
      // (e.g. admin just approved it). If status flipped to 'approved',
      // RoleHome will render the regular dashboard on next paint.
      refreshUser();
    } finally {
      if (aliveRef.current) {
        setLoading(false);
        setRevalidating(false);
      }
    }
  }

  useEffect(() => {
    aliveRef.current = true;
    // Revalidate on mount; show cached data while it's in flight.
    load({ background: !!(institution || kyc) });
    return () => { aliveRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onResendVerify() {
    if (resending) return;
    setResending(true);
    setError("");
    try {
      await api.resendOtp({ email: user.email, purpose: "email_verify" });
      navigate(`/verify-email?email=${encodeURIComponent(user.email)}&context=signup`);
    } catch (e) {
      setError(e.message);
    } finally {
      setResending(false);
    }
  }

  // ---- step state machine ----
  const stepEmail = user.emailVerified ? "done" : "active";
  const stepInstitution =
    !user.emailVerified ? "locked"
    : institution ? "done"
    : "active";
  // Step 3 is about THE USER'S submission, not the result.
  // It's done as soon as a dossier exists (pending or approved). If rejected,
  // the user has work to do again.
  const stepKyc =
    !institution ? "locked"
    : !kyc ? "active"
    : kyc.status === "rejected" ? "active"
    : "done";
  // Step 4 is purely admin's job. Locked until a dossier is submitted, in
  // review while pending, done once approved.
  const stepReview =
    !kyc || kyc.status === "rejected" ? "locked"
    : kyc.status === "approved" ? "done"
    : "review";

  const completed = [stepEmail, stepInstitution, stepKyc, stepReview]
    .filter((s) => s === "done").length;
  const totalSteps = 4;

  return (
    <div className="onboarding">
      <div className="onboarding-head">
        <div className="onboarding-head-row">
          <p className="kicker">Bienvenue {user.firstName || user.fullName}</p>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => load({ background: false })}
            disabled={loading || revalidating}
            title="Actualiser le statut de votre dossier"
          >
            {revalidating ? "Actualisation…" : "↻ Actualiser"}
          </button>
        </div>
        <h1>Activez votre compte Aval</h1>
        <p className="sub">
          Pour pouvoir émettre des codes signés et accéder à votre tableau de bord,
          nous avons besoin de vérifier quelques éléments. Cela prend moins de 10 minutes.
        </p>
        <div className="onboarding-progress">
          <div className="bar">
            <span style={{ width: `${(completed / totalSteps) * 100}%` }} />
          </div>
          <span className="txt">{completed} sur {totalSteps} étapes complétées</span>
        </div>
      </div>

      {error ? <div className="alert" style={{ marginBottom: 18 }}>{error}</div> : null}

      <ol className="onboarding-steps">
        <Step
          n={1}
          state={stepEmail}
          title="Vérifier votre adresse email"
          description={
            user.emailVerified
              ? "Adresse vérifiée."
              : `Nous avons envoyé un code à ${user.email}. Saisissez-le pour activer votre compte.`
          }
          actionLabel={resending ? "Envoi du code…" : "Vérifier mon email"}
          onAction={onResendVerify}
        />

        <Step
          n={2}
          state={stepInstitution}
          title="Profil institutionnel"
          description="RCCM, NIU, OAPI, secteur — la fiche officielle de votre organisation."
          actionLabel={institution ? "Voir / modifier" : "Compléter"}
          onAction={() => navigate("/dashboard/institution")}
          // After completion, give a quiet shortcut to revisit.
          showActionWhenDone
        />

        <Step
          n={3}
          state={stepKyc}
          title={
            kyc?.status === "rejected"
              ? "Corriger et renvoyer le dossier KYC"
              : "Soumettre le dossier KYC"
          }
          description={
            !kyc
              ? "Représentant légal + pièce officielle + documents."
              : kyc.status === "rejected"
                ? "Votre dossier a été rejeté. Renvoyez-le après correction."
                : `Dossier soumis le ${new Date(kyc.submittedAt).toLocaleDateString()}.`
          }
          actionLabel={
            !kyc ? "Soumettre"
            : kyc.status === "rejected" ? "Renvoyer un dossier corrigé"
            : "Voir mon dossier"
          }
          onAction={() => navigate("/dashboard/kyc")}
          showActionWhenDone
          extra={
            kyc?.status === "rejected" && kyc.rejectionReason ? (
              <div className="alert" style={{ marginTop: 8 }}>
                <b>Motif du rejet :</b> {kyc.rejectionReason}
              </div>
            ) : null
          }
        />

        <Step
          n={4}
          state={stepReview}
          title="Revue par un administrateur"
          description={
            stepReview === "done"
              ? "Compte activé. Bienvenue sur Aval."
              : stepReview === "review"
                ? "Votre dossier est en cours d'examen. Délai habituel : 24–48 h ouvrées. Vous serez notifié(e) par email."
                : "Une fois votre KYC soumis, un administrateur l'examine."
          }
        />
      </ol>

      <p className="onboarding-help">
        Besoin d'aide ?{" "}
        <a href="mailto:contact@aval.cm" className="auth-link strong">contact@aval.cm</a>
      </p>
    </div>
  );
}

function Step({
  n,
  state,
  title,
  description,
  actionLabel,
  onAction,
  extra,
  showActionWhenDone = false,
}) {
  const showAction =
    actionLabel && state !== "locked" && (state !== "done" || showActionWhenDone);
  const pill =
    state === "done" ? <span className="status-pill approved">terminé</span>
    : state === "review" ? <span className="status-pill pending">en examen</span>
    : state === "active" ? <span className="status-pill active">à faire</span>
    : <span className="status-pill not_started">verrouillé</span>;

  return (
    <li className={`onboarding-step is-${state}`}>
      <div className="step-num">
        {state === "done" ? "✓" : state === "review" ? "⟳" : n}
      </div>
      <div className="step-body">
        <h3>{title} {pill}</h3>
        <p>{description}</p>
        {extra}
        {showAction ? (
          <button
            type="button"
            className={state === "done" ? "btn btn--ghost btn--sm" : "btn"}
            onClick={onAction}
          >
            {actionLabel} <span>→</span>
          </button>
        ) : null}
      </div>
    </li>
  );
}
