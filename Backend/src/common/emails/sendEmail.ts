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

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Morafeq';

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  if (!senderEmail) {
    throw new Error('BREVO_SENDER_EMAIL is not configured');
  }

  const recipients = Array.isArray(data.to) ? data.to : [data.to];

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: recipients.map((email) => ({ email })),
      subject: data.subject,
      htmlContent: data.html,
      textContent: data.text,
    }),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    console.error('BREVO EMAIL ERROR:', result);
    throw new Error(JSON.stringify(result));
  }

  return result;
};