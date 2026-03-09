import type { Document, Model } from 'mongoose';
import { Schema } from 'mongoose';

import { getOrCreateModel } from '~/server/util/mongoose-utils';

import type {
  INewsFeedConditions,
  INewsFeedItemLocalized,
} from '../../interfaces/news';

const NEWS_ITEM_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

const localizedStringSchema = new Schema<INewsFeedItemLocalized>(
  {
    ja_JP: { type: String },
    en_US: { type: String },
  },
  { _id: false },
);

const conditionsSchema = new Schema<INewsFeedConditions>(
  {
    targetRoles: [{ type: String, enum: ['admin', 'general'] }],
    growiVersionRegExps: [{ type: String }],
  },
  { _id: false },
);

export interface NewsItemDocument extends Document {
  externalId: string;
  title: INewsFeedItemLocalized;
  body: INewsFeedItemLocalized;
  url: string;
  publishedAt: Date;
  conditions?: INewsFeedConditions;
  fetchedAt: Date;
}

export type NewsItemModel = Model<NewsItemDocument>;

const newsItemSchema = new Schema<NewsItemDocument, NewsItemModel>({
  externalId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: localizedStringSchema,
    required: true,
  },
  body: {
    type: localizedStringSchema,
  },
  url: {
    type: String,
    required: true,
  },
  publishedAt: {
    type: Date,
    required: true,
    index: true,
  },
  conditions: {
    type: conditionsSchema,
  },
  fetchedAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: NEWS_ITEM_TTL_SECONDS,
  },
});

export default getOrCreateModel<NewsItemDocument, NewsItemModel>(
  'NewsItem',
  newsItemSchema,
);
