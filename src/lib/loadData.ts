import { parseCsv } from "./csv";
import type { BarItem, Category, EventItem, LastMinuteChange } from "../types";

function splitCategories(raw: string): Category[] {
  return raw
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean) as Category[];
}

function toEvent(row: Record<string, string>): EventItem {
  let lastMinuteChange: LastMinuteChange | null = null;
  if (row.lastMinuteChangeNote && row.lastMinuteChangeDate) {
    lastMinuteChange = { note: row.lastMinuteChangeNote, date: row.lastMinuteChangeDate };
  }
  return {
    id: row.id,
    title: row.title,
    promoter: row.promoter,
    categories: splitCategories(row.categories),
    city: row.city,
    venue: row.venue,
    startDate: row.startDate,
    endDate: row.endDate || undefined,
    dateNote: row.dateNote || undefined,
    priceInfo: row.priceInfo || undefined,
    ticketUrl: row.ticketUrl || undefined,
    sourceUrl: row.sourceUrl,
    lastMinuteChange,
    description: row.description || undefined,
    lastVerified: row.lastVerified,
  };
}

function toBar(row: Record<string, string>): BarItem {
  return {
    id: row.id,
    name: row.name,
    categories: splitCategories(row.categories),
    city: row.city,
    address: row.address || undefined,
    recurrence: row.recurrence,
    description: row.description || undefined,
    website: row.website || undefined,
    lastVerified: row.lastVerified,
  };
}

async function fetchCsv(path: string): Promise<Record<string, string>[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`No se pudo cargar ${path}: HTTP ${res.status}`);
  const text = await res.text();
  return parseCsv(text);
}

export async function loadEvents(): Promise<EventItem[]> {
  const rows = await fetchCsv("./data/events.csv");
  return rows.filter((r) => r.id).map(toEvent);
}

export async function loadBars(): Promise<BarItem[]> {
  const rows = await fetchCsv("./data/bars.csv");
  return rows.filter((r) => r.id).map(toBar);
}
