import { Helmet } from "react-helmet-async";

const BASE_URL = "https://www.urbanix360.com";

interface SeoProps {
  /** Título único de la página (idealmente < 60 caracteres). */
  title: string;
  /** Descripción única de la página (idealmente < 160 caracteres). */
  description: string;
  /** Ruta de la página, p. ej. "/mercado". Se usa para canonical y og:url. */
  path: string;
  /** Imagen social absoluta. Por defecto la del sitio. */
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  /** JSON-LD adicional para la ruta. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const Seo = ({
  title,
  description,
  path,
  image = `${BASE_URL}/og-image.png`,
  type = "website",
  noindex = false,
  jsonLd,
}: SeoProps) => {
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,follow" />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default Seo;
export { BASE_URL };
