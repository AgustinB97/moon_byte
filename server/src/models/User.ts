import { Schema, model, type HydratedDocument, type Model } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser {
  name: string
  email: string
  password: string
  role: 'user' | 'admin'

  // Email verification
  emailVerified: boolean
  verificationToken?: string
  verificationExpires?: Date

  // Password reset
  passwordResetToken?: string
  passwordResetExpires?: Date

  // 2FA (solo admins)
  twoFactorSecret?: string
  twoFactorEnabled: boolean
  twoFactorBackupCodes?: string[]

  createdAt: Date
  updatedAt: Date
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>
type UserModel = Model<IUser, Record<string, never>, IUserMethods>

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[\w.+-]+@([\w-]+\.)+[\w-]{2,}$/, 'Email inválido'],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false, index: true },
    verificationExpires: { type: Date, select: false },

    passwordResetToken: { type: String, select: false, index: true },
    passwordResetExpires: { type: Date, select: false },

    twoFactorSecret: { type: String, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorBackupCodes: { type: [String], select: false },
  },
  { timestamps: true }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password)
}

export const User = model<IUser, UserModel>('User', userSchema)
