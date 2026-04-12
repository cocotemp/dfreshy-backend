const Product = require('./product.model');
const { NotFoundError, ValidationError } = require('../../utils/errors');

const getAllProducts = async (filters = {}) => {
    const query = {};

    // Apply filters
    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }

    if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    return products;
};

const getProductById = async (productId) => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new NotFoundError('Product not found');
    }
    return product;
};

const createProduct = async (productData) => {
    const { name, price, unit, availableStock } = productData;

    // Validate price
    if (price <= 0) {
        throw new ValidationError('Price must be greater than 0');
    }

    // Validate stock
    if (availableStock !== undefined && availableStock < 0) {
        throw new ValidationError('Stock cannot be negative');
    }

    const product = new Product({
        name,
        price,
        unit,
        availableStock: availableStock || 0,
        isActive: true,
    });

    await product.save();
    return product;
};

const updateProduct = async (productId, updates) => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new NotFoundError('Product not found');
    }

    const allowedFields = ['name', 'price', 'unit', 'isActive'];

    // Validate price if being updated
    if (updates.price !== undefined && updates.price <= 0) {
        throw new ValidationError('Price must be greater than 0');
    }

    for (const key of Object.keys(updates)) {
        if (!allowedFields.includes(key)) {
            throw new ValidationError(`Field "${key}" cannot be updated`);
        }
        product[key] = updates[key];
    }

    await product.save();
    return product;
};

const deleteProduct = async (productId) => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new NotFoundError('Product not found');
    }

    // Soft delete: set isActive to false
    product.isActive = false;
    await product.save();

    return product;
};

const updateStock = async (productId, quantity) => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new NotFoundError('Product not found');
    }

    if (quantity < 0) {
        throw new ValidationError('Stock cannot be negative');
    }

    product.availableStock = quantity;
    await product.save();

    return product;
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
};
