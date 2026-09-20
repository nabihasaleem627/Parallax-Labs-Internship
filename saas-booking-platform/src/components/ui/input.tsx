"use client";

import {
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/format";

const fieldClasses = (hasError: boolean) =>
  cn(
    "w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2",
    hasError
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
  );

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(fieldClasses(Boolean(error)), "h-10", className)}
        {...rest}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={errorId} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Select({ label, error, hint, className, id, children, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const errorId = `${selectId}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(fieldClasses(Boolean(error)), "h-10", className)}
        {...rest}
      >
        {children}
      </select>
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={errorId} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...rest }: TextareaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const errorId = `${textareaId}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(fieldClasses(Boolean(error)), "min-h-20 py-2", className)}
        {...rest}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={errorId} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
