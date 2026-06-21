import {
  createTransport,
  SendMailOptions,
} from 'nodemailer';

const transporter = createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.email,
    pass: process.env.password,
  },
});

export const sendEmail = async (
  data: SendMailOptions,
) => {
  if (!process.env.email || !process.env.password) {
    throw new Error(
      'Email credentials are not configured',
    );
  }

  return transporter.sendMail({
    from: `"Morafeq" <${process.env.email}>`,
    ...data,
  });
};