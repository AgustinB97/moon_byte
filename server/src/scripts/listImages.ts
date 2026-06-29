import 'dotenv/config'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

async function main() {
  console.log('[LIST] Buscando imágenes en moonbyte/products...\n')

  const result = await cloudinary.api.resources({
    type: 'upload',
    prefix: 'moonbyte/products',
    max_results: 50,
    resource_type: 'image',
  })

  if (result.resources.length === 0) {
    console.log('  ⚠ No hay imágenes en moonbyte/products todavía.')
    console.log('  Subí una vía el admin y volvé a correr este script.')
    process.exit(0)
  }

  console.log(`  ✓ ${result.resources.length} imagen(es) encontrada(s):\n`)

  result.resources.forEach((img: { public_id: string; width: number; height: number; format: string; bytes: number; secure_url: string }, i: number) => {
    const sizeMb = ((img.bytes ?? 0) / 1024 / 1024).toFixed(2)
    console.log(`  ${i + 1}. ${img.public_id}`)
    console.log(`     ${img.width}×${img.height} · ${img.format.toUpperCase()} · ${sizeMb} MB`)
    console.log(`     ${img.secure_url}`)
    console.log('')
  })

  const totalBytes = result.resources.reduce((sum: number, r: { bytes?: number }) => sum + (r.bytes ?? 0), 0)
  console.log(`  Total: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)

  process.exit(0)
}

main().catch((err) => {
  console.error('[LIST] Error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
