import React from 'react';
import { useThemedColors } from '../../../../store';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
}

/** Card pequeno de KPI usado nas linhas Visao Geral / Eficiencia do time. */
export const KpiCard: React.FC<Props> = React.memo(({ label, value, sub }) => {
  const c = useThemedColors();
  return (
    <div
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: 12,
        flex: 1,
        minWidth: 120,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: c.textSecondary,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: c.text, marginTop: 4 }}>
        {value}
      </div>
      {sub ? (
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{sub}</div>
      ) : null}
    </div>
  );
});
KpiCard.displayName = 'KpiCard';
