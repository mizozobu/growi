import express from 'express';
import type { Types } from 'mongoose';

import type { CrowiRequest } from '~/interfaces/crowi-request';
import type Crowi from '~/server/crowi';
import { accessTokenParser } from '~/server/middlewares/access-token-parser';
import loginRequiredFactory from '~/server/middlewares/login-required';
import type { ApiV3Response } from '~/server/routes/apiv3/interfaces/apiv3-response';
import { configManager } from '~/server/service/config-manager';

import type { NewsTargetRole } from '../../../interfaces/news';
import NewsItem from '../../models/news-item';
import NewsReadStatus from '../../models/news-read-status';

const router = express.Router();

module.exports = (crowi: Crowi) => {
  const loginRequiredStrictly = loginRequiredFactory(crowi);

  router.get(
    '/list',
    accessTokenParser(),
    loginRequiredStrictly,
    async (req: CrowiRequest, res: ApiV3Response) => {
      // biome-ignore lint/style/noNonNullAssertion: user must be set by loginRequiredStrictly
      const user = req.user!;

      const targetRole = configManager.getConfig(
        'app:newsTargetRole',
      ) as NewsTargetRole;
      if (targetRole === 'admin_only' && !user.admin) {
        return res.apiv3({ docs: [], totalDocs: 0, hasNextPage: false });
      }

      const limit =
        req.query.limit != null
          ? parseInt(req.query.limit.toString(), 10) || 10
          : 10;
      const offset =
        req.query.offset != null
          ? parseInt(req.query.offset.toString(), 10)
          : 0;

      try {
        const userId = user._id as Types.ObjectId;

        const newsItems = await NewsItem.find()
          .sort({ publishedAt: -1 })
          .skip(offset)
          .limit(limit)
          .lean();

        const totalDocs = await NewsItem.countDocuments();

        const newsItemIds = newsItems.map((item) => item._id);
        const readStatuses = await NewsReadStatus.find({
          userId,
          newsItemId: { $in: newsItemIds },
        }).lean();

        const readNewsItemIds = new Set(
          readStatuses.map((s) => s.newsItemId.toString()),
        );

        // Filter by item-level conditions (targetRoles)
        const filteredItems = newsItems
          .filter((item) => {
            const roles = item.conditions?.targetRoles;
            if (roles == null || roles.length === 0) return true;
            return user.admin
              ? roles.includes('admin')
              : roles.includes('general');
          })
          .map((item) => ({
            ...item,
            isRead: readNewsItemIds.has(item._id.toString()),
          }));

        return res.apiv3({
          docs: filteredItems,
          totalDocs,
          hasNextPage: offset + limit < totalDocs,
        });
      } catch (err) {
        return res.apiv3Err(err);
      }
    },
  );

  router.get(
    '/unread-count',
    accessTokenParser(),
    loginRequiredStrictly,
    async (req: CrowiRequest, res: ApiV3Response) => {
      // biome-ignore lint/style/noNonNullAssertion: user must be set by loginRequiredStrictly
      const user = req.user!;

      const targetRole = configManager.getConfig(
        'app:newsTargetRole',
      ) as NewsTargetRole;
      if (targetRole === 'admin_only' && !user.admin) {
        return res.apiv3({ count: 0 });
      }

      try {
        const userId = user._id as Types.ObjectId;

        // Build condition filter query
        const conditionFilter = user.admin
          ? {} // admin sees everything
          : {
              $or: [
                { 'conditions.targetRoles': { $exists: false } },
                { 'conditions.targetRoles': { $size: 0 } },
                { 'conditions.targetRoles': 'general' },
              ],
            };

        const totalNews = await NewsItem.countDocuments(conditionFilter);
        const readCount = await NewsReadStatus.countDocuments({ userId });

        return res.apiv3({ count: Math.max(0, totalNews - readCount) });
      } catch (err) {
        return res.apiv3Err(err);
      }
    },
  );

  router.post(
    '/mark-read',
    accessTokenParser(),
    loginRequiredStrictly,
    async (req: CrowiRequest, res: ApiV3Response) => {
      // biome-ignore lint/style/noNonNullAssertion: user must be set by loginRequiredStrictly
      const user = req.user!;
      const { newsItemId } = req.body;

      if (newsItemId == null) {
        return res.apiv3Err('newsItemId is required', 400);
      }

      try {
        const userId = user._id as Types.ObjectId;

        await NewsReadStatus.updateOne(
          { userId, newsItemId },
          { $setOnInsert: { readAt: new Date() } },
          { upsert: true },
        );

        return res.apiv3({});
      } catch (err) {
        return res.apiv3Err(err);
      }
    },
  );

  return router;
};
