export const getVerificationEmailTemplate = (verificationLink: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email for WatPlan</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 30px;
      border: 1px solid #eee;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin-bottom: 10px;
    }
    .content {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      text-align: center;
    }
    .footer {
      margin-top: 30px;
      font-size: 0.8em;
      color: #666;
      text-align: center;
    }
    .link-fallback {
      margin-top: 20px;
      word-break: break-all;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verify your email for WatPlan</h1>
    </div>
    <div class="content">
      <p>Thank you for signing up for WatPlan! Please verify your email address to activate your account.</p>
      <p>Click the button below to verify your email and access all the features of WatPlan:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" class="button">Verify Email Address</a>
      </p>
      <p class="link-fallback">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${verificationLink}">${verificationLink}</a>
      </p>
    </div>
    <div class="footer">
      <p>If you did not sign up for WatPlan, you can safely ignore this email.</p>
      <p>&copy; ${new Date().getFullYear()} WatPlan. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};