import { Notification } from '../models/Notification.js';
import { logger } from '../utils/logger.js';

/**
 * Notifications system. In-app is mandatory and always persisted; SMS/email/
 * push are opt-in and currently logged stubs pending provider integration.
 *
 * TODO(platform): plug in SMS gateway + SMTP + web-push; template management
 * + delivery logs + retry/fallback live in the admin portal.
 */
type NotifyInput = {
  userId: string;
  jobId?: string;
  type: string; // job_accepted | en_route | arrived | completed | refund | ...
  title: string;
  body: string;
  channels?: Array<'in_app' | 'sms' | 'email' | 'push'>;
};

export async function notify(input: NotifyInput) {
  const channels = input.channels ?? ['in_app'];
  const created = [];
  for (const channel of channels) {
    const n = await Notification.create({
      user: input.userId,
      job: input.jobId,
      type: input.type,
      channel,
      title: input.title,
      body: input.body,
      status: channel === 'in_app' ? 'delivered' : 'queued',
    });
    if (channel !== 'in_app') {
      logger.info('Notification queued (stub channel)', { channel, type: input.type });
    }
    created.push(n);
  }
  return created;
}
