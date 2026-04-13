"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

type Role = "SUPER_ADMIN" | "LAND_OWNER" | "LEASEHOLDER";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  roles: Role[];
  createdAt: Date | string;
}

const ROLES: Role[] = ["SUPER_ADMIN", "LAND_OWNER", "LEASEHOLDER"];

export default function UsersManager({ users: initial }: { users: User[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const [users, setUsers] = useState(initial);
  const [modal, setModal] = useState<"add" | "edit" | "invite" | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setModal("add");
  }

  function openEdit(u: User) {
    setEditing(u);
    setModal("edit");
  }

  async function handleDelete(id: string) {
    if (!confirm(t("common.confirm") + "?")) return;
    setDeleting(id);
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeleting(null);
  }

  function onSaved(user: User) {
    setUsers((prev) =>
      modal === "add"
        ? [...prev, user]
        : prev.map((u) => (u.id === user.id ? user : u))
    );
    setModal(null);
  }

  const roleBadge: Record<Role, string> = {
    SUPER_ADMIN: "bg-purple-100 text-purple-800",
    LAND_OWNER: "bg-green-100 text-green-800",
    LEASEHOLDER: "bg-blue-100 text-blue-800",
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-500">{users.length} χρήστες</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModal("invite")}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
            >
              <MailIcon /> {t("invite.sendInvite")}
            </button>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <span>+</span> {t("users.addUser")}
            </button>
          </div>
        </div>

        {/* Mobile */}
        <div className="sm:hidden divide-y divide-gray-100">
          {users.map((u) => (
            <div key={u.id} className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{u.name}</p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                {u.roles.map((r) => (
                  <span key={r} className={`inline-block mt-1 mr-1 text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge[r]}`}>
                    {t(`users.${r}`)}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(u)} className="text-xs text-green-600 hover:underline">{t("common.edit")}</button>
                <button onClick={() => handleDelete(u.id)} disabled={deleting === u.id} className="text-xs text-red-500 hover:underline">{t("common.delete")}</button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop */}
        <table className="hidden sm:table w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold">{t("users.name")}</th>
              <th className="px-5 py-3 font-semibold">{t("users.email")}</th>
              <th className="px-5 py-3 font-semibold">{t("users.role")}</th>
              <th className="px-5 py-3 font-semibold">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-5 py-3 text-gray-600">{u.email}</td>
                <td className="px-5 py-3">
                  {u.roles.map((r) => (
                    <span key={r} className={`inline-flex mr-1 px-2 py-0.5 text-xs font-medium rounded-full ${roleBadge[r]}`}>
                      {t(`users.${r}`)}
                    </span>
                  ))}
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(u)} className="text-green-600 hover:text-green-800 text-xs font-medium">{t("common.edit")}</button>
                    <button onClick={() => handleDelete(u.id)} disabled={deleting === u.id} className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-40">{t("common.delete")}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal === "add" || modal === "edit") && (
        <UserModal
          user={modal === "edit" ? editing : null}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}

      {modal === "invite" && (
        <InviteModal
          locale={locale}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function UserModal({
  user,
  onClose,
  onSaved,
}: {
  user: User | null;
  onClose: () => void;
  onSaved: (u: User) => void;
}) {
  const t = useTranslations();
  const isEdit = !!user;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<Role>(user?.roles?.[0] ?? "LEASEHOLDER");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = { name, email, role, ...(password ? { password } : {}) };
    const res = await fetch(isEdit ? `/api/users/${user!.id}` : "/api/users", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Error");
      return;
    }
    onSaved(await res.json());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {isEdit ? t("users.editUser") : t("users.addUser")}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label={t("users.name")}>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inp} />
          </Field>
          <Field label={t("users.email")}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inp} />
          </Field>
          <Field label={t("users.role")}>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inp}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{t(`users.${r}`)}</option>
              ))}
            </select>
          </Field>
          <Field label={t("users.password")} hint={isEdit ? "(leave blank to keep unchanged)" : undefined}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!isEdit} autoComplete="new-password" className={inp} />
          </Field>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">{t("common.cancel")}</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">{saving ? "..." : t("common.save")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {hint && <span className="text-gray-400 font-normal ml-1">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function InviteModal({ locale, onClose }: { locale: string; onClose: () => void }) {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("LEASEHOLDER");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, roles: [role], locale }),
    });

    setSending(false);

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Error");
      return;
    }

    setSent(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t("invite.inviteUser")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {sent ? (
          <div className="p-8 text-center space-y-3">
            <div className="text-4xl">✉️</div>
            <p className="font-semibold text-gray-900">{t("invite.sent")}</p>
            <p className="text-sm text-gray-500">{t("invite.sentDesc", { email })}</p>
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {t("common.confirm")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label={t("users.email")}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="user@example.com"
                className={inp}
              />
            </Field>
            <Field label={t("users.role")}>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inp}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{t(`users.${r}`)}</option>
                ))}
              </select>
            </Field>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                {t("common.cancel")}
              </button>
              <button type="submit" disabled={sending} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {sending ? "..." : t("invite.sendInvite")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}
