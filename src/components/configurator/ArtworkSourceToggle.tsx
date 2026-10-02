import { useId } from "react";

export type ArtworkSource = "upload" | "text";

const OPTIONS: { value: ArtworkSource; label: string }[] = [
  { value: "upload", label: "Upload logo" },
  { value: "text", label: "Type text" },
];

interface ArtworkSourceToggleProps {
  value: ArtworkSource;
  onChange: (value: ArtworkSource) => void;
}

/** Segmented control, built from real radio inputs so arrow keys and screen readers just work. */
export default function ArtworkSourceToggle({ value, onChange }: ArtworkSourceToggleProps) {
  const name = useId();
  return (
    <fieldset role="radiogroup" className="space-y-2">
      <legend className="text-sm font-medium mb-2">Artwork source</legend>
      <div className="inline-flex rounded-lg border border-input bg-background p-1">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className="cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
