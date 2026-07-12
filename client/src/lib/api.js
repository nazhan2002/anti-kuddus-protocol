const commonMessages = {
  bn: {
    'Request failed.': 'অনুরোধটি সম্পন্ন হয়নি।',
    'Too many attempts. Please wait one minute.': 'অনেকবার চেষ্টা করা হয়েছে। এক মিনিট অপেক্ষা করুন।',
    'This roll number is not in the secret class mapping.': 'এই রোল নম্বর গোপন ক্লাস তালিকায় নেই।',
    'Captain access code is incorrect.': 'ক্যাপ্টেন অ্যাক্সেস কোড সঠিক নয়।',
    'Please provide at least 8 characters of detail.': 'কমপক্ষে ৮ অক্ষরের বিস্তারিত লিখুন।',
    'Complaint delivered anonymously.': 'অভিযোগটি পরিচয় গোপন রেখে পাঠানো হয়েছে।',
    'Enter a valid payment amount.': 'সঠিক টাকার পরিমাণ লিখুন।',
    'Enter the stolen food item.': 'চুরি হওয়া খাবারের নাম লিখুন।',
    'Ledger entry saved anonymously.': 'লেজার রেকর্ড পরিচয় গোপন রেখে সংরক্ষণ হয়েছে।',
    'Select a valid school location.': 'সঠিক স্কুল লোকেশন বেছে নিন।',
    'Active alert not found.': 'সক্রিয় সতর্কতা পাওয়া যায়নি।',
    'Alert marked as resolved.': 'সতর্কতাটি সমাধান হয়েছে বলে চিহ্নিত করা হয়েছে।',
    'Type a claim or a few keywords.': 'একটি দাবি অথবা কয়েকটি কীওয়ার্ড লিখুন।',
    'Paste a longer syllabus statement first.': 'আগে একটু বড় সিলেবাসের লেখা দিন।',
    'Something went wrong on the server.': 'সার্ভারে একটি সমস্যা হয়েছে।',
    'Network unavailable.': 'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না।'
  }
};

function translateMessage(message) {
  const language = localStorage.getItem('ak_language') || 'en';
  if (language !== 'bn') return message;
  if (commonMessages.bn[message]) return commonMessages.bn[message];
  const sosMatch = message.match(/^SOS sent from (.+)\. Biltu and Miltu have been alerted\.$/);
  if (sosMatch) return `${sosMatch[1]} থেকে SOS পাঠানো হয়েছে। বিল্টু ও মিল্টুকে জানানো হয়েছে।`;
  return message;
}

export async function api(path, options = {}) {
  const token = localStorage.getItem('ak_token');
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': localStorage.getItem('ak_language') || 'en',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
  } catch (cause) {
    const error = new Error(translateMessage('Network unavailable.'));
    error.code = 'NETWORK_ERROR';
    error.cause = cause;
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(translateMessage(data.message || 'Request failed.'));
    error.status = response.status;
    throw error;
  }
  if (data?.message) data.message = translateMessage(data.message);
  return data;
}

export function formatDate(dateString, language = localStorage.getItem('ak_language') || 'en') {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(`${dateString}${dateString.includes('T') ? '' : 'Z'}`));
}
