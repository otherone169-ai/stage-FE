import { useId, useMemo } from "react";

const polarToCartesian = (cx, cy, radius, angleDeg) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad)
  };
};

const describeSlice = (cx, cy, outerR, innerR, startAngle, endAngle) => {
  const sliceAngle = endAngle - startAngle;
  if (sliceAngle >= 359.99) {
    return [
      `M ${cx} ${cy - outerR}`,
      `A ${outerR} ${outerR} 0 1 1 ${cx - 0.01} ${cy - outerR}`,
      `L ${cx - 0.01} ${cy - innerR}`,
      `A ${innerR} ${innerR} 0 1 0 ${cx} ${cy - innerR}`,
      "Z"
    ].join(" ");
  }

  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = sliceAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}`,
    "Z"
  ].join(" ");
};

const DonutChart = ({
  data = {},
  labels = {},
  colors = {},
  title,
  emptyLabel = "Aucune donnée disponible"
}) => {
  const titleId = useId();

  const slices = useMemo(() => {
    const entries = Object.entries(data).filter(([, value]) => Number(value) > 0);
    const total = entries.reduce((sum, [, value]) => sum + Number(value), 0);
    if (total === 0) return { total: 0, items: [] };

    let angle = 0;
    const items = entries.map(([key, value]) => {
      const numeric = Number(value);
      const sweep = (numeric / total) * 360;
      const startAngle = angle;
      const endAngle = angle + sweep;
      angle = endAngle;
      return {
        key,
        value: numeric,
        percentage: Math.round((numeric / total) * 100),
        startAngle,
        endAngle,
        color: colors[key] || "var(--text-muted)"
      };
    });

    return { total, items };
  }, [data, colors]);

  const ariaLabel = slices.items.length
    ? slices.items.map((s) => `${labels[s.key] || s.key}: ${s.value} (${s.percentage}%)`).join(", ")
    : emptyLabel;

  return (
    <figure className="ds-chart" aria-labelledby={title ? titleId : undefined}>
      {title && (
        <figcaption id={titleId} className="ds-chart__title">
          {title}
        </figcaption>
      )}

      <div className="ds-chart__body">
        <div className="ds-chart__viz" role="img" aria-label={ariaLabel}>
          {slices.total === 0 ? (
            <div className="ds-chart__empty">
              <svg viewBox="0 0 200 200" width="200" height="200" aria-hidden="true">
                <circle cx="100" cy="100" r="72" fill="none" stroke="var(--border)" strokeWidth="24" />
              </svg>
              <p>{emptyLabel}</p>
            </div>
          ) : (
            <svg viewBox="0 0 200 200" width="200" height="200" aria-hidden="true">
              {slices.items.map((slice) => (
                <path
                  key={slice.key}
                  d={describeSlice(100, 100, 80, 52, slice.startAngle, slice.endAngle)}
                  fill={slice.color}
                  stroke="var(--bg-secondary)"
                  strokeWidth="2"
                />
              ))}
              <text x="100" y="96" textAnchor="middle" className="ds-chart__total-value">
                {slices.total}
              </text>
              <text x="100" y="114" textAnchor="middle" className="ds-chart__total-label">
                total
              </text>
            </svg>
          )}
        </div>

        <ul className="ds-chart__legend">
          {Object.entries(data).map(([key, value]) => {
            const numeric = Number(value) || 0;
            const pct = slices.total > 0 ? Math.round((numeric / slices.total) * 100) : 0;
            return (
              <li key={key} className="ds-chart__legend-item">
                <span className="ds-chart__swatch" style={{ backgroundColor: colors[key] || "var(--border)" }} />
                <span className="ds-chart__legend-label">{labels[key] || key}</span>
                <span className="ds-chart__legend-value">
                  {numeric}
                  {slices.total > 0 && <span className="ds-chart__legend-pct"> ({pct}%)</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </figure>
  );
};

export default DonutChart;
