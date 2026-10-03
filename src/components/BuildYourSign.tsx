import { ArrowLink } from "./CtaButton";
import { CONFIGURATOR_NAME, CONFIGURATOR_PATH } from "../lib/configuratorMeta";

interface BuildYourSignProps {
  /** Opens the configurator with this EdgeLuxe system preselected (data/configurations.ts id). */
  configId?: string;
  title?: string;
  text?: string;
  /** "band" is a full-width strip between page sections; "inline" is a bordered block inside a narrow column. */
  variant?: "band" | "inline";
}

/**
 * Small contextual module for product pages ("Not sure which configuration you need? Build Your Sign"). The
 * configurator is a sales tool, so it is offered where a visitor is choosing, not as a main product.
 */
export default function BuildYourSign({
  configId,
  title = "Not sure which configuration you need?",
  text = "Upload your logo or type your text and preview it as a 3D sign.",
  variant = "band",
}: BuildYourSignProps) {
  const link = <ArrowLink label={CONFIGURATOR_NAME} to={configId ? `${CONFIGURATOR_PATH}?config=${configId}` : CONFIGURATOR_PATH} className="shrink-0" />;
  const copy = (
    <div className="flex-1">
      <p className="font-heading text-xl md:text-2xl uppercase leading-tight">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{text}</p>
    </div>
  );

  if (variant === "inline") {
    return (
      <aside aria-label={CONFIGURATOR_NAME} className="border border-border bg-card/40 p-5 flex flex-col gap-3">
        <p className="mono-label text-primary">3D preview</p>
        {copy}
        {link}
      </aside>
    );
  }
  return (
    <aside aria-label={CONFIGURATOR_NAME} className="border-t border-border bg-card/40">
      <div className="max-w-7xl mx-auto px-6 py-6 md:py-7 flex flex-col md:flex-row md:items-center gap-3 md:gap-10">
        <p className="mono-label text-primary shrink-0 md:w-24">3D preview</p>
        {copy}
        {link}
      </div>
    </aside>
  );
}
