import { Resend } from 'resend';

type SendEmailData = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export const sendEmail = async (data: SendEmailData) => {
  if (process.env.DISABLE_EMAILS === 'true') {
    console.log('EMAIL DISABLED. Email data:', {
      to: data.to,
      subject: data.subject,
    });

    return {
      disabled: true,
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  if (!fromEmail) {
    throw new Error('EMAIL_FROM is not configured');
  }

  const resend = new Resend(apiKey);

  const result = await resend.emails.send({
    from: fromEmail,
    to: data.to,
    subject: data.subject,
    html: data.html,
    text: data.text,
  });

  if (result.error) {
    console.error('RESEND EMAIL ERROR:', result.error);
    throw new Error(JSON.stringify(result.error));
  }

  return result.data;
};