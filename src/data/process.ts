/** "From Artwork to Your Dock." six-step B2B process (brief section 9). Titles only: do not over-explain. */
export const processSteps = [
  "Send your files",
  "Receive your quote",
  "Approve drawings",
  "We fabricate",
  "Quality control",
  "Crated & shipped",
] as const;

/** One real photo per step, same order as processSteps. */
export const processPhotos = [
  { src: "/images/project-olympus-layout.jpg", alt: "Artwork templates laid out for cutting in the workshop" },
  { src: "/images/pasted-image-1787683185061-7qvr07qi.jpeg", alt: "Installed illuminated lettering, the kind of job we quote" },
  { src: "/images/project-olympus-flat.jpg", alt: "Cut sign pieces laid on drawings for approval" },
  { src: "/images/production-hand-assembly.jpg", alt: "Technician assembling an illuminated letter at the Sunlite workshop" },
  { src: "/images/production-quality-control.jpg", alt: "Finished letters inspected before packing" },
  { src: "/images/production-ready-for-freight.jpg", alt: "Closed plywood shipping crate ready for freight" },
] as const;
