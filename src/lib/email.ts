import nodemailer from "nodemailer";
import { getVerificationEmailTemplate } from "./email-templates";

// For development, we'll use a test SMTP service
// In production, you'd use your actual SMTP settings
let transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: process.env.EMAIL_SERVER_SECURE === "true",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationLink = `${baseUrl}/auth/verify?token=${token}`;

    // For development, if no SMTP settings are provided, create a test account
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      console.log("No email credentials found, using Ethereal Email for testing");
      try {
        // Create a test account on ethereal.email for testing
        const testAccount = await nodemailer.createTestAccount();
        console.log("Created test account:", testAccount.user);
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      } catch (etherealError) {
        console.error("Failed to create Ethereal test account:", etherealError);
        throw etherealError;
      }
    }

    const emailHtml = getVerificationEmailTemplate(verificationLink);

    console.log(`Attempting to send verification email to ${email}`);
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"WatPlan" <noreply@watplan.example.com>',
      to: email,
      subject: "Verify your email for WatPlan",
      text: `Please verify your email by clicking on this link: ${verificationLink}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", info.messageId);

    // For test accounts, log the URL where the email can be viewed
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
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