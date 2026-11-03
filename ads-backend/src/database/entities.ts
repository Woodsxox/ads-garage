import { RefreshToken } from '../auth/refresh-token.entity.js';
import { Campaign, ConnectedAccount } from '../integrations/integrations.entities.js';
import { LessonProgress, UserBadge } from '../learning/learning.entities.js';
import { BillingEventRecord } from '../plans/billing/billing-event.entity.js';
import { Subscription } from '../plans/subscription.entity.js';
import { Project } from '../projects/project.entity.js';
import { User } from '../users/user.entity.js';
import { AiUsage } from '../ai/ai-usage.entity.js';

/**
 * Every entity, in one list. The app and the migration CLI both read it, so a table cannot exist
 * in one and be missing from the other. Add new entities here.
 */
export const ENTITIES = [
  User,
  RefreshToken,
  Subscription,
  BillingEventRecord,
  Project,
  LessonProgress,
  UserBadge,
  ConnectedAccount,
  Campaign,
  AiUsage,
];
