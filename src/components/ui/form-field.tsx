import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function TextField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-700">
      {label}
      <input
        className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-950 shadow-sm transition focus:border-zinc-950"
        {...props}
      />
    </label>
  );
}

export function TextAreaField({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-700">
      {label}
      <textarea
        className="min-h-28 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-950 shadow-sm transition focus:border-zinc-950"
        {...props}
      />
    </label>
  );
}

export function SelectField({
  children,
  label,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-700">
      {label}
      <select
        className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-950 shadow-sm transition focus:border-zinc-950"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
