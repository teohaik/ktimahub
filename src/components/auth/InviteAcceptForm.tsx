"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

interface Props {
  token: string;
  email: string;
  roles: string[];
  locale: string;
}

const ROLE_LABELS: Record<string, { el: string; en: string }> = {
  SUPER_ADMIN: { el: "Διαχειριστής", en: "Super Admin" },
  LAND_OWNER: { el: "Ιδιοκτήτης", en: "Land Owner" },
  LEASEHOLDER: { el: "Ενοικιαστής", en: "Leaseholder" },
};

export default function InviteAcceptForm({ token, email, roles, locale }: Props) {
  const t = useTranslations("invite");
  const [view, setView] = useState<"choose" | "credentials">("choose");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const roleLabels = roles
    .map((r) => (locale === "el" ? ROLE_LABELS[r]?.el : ROLE_LABELS[r]?.en) ?? r)
    .join(", ");

  async function handleGoogleSignIn() {
    await signIn("google", {
      callbackUrl: `/${locale}/invite/${token}/finalize`,
    });
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }
    setSaving(true);
    setError("");

    const res = await fetch(`/api/invites/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Error");
      setSaving(false);
      return;
    }

    // Sign in automatically
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t("signInFailed"));
      setSaving(false);
      return;
    }

    window.location.href = `/${locale}`;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-green-700 px-6 py-5 text-white text-center">
        <p className="font-semibold text-lg">{t("title")}</p>
        <p className="text-green-200 text-sm mt-1">{email}</p>
        <span className="inline-block mt-2 bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-full">
          {roleLabels}
        </span>
      </div>

      {view === "choose" && (
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 text-center">{t("chooseMethod")}</p>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <GoogleIcon />
            {t("continueWithGoogle")}
          </button>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <hr className="flex-1 border-gray-200" />
            {t("or")}
            <hr className="flex-1 border-gray-200" />
          </div>

          {/* Email/password */}
          <button
            onClick={() => setView("credentials")}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:bg-green-700 transition-colors"
          >
            {t("setPassword")}
          </button>
        </div>
      )}

      {view === "credentials" && (
        <form onSubmit={handleCredentials} className="p-6 space-y-4">
          <button
            type="button"
            onClick={() => setView("choose")}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            ← {t("back")}
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("yourName")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className={inp}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className={inp}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("confirmPassword")}
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className={inp}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "..." : t("createAccount")}
          </button>
        </form>
      )}
    </div>
  );
}

const inp =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
