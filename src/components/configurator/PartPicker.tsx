// The uploaded drawing as a small picture: click its parts and say what they are (see partRoles.ts).
import { useMemo, useState } from "react";
import * as THREE from "three";
import { PART_ROLES, roleOf, type PartRole } from "./partRoles";

interface PartPickerProps {
  shapes: THREE.Shape[];
  roles: readonly PartRole[];
  onChange: (roles: PartRole[]) => void;
}

const path = (pts: THREE.Vector2[]) => (pts.length ? `M${pts.map((p) => `${p.x.toFixed(3)} ${(-p.y).toFixed(3)}`).join("L")}Z` : "");

export function PartPicker({ shapes, roles, onChange }: PartPickerProps) {
  const [picked, setPicked] = useState<number[]>([]);
  // Largest first underneath, so a letter drawn on a raceway can still be clicked.
  const drawn = useMemo(() => {
    const items = shapes.map((s, i) => {
      const { shape, holes } = s.extractPoints(8);
      const box = new THREE.Box2().setFromPoints(shape);
      const size = box.getSize(new THREE.Vector2());
      return { i, d: [path(shape), ...holes.map(path)].join(""), box, area: size.x * size.y };
    });
    const all = new THREE.Box2();
    for (const it of items) all.union(it.box);
    return { items: [...items].sort((a, b) => b.area - a.area), all };
  }, [shapes]);
  if (!shapes.length) return null;
  const size = drawn.all.getSize(new THREE.Vector2());
  const pad = Math.max(size.x, size.y) * 0.04;
  const viewBox = `${drawn.all.min.x - pad} ${-drawn.all.max.y - pad} ${size.x + 2 * pad} ${size.y + 2 * pad}`;
  const colour = (i: number) => PART_ROLES.find((r) => r.id === roleOf(roles, i))!.swatch;
  const toggle = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  const assign = (role: PartRole) => {
    const next = shapes.map((_, i) => (picked.includes(i) ? role : roleOf(roles, i)));
    onChange(next);
    setPicked([]);
  };
  return (
    <details className="rounded-md border border-border p-2 text-[12px]" data-testid="part-picker">
      <summary className="cursor-pointer select-none font-medium">Raceway, cabinet or vinyl in your drawing? Mark the parts</summary>
      <p className="mt-2 text-muted-foreground">Click one or more parts, then say what they are. Only letters are lit and counted.</p>
      <svg viewBox={viewBox} className="mt-2 h-auto max-h-48 w-full rounded bg-muted/40" role="group" aria-label="Parts of your drawing">
        {drawn.items.map((it) => (
          <path
            key={it.i}
            d={it.d}
            fillRule="evenodd"
            fill={colour(it.i)}
            fillOpacity={roleOf(roles, it.i) === "ignore" ? 0.35 : 0.9}
            stroke={picked.includes(it.i) ? "#2563eb" : "none"}
            strokeWidth={Math.max(size.x, size.y) * 0.012}
            role="button"
            tabIndex={0}
            aria-label={`Part ${it.i + 1}: ${PART_ROLES.find((r) => r.id === roleOf(roles, it.i))!.label}`}
            aria-pressed={picked.includes(it.i)}
            className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={() => toggle(it.i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle(it.i);
              }
            }}
          />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PART_ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            title={r.hint}
            disabled={!picked.length}
            onClick={() => assign(r.id)}
            className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 disabled:opacity-50 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: r.swatch }} aria-hidden />
            {r.label}
          </button>
        ))}
      </div>
      <p className="mt-1 text-muted-foreground" aria-live="polite">
        {picked.length ? `${picked.length} part${picked.length === 1 ? "" : "s"} selected` : "Nothing selected"}
      </p>
    </details>
  );
}
