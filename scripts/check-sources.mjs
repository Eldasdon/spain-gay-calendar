// Detecta cambios en las páginas/fuentes oficiales de cada evento (y en canales
// públicos de Telegram, que suelen tener fechas más granulares que la web).
// No intenta "adivinar" fechas o precios de HTML no estructurado (es demasiado frágil
// y la mayoría de promotores usan Instagram, que no se puede scrapear de forma fiable).
// En cambio: descarga el texto de cada fuente, lo compara con la última vez que se
// revisó, y si cambió, lo deja registrado para revisión humana antes de tocar el CSV.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const EVENTS_CSV = path.join(ROOT, "public/data/events.csv");
const BARS_CSV = path.join(ROOT, "public/data/bars.csv");
const WATCH_SOURCES = path.join(ROOT, "data/watch-sources.json");
const SNAPSHOTS_DIR = path.join(ROOT, "data/snapshots");
const REPORT_PATH = path.join(ROOT, "data/change-report.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };
  const normalized = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\n") {
      pushRow();
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) pushRow();
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length === 0) return [];
  const header = nonEmpty[0].map((h) => h.trim());
  return nonEmpty.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, idx) => (obj[h] = (r[idx] ?? "").trim()));
    return obj;
  });
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hash(text) {
  return createHash("sha256").update(text).digest("hex");
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CalendarioEventosBot/1.0; +revision manual de cambios, no comercial)",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return stripHtml(html);
}

async function readJsonSafe(p, fallback) {
  try {
    return JSON.parse(await readFile(p, "utf-8"));
  } catch {
    return fallback;
  }
}

async function main() {
  await mkdir(SNAPSHOTS_DIR, { recursive: true });

  const events = parseCsv(await readFile(EVENTS_CSV, "utf-8"));
  const bars = parseCsv(await readFile(BARS_CSV, "utf-8"));
  const watchSources = await readJsonSafe(WATCH_SOURCES, []);

  // Una fuente por URL única (evita golpear la misma web varias veces).
  const sources = new Map();
  const addSource = (url, label, refId) => {
    if (!url) return;
    if (!sources.has(url)) sources.set(url, { url, label, refIds: [] });
    sources.get(url).refIds.push(refId);
  };
  for (const ev of events) addSource(ev.sourceUrl, ev.title, `evento:${ev.id}`);
  for (const b of bars) addSource(b.website, b.name, `bar:${b.id}`);
  for (const s of watchSources) addSource(s.url, s.label, `watch:${s.url}`);

  const changes = [];
  const errors = [];

  for (const [url, info] of sources) {
    const id = hash(url).slice(0, 16);
    const snapshotPath = path.join(SNAPSHOTS_DIR, `${id}.txt`);

    let text;
    try {
      text = await fetchText(url);
    } catch (err) {
      errors.push({ url, label: info.label, error: String(err), refIds: info.refIds });
      continue;
    }

    const newHash = hash(text);
    let previousHash = null;
    try {
      previousHash = (await readFile(snapshotPath, "utf-8")).split("\n")[0];
    } catch {
      // primera vez que se revisa esta fuente
    }

    await writeFile(snapshotPath, `${newHash}\n${new Date().toISOString()}\n\n${text}`);

    if (previousHash && previousHash !== newHash) {
      changes.push({ url, label: info.label, refIds: info.refIds, detectedAt: new Date().toISOString() });
    }
  }

  const report = {
    checkedAt: new Date().toISOString(),
    sourcesChecked: sources.size,
    changesDetected: changes,
    errors,
  };

  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(`Fuentes revisadas: ${sources.size}`);
  console.log(`Cambios detectados: ${changes.length}`);
  console.log(`Errores: ${errors.length}`);
  if (changes.length > 0) {
    console.log("\nPosibles cambios:");
    for (const c of changes) console.log(`- [${c.label}] ${c.url} → ${c.refIds.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
