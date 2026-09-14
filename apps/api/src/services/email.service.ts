const configured = Boolean(process.env.SMTP_HOST && process.env.MAIL_USER && process.env.MAIL_APP_PASSWORD);

export async function sendCouponClaimEmail(input: { to: string; code: string; seller: string; product: string; claimedAt: Date }) {
  if (!configured) return;
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_APP_PASSWORD },
  });
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: input.to,
    subject: "Your FindIt Surat 10% visit coupon",
    text: `Your FindIt website coupon is ${input.code}. It gives 10% off ${input.product} at ${input.seller}. Claimed ${input.claimedAt.toISOString()}. Show the code to the seller for verification.`,
  });
}