const logger = require('./logger');

const eventHandlers = new Map();

const onEvent = (eventType, handler) => {
    if (!eventHandlers.has(eventType)) {
        eventHandlers.set(eventType, []);
    }
    eventHandlers.get(eventType).push(handler);
};

const emitEvent = (eventType, payload) => {
    setImmediate(async () => {
        const handlers = eventHandlers.get(eventType);
        if (!handlers || handlers.length === 0) {
            return;
        }

        for (const handler of handlers) {
            try {
                await handler(payload);
            } catch (err) {
                // Log error but don't break main flow
                logger.error('Event handler failed', {
                    eventType,
                    payload,
                    error: err.message,
                    stack: err.stack,
                });
            }
        }
    });
};

module.exports = {
    emitEvent,
    onEvent,
};
