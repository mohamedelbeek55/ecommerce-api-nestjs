interface BaseLayoutOptions {
  title: string;
  preheader: string;
  content: string;
  appName: string;
  footerText?: string;
}

export function renderBaseLayout(options: BaseLayoutOptions): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${options.title}</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background-color:#FBF7F2;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
    -webkit-font-smoothing:antialiased;
  "
>
  <!-- Preheader -->
  <div
    style="
      display:none;
      max-height:0;
      overflow:hidden;
      opacity:0;
      color:transparent;
    "
  >
    ${options.preheader}
  </div>

  <table
    role="presentation"
    cellpadding="0"
    cellspacing="0"
    border="0"
    width="100%"
    style="background-color:#FBF7F2;"
  >
    <tr>
      <td align="center" style="padding:40px 20px;">

        <table
          role="presentation"
          cellpadding="0"
          cellspacing="0"
          border="0"
          width="100%"
          style="
            max-width:600px;
            background-color:#FFFFFF;
            border:1px solid #E7DED4;
            border-radius:12px;
            overflow:hidden;
          "
        >

          <!-- Header -->
          <tr>
            <td
              style="
                padding:30px 40px;
                background-color:#EAD9C9;
                text-align:center;
              "
            >
              <p
                style="
                  margin:0;
                  color:#1C1917;
                  font-size:22px;
                  line-height:1.3;
                  font-weight:700;
                  letter-spacing:-0.02em;
                "
              >
                ${options.appName}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${options.content}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div
                style="
                  height:1px;
                  background-color:#E7DED4;
                "
              ></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              style="
                padding:24px 40px 30px;
                text-align:center;
              "
            >
              <p
                style="
                  margin:0 0 8px;
                  color:#736A63;
                  font-size:12px;
                  line-height:1.6;
                "
              >
                ${options.footerText ||
    `You received this email because you registered at ${options.appName}.`
    }
              </p>

              <p
                style="
                  margin:0;
                  color:#A49B94;
                  font-size:11px;
                  line-height:1.5;
                "
              >
                © ${year} ${options.appName}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}