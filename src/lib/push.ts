import { savePushSubscription } from "@/server/actions/push"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

// Запрашивает разрешение, регистрирует service worker, подписывается на push
// и сохраняет подписку на сервере. Только для клиента.
export async function subscribeToPush(): Promise<{ ok: boolean; error?: string }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, error: "Push не поддерживается этим браузером" }
  }
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapid) return { ok: false, error: "VAPID-ключ не задан" }

  const permission = await Notification.requestPermission()
  if (permission !== "granted") {
    return { ok: false, error: "Доступ к уведомлениям не выдан" }
  }

  const reg = await navigator.serviceWorker.register("/sw.js")
  await navigator.serviceWorker.ready

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
  })

  const json = sub.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, error: "Не удалось получить подписку" }
  }

  const res = await savePushSubscription({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  })
  return res.success ? { ok: true } : { ok: false, error: res.error }
}
