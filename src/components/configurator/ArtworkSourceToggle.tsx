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
        { value: "upload", label: (<><ImageUp aria-hidden="true" className="h-5 w-5" />Upload logo</>) },
        { value: "text", label: (<><Type aria-hidden="true" className="h-5 w-5" />Type text</>) },
      ]}
      className="w-full border-2 border-primary [&_label]:gap-2 [&_label]:py-2.5 [&_label]:text-sm [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wide"
    />
  );
}
