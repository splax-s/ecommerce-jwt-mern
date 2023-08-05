import nodemailer, { Transporter } from 'nodemailer';

interface MailOptions {
  email: string;
  subject: string;
  message: string;
}

const sendMail = async (options: MailOptions): Promise<void> => {
  // Check if the email property is defined
  if (!options.email) {
    throw new Error('Email address is missing.');
  }

  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMPT_HOST,
    port: Number(process.env.SMPT_PORT),
    service: process.env.SMPT_SERVICE,
    auth:{
      user: process.env.SMPT_MAIL,
      pass: process.env.SMPT_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};

export default sendMail;
