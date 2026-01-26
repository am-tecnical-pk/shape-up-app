import nodemailer from 'nodemailer';
import asyncHandler from 'express-async-handler';

// @desc    Send support email
// @route   POST /api/support/send
// @access  Public
const sendEmail = asyncHandler(async (req, res) => {
  const { subject, message, userEmail } = req.body;

  if (!subject || !message || !userEmail) {
    res.status(400);
    throw new Error('Please provide subject, message, and your email');
  }

  // 1. Create Transporter (The "Postman")
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or 'hotmail', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER, // Defined in your .env
      pass: process.env.EMAIL_PASS, // App Password (not your normal login password)
    },
  });

  // 2. Define Email Options
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender address (Your App)
    to: process.env.EMAIL_USER,   // Receiver address (You/Admin)
    replyTo: userEmail,           // When you hit reply, it goes to the User
    subject: `Shape Up Support: ${subject}`,
    text: `
      You have received a new support request from Shape Up.
      
      User: ${userEmail}
      Subject: ${subject}
      
      Message:
      ${message}
    `,
    html: `
      <h3>New Support Request</h3>
      <p><strong>From:</strong> ${userEmail}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px;">
        <p>${message.replace(/\n/g, '<br>')}</p>
      </div>
    `,
  };

  try {
    // 3. Send the Email
    await transporter.sendMail(mailOptions);
    console.log(`Email sent from ${userEmail}`);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error(`Email send failed: ${error.message}`);
    res.status(500);
    throw new Error('Email could not be sent. Please check server logs.');
  }
});

export { sendEmail };