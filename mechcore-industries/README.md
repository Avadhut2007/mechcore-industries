# Mech-Core Industries — website

A static site with a working backend contact form, built to deploy on
Vercel with no build step.

```
mechcore-industries/
├── index.html          the whole site (one page)
├── style.css
├── script.js
├── images/              product photos + logo
├── api/
│   └── contact.js       Vercel serverless function — sends the quote form by email
├── package.json          declares the one backend dependency (nodemailer)
├── .env.example          template for local environment variables
├── .gitignore
└── README.md
```

## 1. Put this on GitHub

```bash
cd mechcore-industries
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

(Or use GitHub Desktop / the "Add file → Upload files" button on
github.com if you'd rather not use the command line — either works.)

## 2. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub
   repo you just created.
2. Framework preset: choose **Other** (or leave it — Vercel
   auto-detects a static site with an `api/` folder correctly). No
   build command is needed.
3. Click **Deploy**. Vercel will host `index.html` as the site and turn
   `api/contact.js` into a live serverless endpoint at
   `https://your-site.vercel.app/api/contact` automatically.

At this point the site is live, but the form will show a "not
configured on the server yet" error until you complete step 3 below.

## 3. Make the contact form actually send email

The form posts to `/api/contact`, which uses
[Nodemailer](https://nodemailer.com/) to send through Gmail's SMTP
servers. You need a Gmail **App Password** — not your normal Gmail
password — because Google blocks plain-password logins from scripts.

**Generate an App Password:**

1. Go to your Google Account → **Security**.
2. Turn on **2-Step Verification** if it isn't already on (required
   for App Passwords to exist as an option).
3. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Create a new app password (name it something like "Mech-Core
   website"). Google shows you a 16-character code — copy it.

**Add it to Vercel:**

1. In your Vercel project, go to **Settings → Environment Variables**.
2. Add:
   | Name | Value |
   |---|---|
   | `SMTP_USER` | the Gmail address you generated the app password for |
   | `SMTP_PASS` | the 16-character app password (no spaces) |
   | `CONTACT_TO` | (optional) where you want quote requests delivered — defaults to `mechcore.ind@gmail.com` if you skip this |
3. Redeploy (Vercel → Deployments → ⋯ → Redeploy), since environment
   variable changes need a fresh deployment to take effect.

That's it — submitting the form on the live site will now land a real
email in the inbox you configured, with the customer's email set as
Reply-To, so replying from your inbox goes straight back to them.

**Using a different email provider instead of Gmail?** The function
also supports any standard SMTP provider (SendGrid, Mailgun, Zoho,
your own mail server). Set `SMTP_HOST`, `SMTP_PORT`, and
`SMTP_SECURE` (`true`/`false`) in addition to `SMTP_USER`/`SMTP_PASS`,
and it'll use that instead of Gmail's preset — see the comments at the
top of `api/contact.js`.

## 4. Testing locally (optional)

```bash
npm install
npm i -g vercel      # if you don't already have the Vercel CLI
cp .env.example .env # then fill in real values
vercel dev
```

This serves the site at `http://localhost:3000` with the `/api/contact`
function running exactly as it will in production.

## Notes

- **Spam protection**: the form has a hidden honeypot field. Real
  visitors never see or fill it; if it arrives filled in, the backend
  silently discards the submission. No CAPTCHA needed for normal spam
  levels.
- **If email sending ever fails** (misconfigured env vars, Gmail
  hiccup, etc.), the form automatically falls back to opening the
  visitor's email app with the message pre-filled, so a submission is
  never silently lost.
- **Swapping content**: product photos live in `images/`, all copy is
  directly in `index.html`, and colors/fonts are CSS variables at the
  top of `style.css` (`:root { --ink: ...; --orange: ...; }`) if you
  want to adjust the palette later. 
