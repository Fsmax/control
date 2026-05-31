"use client"

import { useEffect } from "react"

// Регистрирует service worker для PWA (установка на экран, кэш статики, офлайн-оболочка).
// Дополняет регистрацию в lib/push.ts (та срабатывает при подписке на уведомления);
// повторная регистрация того же '/sw.js' безопасна — браузер дедуплицирует.
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // регистрация не критична — приложение работает и без SW
      })
    }
    if (document.readyState === "complete") onLoad()
    else window.addEventListener("load", onLoad, { once: true })
    return () => window.removeEventListener("load", onLoad)
  }, [])

  return null
}
