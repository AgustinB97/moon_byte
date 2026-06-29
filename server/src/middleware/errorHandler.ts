import * as Sentry from '@sentry/node'
import type { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import multer from 'multer'

export interface AppError extends Error {
  statusCode?: number
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  let statusCode = err.statusCode ?? 500
  let message = err.message ?? 'Error interno del servidor'

  // Mongoose validation errors → 400
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400
    message = Object.values(err.errors).map((e) => e.message).join('. ')
  }

  // Cast errors (ID inválido) → 400
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400
    message = `Valor inválido para ${err.path}`
  }

  // Multer errors → 400
  if (err instanceof multer.MulterError) {
    statusCode = 400
    if (err.code === 'LIMIT_FILE_SIZE') message = 'El archivo supera 5MB'
    else if (err.code === 'LIMIT_FILE_COUNT') message = 'Demasiados archivos'
    else message = err.message
  }

  // Duplicate key (unique index) → 409
  if ('code' in err && (err as { code: number }).code === 11000) {
    statusCode = 409
    const fields = Object.keys((err as { keyValue?: Record<string, unknown> }).keyValue ?? {})
    message = `Valor duplicado en: ${fields.join(', ')}`
  }

  // Reportar a Sentry solo errores no controlados (5xx)
  if (statusCode >= 500) {
    Sentry.captureException(err)
    console.error(`[ERROR ${statusCode}]`, err.message)
    if (process.env.NODE_ENV === 'development') console.error(err.stack)
  }

  res.status(statusCode).json({ message })
}
