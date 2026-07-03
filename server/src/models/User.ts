import { Schema, model, type InferSchemaType } from 'mongoose';

/** Roles drive RBAC across every protected endpoint. */
export const ROLES = ['customer', 'provider', 'admin'] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'customer', index: true },
    smsOptIn: { type: Boolean, default: false },
    suspended: { type: Boolean, default: false },
    // 1:1 link to a Provider profile when role === 'provider'
    provider: { type: Schema.Types.ObjectId, ref: 'Provider' },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: string };
export const User = model('User', userSchema);
