import { api } from './api.js';

const SOS_QUEUE_KEY = 'ak_offline_sos_queue';

export function getQueuedSos() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SOS_QUEUE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(items) {
  localStorage.setItem(SOS_QUEUE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('ak:sos-queue-change', { detail: { count: items.length } }));
}

export function queueSos(location) {
  const item = {
    localId: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    location,
    queuedAt: new Date().toISOString()
  };
  const next = [...getQueuedSos(), item];
  saveQueue(next);
  return item;
}

export async function syncQueuedSos() {
  if (!navigator.onLine) return { sent: 0, remaining: getQueuedSos().length };
  const queue = getQueuedSos();
  const remaining = [];
  let sent = 0;

  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];
    try {
      await api('/sos', {
        method: 'POST',
        body: JSON.stringify({ location: item.location, queuedAt: item.queuedAt })
      });
      sent += 1;
    } catch (error) {
      remaining.push(item, ...queue.slice(index + 1));
      break;
    }
  }

  saveQueue(remaining);
  return { sent, remaining: remaining.length };
}
