import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'MoonByte — PC Hardware'
const DEFAULT_DESC = 'PCs armadas y componentes de hardware para el mercado argentino. Procesadores, placas de video, memorias y más.'
const DEFAULT_IMAGE = '/og-default.jpg'  // colocar en /public

interface MetaProps {
  title?: string           // Se agrega como "Título | MoonByte"
  description?: string
  image?: string           // URL absoluta o relativa
  noIndex?: boolean        // Para páginas de admin/checkout
  canonical?: string
}

export function Meta({ title, description, image, noIndex, canonical }: MetaProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const desc = description ?? DEFAULT_DESC
  const img = image ?? DEFAULT_IMAGE
  const canonicalUrl = canonical ?? (typeof window !== 'undefined' ? window.location.href : '')

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image"       content={img} />
      <meta property="og:type"        content="website" />
      <meta property="og:site_name"   content={SITE_NAME} />
      {canonical && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image"       content={img} />
    </Helmet>
  )
}
