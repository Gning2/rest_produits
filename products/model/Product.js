import mongoose from 'mongoose' 

const productSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    name: {
        type: String,
        required: true
    },
    details: {
        price: {
            type: Number,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        color: {
            type: String,
            required: true
        }
    },
    stock: {
        type: Number,
        required: true
    },
    id: {
        type: Number,
        required: true
    }
});

export const Product = mongoose.model('Product', productSchema);

