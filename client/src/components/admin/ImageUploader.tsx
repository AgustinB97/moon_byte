import { useRef, useState } from 'react'
import { Upload, Trash2, ImageIcon, Loader2 } from 'lucide-react'
import { uploadImage, validateImageFile, MAX_IMAGE_SIZE_MB } from '@/services/upload'
import { cn } from '@/utils'

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

interface UploadingFile {
  id: string
  preview: string
  progress: number
  error?: string
}

export function ImageUploader({ images, onChange, maxImages = 8 }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const canAddMore = images.length + uploading.length < maxImages

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files)
    const room = maxImages - images.length - uploading.length
    const toProcess = arr.slice(0, room)

    if (arr.length > room) {
      alert(`Solo podés subir ${maxImages} imágenes en total`)
    }

    for (const file of toProcess) {
      const validationError = validateImageFile(file)
      const id = `${file.name}-${Date.now()}-${Math.random()}`

      if (validationError) {
        setUploading((u) => [
          ...u,
          { id, preview: URL.createObjectURL(file), progress: 0, error: validationError },
        ])
        setTimeout(() => {
          setUploading((u) => u.filter((x) => x.id !== id))
        }, 4000)
        continue
      }

      const preview = URL.createObjectURL(file)
      setUploading((u) => [...u, { id, preview, progress: 0 }])

      try {
        const result = await uploadImage(file, (percent) => {
          setUploading((u) => u.map((x) => (x.id === id ? { ...x, progress: percent } : x)))
        })
        onChange([...images, result.url])
        setUploading((u) => u.filter((x) => x.id !== id))
        URL.revokeObjectURL(preview)
      } catch (err) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setUploading((u) =>
          u.map((x) => (x.id === id ? { ...x, error: msg ?? 'Error al subir' } : x))
        )
        setTimeout(() => {
          setUploading((u) => u.filter((x) => x.id !== id))
          URL.revokeObjectURL(preview)
        }, 4000)
      }
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files)
    }
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Existing images + uploading */}
      {(images.length > 0 || uploading.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((url, i) => (
            <div
              key={url}
              className="relative aspect-square border border-steel/20 bg-surface-dark overflow-hidden group"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-surface-dark/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => removeImage(i)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  aria-label="Eliminar imagen"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {i === 0 && (
                <span className="absolute top-1 left-1 font-mono text-[8px] uppercase tracking-widest text-gold bg-surface-dark/80 px-1.5 py-0.5">
                  Principal
                </span>
              )}
            </div>
          ))}

          {uploading.map((u) => (
            <div
              key={u.id}
              className="relative aspect-square border border-steel/20 bg-surface-dark overflow-hidden"
            >
              <img src={u.preview} alt="" className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-dark/70 p-2">
                {u.error ? (
                  <>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-red-400 text-center leading-tight">
                      Error
                    </span>
                    <span className="font-mono text-[8px] text-red-400/70 text-center mt-1 leading-tight">
                      {u.error}
                    </span>
                  </>
                ) : (
                  <>
                    <Loader2 size={16} className="text-gold animate-spin mb-2" />
                    <div className="w-full h-1 bg-steel/20">
                      <div
                        className="h-full bg-gold transition-all duration-200"
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-gold mt-1">{u.progress}%</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed cursor-pointer transition-all duration-200 px-4 py-6 flex flex-col items-center justify-center gap-2',
            isDragging
              ? 'border-gold bg-gold/5'
              : 'border-steel/20 hover:border-gold/40 hover:bg-surface-dark/30'
          )}
        >
          {isDragging ? (
            <Upload size={20} className="text-gold" />
          ) : (
            <ImageIcon size={20} className="text-steel" />
          )}
          <p className="font-mono text-[11px] uppercase tracking-widest text-ash/70">
            {isDragging ? 'Soltá para subir' : 'Click o arrastrá imágenes'}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-steel/40">
            JPG, PNG o WebP · Máx {MAX_IMAGE_SIZE_MB}MB · Hasta {maxImages} imágenes
          </p>
        </div>
      )}

      {!canAddMore && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel/40 text-center py-3 border border-steel/15">
          Límite de {maxImages} imágenes alcanzado
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files)
          e.target.value = '' // permite re-seleccionar mismo archivo
        }}
      />
    </div>
  )
}
