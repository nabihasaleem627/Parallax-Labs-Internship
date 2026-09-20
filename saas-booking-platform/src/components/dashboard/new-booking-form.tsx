"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { bookingSchema } from "@/lib/validation/schemas";
import { flattenFieldErrors } from "@/lib/api-client";
import type { FieldErrors } from "@/lib/api";

export function NewBookingForm({ onCreated }: { onCreated?: () => void }) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const form = new FormData(event.currentTarget);
    const parsed = bookingSchema.safeParse({
      title: form.get("title"),
      notes: form.get("notes"),
      startsAt: form.get("startsAt"),
      endsAt: form.get("endsAt"),
      status: form.get("status"),
    });

    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]))
      );
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await response.json().catch(() => null)) as {
        error?: string;
        fieldErrors?: FieldErrors;
      } | null;
      if (!response.ok) {
        setServerError(json?.error ?? "Something went wrong. Please try again.");
        setFieldErrors(flattenFieldErrors(json?.fieldErrors));
        return;
      }
      event.currentTarget.reset();
      router.refresh();
      onCreated?.();
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && <Alert tone="error">{serverError}</Alert>}
      <Input
        label="Title"
        name="title"
        placeholder="Client strategy workshop"
        error={fieldErrors.title}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Starts at"
          name="startsAt"
          type="datetime-local"
          error={fieldErrors.startsAt}
        />
        <Input
          label="Ends at"
          name="endsAt"
          type="datetime-local"
          error={fieldErrors.endsAt}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Status" name="status" defaultValue="PENDING" error={fieldErrors.status}>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
        </Select>
      </div>
      <Textarea
        label="Notes (optional)"
        name="notes"
        placeholder="Agenda, location, links…"
        rows={3}
        error={fieldErrors.notes}
      />
      <Button type="submit" loading={loading} className="w-full">
        {loading ? "Creating…" : "Create booking"}
      </Button>
    </form>
  );
}
