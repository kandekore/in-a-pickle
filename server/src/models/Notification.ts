import { Schema, model, type InferSchemaType } from 'mongoose';

/** Channels the notification system can use (in-app mandatory; sms/email opt). */
export const CHANNELS = ['in_app', 'sms', 'email', 'push'] as const;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job' },

    type: { type: String, required: true }, // job_accepted | en_route | arrived | ...
    channel: { type: String, enum: CHANNELS, default: 'in_app' },
    title: String,
    body: String,

    read: { type: Boolean, default: false },
    // Delivery status for the admin notification log.
    status: { type: String, default: 'queued' }, // queued | sent | delivered | failed
  },
  { timestamps: true },
);

export type NotificationDoc = InferSchemaType<typeof notificationSchema> & { _id: string };
export const Notification = model('Notification', notificationSchema);
