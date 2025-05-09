import nodemailer from "nodemailer"
import Mailgen from "mailgen"
import dotenv from "dotenv"

dotenv.config({
    path: ".env"
})

    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST,
      port: process.env.MAILTRAP_SMTP_PORT,
      auth: {
          user: process.env.MAILTRAP_SMTP_USER, // generated mailtrap user
          pass: process.env.MAILTRAP_SMTP_PASS, // generated mailtrap password
      }
  });

  const sendMail = async (options) => {
    var mailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "Mailgen",
        link: "https://mailgen.js/",
      },
    });
    const emailBody = mailGenerator.generate(options.mailGenContent);
    const emailText = mailGenerator.generatePlaintext(options.mailGenContent);
    const mailOptions = {
      from: '"Maddison Foo Koch 👻" <maddison53@ethereal.email>', // sender address
      to: options.email,
      subject: options.subject,
      text: emailText,
      html: emailBody,
    };
  
    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
  
    }
  };




  
const emailVerificationContent = (username, verificationURL) => {
    return {
      body: {
        name: username,
        intro:
          "Welcome to Project Management System! We're very excited to have you on board.",
        action: {
          instructions: "To get started with US, please click here:",
          button: {
            color: "#22BC66", // Optional action button color
            text: "Confirm your account",
            link: verificationURL,
          },
        },
        outro:
          "Need help, or have questions? Just reply to this email, we'd love to help.",
      },
    };
  };


  const resendEmailVerificationContent = (username, verificationURL) => {
    return {
      body: {
        name: username,
        intro:
          "Welcome to Project Management System! We're very excited to have you on board.",
        action: {
          instructions: "To get started with US, please click here:",
          button: {
            color: "#22BC66", // Optional action button color
            text: "Confirm your account",
            link: verificationURL,
          },
        },
        outro:
          "Need help, or have questions? Just reply to this email, we'd love to help.",
      },
    };
  };

  const emailVerificationConfirmationContent = (username) => {
    return {
      body: {
        name: username,
        intro:
          "Welcome to Project Management System! We're very excited to have you on board.",
        action: {
          instructions: "To get started with US, please click here:",
          button: {
            color: "#22BC66", // Optional action button color
            text: "Confirm your account",
          },
        },
        outro:
          "Need help, or have questions? Just reply to this email, we'd love to help.",
      },
    };
  };


  const resetPasswordEmailContent = (username, resetPassUrl) => {
    return {
      body: {
        name: username,
        intro:
          "Welcome to Project Management System! We're very excited to have you on board.",
        action: {
          instructions: "To get started with US, please click here:",
          button: {
            color: "#22BC66", // Optional action button color
            text: "Confirm your account",
            link: resetPassUrl,
          },
        },
        outro:
          "Need help, or have questions? Just reply to this email, we'd love to help.",
      },
    };
  };

  export {
    sendMail,
    emailVerificationContent,
    emailVerificationConfirmationContent,
    resetPasswordEmailContent,
    resendEmailVerificationContent
  };

