import type { Request, Response } from 'express'
import { uploadImage, uploadFile, isCloudinaryConfigured } from '../services/storage/cloudinary'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf']

export async function uploadImageHandler(req: Request, res: Response): Promise<void> {
  if (!isCloudinaryConfigured()) {
    res.status(503).json({
      message: 'Upload no disponible. Configurá las credenciales de Cloudinary en el .env.',
    })
    return
  }

  if (!req.file) {
    res.status(400).json({ message: 'No se recibió archivo. Esperado en field "image".' })
    return
  }

  // Doble check del MIME type (multer ya hace uno pero defense-in-depth)
  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    res.status(400).json({
      message: 'Formato no soportado. Solo JPG, PNG o WebP.',
    })
    return
  }

  try {
    const result = await uploadImage(req.file.buffer, 'moonbyte/products')
    res.status(201).json({
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
    })
  } catch (err) {
    console.error('[UPLOAD] Error:', err instanceof Error ? err.message : err)
    res.status(500).json({ message: 'No pudimos procesar la imagen. Intentá de nuevo.' })
  }
}

export async function uploadProofHandler(req: Request, res: Response): Promise<void> {
  if (!isCloudinaryConfigured()) {
    res.status(503).json({ message: 'Upload no disponible. Configurá las credenciales de Cloudinary.' })
    return
  }

  if (!req.file) {
    res.status(400).json({ message: 'No se recibió archivo. Esperado en field "file".' })
    return
  }

  if (!ALLOWED_PROOF_TYPES.includes(req.file.mimetype)) {
    res.status(400).json({ message: 'Formato no soportado. Solo JPG, PNG, WebP o PDF.' })
    return
  }

  try {
    const result = await uploadFile(req.file.buffer, 'moonbyte/proofs')
    res.status(201).json({
      url: result.url,
      publicId: result.publicId,
      format: result.format,
      size: result.bytes,
    })
  } catch (err) {
    console.error('[UPLOAD PROOF] Error:', err instanceof Error ? err.message : err)
    res.status(500).json({ message: 'No pudimos procesar el archivo. Intentá de nuevo.' })
  }
}
