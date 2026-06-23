import { createTransport, SendMailOptions } from 'nodemailer';

export const sendEmail = async (data: SendMailOptions) => {
  const emailUser = process.env.EMAIL_USER || process.env.email;
  const emailPass = process.env.EMAIL_PASS || process.env.password;

  if (!emailUser || !emailPass) {
    throw new Error('Email credentials are not configured');
  }

  const transporter = createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass,
    },

    // Important for Railway: do not hang forever
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  return transporter.sendMail({
    from: `"Morafeq" <${emailUser}>`,
    ...data,
  });
};