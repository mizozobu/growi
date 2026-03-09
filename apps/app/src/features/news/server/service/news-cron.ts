import type Crowi from '~/server/crowi';
import { configManager } from '~/server/service/config-manager';
import CronService from '~/server/service/cron';
import axios from '~/utils/axios';
import { getGrowiVersion } from '~/utils/growi-version';
import loggerFactory from '~/utils/logger';

import type { INewsFeed, INewsFeedItem } from '../../interfaces/news';
import NewsItem from '../models/news-item';

const logger = loggerFactory('growi:service:news-cron');

class NewsCronService extends CronService {
  crowi: Crowi;

  constructor(crowi: Crowi) {
    super();
    this.crowi = crowi;
  }

  override getCronSchedule(): string {
    return configManager.getConfig('app:newsCronSchedule');
  }

  override async executeJob(): Promise<void> {
    const feedUrl = configManager.getConfig('app:newsFeedUrl');
    if (feedUrl == null || feedUrl === '') {
      logger.debug('News feed URL is not configured. Skipping.');
      return;
    }

    // Random sleep to distribute requests across GROWI instances
    const maxHours = configManager.getConfig(
      'app:newsCronMaxHoursUntilRequest',
    );
    const sleepMs = Math.floor(Math.random() * maxHours * 60 * 60 * 1000);
    logger.debug(
      `Sleeping ${Math.round(sleepMs / 1000)}s before fetching news`,
    );
    await new Promise<void>((resolve) => {
      setTimeout(resolve, sleepMs);
    });

    await this.fetchAndStoreNews(feedUrl);
  }

  private async fetchAndStoreNews(feedUrl: string): Promise<void> {
    let feed: INewsFeed;
    try {
      const response = await axios.get<INewsFeed>(feedUrl, { timeout: 30000 });
      feed = response.data;
    } catch (err) {
      logger.warn('Failed to fetch news feed:', err);
      return;
    }

    if (feed.items == null || !Array.isArray(feed.items)) {
      logger.warn('Invalid news feed format: missing items array');
      return;
    }

    const growiVersion = getGrowiVersion();
    const filteredItems = feed.items.filter((item) =>
      this.matchesVersionCondition(item, growiVersion),
    );

    const now = new Date();
    const bulkOps = filteredItems.map((item) => ({
      updateOne: {
        filter: { externalId: item.id },
        update: {
          $set: {
            title: item.title,
            body: item.body,
            url: item.url,
            publishedAt: new Date(item.publishedAt),
            conditions: item.conditions,
            fetchedAt: now,
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      try {
        await NewsItem.bulkWrite(bulkOps);
        logger.info(`Upserted ${bulkOps.length} news items`);
      } catch (err) {
        logger.error('Failed to upsert news items:', err);
      }
    }

    // Remove items no longer in the feed
    const currentExternalIds = filteredItems.map((item) => item.id);
    if (currentExternalIds.length > 0) {
      try {
        const result = await NewsItem.deleteMany({
          externalId: { $nin: currentExternalIds },
        });
        if (result.deletedCount > 0) {
          logger.info(`Deleted ${result.deletedCount} old news items`);
        }
      } catch (err) {
        logger.error('Failed to delete old news items:', err);
      }
    }
  }

  private matchesVersionCondition(
    item: INewsFeedItem,
    growiVersion: string,
  ): boolean {
    const regExps = item.conditions?.growiVersionRegExps;
    if (regExps == null || regExps.length === 0) {
      return true;
    }
    return regExps.some((pattern) => {
      try {
        return new RegExp(pattern).test(growiVersion);
      } catch {
        logger.warn(`Invalid version regex: ${pattern}`);
        return false;
      }
    });
  }
}

export let newsCronService: NewsCronService | undefined;

export default function instanciate(crowi: Crowi): void {
  newsCronService = new NewsCronService(crowi);
}
