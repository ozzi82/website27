/**
 * The fonts a visitor can set their sign text in. All are free Google Fonts under the SIL Open Font License,
 * bundled from the @fontsource packages (Latin subset, WOFF) so nothing is requested from Google at runtime.
 *
 * Only this small table is in the configurator's main chunk. The font files themselves are `?url` imports
 * behind dynamic `import()`s, so each ships as a hashed asset that is fetched only when text mode needs it.
 */
export interface TextFont {
  id: string;
  /** Name shown in the picker (and rendered in the font itself). */
  label: string;
  /** Private CSS family name for the picker previews, so it can never clash with the site's own fonts. */
  cssFamily: string;
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
    id: "playfair-display",
    label: "Playfair Display",
    cssFamily: "Sign Playfair Display",
    fileUrl: url(() => import("@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff?url")),
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
];

export const DEFAULT_FONT_ID = TEXT_FONTS[0].id;

export function findTextFont(id: string): TextFont | undefined {
  return TEXT_FONTS.find((f) => f.id === id);
}
