const { Schema, model } = require('mongoose');

const itemSchema = new Schema({
    itemId: {
        type: String,
        required: true,
    },
    itemName: {
        type: String,
        required: true,
    },
    // Add more properties as needed, such as item quantity, rarity, etc.
});

const userProfileSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    balance: {
        type: Number,
        default: 10,
    },
    lastDailyCollected: {
        type: Date,
    },
    items: [itemSchema], // Array field to store items
}, { timestamps: true });

module.exports = model('UserProfile', userProfileSchema);