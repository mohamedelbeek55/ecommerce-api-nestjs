import { renderBaseLayout } from './base-layout.template';

interface VerificationEmailOptions {
    name: string;
    verificationUrl: string;
    appName: string;
    expiresInHours: number;
}

export function renderVerificationEmail(
    options: VerificationEmailOptions,
): string {
    const { name, verificationUrl, appName, expiresInHours } = options;

    const content = `
    <h2 style="margin:0 0 16px 0;color:#111827;font-size:22px;font-weight:600;letter-spacing:-0.01em;">
      Verify your email address
    </h2>

    <p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.6;">
      Hi <strong>${name}</strong>,
    </p>

    <p style="margin:0 0 24px 0;color:#374151;font-size:15px;line-height:1.6;">
      Thanks for signing up for <strong>${appName}</strong>! To complete your registration, please confirm your email address by clicking the button below.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
      <tr>
        <td align="center" style="border-radius:8px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);">
          <a href="${verificationUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:8px;letter-spacing:0.01em;">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px 0;color:#6b7280;font-size:13px;line-height:1.6;">
      Or copy and paste this link into your browser:
    </p>

    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 16px;margin-bottom:24px;word-break:break-all;">
      <a href="${verificationUrl}" style="color:#667eea;font-size:12px;text-decoration:none;font-family:'SF Mono',Monaco,'Cascadia Code',monospace;">
        ${verificationUrl}
      </a>
    </div>

    <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;padding:12px 16px;margin-bottom:8px;">
      <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
        ⏱️ This link will expire in <strong>${expiresInHours} hours</strong>.
      </p>
    </div>

    <p style="margin:16px 0 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `;

    return renderBaseLayout({
        title: `Verify your email — ${appName}`,
        preheader: `Confirm your email address to activate your ${appName} account.`,
        content,
        appName,
    });
}