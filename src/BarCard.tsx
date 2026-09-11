import { CATEGORIES, type BarItem } from "./types";

export default function BarCard({ bar }: { bar: BarItem }) {
  return (
    <div className="bar-card">
      <h3>{bar.name}</h3>
      <p className="event-meta">
        {bar.address ? `${bar.address}, ` : ""}
        {bar.city}
      </p>
      <span className="bar-recurrence">{bar.recurrence}</span>
      <div className="badge-row">
        {bar.categories.map((c) => {
          const meta = CATEGORIES.find((m) => m.id === c);
          return (
            <span key={c} className="badge" style={{ background: meta?.color }}>
              {meta?.label ?? c}
            </span>
          );
        })}
      </div>
      {bar.description && <p className="event-desc">{bar.description}</p>}
      <div className="event-links">
        {bar.website && (
          <a href={bar.website} target="_blank" rel="noreferrer noopener">
            Más info →
          </a>
        )}
      </div>
      <p className="event-verified">Última verificación: {new Date(bar.lastVerified + "T00:00:00").toLocaleDateString("es-ES")}</p>
    </div>
  );
}
