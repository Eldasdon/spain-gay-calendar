import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { CATEGORIES, type BarItem, type Category, type EventItem } from "./types";
import EventCard from "./EventCard";
import BarCard from "./BarCard";
import CalendarGrid from "./CalendarGrid";
import { loadBars, loadEvents } from "./lib/loadData";

type ViewMode = "calendar" | "list";
type Section = "events" | "bars";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function App() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [bars, setBars] = useState<BarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [section, setSection] = useState<Section>("events");
  const [activeCats, setActiveCats] = useState<Set<Category>>(new Set());
  const [city, setCity] = useState<string>("all");
  const [view, setView] = useState<ViewMode>("list");
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadEvents(), loadBars()])
      .then(([ev, br]) => {
        setEvents(ev);
        setBars(br);
      })
      .catch((err) => setLoadError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(() => {
    const source = section === "events" ? events : bars;
    const set = new Set(source.map((e) => e.city));
    return ["all", ...Array.from(set).sort()];
  }, [section, events, bars]);

  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => (activeCats.size === 0 ? true : e.categories.some((c) => activeCats.has(c))))
      .filter((e) => (city === "all" ? true : e.city === city))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [events, activeCats, city]);

  const filteredBars = useMemo(() => {
    return bars
      .filter((b) => (activeCats.size === 0 ? true : b.categories.some((c) => activeCats.has(c))))
      .filter((b) => (city === "all" ? true : b.city === city))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [bars, activeCats, city]);

  function toggleCat(c: Category) {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  function shiftMonth(delta: number) {
    setSelectedDate(null);
    setCursor((prev) => {
      let month = prev.month + delta;
      let year = prev.year;
      if (month < 0) {
        month = 11;
        year -= 1;
      } else if (month > 11) {
        month = 0;
        year += 1;
      }
      return { year, month };
    });
  }

  const dayEvents = selectedDate
    ? filteredEvents.filter((e) => selectedDate >= e.startDate && selectedDate <= (e.endDate ?? e.startDate))
    : [];

  // La vista Lista (portada) arranca en el evento más próximo (hoy en adelante, incluidos los
  // que ya empezaron pero siguen activos) — así quien entra ve primero lo más cercano.
  // El calendario en cambio sigue mostrando todo el año, filtrado solo por categoría/ciudad.
  const upcomingEvents = useMemo(() => {
    const today = todayIso();
    return filteredEvents.filter((e) => (e.endDate ?? e.startDate) >= today);
  }, [filteredEvents]);

  const nextEventId = upcomingEvents[0]?.id ?? null;

  const groupedByMonth = useMemo(() => {
    const groups: { label: string; items: EventItem[] }[] = [];
    for (const ev of upcomingEvents) {
      const d = new Date(ev.startDate + "T00:00:00");
      const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      let g = groups.find((g) => g.label === label);
      if (!g) {
        g = { label, items: [] };
        groups.push(g);
      }
      g.items.push(ev);
    }
    return groups;
  }, [upcomingEvents]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Calendario Gay · Bear · Leather · BDSM España</h1>
        <p>
          Fechas oficiales de los promotores, actualizadas periódicamente. Cobertura {new Date().getFullYear()}–
          {new Date().getFullYear() + 1}.
        </p>
      </header>

      <div className="section-tabs">
        <button className={section === "events" ? "active" : ""} onClick={() => setSection("events")}>
          Eventos
        </button>
        <button className={section === "bars" ? "active" : ""} onClick={() => setSection("bars")}>
          Bares
        </button>
      </div>

      <div className="toolbar">
        <div className="chip-group">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`chip ${activeCats.has(c.id) ? "active" : ""}`}
              style={activeCats.has(c.id) ? { background: c.color, borderColor: c.color } : {}}
              onClick={() => toggleCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <select className="select-native" value={city} onChange={(e) => setCity(e.target.value)}>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "Todas las ciudades" : c}
            </option>
          ))}
        </select>

        {section === "events" && (
          <div className="view-toggle">
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
              Lista
            </button>
            <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>
              Calendario
            </button>
          </div>
        )}
      </div>

      {loading && <p className="empty-state">Cargando datos…</p>}
      {loadError && <p className="empty-state">No se pudieron cargar los datos: {loadError}</p>}

      {!loading && !loadError && section === "bars" && (
        <div className="bar-list">
          {filteredBars.length === 0 && <p className="empty-state">No hay bares con estos filtros.</p>}
          {filteredBars.map((b) => (
            <BarCard bar={b} key={b.id} />
          ))}
        </div>
      )}

      {!loading && !loadError && section === "events" && view === "calendar" && (
        <>
          <div className="month-nav">
            <button onClick={() => shiftMonth(-1)}>← Anterior</button>
            <h2>
              {MONTH_NAMES[cursor.month]} {cursor.year}
            </h2>
            <button onClick={() => shiftMonth(1)}>Siguiente →</button>
          </div>
          <CalendarGrid
            year={cursor.year}
            month={cursor.month}
            events={filteredEvents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <div className="cal-legend">
            {CATEGORIES.map((c) => (
              <div className="cal-legend-item" key={c.id}>
                <span className="cal-legend-swatch" style={{ background: c.color }} />
                {c.label}
              </div>
            ))}
          </div>
          {selectedDate && (
            <div className="day-panel">
              <h3>
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              {dayEvents.length ? (
                <div className="event-list">
                  {dayEvents.map((ev) => (
                    <EventCard event={ev} key={ev.id} />
                  ))}
                </div>
              ) : (
                <p className="empty-state">Sin eventos ese día.</p>
              )}
            </div>
          )}
        </>
      )}

      {!loading && !loadError && section === "events" && view === "list" && (
        <>
          {groupedByMonth.length === 0 && <p className="empty-state">No hay próximos eventos con estos filtros.</p>}
          {groupedByMonth.map((g) => (
            <div key={g.label}>
              <h3 className="month-heading">{g.label}</h3>
              <div className="event-list">
                {g.items.map((ev) => (
                  <EventCard event={ev} key={ev.id} isNext={ev.id === nextEventId} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <footer className="footnote">
        Datos recopilados de las webs y redes oficiales de cada promotor. Fechas, precios y ubicaciones pueden cambiar sin
        previo aviso — se recomienda confirmar en la fuente oficial de cada evento antes de comprar entradas. Editable en{" "}
        <code>public/data/events.csv</code> y <code>public/data/bars.csv</code>. Última actualización del calendario:{" "}
        {new Date().toLocaleDateString("es-ES")}.
      </footer>
    </div>
  );
}
