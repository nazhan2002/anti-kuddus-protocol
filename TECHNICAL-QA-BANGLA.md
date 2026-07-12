# Judge / Teacher কী প্রশ্ন করতে পারে

## React কেন ব্যবহার করেছো?

Component-based UI বানানো সহজ। ছয়টি mission আলাদা page component হিসেবে maintain করা যায়। State পরিবর্তন হলে UI automatically update হয়।

## Express কেন?

Authentication, database access এবং Gemini API key server-side রাখার জন্য একটি backend প্রয়োজন। Express ছোট project-এর জন্য সহজ এবং পরিষ্কার।

## SQLite কেন?

এটি relational database। আলাদা database server setup লাগে না। Hackathon demo এবং junior project-এর জন্য portable।

## Complaint anonymous কীভাবে?

Valid roll দিয়ে login করতে হয়, কিন্তু complaint insert করার সময় roll বা student ID complaint table-এ save করা হয় না। ফলে report list থেকে student identify করা যায় না।

## তিনটি strike কীভাবে কাজ করে?

`complaints` table-এর total row count নেওয়া হয়। UI-তে warning count maximum 3 দেখানো হয়। `3 - warningCount` দিয়ে remaining strike বের হয়।

## Seat sorting algorithm কী?

JavaScript-এর `sort()` দিয়ে numeric height ascending order করা হয়। তারপর sorted array-এর প্রতিটি student grid-এর sequential desk-এ বসে। প্রথম row front row।

## Gemini API key কোথায়?

`.env` file-এ। Backend `process.env.GEMINI_API_KEY` দিয়ে নেয়। Frontend key পায় না। `.gitignore` `.env` upload বন্ধ করে।

## SOS real-time কি?

Junior requirement-এর জন্য active captain dashboard আছে। Dashboard পাঁচ সেকেন্ড পরপর API poll করে। WebSocket senior requirement হওয়ায় এখানে ব্যবহার করা হয়নি।

## Fact checker AI কি?

না। Junior baseline অনুযায়ী string matching। Claim tokenize করে pre-seeded `school_rules` table-এর title, rule text এবং keyword field-এর সঙ্গে overlap হিসাব করে।

## Senior feature কেন করনি?

Junior feature matrix-এ advanced engineering “Not Required”। Required modules stable, complete এবং explainable রাখাকে priority দেওয়া হয়েছে।
