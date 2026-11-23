"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import {
  MobileFlow,
  MobileFlowActions,
  MobileFlowContent,
  MobileFlowHeader,
} from "@/components/mobile-flow/mobile-flow"
import { useRoutedDialog } from "@/components/routed-dialog/routed-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { orders } from "@/lib/data/orders"

const customers = [...new Map(orders.map((o) => [o.customer, o])).values()].slice(0, 20)

/**
 * Quick order in two steps: choose the customer, then confirm the amount.
 * The step state lives here; `MobileFlow` only lays the screen out.
 */
export function QuickOrder() {
  const router = useRouter()
  // Opened from the list it is a Dialog roteado (see @modal/(.)quick-order): back and done close it.
  const frame = useRoutedDialog()
  const inDialog = frame.mode === "dialog"
  const [step, setStep] = React.useState<1 | 2>(1)
  const [customer, setCustomer] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [error, setError] = React.useState("")
  const [pending, setPending] = React.useState(false)

  function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const value = Number(amount.replace(",", "."))
    if (!value || value <= 0) {
      setError("Enter an amount greater than 0.")
      document.getElementById("quick-amount")?.focus()
      return
    }
    setError("")
    setPending(true)
    setTimeout(() => {
      toast.success("Order created", { description: `${customer}: ORD-20482 was added to the queue.` })
      if (inDialog) frame.close()
      else router.push("/orders")
    }, 600)
  }

  if (step === 1) {
    return (
      <MobileFlow>
        <MobileFlowHeader
          title="Choose customer"
          {...(inDialog ? { onBack: () => frame.close() } : { backHref: "/orders" })}
          right={<span className="text-muted-foreground">1 / 2</span>} />
        <MobileFlowContent>
          <RadioGroup value={customer} onValueChange={setCustomer} aria-label="Customer" className="gap-3">
            {customers.map((c) => (
              <FieldLabel key={c.customer} htmlFor={`customer-${c.id}`}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>{c.customer}</FieldTitle>
                    <FieldDescription>{c.email}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={c.customer} id={`customer-${c.id}`} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </MobileFlowContent>
        <MobileFlowActions>
          <Button type="button" disabled={!customer} onClick={() => setStep(2)}>
            Continue
          </Button>
        </MobileFlowActions>
      </MobileFlow>
    )
  }

  return (
    <MobileFlow>
      <MobileFlowHeader title="Confirm amount" onBack={() => setStep(1)} right={<span className="text-muted-foreground">2 / 2</span>} />
      <form noValidate onSubmit={confirm} className="flex min-h-0 flex-1 flex-col">
        <MobileFlowContent>
          <p className="text-muted-foreground">
            Order for <span className="font-medium text-foreground">{customer}</span>
          </p>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="quick-amount">Amount (€)</FieldLabel>
            <Input
              id="quick-amount"
              name="amount"
              inputMode="decimal"
              className="tabular-nums"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "quick-amount-error" : undefined}
            />
            {error ? <FieldError id="quick-amount-error">{error}</FieldError> : null}
          </Field>
        </MobileFlowContent>
        <MobileFlowActions>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Confirm order"}
          </Button>
        </MobileFlowActions>
      </form>
    </MobileFlow>
  )
}
