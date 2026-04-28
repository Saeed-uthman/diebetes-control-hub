<?php
/**
 * Mailer Utility
 * 
 * Sends emails via SMTP using PHPMailer.
 * Install PHPMailer: composer require phpmailer/phpmailer
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

// Auto-load PHPMailer from Composer
$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require_once $autoloadPath;
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class Mailer {

    /**
     * Create a configured PHPMailer instance
     */
    private static function createMailer(): PHPMailer {
        $mail = new PHPMailer(true);

        // SMTP settings
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USERNAME;
        $mail->Password   = SMTP_PASSWORD;
        $mail->SMTPSecure = SMTP_ENCRYPTION === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = SMTP_PORT;

        // Sender
        $mail->setFrom(MAIL_FROM_ADDRESS, MAIL_FROM_NAME);

        // Defaults
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';

        return $mail;
    }

    /**
     * Send a password reset email
     */
    public static function sendPasswordReset(string $toEmail, string $toName, string $token): bool {
        try {
            $mail = self::createMailer();
            $mail->addAddress($toEmail, $toName);

            $resetUrl = FRONTEND_URL . '/reset-password?token=' . urlencode($token);

            $mail->Subject = 'Reset Your Password — ' . MAIL_FROM_NAME;
            $mail->Body    = self::passwordResetTemplate($toName, $resetUrl);
            $mail->AltBody = "Hi {$toName},\n\nYou requested a password reset. Use this link within 1 hour:\n{$resetUrl}\n\nIf you didn't request this, ignore this email.\n\n— " . MAIL_FROM_NAME;

            $mail->send();
            return true;

        } catch (Exception $e) {
            error_log('Mailer Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * HTML template for password reset email
     */
    private static function passwordResetTemplate(string $name, string $resetUrl): string {
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">DiabetesCare</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;">Password Reset Request</h2>
              <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
                Hi <strong>{$name}</strong>, we received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="{$resetUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or copy and paste this URL into your browser:</p>
              <p style="margin:0 0 24px;color:#0ea5e9;font-size:13px;word-break:break-all;">{$resetUrl}</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">&copy; 2026 DiabetesCare. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    /**
     * Send an email verification email
     */
    public static function sendEmailVerification(string $toEmail, string $toName, string $token): bool {
        try {
            $mail = self::createMailer();
            $mail->addAddress($toEmail, $toName);

            $verifyUrl = FRONTEND_URL . '/verify-email?token=' . urlencode($token);

            $mail->Subject = 'Verify Your Email — ' . MAIL_FROM_NAME;
            $mail->Body    = self::emailVerificationTemplate($toName, $verifyUrl);
            $mail->AltBody = "Hi {$toName},\n\nWelcome to DiabetesCare! Please verify your email by visiting this link:\n{$verifyUrl}\n\nThis link expires in 24 hours.\n\n— " . MAIL_FROM_NAME;

            $mail->send();
            return true;

        } catch (Exception $e) {
            error_log('Mailer Error (verification): ' . $e->getMessage());
            return false;
        }
    }

    /**
     * HTML template for email verification
     */
    private static function emailVerificationTemplate(string $name, string $verifyUrl): string {
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">DiabetesCare</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;">Verify Your Email</h2>
              <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
                Hi <strong>{$name}</strong>, welcome to DiabetesCare! Please verify your email address by clicking the button below. This link expires in <strong>24 hours</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="{$verifyUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or copy and paste this URL into your browser:</p>
              <p style="margin:0 0 24px;color:#0ea5e9;font-size:13px;word-break:break-all;">{$verifyUrl}</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">If you didn't create an account, you can safely ignore this email.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">&copy; 2026 DiabetesCare. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    /**
     * Send a medication reminder email
     */
    public static function sendMedicationReminder(string $toEmail, string $toName, string $medicationName, string $dosage, string $scheduledTime): bool {
        try {
            $mail = self::createMailer();
            $mail->addAddress($toEmail, $toName);

            $dashboardUrl = FRONTEND_URL . '/medication';

            $mail->Subject = 'Medication Reminder: ' . $medicationName . ' — ' . MAIL_FROM_NAME;
            $mail->Body    = self::medicationReminderTemplate($toName, $medicationName, $dosage, $scheduledTime, $dashboardUrl);
            $mail->AltBody = "Hi {$toName},\n\nThis is a reminder to take your medication:\n\nMedication: {$medicationName}\nDosage: {$dosage}\nScheduled Time: {$scheduledTime}\n\nVisit your dashboard: {$dashboardUrl}\n\n— " . MAIL_FROM_NAME;

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log('Mailer Error (medication reminder): ' . $e->getMessage());
            return false;
        }
    }

    /**
     * HTML template for medication reminder
     */
    private static function medicationReminderTemplate(string $name, string $medName, string $dosage, string $time, string $dashboardUrl): string {
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">💊 DiabetesCare</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;">Medication Reminder</h2>
              <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
                Hi <strong>{$name}</strong>, it's time to take your medication.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border-radius:8px;border:1px solid #bae6fd;margin:0 0 24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;color:#0c4a6e;font-size:16px;font-weight:600;">{$medName}</p>
                    <p style="margin:0 0 4px;color:#475569;font-size:14px;">Dosage: <strong>{$dosage}</strong></p>
                    <p style="margin:0;color:#475569;font-size:14px;">Scheduled: <strong>{$time}</strong></p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="{$dashboardUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">
                      View My Medications
                    </a>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">Taking your medication on time is crucial for managing your health. If you have questions, consult your healthcare provider.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">&copy; 2026 DiabetesCare. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    /**
     * Send a glucose alert email
     */
    public static function sendGlucoseAlert(string $toEmail, string $toName, float $glucoseValue, string $readingType, string $alertLevel): bool {
        try {
            $mail = self::createMailer();
            $mail->addAddress($toEmail, $toName);

            $dashboardUrl = FRONTEND_URL . '/medication';

            $mail->Subject = '⚠️ Glucose Alert: ' . ucfirst($alertLevel) . ' Level — ' . MAIL_FROM_NAME;
            $mail->Body    = self::glucoseAlertTemplate($toName, $glucoseValue, $readingType, $alertLevel, $dashboardUrl);
            $mail->AltBody = "Hi {$toName},\n\nYour glucose reading of {$glucoseValue} mg/dL ({$readingType}) is {$alertLevel}.\n\nPlease check your dashboard: {$dashboardUrl}\n\n— " . MAIL_FROM_NAME;

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log('Mailer Error (glucose alert): ' . $e->getMessage());
            return false;
        }
    }

    /**
     * HTML template for glucose alert
     */
    private static function glucoseAlertTemplate(string $name, float $value, string $readingType, string $alertLevel, string $dashboardUrl): string {
        $alertColor = $alertLevel === 'high' ? '#ef4444' : ($alertLevel === 'low' ? '#f59e0b' : '#22c55e');
        $alertBg = $alertLevel === 'high' ? '#fef2f2' : ($alertLevel === 'low' ? '#fffbeb' : '#f0fdf4');
        $alertBorder = $alertLevel === 'high' ? '#fecaca' : ($alertLevel === 'low' ? '#fde68a' : '#bbf7d0');
        $alertLabel = ucfirst($alertLevel);
        $readingLabel = ucwords(str_replace('_', ' ', $readingType));

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">⚠️ DiabetesCare</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;">Glucose Level Alert</h2>
              <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
                Hi <strong>{$name}</strong>, your recent glucose reading requires attention.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:{$alertBg};border-radius:8px;border:1px solid {$alertBorder};margin:0 0 24px;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <p style="margin:0 0 4px;color:{$alertColor};font-size:28px;font-weight:700;">{$value} mg/dL</p>
                    <p style="margin:0 0 8px;color:{$alertColor};font-size:14px;font-weight:600;">{$alertLabel} Level</p>
                    <p style="margin:0;color:#475569;font-size:13px;">Reading Type: {$readingLabel}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="{$dashboardUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">
                      View Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">If your glucose remains outside the target range, please consult your healthcare provider immediately.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">&copy; 2026 DiabetesCare. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    /**
     * Send a generic email (reusable for future features)
     */
    public static function send(string $toEmail, string $toName, string $subject, string $htmlBody, string $altBody = ''): bool {
        try {
            $mail = self::createMailer();
            $mail->addAddress($toEmail, $toName);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = $altBody ?: strip_tags($htmlBody);
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log('Mailer Error: ' . $e->getMessage());
            return false;
        }
    }
}
