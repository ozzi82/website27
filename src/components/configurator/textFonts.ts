/**
 * The fonts a visitor can set their sign text in. All are free Google Fonts under the SIL Open Font License,
 * bundled from the @fontsource packages (Latin subset, WOFF) so nothing is requested from Google at runtime.
 *
 * Only this small table is in the configurator's main chunk. The font files themselves are `?url` imports
 * behind dynamic `import()`s, so each ships as a hashed asset that is fetched only when text mode needs it.
 */
import type { LightConfig } from "../../data/configurations";

export interface TextFont {
  id: string;
  /** Name shown in the picker (and rendered in the font itself). */
  label: string;
  /** Private CSS family name for the picker previews, so it can never clash with the site's own fonts. */
  cssFamily: string;
  /** Single-line (monoline) fonts made for the faux-neon LP 11-N: offered for that configuration only. */
  neonOnly?: boolean;
  /** Resolves to the hashed asset URL of the WOFF file. */
  fileUrl: () => Promise<string>;
}

const url = (load: () => Promise<{ default: string }>) => () => load().then((m) => m.default);

export const TEXT_FONTS: readonly TextFont[] = [
  {
    id: "montserrat",
    label: "Montserrat",
    cssFamily: "Sign Montserrat",
    fileUrl: url(() => import("@fontsource/montserrat/files/montserrat-latin-700-normal.woff?url")),
  },
  {
    id: "poppins",
    label: "Poppins",
    cssFamily: "Sign Poppins",
    fileUrl: url(() => import("@fontsource/poppins/files/poppins-latin-700-normal.woff?url")),
  },
  {
    id: "bebas-neue",
    label: "Bebas Neue",
    cssFamily: "Sign Bebas Neue",
    fileUrl: url(() => import("@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff?url")),
  },
  {
    id: "oswald",
    label: "Oswald",
    cssFamily: "Sign Oswald",
    fileUrl: url(() => import("@fontsource/oswald/files/oswald-latin-600-normal.woff?url")),
  },
  {
    id: "arvo",
    label: "Arvo",
    cssFamily: "Sign Arvo",
    fileUrl: url(() => import("@fontsource/arvo/files/arvo-latin-700-normal.woff?url")),
  },
  {
    id: "pacifico",
    label: "Pacifico",
    cssFamily: "Sign Pacifico",
    fileUrl: url(() => import("@fontsource/pacifico/files/pacifico-latin-400-normal.woff?url")),
  },
  {
    id: "lobster",
    label: "Lobster",
    cssFamily: "Sign Lobster",
    fileUrl: url(() => import("@fontsource/lobster/files/lobster-latin-400-normal.woff?url")),
  },
  {
    id: "neon-script",
    label: "Neon Script",
    cssFamily: "Sign Neon Script",
    neonOnly: true,
    fileUrl: url(() => import("@fontsource/sacramento/files/sacramento-latin-400-normal.woff?url")),
  },
  {
    id: "neon-line",
    label: "Neon Line",
    cssFamily: "Sign Neon Line",
    neonOnly: true,
    fileUrl: url(() => import("@fontsource/quicksand/files/quicksand-latin-700-normal.woff?url")),
  },
];

/** The fonts offered for a configuration: the single-line neon fonts only go with LP 11-N (the faux neon profile). */
export function fontsFor(config: Pick<LightConfig, "profile">): readonly TextFont[] {
  return TEXT_FONTS.filter((f) => !f.neonOnly || config.profile === "tube");
}

/** The font actually used: the visitor's pick if this configuration offers it, otherwise the default. */
export function usableFontId(config: Pick<LightConfig, "profile">, fontId: string): string {
  return fontsFor(config).some((f) => f.id === fontId) ? fontId : DEFAULT_FONT_ID;
}

export const DEFAULT_FONT_ID = TEXT_FONTS[0].id;

export function findTextFont(id: string): TextFont | undefined {
  return TEXT_FONTS.find((f) => f.id === id);
}
