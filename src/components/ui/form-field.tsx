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
    <label className="grid gap-2 text-sm font-semibold text-zinc-700">
      <span>{label}</span>
      <input
        className="h-12 rounded-lg border border-zinc-200 bg-white/90 px-4 text-[15px] text-zinc-950 shadow-[0_1px_2px_rgb(20_20_17/0.04)] transition placeholder:text-zinc-400 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
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
    <label className="grid gap-2 text-sm font-semibold text-zinc-700">
      <span>{label}</span>
      <textarea
        className="min-h-32 rounded-lg border border-zinc-200 bg-white/90 px-4 py-3 text-[15px] leading-7 text-zinc-950 shadow-[0_1px_2px_rgb(20_20_17/0.04)] transition placeholder:text-zinc-400 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
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
    <label className="grid gap-2 text-sm font-semibold text-zinc-700">
      <span>{label}</span>
      <select
        className="h-12 rounded-lg border border-zinc-200 bg-white/90 px-4 text-[15px] text-zinc-950 shadow-[0_1px_2px_rgb(20_20_17/0.04)] transition focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
