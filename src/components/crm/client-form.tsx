"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { createClient, updateClient } from "@/server/actions/clients"
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

type ClientLike = {
  id: string
  kind: "COMPANY" | "INDIVIDUAL"
  name: string
  status: "LEAD" | "ACTIVE" | "INACTIVE"
  email: string | null
  phone: string | null
  address: string | null
  site_address: string | null
  tax_id: string | null
  note: string | null
}

export function ClientForm({
  client,
  trigger,
  defaultOpen = false,
}: {
  client?: ClientLike
  trigger?: React.ReactElement
  defaultOpen?: boolean
}) {
  const router = useRouter()
  const editing = !!client
  const [open, setOpen] = useState(defaultOpen)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [kind, setKind] = useState<"COMPANY" | "INDIVIDUAL">(client?.kind ?? "COMPANY")
  const [name, setName] = useState(client?.name ?? "")
  const [status, setStatus] = useState<"LEAD" | "ACTIVE" | "INACTIVE">(client?.status ?? "LEAD")
  const [email, setEmail] = useState(client?.email ?? "")
  const [phone, setPhone] = useState(client?.phone ?? "")
  const [address, setAddress] = useState(client?.address ?? "")
  const [siteAddress, setSiteAddress] = useState(client?.site_address ?? "")
  const [taxId, setTaxId] = useState(client?.tax_id ?? "")
  const [note, setNote] = useState(client?.note ?? "")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    start(async () => {
      const payload = {
        kind,
        name,
        status,
        email: email || null,
        phone: phone || null,
        address: address || null,
        site_address: siteAddress || null,
        tax_id: taxId || null,
        note: note || null,
      }
      const res = editing
        ? await updateClient({ id: client!.id, ...payload })
        : await createClient(payload)
      if (res.success) {
        setError(null)
        setOpen(false)
        if (!editing && res.id) router.push(`/clients/${res.id}`)
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
            <Button>
              <Plus className="size-4" /> Новый клиент
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Редактировать клиента" : "Новый клиент"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Тип">
              <select className={fieldClass} value={kind} onChange={(e) => setKind(e.target.value as "COMPANY" | "INDIVIDUAL")}>
                <option value="COMPANY">Организация</option>
                <option value="INDIVIDUAL">Физлицо</option>
              </select>
            </Field>
            <Field label="Статус">
              <select className={fieldClass} value={status} onChange={(e) => setStatus(e.target.value as "LEAD" | "ACTIVE" | "INACTIVE")}>
                <option value="LEAD">Лид</option>
                <option value="ACTIVE">Активный</option>
                <option value="INACTIVE">Неактивный</option>
              </select>
            </Field>
          </div>
          <Field label="Название / имя">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ООО «Объект» или ФИО" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Телефон">
              <input className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Email">
              <input className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
          <Field label="Адрес объекта" hint="(монтаж / ОВиК)">
            <input className={fieldClass} value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Юр. адрес">
              <input className={fieldClass} value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
            <Field label="ИНН / реквизит">
              <input className={fieldClass} value={taxId} onChange={(e) => setTaxId(e.target.value)} />
            </Field>
          </div>
          <Field label="Заметка">
            <textarea className={`${fieldClass} h-auto py-2`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending || !name.trim()}>
              {editing ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
