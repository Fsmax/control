// Edge Function: рассылает Web Push по задачам с наступившим remind_at.
// Запускается по расписанию (pg_cron → pg_net), см. Finance.md раздел 4.9.
// Секреты: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
// SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY Supabase подставляет автоматически.

import webpush from "npm:web-push@3.6.7"
import { createClient } from "jsr:@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY")!
const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")!
const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:fintask@example.com"

webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

Deno.serve(async (req) => {
  // Защита эндпойнта: функция владеет service_role и рассылает push. Если задан
  // CRON_SECRET — требуем его в заголовке Authorization (его же передаёт cron-job).
  const cronSecret = Deno.env.get("CRON_SECRET")
  if (cronSecret && req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const nowIso = new Date().toISOString()

  const { data: due, error } = await supabase
    .from("tasks")
    .select("id, user_id, title")
    .not("remind_at", "is", null)
    .is("reminded_at", null)
    .lte("remind_at", nowIso)
    .neq("status", "DONE")

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }

  let sent = 0
  let retried = 0
  for (const task of due ?? []) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", task.user_id)

    let delivered = false        // доставлено хотя бы на одну подписку
    let transientFailure = false // временная ошибка (сеть/5xx) — есть смысл повторить

    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: "Напоминание", body: task.title, url: "/" })
        )
        delivered = true
        sent++
      } catch (e) {
        const code = (e as { statusCode?: number })?.statusCode
        if (code === 404 || code === 410) {
          // подписка мертва — удаляем; повтор по ней не поможет
          await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint)
        } else {
          transientFailure = true
        }
      }
    }

    // Помечаем reminded_at, КРОМЕ случая «временный сбой и никуда не доставили» —
    // тогда оставляем null, чтобы следующий прогон повторил. Нет подписок или все 410
    // → помечаем (повтор бесполезен, иначе задача висела бы в очереди вечно).
    if (transientFailure && !delivered) {
      retried++
    } else {
      await supabase.from("tasks").update({ reminded_at: nowIso }).eq("id", task.id)
    }
  }

  return new Response(JSON.stringify({ sent, retried }), {
    headers: { "content-type": "application/json" },
  })
})
