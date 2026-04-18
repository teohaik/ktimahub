"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface Props {
  locale: string;
}

export default function SignupForm({ locale }: Props) {
  const t = useTranslations("auth");
  const [view, setView] = useState<"choose" | "email" | "check-email">("choose");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl: `/${locale}` });
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError(t("passwordMismatch")); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, locale }),
    });

    if (!res.ok) {
      const d = await res.json();
      const msg =
        d.error === "email_taken" ? t("emailTaken") :
        d.error === "too_many_requests" ? t("tooManyRequests") :
        d.error ?? "Error";
      setError(msg);
      setLoading(false);
      return;
    }

    const data = await res.json();

    if (data.requiresVerification) {
      setView("check-email");
      setLoading(false);
      return;
    }

    // INVITED user — activate and sign in directly
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError(t("invalidCredentials"));
      setLoading(false);
      return;
    }
    window.location.href = `/${locale}`;
  }

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
      {view === "check-email" && (
        <div className="text-center py-4 space-y-3">
          <div className="text-5xl">📧</div>
          <h2 className="font-bold text-gray-900 text-lg">{t("verifyEmailTitle")}</h2>
          <p className="text-sm text-gray-500">{t("verifyEmailDesc")}</p>
          <p className="text-xs text-gray-400 pt-2">
            {t("verifyEmailSentTo")} <span className="font-medium text-gray-600">{email}</span>
          </p>
        </div>
      )}

      {view === "choose" && (
        <>
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <GoogleIcon />
            {t("signupWithGoogle")}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
              {locale === "el" ? "ή" : "or"}
            </div>
          </div>

          <button
            onClick={() => setView("email")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {t("signupWithEmail")}
          </button>
        </>
      )}

      {view === "email" && (
        <form onSubmit={handleEmailSignup} className="space-y-3">
          <button
            type="button"
            onClick={() => setView("choose")}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            ← {locale === "el" ? "Πίσω" : "Back"}
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("name")}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("password")}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("confirmPassword")}</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" className={inp} />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "..." : t("createAccount")}
          </button>
        </form>
      )}

      {view !== "check-email" && (
        <p className="text-center text-xs text-gray-500">
          {t("alreadyHaveAccount")}{" "}
          <Link href={`/${locale}/login`} className="text-green-600 hover:underline font-medium">
            {t("signIn")}
          </Link>
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
