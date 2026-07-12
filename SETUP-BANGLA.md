# Anti-Kuddus Protocol — খুব সহজ Setup Guide

## প্রথমবার চালানোর নিয়ম

### Step 1: ZIP Extract করো

ZIP file-এর উপর right click করে **Extract All** চাপো। তারপর `anti-kuddus-protocol` folder পাবে।

### Step 2: VS Code-এ Open করো

1. VS Code চালু করো।
2. **File → Open Folder** চাপো।
3. `anti-kuddus-protocol` folder select করো।
4. **Terminal → New Terminal** চাপো।

### Step 3: Package install করো

Terminal-এ লিখো:

```bash
npm install
```

Install শেষ না হওয়া পর্যন্ত অপেক্ষা করো।

### Step 4: `.env` বানাও

VS Code-এর বাম পাশে `.env.example` file আছে। সেটি copy করে নতুন file-এর নাম দাও:

```text
.env
```

তারপর `.env` file-এর ভিতরে রাখো:

```env
PORT=5000
JWT_SECRET=my-long-random-jwt-secret-2026
ROLL_HASH_SECRET=my-different-roll-secret-2026
CAPTAIN_CODE=BILTU-MILTU-2026
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

Gemini API key পেলে `GEMINI_API_KEY=`-এর পরে paste করবে।

### Step 5: Website চালাও

```bash
npm run dev
```

Terminal-এ URL আসবে:

```text
http://localhost:5173
```

Ctrl চেপে URL-এর উপর click করো।

## Login

Student login-এর জন্য:

```text
701
```

থেকে

```text
712
```

পর্যন্ত যেকোনো roll ব্যবহার করা যাবে।

Captain login-এর জন্য `.env`-এ যেই `CAPTAIN_CODE` দিয়েছো, সেটা ব্যবহার করবে। Default:

```text
BILTU-MILTU-2026
```

## Website বন্ধ করার নিয়ম

Terminal-এর ভিতরে:

```text
Ctrl + C
```

চাপো।

## Final demo-এর আগে

```bash
npm run build
npm start
```

তারপর খুলো:

```text
http://localhost:5000
```

## Problem হলে

### `node` command পাওয়া যাচ্ছে না

Node.js 22.5 বা newer install করতে হবে। Install-এর পরে VS Code পুরোপুরি বন্ধ করে আবার চালু করো।

### Port already in use

আগের terminal-এ চলা server বন্ধ করতে `Ctrl + C` চাপো। তারপর আবার `npm run dev` দাও।

### Gemini summary demo mode দেখাচ্ছে

`.env` file-এ valid `GEMINI_API_KEY` বসাও। তারপর server restart করো।

### Database reset করতে চাইলে

Server বন্ধ করো। তারপর এই file delete করো:

```text
server/data/anti-kuddus.db
```

আবার চালালে database নিজে থেকে তৈরি হবে।

---

## নতুন বাংলা, থিম ও মোবাইল অ্যাপ সুবিধা

Website চালু হওয়ার পরে উপরের controls থেকে:

- `বাংলা/EN` দিয়ে ভাষা বদলানো যাবে।
- Light, Dark অথবা System theme নেওয়া যাবে।
- Chrome installation support করলে `Install app` button দেখা যাবে।

Android-এ Chrome menu থেকে `Install app` বা `Add to Home screen` ব্যবহার করা যায়।

SOS page-এর Offline Emergency Help অংশে জরুরি contact number লিখে save করুন। Internet না থাকলে SOS local queue-তে থাকবে এবং connection ফিরে এলে পাঠানো হবে।
