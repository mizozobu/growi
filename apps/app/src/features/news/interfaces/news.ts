export type NewsTargetRole = 'all' | 'admin_only';

export interface INewsFeedConditions {
  targetRoles?: ('admin' | 'general')[];
  growiVersionRegExps?: string[];
}

export interface INewsFeedItemLocalized {
  ja_JP?: string;
  en_US?: string;
}

export interface INewsFeedItem {
  id: string;
  title: INewsFeedItemLocalized;
  body: INewsFeedItemLocalized;
  url: string;
  publishedAt: string;
  conditions?: INewsFeedConditions;
}

export interface INewsFeed {
  items: INewsFeedItem[];
}

export interface INewsItem {
  _id: string;
  externalId: string;
  title: INewsFeedItemLocalized;
  body: INewsFeedItemLocalized;
  url: string;
  publishedAt: Date;
  conditions?: INewsFeedConditions;
  fetchedAt: Date;
}

export interface INewsReadStatus {
  userId: string;
  newsItemId: string;
  readAt: Date;
}

export interface INewsItemWithStatus extends INewsItem {
  isRead: boolean;
}
