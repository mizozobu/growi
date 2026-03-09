import { memo, useCallback, useEffect } from 'react';

import { useSWRxNewsUnreadCount } from '~/features/news/client/stores/news';
import { SidebarContentsType } from '~/interfaces/ui';
import { useGlobalSocket } from '~/states/socket-io';
import { useSWRxInAppNotificationStatus } from '~/stores/in-app-notification';

import { PrimaryItem, type PrimaryItemProps } from '../SidebarNav/PrimaryItem';

type PrimaryItemForNotificationProps = Omit<
  PrimaryItemProps,
  'onClick' | 'label' | 'iconName' | 'contents' | 'badgeContents'
>;

export const PrimaryItemForNotification = memo(
  (props: PrimaryItemForNotificationProps) => {
    const { sidebarMode, onHover } = props;

    const socket = useGlobalSocket();

    const { data: notificationCount, mutate: mutateNotificationCount } =
      useSWRxInAppNotificationStatus();
    const { data: newsUnreadCount } = useSWRxNewsUnreadCount();

    const totalUnreadCount = (notificationCount ?? 0) + (newsUnreadCount ?? 0);

    const badgeContents = totalUnreadCount > 0 ? totalUnreadCount : undefined;

    const itemHoverHandler = useCallback(
      (contents: SidebarContentsType) => {
        onHover?.(contents);
      },
      [onHover],
    );

    useEffect(() => {
      if (socket != null) {
        socket.on('notificationUpdated', () => {
          mutateNotificationCount();
        });

        // clean up
        return () => {
          socket.off('notificationUpdated');
        };
      }
    }, [mutateNotificationCount, socket]);

    return (
      <PrimaryItem
        sidebarMode={sidebarMode}
        contents={SidebarContentsType.NOTIFICATION}
        label="In-App Notification"
        iconName="notifications"
        badgeContents={badgeContents}
        onHover={itemHoverHandler}
      />
    );
  },
);
