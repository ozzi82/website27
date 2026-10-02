import { useId, type ReactNode } from "react";

export interface SegmentOption<T extends string | number> {
  value: T;
  /** What is drawn in the segment. */
  label: ReactNode;
  /** Accessible name when it should differ from the visible label. */
  ariaLabel?: string;
  title?: string;
}

interface SegmentedControlProps<T extends string | number> {
  /** Accessible name of the group. */
  label: string;
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Stretch the segments to fill the row (equal widths). */
  fill?: boolean;
  className?: string;
}

/**
 * A segmented control built from real radio inputs, so arrow keys, focus and screen readers work
 * natively. The selected segment is highlighted; the radio itself is visually hidden.
 */
export default function SegmentedControl<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled = false,
  fill = false,
  className = "",
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex flex-wrap gap-0.5 rounded-lg border border-input bg-background p-0.5 ${className}`}
    >
      {options.map((o) => (
        <label
          key={String(o.value)}
          title={o.title}
          className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:disabled]:cursor-default has-[:disabled]:opacity-80 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-primary ${
            fill ? "flex-1" : ""
          }`}
        >
          <input
            type="radio"
            name={name}
            value={String(o.value)}
            aria-label={o.ariaLabel}
            checked={value === o.value}
            disabled={disabled}
            onChange={() => onChange(o.value)}
            className="sr-only"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
