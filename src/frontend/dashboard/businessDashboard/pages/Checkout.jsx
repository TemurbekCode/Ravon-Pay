import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useBusiness } from '../../../../hooks/useBusiness.js';
import CreateItemModal from '../CreateItemModal.jsx';

const cartIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>;

export default function Checkout() {
  const { t } = useOutletContext();
  const { checkoutPages, createCheckoutPage, toggleCheckoutPage } = useBusiness();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="page-head reveal">
        <div><h1>{t('page.checkout')}</h1></div>
        <div className="head-actions"><button className="btn-new" onClick={() => setModalOpen(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>{t('checkout.new')}</button></div>
      </div>
      <div className="panel reveal">
        <div className="links-grid">
          {checkoutPages.map((p) => (
            <div className="link-card" key={p.id}>
              <div className="link-ic">{cartIcon}</div>
              <div className="link-info"><div className="link-title">{p.title}</div><div className="link-meta">ravon.pay/p/{p.slug} · {p.views} {t('checkout.views')}</div></div>
              <button className={`pill ${p.active ? 'done' : 'failed'}`} style={{ cursor: 'pointer' }} onClick={() => toggleCheckoutPage(p.id)}>{p.active ? t('checkout.active') : t('checkout.inactive')}</button>
            </div>
          ))}
        </div>
      </div>

      <CreateItemModal
        t={t}
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('checkout.new')}
        submitLabel={t('checkout.new')}
        fields={[{ name: 'title', label: t('field.title') }]}
        onSubmit={(v) => createCheckoutPage(v.title)}
      />
    </>
  );
}
