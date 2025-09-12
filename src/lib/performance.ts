// Performance monitoring utilities
export const measurePerformance = (name: string, fn: () => Promise<unknown> | unknown) => {
  const start = performance.now()
  
  const finish = () => {
    const end = performance.now()
    const duration = end - start
    
    // Log in development or if duration is concerning
    if (process.env.NODE_ENV === 'development' || duration > 1000) {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    }
    
    // Send to analytics in production (optional)
    if (process.env.NODE_ENV === 'production' && duration > 2000) {
      // You can integrate with your analytics service here
      console.warn(`🐌 Slow operation: ${name} took ${duration.toFixed(2)}ms`)
    }
  }

  try {
    const result = fn()
    
    if (result instanceof Promise) {
      return result.finally(finish)
    } else {
      finish()
      return result
    }
  } catch (error) {
    finish()
    throw error
  }
}

// Web Vitals monitoring
export const reportWebVitals = (metric: { name: string; value: number }) => {
  if (process.env.NODE_ENV === 'production') {
    // Log important metrics
    console.log(`📊 ${metric.name}: ${metric.value}`)
    
    // You can send to analytics service here
    // Example: gtag('event', metric.name, { value: metric.value })
  }
}