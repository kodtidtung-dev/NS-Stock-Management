# Real-time Updates Implementation Guide

## 🚀 Overview

This implementation provides **optimistic updates** with **event-driven auto-refresh** for a real-time feel without needing WebSocket infrastructure.

## 📦 Components Created

### Core Systems
- `src/lib/eventBus.ts` - Event broadcasting system
- `src/hooks/useOptimisticMutation.ts` - Enhanced with better error handling
- `src/hooks/useProductMutations.ts` - Real-time product operations
- `src/hooks/useRealTimeToast.ts` - Smart notification system

### UI Components
- `src/components/LoadingSpinner.tsx` - Various loading states
- `src/components/AnimatedCard.tsx` - Visual feedback for updates

### Enhanced Hooks
- `src/hooks/useProducts.ts` - Now listens to product events
- `src/hooks/useDashboard.ts` - Smart auto-refresh on changes

## 🔧 How It Works

### 1. Event Flow
```
User Action → Optimistic UI Update → API Call → Success/Error → Event Broadcast → UI Sync
```

### 2. Example: Adding a Product
```typescript
// 1. User clicks "Add Product"
const { createProduct } = useProductMutations()

// 2. UI shows loading state immediately
await createProduct(newProduct)

// 3. On success:
// - Product appears in list instantly (optimistic)
// - Event broadcasts to other components
// - Dashboard auto-refreshes
// - Toast notification shows
```

### 3. Smart Refresh Logic
- **Stock Updates**: Immediate refresh (critical)
- **Product Changes**: 1-second debounced refresh
- **Background Sync**: Continues as fallback

## 💡 Usage Examples

### Basic Product Operations
```typescript
import { useProductMutations } from '@/hooks/useProductMutations'

function ProductForm() {
  const {
    createProduct,
    updateProduct,
    updateStock,
    isCreatingProduct
  } = useProductMutations()

  const handleSubmit = async (data) => {
    // UI updates immediately, API call happens in background
    await createProduct(data)
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={isCreatingProduct}
    >
      {isCreatingProduct ? <ButtonLoader /> : 'เพิ่มสินค้า'}
    </button>
  )
}
```

### Listening to Events
```typescript
import { useEventBus, PRODUCT_EVENTS } from '@/lib/eventBus'

function ProductList() {
  useEventBus(PRODUCT_EVENTS.CREATED, (event) => {
    console.log('New product:', event.product)
    // Component auto-updates via useProducts hook
  }, [])

  // ... component logic
}
```

### Custom Loading States
```typescript
import { LoadingSpinner, SectionLoader } from '@/components/LoadingSpinner'

function MyComponent() {
  const { products, loading } = useProducts()

  if (loading) return <SectionLoader message="กำลังโหลดสินค้า..." />

  return (
    <div className="relative">
      {/* Content */}
      {isUpdating && <SectionLoader message="กำลังอัปเดต..." />}
    </div>
  )
}
```

## 🎯 Benefits

### User Experience
- ✅ **Instant Feedback** - UI responds immediately
- ✅ **Smart Notifications** - Contextual toast messages
- ✅ **Visual Feedback** - Loading states and success animations
- ✅ **Error Recovery** - Automatic rollback on failures

### Developer Experience
- ✅ **Simple API** - Same hooks as before, enhanced functionality
- ✅ **Event-Driven** - Loose coupling between components
- ✅ **Error Handling** - Built-in rollback and retry logic
- ✅ **TypeScript** - Full type safety

### Performance
- ✅ **Optimistic Updates** - No waiting for API responses
- ✅ **Smart Caching** - Reduced API calls
- ✅ **Background Sync** - Ensures data consistency
- ✅ **Debounced Refresh** - Prevents excessive updates

## 🚀 Next Steps (Optional Enhancements)

### Phase 2: WebSocket Real-time (Future)
```typescript
// When ready for true real-time across devices
import { useWebSocket } from '@/hooks/useWebSocket'

function RealTimeProductList() {
  useWebSocket('/api/products/live', (event) => {
    // Real-time updates from other users
  })
}
```

### Phase 3: Offline Support
```typescript
// For offline-first experience
import { useOfflineSync } from '@/hooks/useOfflineSync'

function OfflineCapableForm() {
  const { syncStatus } = useOfflineSync()
  // Queue operations when offline, sync when online
}
```

## 🧪 Testing the Implementation

1. **Open two browser tabs** to the same page
2. **Make changes** in one tab (add/edit/delete products)
3. **Watch the other tab** update automatically via background sync
4. **Check console logs** for event broadcasting
5. **Test error scenarios** by disconnecting network

The system provides a **real-time feel** with **optimistic updates** while maintaining **data consistency** through background synchronization.