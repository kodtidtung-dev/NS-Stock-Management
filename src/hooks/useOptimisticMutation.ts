// src/hooks/useOptimisticMutation.ts
'use client'

import { useState, useCallback } from 'react'
import { clearCachePattern } from './useApiCache'

interface OptimisticMutationOptions<TData, TError = Error> {
  onSuccess?: (data: TData) => void
  onError?: (error: TError, rollbackData?: unknown) => void
  onSettled?: (data?: TData, error?: TError) => void
  invalidatePatterns?: string[] // Cache patterns to invalidate on success
}

interface OptimisticMutationResult<TVariables, TData> {
  mutate: (variables: TVariables, optimisticData?: unknown) => Promise<TData>
  isLoading: boolean
  error: Error | null
  reset: () => void
}

export function useOptimisticMutation<TVariables, TData, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: OptimisticMutationOptions<TData, TError> = {}
): OptimisticMutationResult<TVariables, TData> {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const {
    onSuccess,
    onError,
    onSettled,
    invalidatePatterns = []
  } = options

  const mutate = useCallback(async (
    variables: TVariables,
    optimisticData?: unknown
  ): Promise<TData> => {
    setIsLoading(true)
    setError(null)

    // Store rollback data for potential error recovery
    const rollbackData = optimisticData

    try {
      // Execute the mutation
      const result = await mutationFn(variables)

      // Invalidate related caches on success
      invalidatePatterns.forEach(pattern => {
        clearCachePattern(pattern)
      })

      // Call success callback
      onSuccess?.(result)
      onSettled?.(result, undefined)

      return result
    } catch (err) {
      const error = err as TError
      setError(err as Error)

      // Enhanced error handling with detailed logging
      console.error('Mutation failed:', {
        error: err,
        variables,
        rollbackData,
        timestamp: new Date().toISOString()
      })

      // Call error callback with rollback data
      onError?.(error, rollbackData)
      onSettled?.(undefined, error)

      // Don't throw if we have rollback data - let the UI handle gracefully
      if (rollbackData) {
        console.log('Rolling back to previous state due to error')
        return Promise.reject(err)
      }

      throw err
    } finally {
      setIsLoading(false)
    }
  }, [mutationFn, onSuccess, onError, onSettled, invalidatePatterns])

  const reset = useCallback(() => {
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    mutate,
    isLoading,
    error,
    reset,
  }
}