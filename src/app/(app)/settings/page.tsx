import type { Metadata } from "next"

import { FormSection } from "@/components/forms/form-section"
import { PageContainer, PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = { title: "Settings" }

export default function SettingsPage() {
  return (
    <PageContainer className="max-w-5xl">
      <PageHeader title="Settings" description="Workspace details shown on invoices and emails." />
      <FormSection title="Workspace" description="Your company name and the address customers reply to.">
        <form className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ws-name">Company name</FieldLabel>
              <Input id="ws-name" defaultValue="Acme Rentals" />
            </Field>
            <Field>
              <FieldLabel htmlFor="ws-email">Reply-to email</FieldLabel>
              <Input id="ws-email" type="email" defaultValue="hello@example.com" />
              <FieldDescription>Customers see this address when they reply to an email.</FieldDescription>
            </Field>
          </FieldGroup>
          <div className="flex justify-end border-t pt-4">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </FormSection>
    </PageContainer>
  )
}
