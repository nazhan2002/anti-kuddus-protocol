# Cloudflare Pages + D1 Deployment (বাংলা)

এই version-এ local development-এর জন্য আগের Express + SQLite server রাখা হয়েছে। Cloudflare deployment-এর সময় `functions/api/[[path]].js` এবং D1 database ব্যবহার হবে।

## কেন Cloudflare

- Render-এর মতো idle sleep নেই।
- Cloudflare Pages, Functions এবং D1-এর free quota hackathon project-এর জন্য যথেষ্ট।
- GitHub-এ push করলে automatic deployment হয়।
- D1 database persistent; redeploy করলে data মুছে যায় না।

## ১. Cloudflare account

Cloudflare dashboard-এ account তৈরি/login করুন। Card প্রয়োজন নেই এমন Free plan নির্বাচন করুন।

## ২. D1 database তৈরি

Workers & Pages → D1 SQL Database → Create database

Database name:

```
anti-kuddus-db
```

Tables প্রথম API request-এ নিজে থেকে তৈরি ও seed হবে। কোনো SQL paste করার প্রয়োজন নেই।

## ৩. Pages project তৈরি

Workers & Pages → Create application → Pages → Connect to Git

Repository:

```
nazhan2002/anti-kuddus-protocol
```

Build settings:

```
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: (empty)
```

## ৪. D1 binding যোগ

Pages project → Settings → Functions → D1 database bindings

```
Variable name: DB
D1 database: anti-kuddus-db
```

## ৫. Environment variables / secrets

Pages project → Settings → Variables and Secrets

অন্তত এগুলো দিন:

```
JWT_SECRET = নিজের তৈরি লম্বা random secret
ROLL_HASH_SECRET = আরেকটি আলাদা লম্বা random secret
CAPTAIN_CODE = BILTU-MILTU-2026
GEMINI_MODEL = gemini-2.5-flash
```

Live Gemini AI চাইলে Secret হিসেবে দিন:

```
GEMINI_API_KEY = your_key
```

API key না দিলেও local fallback summarizer কাজ করবে।

## ৬. Redeploy

Settings save করার পরে Deployments → Retry deployment অথবা GitHub-এ নতুন commit push করুন।

## ৭. Final URL

Deployment সফল হলে URL হবে এমন:

```
https://anti-kuddus-protocol.pages.dev
```

এই URL-টাই Project Deploy URL হিসেবে দেওয়া যাবে।

## Local development

আগের মতো:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

## GitHub update

```powershell
git add .
git commit -m "Add Cloudflare free deployment"
git push
```
