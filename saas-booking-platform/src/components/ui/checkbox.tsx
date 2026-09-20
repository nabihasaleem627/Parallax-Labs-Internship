"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  error?: string;
}

export function Checkbox({ label, error, id, ...rest }: CheckboxProps) {
  const autoId = useId();
  const checkboxId = id ?? autoId;
  const errorId = `${checkboxId}-error`;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={checkboxId}
        className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-600"
      >
        <input
          id={checkboxId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 accent-indigo-600 focus:ring-indigo-500"
          {...rest}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={errorId} className="pl-6 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
