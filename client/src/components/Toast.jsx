import { CheckCircle2, XCircle } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <button className={`toast ${toast.type || 'success'}`} onClick={onClose} type="button">
      {toast.type === 'error' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
      <span>{toast.message}</span>
    </button>
  );
}
