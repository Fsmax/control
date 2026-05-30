import { getProfile } from "@/server/queries/profile"
import { SettingsForm } from "@/components/settings/settings-form"

export default async function SettingsPage() {
  const profile = await getProfile()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Настройки</h1>
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
