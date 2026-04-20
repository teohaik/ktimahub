import { Resend } from "resend";

// Lazily instantiated so the module can be imported at build time without RESEND_API_KEY
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? "KtimaHub <noreply@ktimahub.gr>";
const APP_URL = process.env.NEXTAUTH_URL ?? "https://ktimahub.gr";

export async function sendVerificationEmail({
  to,
  token,
  locale = "el",
}: {
  to: string;
  token: string;
  locale?: string;
}) {
  const link = `${APP_URL}/${locale}/verify-email?token=${token}`;
  const subject =
    locale === "el"
      ? "Επιβεβαιώστε το email σας — KtimaHub"
      : "Verify your email — KtimaHub";

  const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; margin: 0; padding: 32px 0; }
    .card { background: #fff; max-width: 520px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header { background: #166534; padding: 28px 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .header p { color: #bbf7d0; margin: 6px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .cta { display: inline-block; margin-top: 24px; padding: 13px 28px; background: #16a34a; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .link-fallback { margin-top: 20px; font-size: 12px; color: #9ca3af; word-break: break-all; }
    .footer { border-top: 1px solid #f3f4f6; padding: 16px 32px; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🌾 KtimaHub</h1>
      <p>${locale === "el" ? "Διαχείριση Αγροτεμαχίων" : "Smart agricultural land management"}</p>
    </div>
    <div class="body">
      <p style="margin-top:0">${
        locale === "el"
          ? "Σας ευχαριστούμε για την εγγραφή σας στο KtimaHub! Πατήστε το παρακάτω κουμπί για να επιβεβαιώσετε τη διεύθυνση email σας και να ενεργοποιήσετε τον λογαριασμό σας."
          : "Thank you for signing up for KtimaHub! Click the button below to verify your email address and activate your account."
      }</p>
      <a href="${link}" class="cta">${locale === "el" ? "Επιβεβαίωση Email" : "Verify Email"}</a>
      <p class="link-fallback">${locale === "el" ? "Ή αντιγράψτε τον σύνδεσμο:" : "Or copy this link:"}<br/>${link}</p>
    </div>
    <div class="footer">
      ${
        locale === "el"
          ? "Αυτός ο σύνδεσμος λήγει σε 24 ώρες. Εάν δεν δημιουργήσατε λογαριασμό στο KtimaHub, αγνοήστε αυτό το email."
          : "This link expires in 24 hours. If you did not create a KtimaHub account, you can safely ignore this email."
      }
    </div>
  </div>
</body>
</html>
  `;

  await getResend().emails.send({ from: FROM, to, subject, html });
}

export async function sendInviteEmail({
  to,
  token,
  roles,
  locale = "el",
}: {
  to: string;
  token: string;
  roles: string[];
  locale?: string;
}) {
  const link = `${APP_URL}/${locale}/invite/${token}`;
  const roleLabel = roles
    .map((r) =>
      r === "SUPER_ADMIN"
        ? "Διαχειριστής"
        : r === "LAND_OWNER"
        ? "Ιδιοκτήτης"
        : "Ενοικιαστής"
    )
    .join(", ");

  const subject =
    locale === "el"
      ? "Πρόσκληση στο KtimaHub"
      : "You've been invited to KtimaHub";

  const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; margin: 0; padding: 32px 0; }
    .card { background: #fff; max-width: 520px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header { background: #166534; padding: 28px 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .header p { color: #bbf7d0; margin: 6px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .role-badge { display: inline-block; background: #dcfce7; color: #166534; border-radius: 9999px; padding: 4px 12px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    .cta { display: inline-block; margin-top: 24px; padding: 13px 28px; background: #16a34a; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .link-fallback { margin-top: 20px; font-size: 12px; color: #9ca3af; word-break: break-all; }
    .footer { border-top: 1px solid #f3f4f6; padding: 16px 32px; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🌾 KtimaHub</h1>
      <p>${locale === "el" ? "Διαχείριση Αγροτεμαχίων" : "Smart agricultural land management"}</p>
    </div>
    <div class="body">
      <p style="margin-top:0">${locale === "el"
        ? `Καλώς ήλθατε στο KtimaHub! Αυτή είναι μια πρόσκληση για να δημιουργήσετε τον λογαριασμό σας ως <strong>${roleLabel}</strong>.`
        : `Welcome to KtimaHub! You have been invited to create your account as <strong>${roleLabel}</strong>.`
      }</p>
      <p>${locale === "el" ? "Πατήστε το παρακάτω κουμπί για να συνεχίσετε:" : "Click the button below to continue:"}</p>
      <a href="${link}" class="cta">${locale === "el" ? "Αποδοχή Πρόσκλησης" : "Accept Invitation"}</a>
      <p class="link-fallback">${locale === "el" ? "Ή αντιγράψτε τον σύνδεσμο:" : "Or copy this link:"}<br/>${link}</p>
    </div>
    <div class="footer">
      ${locale === "el"
        ? "Αυτή η πρόσκληση λήγει σε 7 ημέρες. Εάν δεν ζητήσατε αυτό το email, αγνοήστε το."
        : "This invitation expires in 7 days. If you did not expect this email, you can safely ignore it."}
    </div>
  </div>
</body>
</html>
  `;

  await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html,
  });
}
