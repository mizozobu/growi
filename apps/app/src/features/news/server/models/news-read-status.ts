import type { Document, Model, Types } from 'mongoose';
import { Schema } from 'mongoose';

import { getOrCreateModel } from '~/server/util/mongoose-utils';

export interface NewsReadStatusDocument extends Document {
  userId: Types.ObjectId;
  newsItemId: Types.ObjectId;
  readAt: Date;
}

export type NewsReadStatusModel = Model<NewsReadStatusDocument>;

const newsReadStatusSchema = new Schema<
  NewsReadStatusDocument,
  NewsReadStatusModel
>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  newsItemId: {
    type: Schema.Types.ObjectId,
    ref: 'NewsItem',
    required: true,
  },
  readAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

newsReadStatusSchema.index({ userId: 1, newsItemId: 1 }, { unique: true });

export default getOrCreateModel<NewsReadStatusDocument, NewsReadStatusModel>(
  'NewsReadStatus',
  newsReadStatusSchema,
);
