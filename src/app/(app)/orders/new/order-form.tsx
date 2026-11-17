"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { FormActions, FormSection } from "@/components/forms/form-section"
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

type Errors = Partial<Record<"customer" | "email" | "amount" | "channel", string>>

/**
 * Plain controlled form to show the layout and error states.
 * In a real project, plug in react-hook-form or TanStack Form + zod; the markup stays the same.
 */
export function OrderForm() {
  const router = useRouter()
  const [errors, setErrors] = React.useState<Errors>({})
  const [channel, setChannel] = React.useState<string>("")
  const [pending, setPending] = React.useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const next: Errors = {}
    if (!String(data.get("customer") ?? "").trim()) next.customer = "Enter the customer's name."
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
    setTimeout(() => {
      toast.success("Order created", { description: "ORD-20481 was added to the queue." })
      router.push("/orders")
    }, 600)
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-8">
      <FormSection title="Customer" description="Who the order is for. We send the confirmation to this email.">
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.customer}>
              <FieldLabel htmlFor="customer">Full name</FieldLabel>
              <Input
                id="customer"
                name="customer"
                autoComplete="name"
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
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email ? <FieldError id="email-error">{errors.email}</FieldError> : null}
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="phone">
              Phone <span className="font-normal text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" className="sm:max-w-xs" />
          </Field>
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
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger
                  id="channel"
                  className="w-full"
                  aria-invalid={!!errors.channel}
                  aria-describedby={errors.channel ? "channel-error" : undefined}
                >
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
              {errors.channel ? <FieldError id="channel-error">{errors.channel}</FieldError> : null}
            </Field>
          </div>
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
          <Field>
            <FieldLabel htmlFor="notes">Internal notes</FieldLabel>
            <Textarea id="notes" name="notes" rows={3} placeholder="Only your team sees this." />
          </Field>
        </FieldGroup>
      </FormSection>

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

      <FormActions>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create order"}
        </Button>
      </FormActions>
    </form>
  )
}
