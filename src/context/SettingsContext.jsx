import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadSettingsSync, settingsService } from '../services/settingsService.js';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettingsSync);

  useEffect(() => {
    let active = true;
    settingsService.loadAll()
      .then((loaded) => { if (active) setSettings(loaded); })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Could not load settings from Supabase, using defaults:', err.message);
      });
    return () => { active = false; };
  }, []);

  const savePlans = useCallback(async (plans) => {
    const saved = await settingsService.savePlans(plans);
    setSettings((s) => ({ ...s, plans: saved }));
  }, []);
  const saveAge = useCallback(async (age) => {
    const saved = await settingsService.saveAgeSettings(age);
    setSettings((s) => ({ ...s, age: saved }));
  }, []);
  const savePark = useCallback(async (park) => {
    const saved = await settingsService.saveParkSettings(park);
    setSettings((s) => ({ ...s, park: saved }));
  }, []);
  const resetAll = useCallback(async () => {
    const loaded = await settingsService.loadAll();
    setSettings(loaded);
    return loaded;
  }, []);

  const value = useMemo(() => ({
    ...settings,
    activePlans: settings.plans.filter((p) => p.active),
    savePlans, saveAge, savePark, resetAll,
  }), [settings, savePlans, saveAge, savePark, resetAll]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
