import {createTransport ,SendMailOptions } from 'nodemailer';

export const sendEmail = async (data:SendMailOptions) => {
  const transporter = createTransport({
    host:"smtp.gmail.email",
    service: 'gmail',
    port:465,
    secure:true,
    auth: {
      user: process.env.email,
      pass: process.env.password,
    },
  });

  const info = await transporter.sendMail({
    from: `"primoo👻" <${process.env.email}>`,
    ...data
  });

  return info;
};
