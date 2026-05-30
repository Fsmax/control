"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { createContact } from "@/server/actions/contacts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fieldClass, Field } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ContactForm({ clientId, trigger }: { clientId: string; trigger?: React.ReactElement }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    start(async () => {
      const res = await createContact({
        client_id: clientId,
        name,
        role: role || null,
        phone: phone || null,
        email: email || null,
      })
      if (res.success) {
        setName("")
        setRole("")
        setPhone("")
        setEmail("")
        setError(null)
        setOpen(false)
        router.refresh()
      } else {
        setError(res.error ?? "Ошибка")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" variant="outline">
              <Plus className="size-4" /> Контакт
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Новый контакт</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Имя">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ФИО" autoFocus />
          </Field>
          <Field label="Должность">
            <input className={fieldClass} value={role} onChange={(e) => setRole(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Телефон">
              <input className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Email">
              <input className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending || !name.trim()}>
              Добавить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
