import nodemailer from "nodemailer"

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const mailOptions = {
    from: `"TaskMaster" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <h1>Hello ${name},</h1>
      <p>You requested a password reset for your TaskMaster account.</p>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Thanks,<br>The TaskMaster Team</p>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

