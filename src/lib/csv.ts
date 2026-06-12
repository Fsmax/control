type CsvValue = string | number | null | undefined

/**
 * CSV по RFC 4180: разделитель «;» (так Excel в ru-локали открывает без мастера),
 * экранирование кавычками, переводы строк CRLF.
 */
export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const esc = (v: CsvValue): string => {
    const s = v == null ? "" : String(v)
    return /[";\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
  }
  return [headers, ...rows].map((r) => r.map(esc).join(";")).join("\r\n")
}
