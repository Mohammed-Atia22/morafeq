import { lookup } from 'node:dns/promises';
import net from 'node:net';
import { createTransport, SendMailOptions } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 587;

export const sendEmail = async (data: SendMailOptions) => {
  const emailUser = process.env.EMAIL_USER || process.env.email;
  const emailPass = process.env.EMAIL_PASS || process.env.password;

  if (!emailUser || !emailPass) {
    throw new Error('Email credentials are not configured');
  }

  const transportOptions = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    requireTLS: true,

    auth: {
      user: emailUser,
      pass: emailPass,
    },

    tls: {
      servername: SMTP_HOST,
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,

    async getSocket(_options, callback) {
      let called = false;

      const done = (err: Error | null, socketOptions?: any) => {
        if (called) return;
        called = true;
        callback(err, socketOptions);
      };

      try {
        const { address } = await lookup(SMTP_HOST, { family: 4 });

        console.log(`SMTP IPv4 resolved: ${address}`);

        const socket = net.connect({
          host: address,
          port: SMTP_PORT,
          family: 4,
          timeout: 10000,
        });

        socket.once('connect', () => {
          done(null, {
            connection: socket,
          });
        });

        socket.once('timeout', () => {
          socket.destroy();
          done(new Error('SMTP socket timeout'), undefined);
        });

        socket.once('error', (error) => {
          done(error, undefined);
        });
      } catch (error) {
        done(error as Error, undefined);
      }
    },
  } as SMTPTransport.Options;

  const transporter = createTransport(transportOptions);

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