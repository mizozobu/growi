import mongoose from 'mongoose';

import { AttachmentType } from '~/server/interfaces/attachment';
// imported for its side effect of registering the Attachment schema
import '~/server/models/attachment';
import {
  getModelSafely,
  getMongoUri,
  mongoOptions,
} from '~/server/util/mongoose-utils';
import loggerFactory from '~/utils/logger';

const logger = loggerFactory(
  'growi:migrate:add-attachment-type-to-existing-attachments',
);

export async function up(db) {
  logger.info('Apply migration');
  await mongoose.connect(getMongoUri(), mongoOptions);

  // Add attachmentType for wiki page
  // Filter pages where "attachmentType" doesn't exist and "page" is not null
  const operationsForWikiPage = {
    updateMany: {
      filter: { page: { $ne: null }, attachmentType: { $exists: false } },
      update: { $set: { attachmentType: AttachmentType.WIKI_PAGE } },
    },
  };

  // Add attachmentType for profile image
  // Filter pages where "attachmentType" doesn't exist and "page" is null
  const operationsForProfileImage = {
    updateMany: {
      filter: { page: { $eq: null }, attachmentType: { $exists: false } },
      update: { $set: { attachmentType: AttachmentType.PROFILE_IMAGE } },
    },
  };
  const Attachment = getModelSafely('Attachment');
  await Attachment.bulkWrite([
    operationsForWikiPage,
    operationsForProfileImage,
  ]);

  logger.info('Migration has successfully applied');
}

export async function down(db) {
  // No rollback
}
