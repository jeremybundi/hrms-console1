/** One CSV cell: quoted when it holds a comma, quote or line break; formula-like text is defused for spreadsheets. */
export function csvCell(value) {
  if (value === null || value === undefined) return ''
  let s = String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

/** columns: [{ header, value(row) }] → CSV text with a header row. */
export function toCsv(columns, rows) {
  return [columns.map((c) => csvCell(c.header)), ...rows.map((r) => columns.map((c) => csvCell(c.value(r))))]
    .map((line) => line.join(','))
    .join('\r\n')
}

/** Every page of a paginated list, 100 at a time. `list` is e.g. listUsers. */
export async function fetchAll(list, params, { max = 5000 } = {}) {
  const rows = []
  for (let page = 1; ; page++) {
    const res = await list({ ...params, per_page: 100, page })
    rows.push(...(res.data ?? []))
    if (!res.meta || page >= res.meta.last_page || rows.length >= max) return rows
  }
}

/** Hands the browser a CSV file to save. The BOM makes Excel read it as UTF-8. */
export function downloadCsv(filename, csv) {
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
