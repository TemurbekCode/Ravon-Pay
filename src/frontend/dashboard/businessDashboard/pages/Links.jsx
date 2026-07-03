import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useBusiness } from '../../../../hooks/useBusiness.js';
import { formatCurrency } from '../../../../utils/formatCurrency.js';
import CreateItemModal from '../CreateItemModal.jsx';

const linkIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19" /></svg>;
const copyIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;

export default function Links() {
  const { t, showToast } = useOutletContext();
  const { links, createLink } = useBusiness();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="page-head reveal">
        <div><h1>{t('page.links')}</h1></div>
        <div className="head-actions"><button className="btn-new" onClick={() => setModalOpen(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>{t('links.new')}</button></div>
      </div>
      <div className="panel reveal">
        <div className="links-grid">
          {links.map((l) => (
            <div className="link-card" key={l.id}>
              <div className="link-ic">{linkIcon}</div>
              <div className="link-info"><div className="link-title">{l.title}</div><div className="link-meta">ravon.pay/c/{l.slug} · {l.uses} {t('links.uses')}</div></div>
              <div className="link-amt">{formatCurrency(l.amount)}</div>
              <button className="link-copy" onClick={() => showToast(t('toast.copy'))}>{copyIcon}</button>
            </div>
          ))}
        </div>
      </div>

      <CreateItemModal
        t={t}
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('links.new')}
        submitLabel={t('links.new')}
        fields={[
          { name: 'title', label: t('links.name') },
          { name: 'amount', label: t('th.amount'), type: 'number', placeholder: '0' },
        ]}
        onSubmit={(v) => createLink(v.title, Number(v.amount))}
      />
    </>
  );
}
