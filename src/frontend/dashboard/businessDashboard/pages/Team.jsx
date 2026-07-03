import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useBusiness } from '../../../../hooks/useBusiness.js';
import CreateItemModal from '../CreateItemModal.jsx';

export default function Team() {
  const { t } = useOutletContext();
  const { team, inviteTeamMember } = useBusiness();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="page-head reveal">
        <div><h1>{t('page.team')}</h1></div>
        <div className="head-actions"><button className="btn-new" onClick={() => setModalOpen(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>{t('team.invite')}</button></div>
      </div>
      <div className="panel reveal">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{t('th.customer')}</th><th className="right">{t('team.role')}</th></tr></thead>
            <tbody>
              {team.map((m) => (
                <tr key={m.id}>
                  <td><div className="cust"><span className="avatar" style={{ background: `linear-gradient(135deg,${m.grad})` }}>{m.initials}</span><div><div className="nm">{m.name}</div><div className="em">{m.email}</div></div></div></td>
                  <td className="right"><span className={`pill ${m.roleKey === 'team.owner' ? 'done' : m.roleKey === 'team.admin' ? 'pending' : ''}`} style={m.roleKey === 'team.member' ? { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' } : {}}>{t(m.roleKey)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateItemModal
        t={t}
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('team.invite')}
        submitLabel={t('team.invite')}
        fields={[
          { name: 'email', label: t('field.email'), type: 'email' },
          { name: 'role', label: t('team.role'), placeholder: 'admin / member' },
        ]}
        onSubmit={(v) => inviteTeamMember(v.email, v.role)}
      />
    </>
  );
}
