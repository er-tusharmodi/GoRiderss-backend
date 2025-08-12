import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpMail = async (to, otp) => {
  return await transporter.sendMail({
    from: `"GoRiderss OTP" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your OTP Code",
    html: `<h3>Your OTP: ${otp}</h3><p>Expires in 10 minutes</p>`,
  });
};

export { transporter, sendOtpMail };