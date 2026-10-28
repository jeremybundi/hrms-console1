import { describe, expect, it, vi } from 'vitest'
import { csvCell, fetchAll, toCsv } from './csv'

describe('csv', () => {
  it('quotes cells with commas, quotes and line breaks', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('Acme, Ltd')).toBe('"Acme, Ltd"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('two\nlines')).toBe('"two\nlines"')
    expect(csvCell(null)).toBe('')
    expect(csvCell(0)).toBe('0')
  })

  it('defuses text a spreadsheet would run as a formula', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCell('+254700000000')).toBe("'+254700000000")
    expect(csvCell('@sum')).toBe("'@sum")
  })

  it('builds a header row and one line per row', () => {
    const csv = toCsv([{ header: 'Name', value: (r) => r.name }, { header: 'Users', value: (r) => r.n }], [{ name: 'Acme', n: 3 }, { name: 'Globex', n: 0 }])
    expect(csv).toBe('Name,Users\r\nAcme,3\r\nGlobex,0')
  })

  it('fetches every page, 100 at a time', async () => {
    const list = vi.fn(async ({ page }) => ({ data: [{ id: page }], meta: { last_page: 3 } }))
    const rows = await fetchAll(list, { tenant_id: 7 })
    expect(rows.map((r) => r.id)).toEqual([1, 2, 3])
    expect(list).toHaveBeenCalledWith({ tenant_id: 7, per_page: 100, page: 2 })
  })
})
