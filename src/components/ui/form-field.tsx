import type {
  ChangeEvent,
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

export function FileUploadField({
  accept,
  files,
  label,
  multiple = true,
  onChange,
}: {
  accept?: string;
  files?: File | FileList | null;
  label: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
}) {
  const fileCount = !files ? 0 : "length" in files ? files.length : 1;

  return (
    <label className="grid gap-2 text-sm font-semibold text-zinc-700">
      <span>{label}</span>
      <span className="flex flex-col gap-3 rounded-lg border border-dashed border-zinc-300 bg-white/90 p-4 shadow-[0_1px_2px_rgb(20_20_17/0.04)] sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-medium text-zinc-500">
          {fileCount
            ? `${fileCount} Datei${fileCount === 1 ? "" : "en"} ausgewählt`
            : "Noch keine Datei ausgewählt"}
        </span>
        <span className="premium-button-secondary w-fit cursor-pointer rounded-lg px-4 py-2.5 text-sm font-black">
          Dateien auswählen
        </span>
      </span>
      <input
        accept={accept}
        className="sr-only"
        multiple={multiple}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.files)}
        type="file"
      />
    </label>
  );
}
