import { renderBaseLayout } from './base-layout.template';

interface PasswordResetEmailOptions {
    name: string;
    resetUrl: string;
    appName: string;
    expiresInMinutes: number;
}

export function renderPasswordResetEmail(
    options: PasswordResetEmailOptions,
): string {
    const { name, resetUrl, appName, expiresInMinutes } = options;

    const content = `
    <h2 style="margin:0 0 16px 0;color:#111827;font-size:22px;font-weight:600;letter-spacing:-0.01em;">
      Reset your password
    </h2>

    <p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.6;">
      Hi <strong>${name}</strong>,
    </p>

    <p style="margin:0 0 24px 0;color:#374151;font-size:15px;line-height:1.6;">
      We received a request to reset the password for your <strong>${appName}</strong> account. Click the button below to choose a new password.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
      <tr>
        <td align="center" style="border-radius:8px;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);">
          <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:8px;letter-spacing:0.01em;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px 0;color:#6b7280;font-size:13px;line-height:1.6;">
      Or copy and paste this link into your browser:
    </p>

    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 16px;margin-bottom:24px;word-break:break-all;">
      <a href="${resetUrl}" style="color:#ef4444;font-size:12px;text-decoration:none;font-family:'SF Mono',Monaco,'Cascadia Code',monospace;">
        ${resetUrl}
      </a>
    </div>

    <div style="background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;padding:12px 16px;margin-bottom:8px;">
      <p style="margin:0 0 6px 0;color:#991b1b;font-size:13px;line-height:1.5;font-weight:600;">
        ⏱️ This link will expire in ${expiresInMinutes} minutes.
      </p>
      <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.5;">
        If you didn't request this, ignore this email — your password will remain unchanged.
      </p>
    </div>
  `;

    return renderBaseLayout({
        title: `Reset your password — ${appName}`,
        preheader: `Reset your ${appName} password using the link inside.`,
        content,
        appName,
    });
}