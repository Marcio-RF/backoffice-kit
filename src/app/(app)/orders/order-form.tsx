"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { markItemChanged, markItemCreated } from "@/components/data-table/list-updates"
import { FormSection } from "@/components/forms/form-section"
import {
  RoutedDialogBody,
  RoutedDialogDescription,
  RoutedDialogFooter,
  RoutedDialogHeader,
  RoutedDialogTitle,
  useRoutedDialog,
  useRoutedDialogDirty,
} from "@/components/routed-dialog/routed-dialog"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { type Order, type OrderStatus, statusMeta } from "@/lib/data/orders"

import { saveOrder } from "./actions"

type Errors = Partial<Record<"customer" | "email" | "amount" | "channel", string>>

const channels: Order["channel"][] = ["Website", "Partner", "Phone"]

/**
 * Create or edit an order. The same form is a Dialog roteado over the list (`@modal/(.)orders/new`,
 * `@modal/(.)orders/[id]/edit`) and a full page at the same URL.
 * Plain controlled form to show the layout and error states; in a real project, plug in
 * react-hook-form or TanStack Form + zod, and the markup stays the same.
 */
export function OrderForm({ order }: { order?: Order }) {
  const router = useRouter()
  const frame = useRoutedDialog()
  const [errors, setErrors] = React.useState<Errors>({})
  const [channel, setChannel] = React.useState<string>(order?.channel ?? "")
  const [status, setStatus] = React.useState<OrderStatus>(order?.status ?? "pending")
  const [pending, setPending] = React.useState(false)
  const [dirty, setDirty] = React.useState(false)
  useRoutedDialogDirty(dirty)

  const editing = !!order
  const title = editing ? `Edit ${order.id}` : "New order"

  /** Back where the form was opened from: the Detail when editing from it, else the list. */
  const leave = (options?: { force?: boolean; refresh?: boolean }) => {
    if (frame.mode === "dialog") frame.back(options)
    else router.push(editing ? `/orders/${order.id}` : "/orders")
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const next: Errors = {}
    const customer = String(data.get("customer") ?? "").trim()
    if (!customer) next.customer = "Enter the customer's name."
    const email = String(data.get("email") ?? "")
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address, like name@example.com."
    const amount = Number(data.get("amount"))
    if (!amount || amount <= 0) next.amount = "Enter an amount greater than 0."
    if (!channel) next.channel = "Choose where the order came from."
    setErrors(next)
    const firstInvalid = (["customer", "email", "amount", "channel"] as const).find((k) => next[k])
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }
    setPending(true)
    const saved = await saveOrder(order?.id ?? null, {
      customer,
      email,
      amount,
      channel: channel as Order["channel"],
      status,
    })
    setPending(false)
    if (!saved) return
    setDirty(false)
    // The list behind fetches this order again when the dialog closes.
    if (editing) markItemChanged("orders", saved.id)
    else markItemCreated("orders", saved.id)
    toast.success(editing ? `${saved.id} saved` : "Order created", {
      description: editing ? undefined : `${saved.id} was added to the queue.`,
    })
    leave({ force: true, refresh: editing })
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      onChange={() => setDirty(true)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <RoutedDialogHeader>
        <RoutedDialogTitle>{title}</RoutedDialogTitle>
        <RoutedDialogDescription>
          {editing ? "Changes are saved to the order right away." : "Create an order on behalf of a customer."}
        </RoutedDialogDescription>
      </RoutedDialogHeader>
      <RoutedDialogBody className="gap-8 px-4">
        <FormSection title="Customer" description="Who the order is for. We send the confirmation to this email.">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.customer}>
                <FieldLabel htmlFor="customer">Full name</FieldLabel>
                <Input
                  id="customer"
                  name="customer"
                  autoComplete="name"
                  defaultValue={order?.customer}
                  aria-invalid={!!errors.customer}
                  aria-describedby={errors.customer ? "customer-error" : undefined}
                />
                {errors.customer ? <FieldError id="customer-error">{errors.customer}</FieldError> : null}
              </Field>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={order?.email}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email ? <FieldError id="email-error">{errors.email}</FieldError> : null}
              </Field>
            </div>
            {editing ? null : (
              <Field>
                <FieldLabel htmlFor="phone">
                  Phone <span className="font-normal text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Input id="phone" name="phone" type="tel" autoComplete="tel" className="sm:max-w-xs" />
              </Field>
            )}
          </FieldGroup>
        </FormSection>

        <FormSection title="Order" description="Amount and origin. Amounts are in euros, VAT included.">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.amount}>
                <FieldLabel htmlFor="amount">Amount (€)</FieldLabel>
                <Input
                  id="amount"
                  name="amount"
                  inputMode="decimal"
                  className="tabular-nums"
                  defaultValue={order?.amount}
                  aria-invalid={!!errors.amount}
                  aria-describedby={errors.amount ? "amount-error" : "amount-help"}
                />
                {errors.amount ? (
                  <FieldError id="amount-error">{errors.amount}</FieldError>
                ) : (
                  <FieldDescription id="amount-help">Use a dot for decimals: 129.90</FieldDescription>
                )}
              </Field>
              <Field data-invalid={!!errors.channel}>
                <FieldLabel htmlFor="channel">Channel</FieldLabel>
                <Select
                  value={channel}
                  onValueChange={(v) => {
                    setChannel(v)
                    setDirty(true)
                  }}
                >
                  <SelectTrigger
                    id="channel"
                    className="w-full"
                    aria-invalid={!!errors.channel}
                    aria-describedby={errors.channel ? "channel-error" : undefined}
                  >
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.channel ? <FieldError id="channel-error">{errors.channel}</FieldError> : null}
              </Field>
            </div>
            {editing ? (
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v as OrderStatus)
                    setDirty(true)
                  }}
                >
                  <SelectTrigger id="status" className="w-full sm:max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statusMeta) as OrderStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusMeta[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : (
              <FieldSet>
                <FieldLegend variant="label">Payment</FieldLegend>
                <RadioGroup name="payment" defaultValue="card" className="grid gap-3 sm:grid-cols-3">
                  {[
                    { value: "card", title: "Card", desc: "Charged now" },
                    { value: "transfer", title: "Bank transfer", desc: "Within 3 days" },
                    { value: "on_site", title: "On site", desc: "At pick-up" },
                  ].map((o) => (
                    <FieldLabel key={o.value} htmlFor={`pay-${o.value}`}>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>{o.title}</FieldTitle>
                          <FieldDescription>{o.desc}</FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value={o.value} id={`pay-${o.value}`} />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </FieldSet>
            )}
            <Field>
              <FieldLabel htmlFor="notes">Internal notes</FieldLabel>
              <Textarea id="notes" name="notes" rows={3} placeholder="Only your team sees this." />
            </Field>
          </FieldGroup>
        </FormSection>

        {editing ? null : (
          <FormSection title="Notifications" description="What the customer receives after you save.">
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="notify-email">Send confirmation email</FieldLabel>
                  <FieldDescription>Includes the order summary and a PDF receipt.</FieldDescription>
                </FieldContent>
                <Switch id="notify-email" name="notifyEmail" defaultChecked />
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="notify-sms">Send SMS reminder</FieldLabel>
                  <FieldDescription>24 hours before the start date.</FieldDescription>
                </FieldContent>
                <Switch id="notify-sms" name="notifySms" />
              </Field>
            </FieldGroup>
          </FormSection>
        )}
      </RoutedDialogBody>
      <RoutedDialogFooter>
        <Button type="button" variant="ghost" onClick={() => leave()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Create order"}
        </Button>
      </RoutedDialogFooter>
    </form>
  )
}
