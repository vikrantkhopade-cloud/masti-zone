import { CheckCircle2, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button.jsx';

/** Sticky save/discard bar shown on settings pages. */
export default function SaveBar({ dirty, saving, status, onSave, onDiscard }) {
  return (
    <div className="sticky bottom-4 z-10 mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl bg-navy-950 px-5 py-3.5 text-sm text-white shadow-2xl sm:flex-row">
      <span className="flex items-center gap-2">
        {status?.type === 'success' && <><CheckCircle2 className="h-4 w-4 text-emerald-400" />{status.message}</>}
        {status?.type === 'error' && <><AlertTriangle className="h-4 w-4 text-amber-400" />{status.message}</>}
        {!status && (dirty ? 'You have unsaved changes.' : 'All changes saved.')}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="glass" disabled={!dirty || saving} onClick={onDiscard}>Discard</Button>
        <Button size="sm" disabled={!dirty} loading={saving} onClick={onSave}>Save changes</Button>
      </div>
    </div>
  );
}
