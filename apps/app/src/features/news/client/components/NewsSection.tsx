import type { FC } from 'react';
import { useTranslation } from 'next-i18next';

import {
  markNewsAsRead,
  useSWRxNews,
  useSWRxNewsUnreadCount,
} from '../stores/news';
import { NewsItemComponent } from './NewsItem';

interface Props {
  limit?: number;
}

export const NewsSection: FC<Props> = ({ limit = 3 }) => {
  const { t } = useTranslation('commons');
  const { data: newsData, mutate: mutateNews } = useSWRxNews(limit);
  const { mutate: mutateUnreadCount } = useSWRxNewsUnreadCount();

  if (newsData == null || newsData.docs.length === 0) {
    return null;
  }

  const handleMarkRead = async (newsItemId: string) => {
    await markNewsAsRead(newsItemId);
    mutateNews();
    mutateUnreadCount();
  };

  return (
    <div className="grw-news-section">
      <div className="px-3 py-2 fw-bold small text-muted">
        {t('news.title')}
      </div>
      <div className="list-group list-group-flush">
        {newsData.docs.map((item) => (
          <NewsItemComponent
            key={item._id}
            newsItem={item}
            onMarkRead={handleMarkRead}
          />
        ))}
      </div>
    </div>
  );
};
