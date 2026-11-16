/**
 * Contract of inappnotificationsettings.upsertSubscribeRules: one settings
 * document per user, created on first call and overwritten afterwards.
 */
import { ObjectId } from 'mongodb';

import { prisma } from '~/utils/prisma';

describe('inappnotificationsettings.upsertSubscribeRules', () => {
  const userId = new ObjectId().toString();

  afterEach(async () => {
    await prisma.inappnotificationsettings.deleteMany({ where: { userId } });
  });

  it('creates the settings when the user has none', async () => {
    const created = await prisma.inappnotificationsettings.upsertSubscribeRules(
      userId,
      [{ name: 'PAGE_CREATE', isEnabled: true }],
    );

    expect(created.userId).toBe(userId);
    expect(created.subscribeRules).toEqual([
      { name: 'PAGE_CREATE', isEnabled: true },
    ]);
  });

  it('overwrites the rules of the existing document instead of adding another', async () => {
    await prisma.inappnotificationsettings.upsertSubscribeRules(userId, [
      { name: 'PAGE_CREATE', isEnabled: true },
    ]);
    const updated = await prisma.inappnotificationsettings.upsertSubscribeRules(
      userId,
      [{ name: 'PAGE_CREATE', isEnabled: false }],
    );

    expect(updated.subscribeRules).toEqual([
      { name: 'PAGE_CREATE', isEnabled: false },
    ]);
    expect(
      await prisma.inappnotificationsettings.count({ where: { userId } }),
    ).toBe(1);
  });
});
