import { useState } from 'react';
import { AlertTriangle, Pencil, Plus, ShieldCheck, UserX, UserCheck } from 'lucide-react';
import { AdminPageHeader, useAdminFilters } from '../../components/admin/AdminUI.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Input, Select } from '../../components/ui/Form.jsx';
import { Modal, Notice } from '../../components/ui/Misc.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/StateViews.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { adminService } from '../../services/adminService.js';
import { ADMIN_ROLES, roleLabel } from '../../data/adminRoles.js';
import { formatDate } from '../../utils/format.js';

const ROLE_TONE = { super_admin: 'navy', manager: 'aqua', finance: 'violet', booking_staff: 'gray' };
const emptyInvite = { email: '', adminRole: 'booking_staff' };

export default function AdminUsers() {
  const { adminRole: myRole } = useAdminFilters();
  const { data, loading, error, reload, setData } = useAsync(() => adminService.listStaff(), []);
  const [inviting, setInviting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirmRole, setConfirmRole] = useState(null); // { staff, newRole }
  const [confirmStatus, setConfirmStatus] = useState(null); // { staff, nextStatus }
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionStatus, setActionStatus] = useState(null); // { type: 'success' | 'error', message }

  const inviteErrors = inviting ? {
    email: /^\S+@\S+\.\S{2,}$/.test(inviting.email) ? null : 'Enter a valid email address',
  } : {};

  const activeSuperAdmins = (data || []).filter((s) => s.adminRole === 'super_admin' && s.status === 'active');

  const onInvite = async () => {
    setSubmitted(true);
    setActionStatus(null);
    if (inviteErrors.email) return;
    setSaving(true);
    try {
      const staff = await adminService.promoteToStaff(inviting.email, inviting.adminRole);
      setData([staff, ...(data || []).filter((s) => s.id !== staff.id)]);
      setInviting(null);
      setSubmitted(false);
      setActionStatus({ type: 'success', message: `${staff.name} has been promoted to ${roleLabel(staff.adminRole)}.` });
    } catch (err) {
      setActionStatus({ type: 'error', message: err.message || 'Could not promote this customer.' });
    } finally {
      setSaving(false);
    }
  };

  // Role select modal only picks the new role — the actual change happens
  // after a separate confirmation step (confirmRole below).
  const openRoleConfirm = () => {
    setConfirmRole({ staff: editing, newRole: editing.adminRole });
    setEditing(null);
  };

  const onConfirmRoleChange = async () => {
    setSaving(true);
    setActionStatus(null);
    try {
      const updated = await adminService.setStaffRole(confirmRole.staff.id, confirmRole.newRole);
      setData(data.map((s) => (s.id === updated.id ? updated : s)));
      setActionStatus({ type: 'success', message: `${updated.name}'s role has been changed to ${roleLabel(updated.adminRole)}.` });
      setConfirmRole(null);
    } catch (err) {
      setActionStatus({ type: 'error', message: err.message || 'Could not change this role.' });
    } finally {
      setSaving(false);
    }
  };

  const onConfirmStatusChange = async () => {
    setSaving(true);
    setActionStatus(null);
    try {
      const updated = await adminService.setStaffStatus(confirmStatus.staff.id, confirmStatus.nextStatus);
      setData(data.map((x) => (x.id === updated.id ? updated : x)));
      setActionStatus({ type: 'success', message: `${updated.name} has been ${updated.status === 'active' ? 're-enabled' : 'disabled'}.` });
      setConfirmStatus(null);
    } catch (err) {
      setActionStatus({ type: 'error', message: err.message || 'Could not update this account.' });
    } finally {
      setSaving(false);
    }
  };

  // Was the row currently being edited/toggled the last active super admin
  // BEFORE this change (looked up from the unmodified fetched list, not the
  // in-progress form state) — used to disable Save / explain why.
  const isLastSuperAdmin = (staff) => !!staff && staff.adminRole === 'super_admin' && staff.status === 'active' && activeSuperAdmins.length === 1;
  const editingOriginal = editing ? (data || []).find((s) => s.id === editing.id) : null;
  const roleChangeWouldRemoveLastSuperAdmin = isLastSuperAdmin(editingOriginal) && editing?.adminRole !== 'super_admin';

  return (
    <>
      <AdminPageHeader title="Staff Management" subtitle="Give park staff access to the admin console, scoped to their role." actions={<Button size="sm" onClick={() => { setInviting({ ...emptyInvite }); setSubmitted(false); setActionStatus(null); }}><Plus className="h-4 w-4" />Promote a customer</Button>} />
      <Notice className="mb-6">
        Staff sign in with a normal Supabase account. To add someone: ask them to create an account at <span className="font-mono">/register</span>, then promote that email here — this only works for an email that's already registered as a customer (no new password is set from this screen). Signed in as <strong>{roleLabel(myRole)}</strong>.
      </Notice>
      {actionStatus && (
        <Notice tone={actionStatus.type === 'error' ? 'warn' : 'info'} className="mb-6" title={actionStatus.type === 'error' ? 'Action failed' : 'Done'}>
          {actionStatus.message}
        </Notice>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ADMIN_ROLES.map((r) => (
          <Card key={r.value} className="!p-4">
            <Badge tone={ROLE_TONE[r.value]}>{r.label}</Badge>
            <p className="mt-2 text-xs text-navy-500">{r.desc}</p>
          </Card>
        ))}
      </div>

      {loading ? <Skeleton className="h-72 rounded-2xl" /> : error ? <ErrorState error={error} onRetry={reload} /> : !data?.length ? (
        <EmptyState icon={ShieldCheck} title="No staff accounts yet" description="Promote a registered customer to get started." action={<Button size="sm" onClick={() => setInviting({ ...emptyInvite })}>Promote a customer</Button>} />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-navy-50/50 text-left text-xs uppercase tracking-wider text-navy-400">
                <tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Since</th><th className="px-5 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {data.map((s) => {
                  const lastSuperAdmin = isLastSuperAdmin(s);
                  return (
                    <tr key={s.id} className="hover:bg-aqua-50/30">
                      <td className="px-5 py-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white">{(s.name || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}</span><div><p className="font-semibold">{s.name}</p><p className="text-xs text-navy-400">{s.email}</p></div></div></td>
                      <td className="px-5 py-3">{s.adminRole ? <Badge tone={ROLE_TONE[s.adminRole]}>{roleLabel(s.adminRole)}</Badge> : <span className="text-xs text-navy-400">Not set — apply the pending migration</span>}</td>
                      <td className="px-5 py-3"><Badge tone={s.status === 'active' ? 'green' : 'gray'} dot>{s.status === 'active' ? 'Active' : 'Disabled'}</Badge></td>
                      <td className="px-5 py-3 text-navy-500">{formatDate(s.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setEditing({ ...s }); setActionStatus(null); }}><Pencil className="h-4 w-4" />Role</Button>
                          <Button size="sm" variant={s.status === 'active' ? 'danger' : 'secondary'} disabled={lastSuperAdmin} title={lastSuperAdmin ? 'At least one active Super Admin is required' : undefined} onClick={() => { setConfirmStatus({ staff: s, nextStatus: s.status === 'active' ? 'disabled' : 'active' }); setActionStatus(null); }}>
                            {s.status === 'active' ? <><UserX className="h-4 w-4" />Disable</> : <><UserCheck className="h-4 w-4" />Enable</>}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={!!inviting} onClose={() => setInviting(null)} title="Promote a customer to staff"
        footer={<><Button variant="ghost" onClick={() => setInviting(null)}>Cancel</Button><Button loading={saving} onClick={onInvite}>Promote</Button></>}>
        {inviting && (
          <div className="space-y-4">
            <Input label="Their registered email" type="email" required value={inviting.email} onChange={(e) => setInviting({ ...inviting, email: e.target.value })} error={submitted ? inviteErrors.email : undefined} hint="They must already have a normal account from /register." />
            <Select label="Role" value={inviting.adminRole} onChange={(e) => setInviting({ ...inviting, adminRole: e.target.value })} options={ADMIN_ROLES.map((r) => ({ value: r.value, label: r.label }))} hint={ADMIN_ROLES.find((r) => r.value === inviting.adminRole)?.desc} />
          </div>
        )}
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Change role"
        footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={roleChangeWouldRemoveLastSuperAdmin} onClick={openRoleConfirm}>Continue</Button></>}>
        {editing && (
          <div className="space-y-4">
            <p className="text-sm text-navy-600">{editing.name} <span className="text-navy-400">({editing.email})</span></p>
            <Select label="Role" value={editing.adminRole || ''} onChange={(e) => setEditing({ ...editing, adminRole: e.target.value })} options={ADMIN_ROLES.map((r) => ({ value: r.value, label: r.label }))} hint={ADMIN_ROLES.find((r) => r.value === editing.adminRole)?.desc} />
            {roleChangeWouldRemoveLastSuperAdmin && (
              <p className="flex items-start gap-1.5 text-sm font-medium text-red-600"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />This is the last active Super Admin — promote someone else to Super Admin first before changing this role.</p>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!confirmRole} onClose={() => setConfirmRole(null)} title="Confirm role change"
        footer={<><Button variant="ghost" onClick={() => setConfirmRole(null)}>Cancel</Button><Button loading={saving} onClick={onConfirmRoleChange}>Confirm change</Button></>}>
        {confirmRole && (
          <p className="text-sm text-navy-600">
            Change <strong>{confirmRole.staff.name}</strong>'s role from <strong>{roleLabel(confirmRole.staff.adminRole)}</strong> to <strong>{roleLabel(confirmRole.newRole)}</strong>? They will immediately gain or lose access to the matching admin pages.
          </p>
        )}
      </Modal>

      <Modal open={!!confirmStatus} onClose={() => setConfirmStatus(null)} title={confirmStatus?.nextStatus === 'active' ? 'Re-enable staff access?' : 'Disable staff access?'}
        footer={<><Button variant="ghost" onClick={() => setConfirmStatus(null)}>Cancel</Button><Button variant={confirmStatus?.nextStatus === 'active' ? 'primary' : 'danger'} loading={saving} onClick={onConfirmStatusChange}>{confirmStatus?.nextStatus === 'active' ? 'Re-enable' : 'Disable'}</Button></>}>
        {confirmStatus && (
          <p className="text-sm text-navy-600">
            {confirmStatus.nextStatus === 'active'
              ? <>Re-enable admin console access for <strong>{confirmStatus.staff.name}</strong>? They will be able to sign in again immediately.</>
              : <>Disable admin console access for <strong>{confirmStatus.staff.name}</strong>? They will be signed out of the admin panel immediately — their customer account, if any, is not affected.</>}
          </p>
        )}
      </Modal>
    </>
  );
}
