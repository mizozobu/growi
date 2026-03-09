import type { SWRResponse } from 'swr';
import useSWR from 'swr';

import { apiv3Get, apiv3Post } from '~/client/util/apiv3-client';

import type { INewsItemWithStatus } from '../../interfaces/news';

interface NewsListResponse {
  docs: INewsItemWithStatus[];
  totalDocs: number;
  hasNextPage: boolean;
}

export const useSWRxNews = (
  limit: number,
  offset?: number,
): SWRResponse<NewsListResponse, Error> => {
  return useSWR(['/news/list', limit, offset], ([endpoint]) =>
    apiv3Get(endpoint, { limit, offset }).then(
      (response) => response.data as NewsListResponse,
    ),
  );
};

export const useSWRxNewsUnreadCount = (): SWRResponse<number, Error> => {
  return useSWR('/news/unread-count', (endpoint) =>
    apiv3Get(endpoint).then((response) => response.data.count as number),
  );
};

export const markNewsAsRead = async (newsItemId: string): Promise<void> => {
  await apiv3Post('/news/mark-read', { newsItemId });
};
