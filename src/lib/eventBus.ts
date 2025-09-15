// src/lib/eventBus.ts
// Simple event bus for cross-component communication

type EventCallback = (data?: unknown) => void

class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map()

  // Subscribe to an event
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }

    this.events.get(event)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.events.get(event)?.delete(callback)
      if (this.events.get(event)?.size === 0) {
        this.events.delete(event)
      }
    }
  }

  // Emit an event
  emit(event: string, data?: unknown): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error)
        }
      })
    }
  }

  // Subscribe once (auto-unsubscribe after first call)
  once(event: string, callback: EventCallback): () => void {
    const unsubscribe = this.on(event, (data) => {
      callback(data)
      unsubscribe()
    })
    return unsubscribe
  }

  // Clear all listeners for an event
  off(event: string): void {
    this.events.delete(event)
  }

  // Clear all listeners
  clear(): void {
    this.events.clear()
  }
}

// Global event bus instance
export const eventBus = new EventBus()

// Product-specific events
export const PRODUCT_EVENTS = {
  CREATED: 'product:created',
  UPDATED: 'product:updated',
  DELETED: 'product:deleted',
  STOCK_UPDATED: 'product:stock-updated',
} as const

// Dashboard events
export const DASHBOARD_EVENTS = {
  REFRESH: 'dashboard:refresh',
  DATA_CHANGED: 'dashboard:data-changed',
} as const

