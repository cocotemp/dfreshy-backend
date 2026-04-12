# Event & Notification System - Integration Guide

## Overview
Event-driven notification system for Coco backend. Events are emitted AFTER DB commits, notifications are created asynchronously.

## Architecture
```
Business Service → Event Emission → Event Bus → Event Handlers → Notification Service → DB
```

## How to Emit Events from Services

### Import Event Bus
```javascript
const { emitEvent } = require('../../utils/eventBus');
```

### Emit Events AFTER DB Commits

#### Customer Service Example (ORDER_PLACED)
```javascript
await order.save();

emitEvent('ORDER_PLACED', {
    orderId: order._id,
    customerId: userId,
});

return order._id;
```

#### Manager Service Examples

**After acceptOrder (transaction committed):**
```javascript
await session.commitTransaction();

emitEvent('ORDER_ACCEPTED', {
    orderId,
    customerId: order.customerId,
    managerId,
});
```

**After rejectOrder:**
```javascript
await order.save();

emitEvent('ORDER_REJECTED', {
    orderId,
    customerId: order.customerId,
    managerId,
});
```

**After assignOrder:**
```javascript
await order.save();

emitEvent('ORDER_ASSIGNED', {
    orderId,
    customerId: order.customerId,
    deliveryBoyId,
    managerId,
});
```

**After settleCOD:**
```javascript
await order.save();

emitEvent('COD_SETTLED', {
    orderId,
    customerId: order.customerId,
    deliveryBoyId: order.deliveryBoyId,
    managerId,
});
```

#### Delivery Service Examples

**After outForDelivery:**
```javascript
await order.save();

emitEvent('ORDER_OUT_FOR_DELIVERY', {
    orderId,
    customerId: order.customerId,
    deliveryBoyId,
});
```

**After deliverOrder (transaction committed):**
```javascript
await session.commitTransaction();

emitEvent('ORDER_DELIVERED', {
    orderId,
    customerId: order.customerId,
    deliveryBoyId,
    paymentMode: order.paymentMode,
});

// If COD, also emit COD_PENDING
if (isCOD) {
    emitEvent('COD_PENDING', {
        orderId,
        customerId: order.customerId,
        deliveryBoyId,
    });
}
```

**After failOrder (transaction committed):**
```javascript
await session.commitTransaction();

emitEvent('ORDER_FAILED', {
    orderId,
    customerId: order.customerId,
    deliveryBoyId,
    reason,
});
```

## Event Payload Structure

### Required Fields
- **orderId**: The order ID (always required)
- **customerId**: Customer user ID (for customer notifications)
- **managerId**: Manager user ID (optional, for manager-specific notifications)
- **deliveryBoyId**: Delivery person user ID (optional, for delivery notifications)

### Optional Fields
- **paymentMode**: 'COD' or 'ONLINE'
- **reason**: Rejection/failure reason

## Supported Events

| Event | Triggered By | Notifies |
|-------|-------------|----------|
| ORDER_PLACED | Customer creates order | Customer, Manager |
| ORDER_ACCEPTED | Manager accepts order | Customer |
| ORDER_REJECTED | Manager rejects order | Customer |
| ORDER_ASSIGNED | Manager assigns delivery | Customer, Delivery |
| ORDER_OUT_FOR_DELIVERY | Delivery marks out | Customer |
| ORDER_DELIVERED | Delivery completes | Customer |
| ORDER_FAILED | Delivery fails | Customer, Manager |
| COD_PENDING | COD order delivered | Customer, Manager |
| COD_SETTLED | Manager settles COD | Customer, Delivery |

## Critical Rules

1. ✅ **Emit events ONLY after successful DB commit/save**
2. ✅ **Never await emitEvent() - it's fire-and-forget**
3. ✅ **Events must never break main business flow**
4. ✅ **Event handlers automatically create notifications**
5. ❌ **Never create notifications directly from services**
6. ❌ **Never emit events inside transactions**
7. ❌ **Never emit events before persistence**

## Example: Full Integration

```javascript
const { emitEvent } = require('../../utils/eventBus');

const createOrder = async ({ userId, items, address, paymentMode, requestId }) => {
    // ... validation logic ...
    
    const order = new Order({
        customerId: userId,
        items: orderItems,
        addressSnapshot: address,
        paymentMode,
        status: ORDER_STATES.PENDING_MANAGER,
        timeline: [
            { state: ORDER_STATES.PLACED, at: new Date(), by: userId },
            { state: ORDER_STATES.PENDING_MANAGER, at: new Date(), by: userId },
        ],
    });

    await order.save(); // ← DB commit happens here

    // Audit (fire-and-forget)
    auditLog({
        actorId: userId,
        actorRole: 'CUSTOMER',
        action: 'ORDER_PLACED',
        entityType: 'ORDER',
        entityId: order._id,
        source: 'API',
        requestId,
        meta: { paymentMode, itemCount: orderItems.length, totalQty: 10 },
    });

    // Event emission (fire-and-forget) ← AFTER save()
    emitEvent('ORDER_PLACED', {
        orderId: order._id,
        customerId: userId,
    });

    return order._id;
};
```

## Files Created

1. **src/utils/eventBus.js** - In-memory event bus
2. **src/models/notification.model.js** - Notification schema
3. **src/services/notification.service.js** - Notification creation service
4. **src/events/orderEvents.handler.js** - Order event handlers
5. **src/app.js** - Wired event handlers during startup

## Next Steps for Integration

1. Import `emitEvent` in each service file:
   - `customer.service.js`
   - `manager.service.js`
   - `delivery.service.js`

2. Add event emissions AFTER successful DB operations

3. Test notification creation in database after order lifecycle actions

## Production Considerations

- Notifications are stored in DB (in-app inbox)
- No external dependencies (Redis, queues, etc.)
- Event handlers swallow errors to prevent cascading failures
- Notification creation is fire-and-forget
- Future: Add push notifications, SMS, email by extending event handlers
