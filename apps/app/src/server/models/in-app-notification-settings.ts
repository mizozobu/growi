import { Schema } from 'mongoose';

import { Prisma } from '~/generated/prisma/client';
import type { ISubscribeRule } from '~/interfaces/in-app-notification';
import { subscribeRuleNames } from '~/interfaces/in-app-notification';
import type { prisma } from '~/utils/prisma';

import { getOrCreateModel } from '../util/mongoose-utils';

// TODO: remove mongoose model and use `prisma db push` after all models are migrated to prisma.
// Until then, use mongoose to automatically create collections and indexes when connected.
const inAppNotificationSettingsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId },
  subscribeRules: [
    {
      name: { type: String, required: true, enum: subscribeRuleNames },
      isEnabled: { type: Boolean },
    },
  ],
});

getOrCreateModel('InAppNotificationSettings', inAppNotificationSettingsSchema);

export const extension = Prisma.defineExtension((client) => {
  return client.$extends({
    result: {
      inappnotificationsettings: {
        // for backward compatibility with mongoose
        _id: {
          needs: { id: true },
          compute(model) {
            return model.id;
          },
        },
        // for backward compatibility with mongoose
        __v: {
          needs: { v: true },
          compute(model) {
            return model.v;
          },
        },
      },
    },
    model: {
      inappnotificationsettings: {
        // No unique index on userId exists, so this is find-then-write, not an atomic upsert.
        async upsertSubscribeRules(
          userId: string,
          subscribeRules: ISubscribeRule[],
        ) {
          const context =
            Prisma.getExtensionContext<typeof prisma.inappnotificationsettings>(
              this,
            );
          const existing = await context.findFirst({ where: { userId } });
          if (existing == null) {
            return context.create({ data: { userId, subscribeRules } });
          }
          return context.update({
            where: { id: existing.id },
            data: { subscribeRules },
          });
        },
      },
    },
  });
});
