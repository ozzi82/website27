/** Line illustrations for the six "From Artwork to Your Dock" steps: one visual language (grey linework, orange accents). */
const label = [
  "Artwork files being sent",
  "A priced quote sheet",
  "A dimensioned drawing with an approval check",
  "A channel letter with LED modules",
  "A letter being inspected under a magnifier",
  "A wooden shipping crate on its way",
] as const;

const A = "text-primary"; // accent group
const L = "stroke-current fill-none"; // line group

const art = [
  // 1 Send your files
  <>
    <g className={L}>
      <path d="M40 22h34l16 16v54a4 4 0 0 1-4 4H44a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4Z" />
      <path d="M74 22v16h16" />
      <path d="M50 54h30M50 64h30M50 74h20" />
    </g>
    <g className={`${A} ${L}`} strokeLinecap="round" strokeLinejoin="round">
      <path d="M118 92V44M106 56l12-12 12 12" strokeWidth="3" />
      <path d="M104 100h28" strokeWidth="3" />
    </g>
    <g className="fill-current text-muted-foreground" fontFamily="inherit" fontSize="9" fontWeight="700">
      <text x="14" y="42">DXF</text>
      <text x="14" y="60">AI</text>
      <text x="14" y="78">PDF</text>
    </g>
  </>,
  // 2 Receive your quote
  <>
    <g className={L}>
      <rect x="40" y="16" width="64" height="82" rx="4" />
      <path d="M50 34h26M50 48h26M50 62h26M86 34h8M86 48h8M86 62h8" />
    </g>
    <g className={`${A} ${L}`} strokeLinecap="round">
      <path d="M50 78h44" strokeWidth="3" />
      <circle cx="112" cy="86" r="17" className="fill-card" strokeWidth="2.5" />
    </g>
    <text x="112" y="93" textAnchor="middle" className={`${A} fill-current`} fontSize="20" fontWeight="700" fontFamily="inherit">$</text>
    <text x="14" y="30" className="fill-current text-muted-foreground" fontSize="9" fontWeight="700" fontFamily="inherit">24 H</text>
  </>,
  // 3 Approve drawings
  <>
    <g className={L}>
      <rect x="26" y="14" width="108" height="86" rx="4" />
      <path d="M66 80 80 34l14 46M71 66h18" strokeWidth="2.5" strokeLinejoin="round" />
    </g>
    <g className={`${A} ${L}`} strokeLinecap="round">
      <path d="M62 90h36M62 86v8M98 86v8M44 34v46M40 34h8M40 80h8" />
    </g>
    <circle cx="118" cy="86" r="14" className={`${A} fill-current`} />
    <path d="m111 86 5 5 9-10" className="stroke-background fill-none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </>,
  // 4 We fabricate
  <>
    <g className={L} strokeLinejoin="round">
      <path d="M50 28h18v38h32v18H50Z" />
      <path d="M36 40l14-12M54 40l14-12M54 78l14-12M86 78l14-12M86 96l14-12M36 96l14-12" />
      <path d="M36 96V40h18v38h32v18Z" className="fill-card" />
    </g>
    <g className={`${A} fill-current`}>
      <circle cx="45" cy="52" r="2.8" /><circle cx="45" cy="66" r="2.8" /><circle cx="45" cy="86" r="2.8" /><circle cx="62" cy="87" r="2.8" /><circle cx="76" cy="87" r="2.8" />
    </g>
    <g className={`${A} ${L}`} strokeLinecap="round"><path d="M22 34l-8-6M20 56h-10M22 78l-8 6" /></g>
  </>,
  // 5 Quality control
  <>
    <g className={L} strokeLinejoin="round">
      <path d="M36 92V34h20v40h32v18Z" />
    </g>
    <g className={`${A} ${L}`} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="96" cy="54" r="24" className="fill-background/70" strokeWidth="3" />
      <path d="m114 72 18 20" strokeWidth="7" />
      <path d="m85 55 8 8 15-17" strokeWidth="4" />
    </g>
  </>,
  // 6 Crated & shipped
  <>
    <g className={L} strokeLinejoin="round">
      <path d="M26 50h58v48H26Z" className="fill-card" />
      <path d="M26 50l16-14h58l-16 14M100 36v48L84 98" />
      <path d="M26 64h58M26 80h58M26 50l58 48" strokeWidth="1.5" />
      <rect x="40" y="56" width="22" height="14" rx="1.5" className="fill-background" />
    </g>
    <g className={`${A} ${L}`} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
      <path d="M112 66h34M136 54l12 12-12 12" />
    </g>
  </>,
];

export default function ProcessIllustration({ step, className }: { step: number; className?: string }) {
  return (
    <svg viewBox="0 0 160 112" role="img" aria-label={label[step]} className={className} strokeWidth="2" strokeLinecap="round">
      <g className="text-muted-foreground">{art[step]}</g>
    </svg>
  );
}
