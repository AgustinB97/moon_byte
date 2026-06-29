import { v2 as cloudinary } from 'cloudinary'

/**
 * Servicio de storage de imágenes vía Cloudinary.
 *
 * Cloudinary nos da:
 *  - CDN global con cache automático
 *  - Conversión a WebP/AVIF según el navegador
 *  - Resize responsive vía URL params (ej: w_400,h_400,c_fill)
 *  - Strip de EXIF automático (privacy)
 *
 * Uploads son server-side (signed). El API secret NUNCA va al frontend.
 *
 * Para obtener credenciales:
 *  https://cloudinary.com/users/register/free
 *  Dashboard → Product Environment Credentials
 */

let configured = false

function ensureConfigured(): void {
  if (configured) return

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      '[CLOUDINARY] Credenciales faltantes. Configurá CLOUDINARY_CLOUD_NAME, ' +
      'CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en el .env.'
    )
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  })

  configured = true
}

export interface UploadResult {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
}

/**
 * Sube una imagen a Cloudinary.
 *
 * Transformaciones aplicadas al subir (Cloudinary lo hace, no nosotros):
 *  - Resize máximo a 1600px de ancho
 *  - Calidad auto (target ~85)
 *  - Strip EXIF
 *  - Formato auto (se sirve como WebP/AVIF según el cliente)
 */
export async function uploadImage(
  buffer: Buffer,
  folder = 'moonbyte/products'
): Promise<UploadResult> {
  ensureConfigured()

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1600, height: 1600, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
        // Strip metadata (EXIF, GPS) por privacidad
        invalidate: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Upload sin respuesta'))
          return
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        })
      }
    )
    stream.end(buffer)
  })
}

/**
 * Sube un archivo genérico (imagen o PDF) a Cloudinary.
 * resource_type: 'auto' detecta el tipo automáticamente.
 */
export async function uploadFile(
  buffer: Buffer,
  folder = 'moonbyte/proofs'
): Promise<UploadResult> {
  ensureConfigured()

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto', invalidate: true },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Upload sin respuesta'))
          return
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width ?? 0,
          height: result.height ?? 0,
          format: result.format ?? '',
          bytes: result.bytes,
        })
      }
    )
    stream.end(buffer)
  })
}

/**
 * Elimina una imagen de Cloudinary.
 * Idempotente: si la imagen no existe, no tira error.
 */
export async function deleteImage(publicId: string): Promise<void> {
  ensureConfigured()
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
  } catch (err) {
    console.warn(`[CLOUDINARY] No se pudo borrar ${publicId}:`, err instanceof Error ? err.message : err)
  }
}

/**
 * Extrae el publicId de una URL de Cloudinary.
 * Retorna null si la URL no es de Cloudinary (ej: Unsplash de los seeds).
 *
 * Formato de URLs:
 *   https://res.cloudinary.com/CLOUD/image/upload/v123/folder/abc.webp
 *   https://res.cloudinary.com/CLOUD/image/upload/folder/abc.webp
 */
export function extractPublicId(url: string): string | null {
  if (!url.includes('res.cloudinary.com')) return null

  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|jpeg|png|webp|gif|avif)(?:\?.*)?$/i)
  return match ? match[1] : null
}

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}
