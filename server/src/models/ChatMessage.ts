import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * Job-scoped chat. Unlocked only after payment is confirmed.
 * System messages are non-editable and timestamped (job status, payment, etc.).
 */
const chatMessageSchema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' }, // null for system messages
    kind: { type: String, enum: ['text', 'system'], default: 'text' },
    body: { type: String, required: true },
    // Set when contact-detail sharing is blocked, for moderation/audit.
    redacted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type ChatMessageDoc = InferSchemaType<typeof chatMessageSchema> & { _id: string };
export const ChatMessage = model('ChatMessage', chatMessageSchema);
