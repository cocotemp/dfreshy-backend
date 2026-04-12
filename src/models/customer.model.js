const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({}, { timestamps: true });

// TODO: Add customer-specific fields

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
