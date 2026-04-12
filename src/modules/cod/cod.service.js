const COD = require('./cod.model');

const recordCODTransaction = async (transactionData) => {
    // TODO: Record cash-on-delivery transaction
    // - orderId
    // - amount
    // - deliveryPersonId
    // - status (PENDING, COLLECTED, DEPOSITED)
    throw new Error('Not implemented');
};

const getCODTransactions = async (filters = {}) => {
    // TODO: Fetch COD transactions with filters
    throw new Error('Not implemented');
};

const updateCODStatus = async (transactionId, status) => {
    // TODO: Update COD transaction status
    throw new Error('Not implemented');
};

const getCODBalance = async (deliveryPersonId) => {
    // TODO: Get pending COD balance for delivery person
    throw new Error('Not implemented');
};

module.exports = {
    recordCODTransaction,
    getCODTransactions,
    updateCODStatus,
    getCODBalance,
};
