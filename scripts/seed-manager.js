const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const { ROLES } = require('../src/config/constants');
const env = require('../src/config/env');

/**
 * Seed script to create initial manager user
 * Usage: node scripts/seed-manager.js
 */

const seedManager = async () => {
    try {
        // Connect to database
        await mongoose.connect(env.mongodb.uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });

        console.log('✓ Connected to MongoDB');

        // Check if manager already exists
        const existingManager = await User.findOne({ role: ROLES.MANAGER });

        if (existingManager) {
            console.log('⚠️  Manager already exists:', existingManager.phone);
            console.log('Manager ID:', existingManager._id);
            process.exit(0);
        }

        // Get phone from environment or use default
        const managerPhone = process.env.MANAGER_PHONE || '+919999999999';

        // Create manager
        const manager = await User.create({
            phone: managerPhone,
            role: ROLES.MANAGER,
            status: 'ACTIVE',
        });

        console.log('✓ Manager created successfully!');
        console.log('Manager ID:', manager._id);
        console.log('Phone:', manager.phone);
        console.log('Role:', manager.role);
        console.log('\n📝 Use this phone number to login as manager');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding manager:', error.message);
        process.exit(1);
    }
};

seedManager();
