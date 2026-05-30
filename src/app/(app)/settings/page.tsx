import { getProfile } from "@/server/queries/profile"
import { PageHeader } from "@/components/ui/page-header"
import { SettingsForm } from "@/components/settings/settings-form"

export default async function SettingsPage() {
  const profile = await getProfile()

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Настройки" description="Профиль, цель дня, таймзона и базовая валюта" />
      {profile ? (
        <SettingsForm
          profile={{
            name: profile.name,
            timezone: profile.timezone,
            day_goal: profile.day_goal,
            focus_goal_min: profile.focus_goal_min,
            base_currency: profile.base_currency,
          }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Профиль не найден.</p>
      )}
    </div>
  )
}
