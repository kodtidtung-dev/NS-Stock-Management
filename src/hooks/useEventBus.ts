'use client'

import { useEffect } from 'react'
import { eventBus } from '@/lib/eventBus'

type EventCallback = (data?: unknown) => void

export function useEventBus(event: string, callback: EventCallback, deps: React.DependencyList = []) {
  useEffect(() => {
    const unsubscribe = eventBus.on(event, callback)
    return unsubscribe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, callback, ...deps])
}