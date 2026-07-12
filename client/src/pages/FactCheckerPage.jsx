import { useState } from 'react';
import { BookMarked, Search, SearchCheck } from 'lucide-react';
import SectionHeader from '../components/SectionHeader.jsx';
import { useAppSettings } from '../context/AppSettings.jsx';
import { api } from '../lib/api.js';

const examples = {
  en: [
    'First captains do not have to submit homework.',
    'Students must pay 2 Taka to use the washroom.',
    'Kuddus can take 20 percent of any tiffin.'
  ],
  bn: [
    'প্রথম ক্যাপ্টেনকে বাড়ির কাজ জমা দিতে হয় না।',
    'ওয়াশরুম ব্যবহার করতে শিক্ষার্থীদের ২ টাকা দিতে হবে।',
    'কুদ্দুস যেকোনো টিফিনের ২০ শতাংশ নিতে পারে।'
  ]
};

const banglaRules = {
  1: ['বাড়ির কাজের দায়িত্ব', 'ক্লাস ক্যাপ্টেনসহ প্রত্যেক শিক্ষার্থীকে সময়মতো নির্ধারিত বাড়ির কাজ সম্পন্ন করে জমা দিতে হবে।'],
  2: ['ক্যাপ্টেনের সিদ্ধান্ত গ্রহণ', 'কোনো বড় ক্লাস সিদ্ধান্ত নেওয়ার আগে প্রথম ক্যাপ্টেনকে দ্বিতীয় ও তৃতীয় ক্যাপ্টেনের সঙ্গে আলোচনা করতে হবে।'],
  3: ['টাকা সংগ্রহ', 'ক্লাস শিক্ষকের লিখিত অনুমতি ছাড়া কোনো ক্যাপ্টেন টাকা, ফি, টোল বা অনুদান সংগ্রহ করতে পারবে না।'],
  4: ['ওয়াশরুম ব্যবহারের অধিকার', 'ফ্রি পিরিয়ডে কোনো ফি না দিয়েই শিক্ষার্থীরা ওয়াশরুম ব্যবহার করতে পারবে।'],
  5: ['খাবার ও ব্যক্তিগত সম্পত্তি', 'স্পষ্ট অনুমতি ছাড়া কোনো শিক্ষার্থী বা ক্যাপ্টেন অন্য শিক্ষার্থীর খাবার নিতে, কর বসাতে, চেখে দেখতে বা রেখে দিতে পারবে না।'],
  6: ['খেলাধুলা ও পিটি পিরিয়ড', 'পিটি পিরিয়ডের কার্যক্রম ন্যায্যভাবে বাছাই করতে হবে এবং ব্যক্তিগত পছন্দের জন্য একজন ক্যাপ্টেন তা নিয়ন্ত্রণ করতে পারবে না।'],
  7: ['পরীক্ষার সময়সূচি', 'বিষয় শিক্ষক যথেষ্ট সময় আগে পরিষ্কার সিলেবাসসহ ক্লাস টেস্টের সময় নির্ধারণ করবেন।'],
  8: ['বসার ব্যবস্থা', 'ক্লাসরুমের আসন শেখা ও দৃশ্যমানতার সহায়ক হতে হবে; কেউ ইচ্ছা করে শিক্ষকের দৃষ্টি বাধাগ্রস্ত করতে পারবে না।'],
  9: ['অভিযোগকারীর সুরক্ষা', 'পরিচয় প্রকাশ বা প্রতিশোধের ভয় ছাড়াই একজন শিক্ষার্থী বৈধ অভিযোগ জমা দিতে পারবে।'],
  10: ['তিন-স্ট্রাইক নিয়ম', 'প্রথম ক্যাপ্টেনের বিরুদ্ধে তিনটি বৈধ গোপন অভিযোগ এলে দুই সতর্কতার পর তাকে সঙ্গে সঙ্গে অপসারণ করা হবে।']
};

export default function FactCheckerPage({ notify }) {
  const { t, language } = useAppSettings();
  const activeExamples = examples[language];
  const [claim, setClaim] = useState(activeExamples[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function check(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await api('/fact-check', { method: 'POST', body: JSON.stringify({ claim }) });
      setResult(data);
      if (!data.matches.length) notify(t('noExactMatch'), 'error');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SectionHeader eyebrow={t('mission06')} title={t('m6Title')} description={t('factsDescription')} />
      <section className="panel search-panel">
        <form onSubmit={check} className="fact-search"><Search /><input value={claim} onChange={(e) => setClaim(e.target.value)} placeholder={t('claimPlaceholder')} /><button className="button primary" disabled={loading}>{loading ? t('searching') : t('checkRulebook')}</button></form>
        <div className="example-chips">{activeExamples.map((example, index) => <button type="button" key={example} onClick={() => setClaim(example)}>{t('example', { count: index + 1 })}</button>)}</div>
      </section>

      <div className="fact-results">
        {result ? result.matches.length ? result.matches.map((rule, index) => {
          const translated = language === 'bn' ? banglaRules[rule.id] : null;
          return (
            <article className="rule-card" key={rule.id}>
              <div className="rule-rank">{index + 1}</div>
              <div className="rule-icon"><BookMarked /></div>
              <div><span className="eyebrow">{t('officialRule')}</span><h3>{translated?.[0] || rule.title}</h3><blockquote>{translated?.[1] || rule.rule_text}</blockquote><p>{t('matchedKeywords', { keywords: rule.matched.join(', ') })}</p></div>
            </article>
          );
        }) : <div className="empty-state panel"><Search /><strong>{t('noRule')}</strong><span>{t('noRuleText')}</span></div> : <div className="empty-state panel"><SearchCheck /><strong>{t('readyVerify')}</strong><span>{t('readyVerifyText')}</span></div>}
      </div>
    </div>
  );
}
