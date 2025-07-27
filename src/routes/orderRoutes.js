const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

router.post('/', async (req, res) => {
  try {
    const { items, total, paymentMethod, userEmail } = req.body;
    
    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }
    
    if (typeof total !== 'number' || total <= 0) {
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    const orderItems = items.map(item => ({
      product: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    // Create order with completed status
    const order = new Order({
      items: orderItems,
      total,
      paymentMethod: paymentMethod || 'credit_card',
      status: 'completed',
      userEmail, // Store user email directly
      createdAt: new Date()
    });

    const savedOrder = await order.save();
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
        paymentMethod: savedOrder.paymentMethod,
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