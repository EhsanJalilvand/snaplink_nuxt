import { useState } from '#imports'

type EventCallback<T = unknown> = (payload: T) => void

interface EventRegistry {
  [event: string]: Set<EventCallback<any>>
}

export const useEvents = () => {
  const registry = useState<EventRegistry>('snaplink:event-registry', () => ({}))

  const on = <T = unknown>(event: string, callback: EventCallback<T>) => {
    if (!registry.value[event]) {
      registry.value[event] = new Set<EventCallback<T>>()
    }

    registry.value[event].add(callback as EventCallback<any>)

    return () => off(event, callback)
  }

  const once = <T = unknown>(event: string, callback: EventCallback<T>) => {
    const wrapper: EventCallback<T> = (payload) => {
      off(event, wrapper)
      callback(payload)
    }

    return on(event, wrapper)
  }

  const off = <T = unknown>(event: string, callback: EventCallback<T>) => {
    registry.value[event]?.delete(callback as EventCallback<any>)
    if (registry.value[event]?.size === 0) {
      delete registry.value[event]
    }
  }

  const emit = <T = unknown>(event: string, payload: T) => {
    registry.value[event]?.forEach((callback) => {
      try {
        callback(payload)
      } catch (error) {
        if (import.meta.dev) {
          console.error(`[useEvents] listener for "${event}" failed`, error)
        }
      }
    })
  }

  const clear = (event?: string) => {
    if (event) {
      delete registry.value[event]
    } else {
      Object.keys(registry.value).forEach((key) => delete registry.value[key])
    }
  }

  return {
    on,
    once,
    off,
    emit,
    clear,
  }
}
