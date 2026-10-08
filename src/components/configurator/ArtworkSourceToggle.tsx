import { ImageUp, Type } from "lucide-react";
import SegmentedControl from "./SegmentedControl";

export type ArtworkSource = "upload" | "text";

interface ArtworkSourceToggleProps {
  value: ArtworkSource;
  onChange: (value: ArtworkSource) => void;
}

/** "Upload logo" | "Type text" as a segmented control (real radio inputs, so arrow keys and screen readers just work). */
export default function ArtworkSourceToggle({ value, onChange }: ArtworkSourceToggleProps) {
  return (
    <SegmentedControl<ArtworkSource>
      label="Artwork source"
      value={value}
      onChange={onChange}
      fill
      options={[
        { value: "text", label: (<><Type aria-hidden="true" className="h-4 w-4" />Type text</>) },
        { value: "upload", label: (<><ImageUp aria-hidden="true" className="h-4 w-4" />Upload logo</>) },
      ]}
      className="w-full rounded-xl bg-card p-1 [&_label]:gap-2 [&_label]:rounded-lg [&_label]:py-2.5 [&_label]:text-sm [&_label]:font-semibold"
    />
  );
}
