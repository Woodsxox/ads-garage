"use client";

import type { ReactNode } from "react";
import { normalizeHex } from "@/lib/studio/color";

const INPUT =
  "w-full border border-white/15 bg-bay-floor px-2 py-1.5 font-body text-sm text-chalk placeholder:text-chalk/35";

export function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <Field label={label} htmlFor={id}>
      {multiline ? (
        <textarea id={id} rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={INPUT} />
      ) : (
        <input id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={INPUT} />
      )}
    </Field>
  );
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <input
        id={id}
        type="number"
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) return;
          onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)));
        }}
        className={INPUT}
      />
    </Field>
  );
}

export function SelectField<T extends string | number>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly { value: T; label: string; disabled?: boolean }[];
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          const match = options.find((o) => String(o.value) === raw);
          if (match) onChange(match.value);
        }}
        className={INPUT}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Color picker plus a hex box that commits on blur or Enter, so partial typing never breaks the design. */
export function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const hex = normalizeHex(value) ?? "#000000";
  const commit = (raw: string) => {
    const next = normalizeHex(raw);
    if (next && next !== hex) onChange(next);
  };
  return (
    <Field label={label} htmlFor={id}>
      <div className="flex gap-2">
        <input
          id={id}
          type="color"
          value={hex.toLowerCase()}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-[34px] w-11 shrink-0 border border-white/15 bg-bay-floor p-0.5"
        />
        <input
          key={hex}
          aria-label={`${label} hex value`}
          defaultValue={hex}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
          }}
          className={`${INPUT} font-mono uppercase`}
          maxLength={7}
        />
      </div>
    </Field>
  );
}
