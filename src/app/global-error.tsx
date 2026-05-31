"use client"

import { useEffect } from "react"

// Граница на случай падения в корневом layout (когда обычный error.tsx уже не помогает).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ru">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          background: "#0a0a0a",
          color: "#fafafa",
        }}
      >
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Что-то пошло не так</h2>
        {error.digest && (
          <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>код: {error.digest}</p>
        )}
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#fafafa",
            color: "#0a0a0a",
            cursor: "pointer",
          }}
        >
          Обновить
        </button>
      </body>
    </html>
  )
}
