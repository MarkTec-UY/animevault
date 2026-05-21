"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  notificationsAPI,
  type AnimeNotification,
  type NotificationsResponse,
} from "@/lib/api/notifications"

const NOTIFICATIONS_QUERY_KEY = ["me", "notifications", "dropdown"] as const

function markNotificationAsReadInCache(
  current: NotificationsResponse | undefined,
  notificationId: number,
): NotificationsResponse | undefined {
  if (!current) return current

  let unreadDelta = 0

  const data = current.data.map((notification) => {
    if (notification.id !== notificationId || notification.read_at) {
      return notification
    }

    unreadDelta = 1

    return {
      ...notification,
      read_at: new Date().toISOString(),
    }
  })

  if (unreadDelta === 0) {
    return current
  }

  return {
    ...current,
    data,
    meta: {
      ...current.meta,
      unread_count: Math.max(0, current.meta.unread_count - unreadDelta),
    },
  }
}

function markAllNotificationsAsReadInCache(
  current: NotificationsResponse | undefined,
): NotificationsResponse | undefined {
  if (!current) return current

  const timestamp = new Date().toISOString()

  return {
    ...current,
    data: current.data.map((notification) => ({
      ...notification,
      read_at: notification.read_at ?? timestamp,
    })),
    meta: {
      ...current.meta,
      unread_count: 0,
    },
  }
}

export function useNotifications() {
  const queryClient = useQueryClient()

  const query = useQuery<NotificationsResponse>({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () =>
      notificationsAPI.list({
        perPage: 20,
      }),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => notificationsAPI.markAsRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })

      const previous =
        queryClient.getQueryData<NotificationsResponse>(NOTIFICATIONS_QUERY_KEY)

      queryClient.setQueryData<NotificationsResponse | undefined>(
        NOTIFICATIONS_QUERY_KEY,
        (current) => markNotificationAsReadInCache(current, notificationId),
      )

      return { previous }
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previous)
      }
    },
    onSuccess: (notification) => {
      queryClient.setQueryData<NotificationsResponse | undefined>(
        NOTIFICATIONS_QUERY_KEY,
        (current) => {
          if (!current) return current

          return {
            ...current,
            data: current.data.map((item) =>
              item.id === notification.id ? notification : item,
            ),
          }
        },
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })

      const previous =
        queryClient.getQueryData<NotificationsResponse>(NOTIFICATIONS_QUERY_KEY)

      queryClient.setQueryData<NotificationsResponse | undefined>(
        NOTIFICATIONS_QUERY_KEY,
        (current) => markAllNotificationsAsReadInCache(current),
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
    },
  })

  return {
    notifications: query.data?.data ?? [],
    meta: query.data?.meta ?? null,
    unreadCount: query.data?.meta.unread_count ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    markAsRead: (notification: AnimeNotification) => {
      if (notification.read_at) return

      markAsReadMutation.mutate(notification.id)
    },
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  }
}
