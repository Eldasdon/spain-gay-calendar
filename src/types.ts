export type Category = "gay" | "bear" | "leather" | "bdsm" | "daddy";

export interface CategoryMeta {
  id: Category;
  label: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "gay", label: "Gay", color: "#e0559a" },
  { id: "bear", label: "Bear", color: "#c97a3d" },
  { id: "leather", label: "Leather", color: "#4a4a52" },
  { id: "bdsm", label: "BDSM / Fetish", color: "#8f2d2d" },
  { id: "daddy", label: "Daddy", color: "#2f8a72" },
];

export interface LastMinuteChange {
  note: string;
  date: string; // ISO date the change was recorded
}

export interface EventItem {
  id: string;
  title: string;
  promoter: string;
  categories: Category[];
  city: string;
  venue: string;
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate?: string; // ISO date
  dateNote?: string; // e.g. "Fecha por confirmar por el promotor"
  priceInfo?: string;
  ticketUrl?: string;
  sourceUrl: string;
  lastMinuteChange?: LastMinuteChange | null;
  description?: string;
  lastVerified: string; // ISO date this entry was last checked against the source
}

export interface BarItem {
  id: string;
  name: string;
  categories: Category[];
  city: string;
  address?: string;
  recurrence: string; // e.g. "Todos los días", "Viernes y sábados"
  description?: string;
  website?: string;
  lastVerified: string;
}
