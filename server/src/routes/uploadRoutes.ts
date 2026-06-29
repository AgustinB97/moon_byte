import { Router } from 'express'
import multer from 'multer'
import { uploadImageHandler, uploadProofHandler } from '../controllers/uploadController'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Solo JPG, PNG o WebP'))
  },
})

const proofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf']
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Solo JPG, PNG, WebP o PDF'))
  },
})

router.post('/image', requireAuth, requireAdmin, upload.single('image'), uploadImageHandler)
router.post('/proof', requireAuth, proofUpload.single('file'), uploadProofHandler)

export default router
