import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useBusiness } from '../../../../hooks/useBusiness.js';
import { formatCurrency } from '../../../../utils/formatCurrency.js';
import CreateItemModal from '../CreateItemModal.jsx';

export default function Invoices() {
  const { t } = useOutletContext();
  const { invoices, createInvoice, markInvoicePaid } = useBusiness();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="page-head reveal">
        <div><h1>{t('page.invoices')}</h1></div>
        <div className="head-actions"><button className="btn-new" onClick={() => setModalOpen(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>{t('invoices.new')}</button></div>
      </div>
      <div className="panel reveal">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{t('invoices.num')}</th><th>{t('invoices.client')}</th><th>{t('invoices.due')}</th><th>{t('th.status')}</th><th className="right">{t('th.amount')}</th><th className="right"></th></tr></thead>
            <tbody>
              {invoices.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{v.num}</td>
                  <td>{v.client}</td>
                  <td>{v.due}</td>
                  <td><span className={`pill ${v.status}`}>{v.status === 'done' ? t('invoices.paid') : v.status === 'pending' ? t('st.pending') : t('invoices.unpaid')}</span></td>
                  <td className="right amt">{formatCurrency(v.amount)}</td>
                  <td className="right">
                    {v.status === 'pending' && (
                      <button className="panel-link" onClick={() => markInvoicePaid(v.id)}>{t('invoices.markPaid')}</button>
                    )}
                  </td>
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
        title={t('invoices.new')}
        submitLabel={t('invoices.new')}
        fields={[
          { name: 'client', label: t('invoices.client') },
          { name: 'due', label: t('invoices.due'), placeholder: '25-iyul' },
          { name: 'amount', label: t('th.amount'), type: 'number', placeholder: '0' },
        ]}
        onSubmit={(v) => createInvoice(v.client, v.due, Number(v.amount))}
      />
    </>
  );
}
