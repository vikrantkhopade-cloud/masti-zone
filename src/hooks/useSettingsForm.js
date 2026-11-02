import { useState } from 'react';

/** Local editable copy of a settings object with dirty tracking and async save. */
export function useSettingsForm(source, saveFn) {
  const [form, setForm] = useState(source);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(source);

  const change = (next) => { setStatus(null); setForm(next); };
  const discard = () => { setStatus(null); setForm(source); };
  const save = async () => {
    setSaving(true); setStatus(null);
    try {
      await saveFn(form);
      setStatus({ type: 'success', message: 'Saved. The customer website now uses these settings.' });
    } catch (e) {
      setStatus({ type: 'error', message: e.message || 'Could not save settings.' });
    } finally {
      setSaving(false);
    }
  };
  return { form, setForm: change, dirty, saving, status, save, discard };
}
