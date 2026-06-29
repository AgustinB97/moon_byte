import type { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'

export function handleValidation(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({
      message: 'Datos inválidos',
      errors: errors.array().map((e) => ({
        field: 'path' in e ? e.path : 'unknown',
        msg: e.msg,
      })),
    })
    return
  }
  next()
}
