# Calendario de eventos Gay · Bear · Leather · BDSM España

Prototipo de calendario de eventos con datos reales de promotores oficiales.
Cobertura 2026–2027. Incluye categoría Daddy y una sección aparte para bares
con fiestas recurrentes (no puntuales, así que no tiene sentido ponerlos en
el calendario).

## Base de datos editable (Excel-compatible)

Los datos NO están hardcodeados en el código: viven en dos archivos **CSV**
que la app lee en tiempo real (al recargar la página, sin necesidad de
recompilar nada):

- [`public/data/events.csv`](public/data/events.csv) — eventos puntuales/con fecha.
- [`public/data/bars.csv`](public/data/bars.csv) — bares con fiestas recurrentes.

Se pueden abrir y editar con Excel, Numbers o Google Sheets (guardar siempre
como **CSV**, no como .xlsx). Columnas de `events.csv`:

| Columna | Qué va |
|---|---|
| `id` | identificador único, sin espacios (ej. `mad-bear-madrid-2026`) |
| `title` | nombre del evento |
| `promoter` | quién lo organiza |
| `categories` | una o más de `gay`, `bear`, `leather`, `bdsm`, `daddy`, separadas por `\|` |
| `city`, `venue` | ciudad y local |
| `startDate`, `endDate` | formato `AAAA-MM-DD`, `endDate` vacío si es de un solo día |
| `dateNote` | ej. "fecha por confirmar" |
| `priceInfo`, `ticketUrl`, `sourceUrl` | precio, link de entradas, fuente oficial |
| `lastMinuteChangeNote`, `lastMinuteChangeDate` | para marcar un cambio de última hora (aparece como aviso rojo) |
| `description`, `lastVerified` | descripción y fecha de la última revisión |

`bars.csv` es más simple: `id, name, categories, city, address, recurrence,
description, website, lastVerified`.

Si un campo de texto tiene comas, hay que ponerlo entre comillas dobles
(estándar CSV — Excel/Sheets lo hacen solos al guardar).

## Servidor local

Sí — ya está corriendo en este entorno con `npm run dev` (Vite), en
`http://localhost:5173`. Para levantarlo vos mismo en tu Mac:

```bash
npm install
npm run dev
```

Cualquier cambio que hagas en los CSV se ve recargando la página del
navegador, sin reiniciar el servidor.

## Actualización automática de datos

Ningún promotor de esta escena publica sus eventos en formato estructurado
(tablas, JSON, RSS) — son carteles/imágenes con texto libre, y varios usan
Instagram como canal principal, que bloquea el scraping automatizado. Por
eso el sistema NO intenta extraer fechas automáticamente (daría datos
incorrectos con frecuencia). En cambio, hace **detección de cambios**:

```bash
npm run check-sources
```

Descarga el texto de cada fuente oficial (`sourceUrl` de cada evento,
`website` de cada bar, y las fuentes extra en
[`data/watch-sources.json`](data/watch-sources.json)) y lo compara con la
última revisión guardada en `data/snapshots/`. Si algo cambió, queda
registrado en `data/change-report.json`.

El workflow `.github/workflows/check-sources.yml` corre esto solo, **lunes y
jueves**, y si detecta cambios **abre un issue en GitHub** listando qué
fuente cambió, para revisar y actualizar el CSV a mano (unos minutos).

### Telegram como fuente extra

A diferencia de Instagram, los **canales públicos de Telegram sí se pueden
leer** (vía `https://t.me/s/<canal>`, sin necesitar API ni login) y suelen
tener fechas más concretas por fiesta que la web principal del promotor —
ya lo comprobé con el canal de Strong The Club (`t.me/s/strongtheclub`):
tiene fechas de fiestas puntuales que no están en `strong.madrid`.

Para sumar un canal de Telegram (u otra web) como fuente vigilada sin
asociarlo a un evento puntual, agregalo a `data/watch-sources.json`:

```json
{ "label": "Nombre del canal", "url": "https://t.me/s/nombrecanal", "note": "por qué lo seguimos" }
```

Si me pasás los nombres de otros canales de Telegram de promotores que
conozcas, los sumo. Grupos **privados** de Telegram no se pueden leer así
(harían falta un bot y ser miembro — es otro nivel de integración).

## Desplegar (gratis, sin proveedor propio)

1. Creá un repositorio en GitHub y pusheá este proyecto.
2. En **Settings → Pages**, elegí "GitHub Actions" como fuente.
3. El workflow `deploy.yml` publica automáticamente en cada push a `main`.
4. `check-sources.yml` corre solo 2 veces por semana con el runner gratuito
   de GitHub Actions — no hace falta ninguna cuenta de hosting de pago.

## Próximos pasos sugeridos

- Sumar más promotores/bares (Barcelona, Valencia, Sitges fuera de semana
  de osos) y más canales de Telegram.
- Empaquetar esta misma app como app de macOS con **Tauri** y como app de
  iOS con **Capacitor**, reutilizando el mismo código y los mismos CSV.
