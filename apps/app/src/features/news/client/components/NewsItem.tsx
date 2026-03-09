import type { FC } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'next-i18next';

import type {
  INewsFeedItemLocalized,
  INewsItemWithStatus,
} from '../../interfaces/news';

interface Props {
  newsItem: INewsItemWithStatus;
  onMarkRead?: (newsItemId: string) => void;
}

const getLocalizedText = (
  localized: INewsFeedItemLocalized | undefined,
  lang: string,
): string => {
  if (localized == null) return '';
  const langKey = lang as keyof INewsFeedItemLocalized;
  return localized[langKey] ?? localized.en_US ?? localized.ja_JP ?? '';
};

export const NewsItemComponent: FC<Props> = ({ newsItem, onMarkRead }) => {
  const { i18n } = useTranslation();

  const title = getLocalizedText(newsItem.title, i18n.language);
  const body = getLocalizedText(newsItem.body, i18n.language);
  const publishedDate = format(new Date(newsItem.publishedAt), 'yyyy/MM/dd');

  const handleClick = () => {
    if (!newsItem.isRead) {
      onMarkRead?.(newsItem._id);
    }
    if (newsItem.url) {
      window.open(newsItem.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      type="button"
      className="list-group-item list-group-item-action border-0 text-start"
      onClick={handleClick}
    >
      <div className="d-flex align-items-center">
        <span
          className={`${!newsItem.isRead ? 'grw-unopend-notification' : 'ms-2'} rounded-circle me-3`}
        />
        <span className="material-symbols-outlined me-2 text-info">
          campaign
        </span>
        <div className="flex-grow-1 overflow-hidden">
          <div className="fw-bold text-truncate">{title}</div>
          {body && <div className="text-muted small text-truncate">{body}</div>}
          <small className="text-muted">{publishedDate}</small>
        </div>
      </div>
    </button>
  );
};
