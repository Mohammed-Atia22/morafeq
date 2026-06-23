import { setDefaultResultOrder } from 'node:dns';
import { createTransport, SendMailOptions } from 'nodemailer';

setDefaultResultOrder('ipv4first');

export const sendEmail = async (data: SendMailOptions) => {
  const emailUser = process.env.EMAIL_USER || process.env.email;
  const emailPass = process.env.EMAIL_PASS || process.env.password;

  if (!emailUser || !emailPass) {
    throw new Error('Email credentials are not configured');
  }

  const transporter = createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,

    auth: {
      user: emailUser,
      pass: emailPass,
    },

    // Force IPv4 because Railway failed on Gmail IPv6
    family: 4,

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  try {
    return await transporter.sendMail({
      from: `"Morafeq" <${emailUser}>`,
      ...data,
    });
  } catch (error) {
    console.error('SEND EMAIL ERROR:', error);
    throw error;
  }
};