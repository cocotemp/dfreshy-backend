const productService = require('./product.service');
const response = require('../../utils/response');

// MANAGER: Create product
const createProduct = async (req, res, next) => {
    try {
        const { name, price, unit, availableStock } = req.body;

        const product = await productService.createProduct({
            name,
            price: Number(price),
            unit,
            availableStock:
                availableStock !== undefined ? Number(availableStock) : undefined,
        });

        response.success(res, { product }, 'Product created successfully');
    } catch (error) {
        next(error);
    }
};

// MANAGER: Get all products
const getProducts = async (req, res, next) => {
    try {
        const { isActive, name } = req.query;

        const filters = {};
        if (isActive !== undefined) {
            filters.isActive = isActive === 'true';
        }
        if (name) {
            filters.name = name;
        }

        const products = await productService.getAllProducts(filters);

        response.success(res, { products }, 'Products fetched successfully');
    } catch (error) {
        next(error);
    }
};

// MANAGER: Update product
const updateProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const updates = { ...req.body };

        if (updates.price !== undefined) {
            updates.price = Number(updates.price);
        }

        const product = await productService.updateProduct(productId, updates);

        response.success(res, { product }, 'Product updated successfully');
    } catch (error) {
        next(error);
    }
};

// MANAGER: Delete product (soft delete)
const deleteProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;

        await productService.deleteProduct(productId);

        response.success(res, {}, 'Product deleted successfully');
    } catch (error) {
        next(error);
    }
};

// CUSTOMER: Get active products only
const getActiveProducts = async (req, res, next) => {
    try {
        const { name } = req.query;

        const filters = { isActive: true };
        if (name) {
            filters.name = name;
        }

        const products = await productService.getAllProducts(filters);

        response.success(res, { products }, 'Products fetched successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    getActiveProducts,
};
