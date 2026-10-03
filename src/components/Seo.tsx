import { Helmet } from "react-helmet-async";
import { SITE_NAME, absoluteUrl, DEFAULT_OG_IMAGE } from "@project/lib/seo";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  /** Use `title` verbatim as the <title> (no " | Sunlite Signs" suffix), for titles the owner specified exactly. */
  exactTitle?: boolean;
  jsonLd?: object | object[];
}

export default function Seo({ title, description, path, image = DEFAULT_OG_IMAGE, noindex, exactTitle, jsonLd }: SeoProps) {
  const url = absoluteUrl(path);
  const fullTitle = exactTitle || title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const jsonLdList = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLdList.map((entry, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
}
