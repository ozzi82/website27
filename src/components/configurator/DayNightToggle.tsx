import { Moon, Sun } from "lucide-react";
import SegmentedControl from "./SegmentedControl";
import type { DayNight } from "./types";

interface DayNightToggleProps {
  value: DayNight;
  onChange: (value: DayNight) => void;
}

/** Day | Night segmented toggle with sun and moon icons (the scene fades between the two over about a second). */
export default function DayNightToggle({ value, onChange }: DayNightToggleProps) {
  return (
    <SegmentedControl<DayNight>
      label="Day or night"
      value={value}
      onChange={onChange}
      fill
      options={[
        { value: "day", label: (<><Sun aria-hidden="true" className="h-4 w-4" />Day</>) },
        { value: "night", label: (<><Moon aria-hidden="true" className="h-4 w-4" />Night</>) },
      ]}
      className="w-full [&_label]:py-1.5 [&_label]:text-sm"
    />
  );
}
