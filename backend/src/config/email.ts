import dotenv from "dotenv";

dotenv.config();

export const emailConfig = {
  host: process.env.EMAIL_HOST || "smtp.mailtrap.io",
  port: parseInt(process.env.EMAIL_PORT || "2525"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  from: process.env.EMAIL_FROM || '"Nonnytech" <noreply@nonnytech.com>',
};
