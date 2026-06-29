import api from './api'

export interface UploadResult {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  size: number
}

export async function uploadImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('image', file)

  const { data } = await api.post<UploadResult>('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })

  return data
}

export const MAX_IMAGE_SIZE_MB = 5
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Formato no soportado. Usá JPG, PNG o WebP.'
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `La imagen supera ${MAX_IMAGE_SIZE_MB}MB.`
  }
  return null
}

export const MAX_PROOF_SIZE_MB = 10
export const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf']

export function validateProofFile(file: File): string | null {
  if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
    return 'Formato no soportado. Usá JPG, PNG, WebP o PDF.'
  }
  if (file.size > MAX_PROOF_SIZE_MB * 1024 * 1024) {
    return `El archivo supera ${MAX_PROOF_SIZE_MB}MB.`
  }
  return null
}

export async function uploadProof(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post<UploadResult>('/upload/proof', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })

  return data
}
