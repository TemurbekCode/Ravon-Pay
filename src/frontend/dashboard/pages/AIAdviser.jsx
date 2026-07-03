import { useOutletContext } from 'react-router-dom';

export default function AIAdviser() {
  const { t } = useOutletContext();
  return (
    <>
      <div className="page-head reveal"><h1>AIAdviser</h1></div>
      <div className="info-card reveal">
        <p style={{ color: 'var(--text-secondary)' }}>Bu sahifa tez orada to'liq ishga tushadi.</p>
      </div>
    </>
  );
}
