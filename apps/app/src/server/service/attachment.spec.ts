import { mock } from 'vitest-mock-extended';

import { prisma } from '~/utils/prisma';

import type Crowi from '../crowi';
import { AttachmentService } from './attachment';

type AttachmentsPort = Pick<
  (typeof prisma)['attachments'],
  'findUnique' | 'delete'
>;

// The real prisma client connects to a DB unavailable in unit tests; mock the
// boundary so findUnique/delete are controllable, type-safe mocks.
vi.mock('~/utils/prisma', () => ({
  prisma: {
    attachments: mock<AttachmentsPort>(),
  },
}));

const mockFindUnique = vi.mocked(prisma.attachments.findUnique);
const mockDelete = vi.mocked(prisma.attachments.delete);

// Locks down two contracts of removeAttachment:
// 1. Missing metadata doc is a no-op (the bulk-export cleanup cron relies on
//    this to self-heal zombie job records without throwing).
// 2. A genuine file-store failure propagates, so callers like the attachment
//    delete API surface it instead of dropping the metadata doc and stranding
//    an orphan blob.
describe('AttachmentService.removeAttachment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should resolve without throwing when the attachment is already gone', async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    const deleteFile = vi.fn();
    const crowi = mock<Crowi>({
      fileUploadService: { deleteFile },
    });
    const service = new AttachmentService(crowi);

    await expect(
      service.removeAttachment('this-id-does-not-exist'),
    ).resolves.toBeUndefined();

    expect(deleteFile).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  test('should propagate the error and not drop the metadata doc when the file store fails', async () => {
    mockFindUnique.mockResolvedValueOnce(
      mock<Awaited<ReturnType<typeof prisma.attachments.findUnique>>>({
        id: 'some-id',
      }),
    );
    const deleteFile = vi
      .fn()
      .mockRejectedValue(new Error('S3 is temporarily unavailable'));
    const crowi = mock<Crowi>({
      fileUploadService: { deleteFile },
    });
    const service = new AttachmentService(crowi);
    service.detachHandlers = [];

    await expect(service.removeAttachment('some-id')).rejects.toThrow(
      'S3 is temporarily unavailable',
    );

    expect(deleteFile).toHaveBeenCalledTimes(1);
    // metadata doc must survive so the blob stays referenceable for retry
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
