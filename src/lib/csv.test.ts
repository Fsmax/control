import { describe, expect, it } from "vitest"

import { toCsv } from "@/lib/csv"

describe("toCsv", () => {
  it("строит строки через «;» и CRLF", () => {
    expect(toCsv(["a", "b"], [["1", "2"]])).toBe("a;b\r\n1;2")
  })

  it("экранирует кавычки, разделители и переводы строк", () => {
    expect(toCsv(["x"], [['он сказал "привет"']])).toBe('x\r\n"он сказал ""привет"""')
    expect(toCsv(["x"], [["a;b"]])).toBe('x\r\n"a;b"')
    expect(toCsv(["x"], [["a\nb"]])).toBe('x\r\n"a\nb"')
  })

  it("null и undefined превращаются в пустые ячейки", () => {
    expect(toCsv(["a", "b"], [[null, undefined]])).toBe("a;b\r\n;")
  })

  it("числа сериализуются как есть", () => {
    expect(toCsv(["n"], [[1234.5]])).toBe("n\r\n1234.5")
  })
})
