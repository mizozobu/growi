import type { FC } from 'react';
import { useTranslation } from 'next-i18next';

import {
  markNewsAsRead,
  useSWRxNews,
  useSWRxNewsUnreadCount,
} from '../stores/news';
import { NewsItemComponent } from './NewsItem';

export const NewsTabContent: FC = () => {
  const { t } = useTranslation('commons');
  const { data: newsData, mutate: mutateNews } = useSWRxNews(20);
  const { mutate: mutateUnreadCount } = useSWRxNewsUnreadCount();

  const handleMarkRead = async (newsItemId: string) => {
    await markNewsAsRead(newsItemId);
    mutateNews();
    mutateUnreadCount();
  };

  if (newsData == null || newsData.docs.length === 0) {
    return (
      <div className="text-muted text-center py-4">{t('news.no_news')}</div>
    );
  }

  return (
    <div className="list-group list-group-flush">
      {newsData.docs.map((item) => (
        <NewsItemComponent
          key={item._id}
          newsItem={item}
          onMarkRead={handleMarkRead}
        />
      ))}
    </div>
  );
};
