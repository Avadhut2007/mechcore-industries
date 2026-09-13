// Vercel Serverless Function — handles the quote-request form.
// Runs server-side only; never exposes credentials to the browser.
//
// Required environment variables (set these in the Vercel dashboard,
// Project Settings -> Environment Variables — see README.md):
//   SMTP_USER    the Gmail address that will send the notification
//   SMTP_PASS    a 16-character Gmail "App Password" (not the normal password)
//   CONTACT_TO   (optional) where quote requests are delivered.
//                Defaults to mechcore.ind@gmail.com if not set.
//
// Optional (only needed if you want to use a non-Gmail SMTP provider,
// e.g. SendGrid, Mailgun, Zoho, your own mail server, or a local test
// server during development):
//   SMTP_HOST, SMTP_PORT, SMTP_SECURE ("true"/"false")
//   When SMTP_HOST is set, it's used instead of Gmail's service preset.

const nodemailer = require('nodemailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const company = String(body.company || '').trim();
  const message = String(body.message || '').trim();
  const website = String(body.website || '').trim(); // honeypot field

  // Honeypot: real visitors never fill this in. If it's filled, silently
  // pretend success so bots don't learn anything from the response.
  if (website) {
    return res.status(200).json({ ok: true });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Name, email and message are required.' });
  }
  if (name.length > 200 || email.length > 200 || company.length > 200) {
    return res.status(400).json({ ok: false, error: 'One of the fields is too long.' });
  }
  if (message.length > 5000) {
    return res.status(400).json({ ok: false, error: 'Message is too long.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'Please provide a valid email address.' });
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const contactTo = process.env.CONTACT_TO || 'mechcore.ind@gmail.com';

  if (!smtpUser || !smtpPass) {
    console.error('Missing SMTP_USER / SMTP_PASS environment variables.');
    return res.status(500).json({
      ok: false,
      error: 'Email is not configured on the server yet.'
    });
  }

  try {
    const smtpHost = process.env.SMTP_HOST;
    const transportConfig = smtpHost
      ? {
          host: smtpHost,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: smtpUser, pass: smtpPass }
        }
      : {
          service: 'gmail',
          auth: { user: smtpUser, pass: smtpPass }
        };

    const transporter = nodemailer.createTransport(transportConfig);

    const escapeHtml = (str) =>
      str.replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));

    await transporter.sendMail({
      from: `"Mech-Core Website" <${smtpUser}>`,
      to: contactTo,
      replyTo: email,
      subject: `Quote request from ${name}${company ? ' (' + company + ')' : ''}`,
      text:
        `New quote request from the website\n\n` +
        `Name: ${name}\n` +
        `Company: ${company || '-'}\n` +
        `Email: ${email}\n\n` +
        `Message:\n${message}\n`,
      html:
        `<h2>New quote request</h2>` +
        `<p><strong>Name:</strong> ${escapeHtml(name)}</p>` +
        `<p><strong>Company:</strong> ${escapeHtml(company || '-')}</p>` +
        `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` +
        `<p><strong>Message:</strong></p>` +
        `<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Failed to send contact email:', err);
    return res.status(502).json({ ok: false, error: 'Could not send the email right now.' });
  }
};
