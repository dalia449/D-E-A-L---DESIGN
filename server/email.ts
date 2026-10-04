import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { getDatabase, queryOne } from './db.js';

export interface SendVerificationEmailOptions {
  to: string;
  name: string;
  code: string;
  type?: 'verification' | 'password_reset';
}

export interface EmailDeliveryResult {
  success: boolean;
  provider: 'resend' | 'custom_smtp';
  messageId?: string;
  error?: string;
}

export interface ResolvedEmailConfig {
  provider: 'resend' | 'custom_smtp' | 'none';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  senderEmail?: string;
  senderName?: string;
  resendApiKey?: string;
}

/**
 * Resolves active email delivery configuration.
 * Checks persistent platform_settings in SQLite first, then process.env.
 */
export async function getResolvedEmailConfig(): Promise<ResolvedEmailConfig> {
  let dbConfig: any = null;
  try {
    const db = await getDatabase();
    const row = queryOne<{ value_json: string }>(
      db,
      "SELECT value_json FROM platform_settings WHERE setting_key = 'email_config'"
    );
    if (row && row.value_json) {
      dbConfig = JSON.parse(row.value_json);
    }
  } catch (err) {
    // If DB check fails, proceed with env
  }

  // 1. Check custom SMTP configuration
  const smtpHost = dbConfig?.smtpHost || process.env.SMTP_HOST;
  const smtpUser = dbConfig?.smtpUser || process.env.SMTP_USER || process.env.SMTP_USERNAME;
  const smtpPass = dbConfig?.smtpPass || process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const smtpPort = Number(dbConfig?.smtpPort || process.env.SMTP_PORT) || 587;
  const smtpSecure = dbConfig?.smtpSecure !== undefined
    ? Boolean(dbConfig.smtpSecure)
    : (process.env.SMTP_SECURE === 'true' || smtpPort === 465);

  const senderEmail = dbConfig?.senderEmail || process.env.SENDER_EMAIL || smtpUser || 'verify@deal-architecture.com';
  const senderName = dbConfig?.senderName || process.env.SENDER_NAME || 'DEAL Architectural Platform';

  if (smtpHost && smtpUser && smtpPass) {
    return {
      provider: 'custom_smtp',
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure,
      senderEmail,
      senderName
    };
  }

  // 2. Check Resend API configuration
  const resendApiKey = dbConfig?.resendApiKey || process.env.RESEND_API_KEY;
  if (resendApiKey) {
    return {
      provider: 'resend',
      resendApiKey,
      senderEmail: dbConfig?.senderEmail || process.env.SENDER_EMAIL || process.env.RESEND_FROM || 'DEAL Platform <onboarding@resend.dev>',
      senderName
    };
  }

  return {
    provider: 'none',
    senderEmail,
    senderName
  };
}

/**
 * Sends a real verification or password reset OTP code email.
 * Rejects simulation; strictly connects to the configured real email service provider.
 */
export async function sendVerificationEmail({
  to,
  name,
  code,
  type = 'verification'
}: SendVerificationEmailOptions): Promise<EmailDeliveryResult> {
  const cleanTo = to.trim().toLowerCase();
  const isReset = type === 'password_reset';
  const subject = isReset
    ? `DEAL — Password Reset Code: ${code}`
    : `DEAL — Email Verification Code: ${code}`;

  const heading = isReset ? 'Reset Your Password' : 'Verify Your Email Address';
  const actionText = isReset
    ? 'Use the 6-digit security code below to reset your DEAL platform password.'
    : 'Welcome to DEAL. Enter the 6-digit verification code below to activate your architectural workspace account.';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F6EFE5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #3F3832; }
    .container { max-width: 580px; margin: 40px auto; background-color: #FAF7F2; border: 1px solid #D8CEC2; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(84, 72, 60, 0.08); }
    .header { background-color: #54483C; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; color: #FAF7F2; font-size: 24px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; font-family: Georgia, serif; }
    .header p { margin: 6px 0 0 0; color: #D8CEC2; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; }
    .content { padding: 40px 32px; }
    .greeting { font-size: 16px; font-weight: 600; color: #3F3832; margin-bottom: 12px; }
    .message { font-size: 14px; line-height: 1.6; color: #54483C; margin-bottom: 28px; }
    .code-box { background-color: #EFE6DA; border: 1px solid #D8CEC2; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
    .code-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #756A60; font-weight: 600; margin-bottom: 8px; }
    .code-digits { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 700; letter-spacing: 0.35em; color: #3F3832; margin: 4px 0; }
    .code-expiry { font-size: 12px; color: #8A7A6A; margin-top: 8px; }
    .security-notice { background-color: #F6EFE5; border-left: 3px solid #54483C; padding: 14px 16px; font-size: 12px; line-height: 1.5; color: #756A60; margin-top: 28px; border-radius: 0 4px 4px 0; }
    .footer { background-color: #EFE6DA; padding: 20px 24px; text-align: center; font-size: 11px; color: #756A60; border-top: 1px solid #D8CEC2; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>DEAL</h1>
      <p>Design • Engineering • Architecture • Living</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${name || 'Architect'},</div>
      <div class="message">${actionText}</div>

      <div class="code-box">
        <div class="code-label">Verification Code</div>
        <div class="code-digits">${code}</div>
        <div class="code-expiry">Expires in <strong>10 minutes</strong></div>
      </div>

      <div class="security-notice">
        <strong>Security Notice:</strong> Never share this 6-digit code with anyone. DEAL team members will never ask for your verification code or password. If you did not request this code, you can safely ignore this email.
      </div>
    </div>
    <div class="footer">
      <p><strong>DEAL Platform</strong> — AI-Powered Architectural & Engineering System</p>
      <p>King Abdullah Financial District (KAFD), Riyadh, Saudi Arabia</p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `DEAL — Design • Engineering • Architecture • Living\n\n${heading}\n\nHello ${name || 'Architect'},\n\nYour 6-digit verification code is:\n\n${code}\n\nThis code will expire in 10 minutes.\n\nSECURITY NOTICE: Never share this code with anyone. DEAL team members will never ask for your verification code.\n\nIf you did not request this, please ignore this email.\n\nDEAL Architecture & Engineering Platform`;

  const config = await getResolvedEmailConfig();

  // 1. Resend API delivery
  if (config.provider === 'resend' && config.resendApiKey) {
    try {
      const resend = new Resend(config.resendApiKey);
      const fromAddress = config.senderEmail?.includes('<')
        ? config.senderEmail
        : `"${config.senderName || 'DEAL Platform'}" <${config.senderEmail || 'onboarding@resend.dev'}>`;

      const response = await resend.emails.send({
        from: fromAddress,
        to: cleanTo,
        subject,
        html: htmlContent,
        text: textContent
      });

      if (response.error) {
        console.error('[REAL EMAIL DISPATCH - RESEND API ERROR]', response.error);
        throw new Error(response.error.message || 'Resend API rejected the request');
      }

      console.log(`[REAL EMAIL DISPATCH - RESEND SUCCESS] Delivered to: ${cleanTo} | Message ID: ${response.data?.id}`);
      return {
        success: true,
        provider: 'resend',
        messageId: response.data?.id
      };
    } catch (err: any) {
      console.error('[REAL EMAIL DISPATCH - RESEND FAILURE]', err);
      throw new Error(`Resend email delivery failed: ${err.message || err}`);
    }
  }

  // 2. Custom SMTP delivery
  if (config.provider === 'custom_smtp' && config.smtpHost && config.smtpUser && config.smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        connectionTimeout: 6000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const senderFrom = `"${config.senderName || 'DEAL Architectural Platform'}" <${config.senderEmail || config.smtpUser}>`;

      const info = await transporter.sendMail({
        from: senderFrom,
        to: cleanTo,
        subject,
        html: htmlContent,
        text: textContent
      });

      console.log(`[REAL EMAIL DISPATCH - SMTP SUCCESS] Delivered to: ${cleanTo} | Message ID: ${info.messageId}`);
      return {
        success: true,
        provider: 'custom_smtp',
        messageId: info.messageId
      };
    } catch (err: any) {
      console.error('[REAL EMAIL DISPATCH - SMTP FAILURE]', err);
      throw new Error(`SMTP email delivery failed: ${err.message || err}`);
    }
  }

  // 3. No real email service configured
  console.warn('[EMAIL SERVICE NOTICE] No email provider (SMTP or Resend) configured in environment or database.');
  throw new Error(
    'Email delivery service is pending configuration. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env or configure Email Provider in the Executive Control Center.'
  );
}

/**
 * Validates the connection to the configured email provider.
 */
export async function verifyEmailConnection(): Promise<{
  connected: boolean;
  provider: string;
  details?: string;
  error?: string;
}> {
  const config = await getResolvedEmailConfig();

  if (config.provider === 'custom_smtp') {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        connectionTimeout: 6000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass
        }
      });
      await transporter.verify();
      return {
        connected: true,
        provider: 'custom_smtp',
        details: `Connected to ${config.smtpHost}:${config.smtpPort} as ${config.smtpUser}`
      };
    } catch (err: any) {
      return {
        connected: false,
        provider: 'custom_smtp',
        error: err.message || 'SMTP connection verification failed'
      };
    }
  }

  if (config.provider === 'resend') {
    return {
      connected: true,
      provider: 'resend',
      details: 'Resend API key configured'
    };
  }

  return {
    connected: false,
    provider: 'none',
    error: 'No email service credentials found in .env or platform settings.'
  };
}
