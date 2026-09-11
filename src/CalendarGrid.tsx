import { CATEGORIES, type EventItem } from "./types";

const DOW = ["L", "M", "X", "J", "V", "S", "D"];
const MS_DAY = 86400000;

function toDate(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / MS_DAY);
}

function categoryColor(id: string): string {
  return CATEGORIES.find((m) => m.id === id)?.color ?? "#666";
}

function barBackground(categories: string[]): string {
  if (categories.length <= 1) return categoryColor(categories[0]);
  const step = 100 / categories.length;
  const stops = categories.map((c, i) => `${categoryColor(c)} ${i * step}% ${(i + 1) * step}%`);
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

interface Segment {
  event: EventItem;
  colStart: number; // 0-6
  colEnd: number; // 0-6 inclusive
  lane: number;
}

interface Week {
  days: { date: Date; iso: string; inMonth: boolean }[];
  segments: Segment[];
  lanes: number;
}

function buildWeeks(year: number, month: number, events: EventItem[]): Week[] {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const gridStart = new Date(year, month, 1 - startWeekday);

  const weeks: Week[] = [];
  for (let w = 0; w < 6; w++) {
    const weekStart = new Date(gridStart);
    weekStart.setDate(gridStart.getDate() + w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return { date: d, iso: isoOf(d), inMonth: d.getMonth() === month };
    });

    const intersecting = events.filter((e) => {
      const start = toDate(e.startDate);
      const end = toDate(e.endDate ?? e.startDate);
      return start <= weekEnd && end >= weekStart;
    });

    intersecting.sort((a, b) => {
      const aStart = Math.max(0, diffDays(toDate(a.startDate), weekStart));
      const bStart = Math.max(0, diffDays(toDate(b.startDate), weekStart));
      if (aStart !== bStart) return aStart - bStart;
      const aLen = diffDays(toDate(a.endDate ?? a.startDate), toDate(a.startDate));
      const bLen = diffDays(toDate(b.endDate ?? b.startDate), toDate(b.startDate));
      return bLen - aLen;
    });

    const laneEnds: number[] = [];
    const segments: Segment[] = intersecting.map((e) => {
      const start = toDate(e.startDate);
      const end = toDate(e.endDate ?? e.startDate);
      const colStart = Math.max(0, diffDays(start, weekStart));
      const colEnd = Math.min(6, diffDays(end, weekStart));

      let lane = laneEnds.findIndex((laneEnd) => laneEnd < colStart);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(colEnd);
      } else {
        laneEnds[lane] = colEnd;
      }

      return { event: e, colStart, colEnd, lane };
    });

    weeks.push({ days, segments, lanes: laneEnds.length });
  }

  // recorta semanas finales completamente fuera del mes y sin eventos
  while (weeks.length > 4 && weeks[weeks.length - 1].days.every((d) => !d.inMonth) && weeks[weeks.length - 1].segments.length === 0) {
    weeks.pop();
  }

  return weeks;
}

export default function CalendarGrid({
  year,
  month, // 0-indexed
  events,
  selectedDate,
  onSelectDate,
}: {
  year: number;
  month: number;
  events: EventItem[];
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
}) {
  const weeks = buildWeeks(year, month, events);

  return (
    <div className="cal-month">
      <div className="cal-dow-row">
        {DOW.map((d) => (
          <div className="cal-dow" key={d}>
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div
          className="cal-week"
          key={wi}
          style={{ gridTemplateRows: `20px repeat(${Math.max(week.lanes, 0)}, 18px)` }}
        >
          {week.days.map((day) => (
            <div
              key={day.iso}
              className={`cal-daynum ${day.inMonth ? "" : "out"} ${selectedDate === day.iso ? "selected" : ""}`}
              onClick={() => onSelectDate(day.iso)}
            >
              {day.date.getDate()}
            </div>
          ))}
          {week.segments.map((seg) => (
            <div
              key={`${seg.event.id}-${wi}`}
              className="cal-bar"
              title={`${seg.event.title} · ${seg.event.venue}, ${seg.event.city}`}
              style={{
                gridColumn: `${seg.colStart + 1} / ${seg.colEnd + 2}`,
                gridRow: seg.lane + 2,
                background: barBackground(seg.event.categories),
              }}
              onClick={() => onSelectDate(seg.event.startDate)}
            >
              <span className="cal-bar-label">{seg.event.title}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
