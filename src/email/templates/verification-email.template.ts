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
    <div>
      <!-- Heading -->
      <h2
        style="
          margin:0 0 16px;
          color:#1C1917;
          font-size:24px;
          line-height:1.3;
          font-weight:700;
          letter-spacing:-0.02em;
        "
      >
        Verify your email address
      </h2>

      <!-- Greeting -->
      <p
        style="
          margin:0 0 16px;
          color:#1C1917;
          font-size:15px;
          line-height:1.7;
        "
      >
        Hi <strong>${name}</strong>,
      </p>

      <!-- Message -->
      <p
        style="
          margin:0 0 28px;
          color:#736A63;
          font-size:15px;
          line-height:1.7;
        "
      >
        Thanks for creating an account with
        <strong style="color:#1C1917;">${appName}</strong>.
        Please verify your email address to complete your registration.
      </p>

      <!-- CTA -->
      <table
        role="presentation"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="margin:0 0 28px;"
      >
        <tr>
          <td
            align="center"
            style="
              border-radius:6px;
              background-color:#B85C38;
            "
          >
            <a
              href="${verificationUrl}"
              target="_blank"
              style="
                display:inline-block;
                padding:14px 28px;
                color:#FFFFFF;
                text-decoration:none;
                font-size:14px;
                line-height:1.2;
                font-weight:600;
                border-radius:6px;
              "
            >
              Verify Email Address
            </a>
          </td>
        </tr>
      </table>

      <!-- Alternative link -->
      <p
        style="
          margin:0 0 10px;
          color:#736A63;
          font-size:13px;
          line-height:1.6;
        "
      >
        If the button doesn't work, copy and paste this link into your browser:
      </p>

      <div
        style="
          margin:0 0 24px;
          padding:12px 14px;
          background-color:#FBF7F2;
          border:1px solid #E7DED4;
          border-radius:6px;
          word-break:break-all;
        "
      >
        <a
          href="${verificationUrl}"
          target="_blank"
          style="
            color:#B85C38;
            font-size:12px;
            line-height:1.6;
            text-decoration:none;
            font-family:'SF Mono',Monaco,'Cascadia Code',monospace;
          "
        >
          ${verificationUrl}
        </a>
      </div>

      <!-- Expiration notice -->
      <div
        style="
          margin:0 0 20px;
          padding:14px 16px;
          background-color:#EAD9C9;
          border-radius:6px;
        "
      >
        <p
          style="
            margin:0;
            color:#1C1917;
            font-size:13px;
            line-height:1.6;
          "
        >
          <strong>This verification link expires in ${expiresInHours} hours.</strong>
        </p>
      </div>

      <!-- Security note -->
      <p
        style="
          margin:0;
          color:#736A63;
          font-size:13px;
          line-height:1.6;
        "
      >
        If you didn't create an account with ${appName}, you can safely ignore this email.
      </p>
    </div>
  `;

  return renderBaseLayout({
    title: `Verify your email — ${appName}`,
    preheader: `Confirm your email address to activate your ${appName} account.`,
    content,
    appName,
  });
}