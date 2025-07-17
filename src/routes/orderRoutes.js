const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

router.post('/', async (req, res) => {
  console.log('Received order request:', req.body);
  try {
    const { items, total } = req.body;
    
    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Items must be a non-empty array' 
      });
    }
    
    if (typeof total !== 'number' || total <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid total amount' 
      });
    }

    // Process items and validate stock
    const orderItems = [];
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({ 
          success: false,
          error: `Invalid product ID: ${item.productId}`
        });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          success: false,
          error: `Product not found: ${item.productId}` 
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false,
          error: `Insufficient stock for ${product.name}` 
        });
      }

      orderItems.push({
        product: item.productId,
        name: product.name,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Create and save order
    const order = new Order({
      items: orderItems,
      total,
      status: 'completed',
      createdAt: new Date()
    });

    const savedOrder = await order.save();

    // Update product stocks
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Return success response
    res.status(201).json({
      success: true,
      order: {
        id: savedOrder._id,
        items: savedOrder.items,
        total: savedOrder.total,
        status: savedOrder.status,
        createdAt: savedOrder.createdAt
      }
    });

  } catch (error) {
    console.error('Order processing error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process order',
      details: error.message 
    });
  }
});

module.exports = router;