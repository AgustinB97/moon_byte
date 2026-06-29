import 'dotenv/config'
import { uploadImage, deleteImage, isCloudinaryConfigured } from '../services/storage/cloudinary'

async function main() {
  console.log('[TEST] Probando conexión a Cloudinary...')

  if (!isCloudinaryConfigured()) {
    console.error('  ✗ Credenciales faltantes. Revisá el .env.')
    process.exit(1)
  }

  console.log(`[TEST] Cloud name: ${process.env.CLOUDINARY_CLOUD_NAME}`)
  console.log(`[TEST] API key: ${process.env.CLOUDINARY_API_KEY?.slice(0, 6)}...`)
  console.log('')

  // Generar un PNG mini de 1x1 negro como test
  const tinyPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ])

  try {
    console.log('[TEST] Subiendo imagen de prueba...')
    const uploaded = await uploadImage(tinyPng, 'moonbyte/tests')

    console.log('  ✓ Upload exitoso')
    console.log(`    URL: ${uploaded.url}`)
    console.log(`    PublicId: ${uploaded.publicId}`)
    console.log(`    Tamaño: ${uploaded.width}×${uploaded.height} (${uploaded.bytes} bytes)`)
    console.log('')

    console.log('[TEST] Limpiando — borrando imagen de prueba...')
    await deleteImage(uploaded.publicId)
    console.log('  ✓ Borrado exitoso')
    console.log('')

    console.log('  ════════════════════════════════════════')
    console.log('  ✓ Cloudinary configurado y funcionando')
    console.log('  ════════════════════════════════════════')
    process.exit(0)
  } catch (err) {
    console.log('')
    console.log('  ════════════════════════════════════════')
    console.log('  ✗ Cloudinary falló')
    console.log(`    ${err instanceof Error ? err.message : err}`)
    console.log('  ════════════════════════════════════════')
    process.exit(1)
  }
}

main()
