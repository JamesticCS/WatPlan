import { Resend } from 'resend';
import { getVerificationEmailTemplate } from "./email-templates";
import nodemailer from "nodemailer";

// Create a Resend client
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Fallback NodeMailer transporter for development
let fallbackTransporter: nodemailer.Transporter | null = null;

export async function sendVerificationEmail(email: string, token: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationLink = `${baseUrl}/auth/verify?token=${token}`;
    const emailHtml = getVerificationEmailTemplate(verificationLink);
    const emailText = `Please verify your email by clicking on this link: ${verificationLink}`;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@watplan.app';

    console.log(`Attempting to send verification email to ${email}`);

    // First try to use Resend if API key is available (preferred for production)
    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: 'Verify your email for WatPlan',
          html: emailHtml,
          text: emailText,
        });

        if (error) {
          throw new Error(`Resend error: ${error.message}`);
        }

        console.log('Email sent successfully with Resend:', data?.id);
        return data;
      } catch (resendError) {
        console.error('Resend email service failed, falling back to Nodemailer:', resendError);
        // Continue to fallback
      }
    }

    // Fallback to NodeMailer with Ethereal for development
    if (!fallbackTransporter) {
      // Check if we have SMTP settings
      if (process.env.EMAIL_SERVER_HOST && 
          process.env.EMAIL_SERVER_USER && 
          process.env.EMAIL_SERVER_PASSWORD) {
        // Use provided SMTP settings
        fallbackTransporter = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST,
          port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
          secure: process.env.EMAIL_SERVER_SECURE === "true",
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        });
      } else {
        // Create Ethereal test account
        console.log("No email credentials found, using Ethereal Email for testing");
        const testAccount = await nodemailer.createTestAccount();
        console.log("Created test account:", testAccount.user);
        
        fallbackTransporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }
    }

    // Send with NodeMailer
    const info = await fallbackTransporter.sendMail({
      from: fromEmail,
      to: email,
      subject: "Verify your email for WatPlan",
      text: emailText,
      html: emailHtml,
    });

    console.log("Email sent successfully with Nodemailer:", info.messageId);

    // For Ethereal test accounts, log the URL where the email can be viewed
    if (info && info.messageId && fallbackTransporter?.options?.host === "smtp.ethereal.email") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("==============================================================");
      console.log("IMPORTANT: Email verification preview URL:", previewUrl);
      console.log("==============================================================");
    }

    return info;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
}