import { CATEGORIES, type EventItem } from "./types";

function formatDateRange(ev: EventItem): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  const start = new Date(ev.startDate + "T00:00:00");
  const startStr = start.toLocaleDateString("es-ES", opts);
  if (!ev.endDate || ev.endDate === ev.startDate) return startStr;
  const end = new Date(ev.endDate + "T00:00:00");
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.getDate()}–${end.toLocaleDateString("es-ES", opts)}`;
  }
  return `${startStr} – ${end.toLocaleDateString("es-ES", opts)}`;
}

export default function EventCard({ event, isNext = false }: { event: EventItem; isNext?: boolean }) {
  return (
    <div className={`event-card ${isNext ? "event-card-next" : ""}`}>
      {isNext && <span className="next-badge">Próximo evento</span>}
      <div className="event-card-top">
        <div>
          <h3>{event.title}</h3>
          <p className="event-meta">
            {formatDateRange(event)}
            {event.dateNote ? ` · ${event.dateNote}` : ""}
            {" · "}
            {event.venue}, {event.city}
          </p>
        </div>
      </div>

      <div className="badge-row">
        {event.categories.map((c) => {
          const meta = CATEGORIES.find((m) => m.id === c);
          return (
            <span key={c} className="badge" style={{ background: meta?.color }}>
              {meta?.label ?? c}
            </span>
          );
        })}
      </div>

      {event.lastMinuteChange && (
        <div className="badge-alert">
          ⚠ Cambio de última hora ({new Date(event.lastMinuteChange.date + "T00:00:00").toLocaleDateString("es-ES")}):{" "}
          {event.lastMinuteChange.note}
        </div>
      )}

      {event.description && <p className="event-desc">{event.description}</p>}

      <p className="event-meta" style={{ marginBottom: 8 }}>
        Organiza: {event.promoter} · Precio: {event.priceInfo ?? "Consultar web oficial"}
      </p>

      <div className="event-links">
        {event.ticketUrl && (
          <a href={event.ticketUrl} target="_blank" rel="noreferrer noopener">
            Entradas / info →
          </a>
        )}
        <a href={event.sourceUrl} target="_blank" rel="noreferrer noopener">
          Fuente oficial
        </a>
      </div>

      <p className="event-verified">Última verificación: {new Date(event.lastVerified + "T00:00:00").toLocaleDateString("es-ES")}</p>
    </div>
  );
}
