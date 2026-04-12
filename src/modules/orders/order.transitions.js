const { ORDER_STATES, ROLES } = require('../../config/constants');

/**
 * Order state transition validator
 * Ensures order status changes follow allowed lifecycle rules
 */

// Define allowed transitions based on Coco Order Lifecycle v2
// Maps: currentState -> newState -> [allowedRoles]
const ALLOWED_TRANSITIONS = {
    [ORDER_STATES.PENDING_MANAGER]: {
        [ORDER_STATES.ACCEPTED]: [ROLES.MANAGER],
        [ORDER_STATES.REJECTED_BY_MANAGER]: [ROLES.MANAGER],
    },
    [ORDER_STATES.ACCEPTED]: {
        [ORDER_STATES.RESERVED]: [ROLES.MANAGER],
    },
    [ORDER_STATES.RESERVED]: {
        [ORDER_STATES.ASSIGNING]: [ROLES.MANAGER],
        [ORDER_STATES.ASSIGNED]: [ROLES.MANAGER],
    },
    [ORDER_STATES.ASSIGNING]: {
        [ORDER_STATES.ASSIGNED]: [ROLES.MANAGER],
    },
    [ORDER_STATES.ASSIGNED]: {
        [ORDER_STATES.PICKED_UP]: [ROLES.DELIVERY],
    },
    [ORDER_STATES.PICKED_UP]: {
        [ORDER_STATES.OUT_FOR_DELIVERY]: [ROLES.DELIVERY],
    },
    [ORDER_STATES.OUT_FOR_DELIVERY]: {
        [ORDER_STATES.DELIVERED]: [ROLES.DELIVERY],
        [ORDER_STATES.FAILED_DELIVERY]: [ROLES.DELIVERY],
    },
    [ORDER_STATES.DELIVERED]: {
        [ORDER_STATES.COD_PENDING]: [ROLES.DELIVERY],
        [ORDER_STATES.CLOSED]: [ROLES.MANAGER], // ONLINE orders
    },
    [ORDER_STATES.COD_PENDING]: {
        [ORDER_STATES.COD_SETTLED]: [ROLES.MANAGER],
    },
    [ORDER_STATES.COD_SETTLED]: {
        [ORDER_STATES.CLOSED]: [ROLES.MANAGER],
    },
};

const validateTransition = (currentStatus, newStatus, userRole) => {
    // Validate that states exist
    const validStates = Object.values(ORDER_STATES);

    if (!validStates.includes(currentStatus)) {
        throw new Error(`Invalid current status: ${currentStatus}`);
    }

    if (!validStates.includes(newStatus)) {
        throw new Error(`Invalid new status: ${newStatus}`);
    }

    // Check if transition exists in allowed transitions
    if (!ALLOWED_TRANSITIONS[currentStatus]) {
        throw new Error(`No transitions allowed from state: ${currentStatus}`);
    }

    if (!ALLOWED_TRANSITIONS[currentStatus][newStatus]) {
        throw new Error(`Transition from ${currentStatus} to ${newStatus} is not allowed`);
    }

    // Check if user role is allowed for this transition
    const allowedRoles = ALLOWED_TRANSITIONS[currentStatus][newStatus];
    if (!allowedRoles.includes(userRole)) {
        throw new Error(`Role ${userRole} is not allowed to transition from ${currentStatus} to ${newStatus}`);
    }

    return true;
};

module.exports = {
    validateTransition,
};
