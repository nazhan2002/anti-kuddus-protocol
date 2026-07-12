# বাংলা, থিম, অফলাইন SOS ও মোবাইল অ্যাপ আপগ্রেড

এই সংস্করণে আগের সব Junior requirement রেখে চারটি নতুন সুবিধা যোগ করা হয়েছে।

## ১. বাংলা ও ইংরেজি ভাষা

Login page এবং dashboard-এর উপরে language button আছে।

- `বাংলা` চাপলে পুরো interface বাংলায় যাবে।
- `EN` চাপলে আবার ইংরেজি হবে।
- নির্বাচনটি browser-এ মনে রাখা হবে।
- Syllabus AI-তে বাংলা mode থাকলে output বাংলায় চাওয়া হবে।
- Fact-Checker এখন বাংলা claim-এর গুরুত্বপূর্ণ শব্দও বুঝতে পারে।

## ২. Theme পরিবর্তন

উপরে theme selector থেকে পাওয়া যাবে:

- Light
- Dark
- System

`System` দিলে laptop বা mobile-এর বর্তমান appearance অনুসরণ করবে।

## ৩. Offline জরুরি সহায়তা

SOS page-এ নিচে `Offline emergency help` section আছে।

এখানে তিনটি contact নাম ও phone number লিখে save করা যায়:

- School office
- Guardian
- Class teacher

তথ্য server-এ যায় না। শুধু ওই device-এর browser storage-এ থাকে। তাই internet না থাকলেও contact দেখা ও phone call করা যায়।

Internet বন্ধ অবস্থায় SOS চাপলে:

1. SOS device-এ queue হবে।
2. User-কে offline message দেখাবে।
3. Internet ফিরে এলে login session active থাকলে SOS নিজে থেকে server-এ পাঠাবে।
4. Captain dashboard তখন alert দেখতে পাবে।

## ৪. Mobile app বা PWA

এটি এখন Progressive Web App (PWA)। আলাদা Android code না লিখেও mobile app-এর মতো install করা যায়।

### Android Chrome

1. Website Chrome-এ খুলুন।
2. উপরে `Install app` button দেখা গেলে চাপুন।
3. Button না এলে Chrome-এর তিন ডট menu খুলুন।
4. `Install app` অথবা `Add to Home screen` চাপুন।
5. Home screen থেকে app চালু করুন।

### Laptop Chrome

Address bar-এর পাশে install icon অথবা website-এর `Install app` button ব্যবহার করুন।

## কোন file-গুলো যোগ বা পরিবর্তন হয়েছে

```text
client/
├── public/
│   ├── manifest.webmanifest
│   ├── service-worker.js
│   └── icons/
├── src/
│   ├── context/AppSettings.jsx
│   ├── components/AppTools.jsx
│   ├── components/ConnectivityBadge.jsx
│   ├── lib/offlineQueue.js
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles.css
│   └── pages/...
server/index.js
```

## আবার চালানোর নিয়ম

আগের project-এর মতোই:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Browser:

```text
http://localhost:5173
```

## পরীক্ষা করার সহজ পদ্ধতি

1. Student roll `701` দিয়ে login করুন।
2. বাংলা button চাপুন।
3. Dark theme নির্বাচন করুন।
4. SOS page খুলুন।
5. Emergency contact save করুন।
6. Chrome DevTools থেকে Network → Offline করুন অথবা Wi-Fi সাময়িক বন্ধ করুন।
7. SOS পাঠান। Queue count বাড়বে।
8. আবার online হলে queue নিজে থেকে পাঠানো হবে।
9. Captain code দিয়ে login করে alert দেখুন।

## গুরুত্বপূর্ণ সীমাবদ্ধতা

PWA একটি installable web app; এটি সরাসরি native Android APK নয়। Hackathon demo-এর জন্য এটি অনেক সহজ এবং কার্যকর। পরে APK দরকার হলে একই React app Capacitor দিয়ে Android project-এ wrap করা যাবে।
