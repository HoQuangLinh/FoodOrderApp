const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: "hoquanglinh2710@gmail.com",
        pass: "#include<iostream>",
      },
    });

    await transporter.sendMail({
      from: "hoquanglinh2710@gmail.com",
      to: email,
      subject: subject,
      text: text,
    });

    console.log("email sent sucessfully");
  } catch (error) {
    console.log(error, "email not sent");
  }
};

module.exports = sendEmail;
