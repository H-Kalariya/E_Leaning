const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

const activateSubscription = async (req, res) => {
  try {
    const { plan, durationMonths } = req.body;
    let subscription = await Subscription.findOne({ studentId: req.user._id });
    
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + (durationMonths || 1));

    if (subscription) {
      subscription.plan = plan;
      subscription.expiryDate = expiryDate;
      subscription.isActive = true;
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        studentId: req.user._id,
        plan,
        expiryDate,
        isActive: true
      });
    }

    // Keep the canonical user flag in sync so other endpoints can gate reliably
    await User.updateOne({ _id: req.user._id }, { $set: { isPremium: true } });

    res.json({ message: 'Subscription activated', subscription, isPremium: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const processPayment = async (req, res) => {
  // Placeholder for real Razorpay order processing
  const { amount } = req.body;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    // Mock processing context for demo
    await Payment.create({
      studentId: req.user._id,
      amount,
      status: "Completed",
      method: "Razorpay (Mock)",
      transactionRef: "mock_" + Date.now()
    });
    return res.json({ message: 'Mock payment processed successfully since Razorpay keys are missing' });
  }

  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amount * 100,  // Amount in paise
      currency: "INR",
      receipt: "receipt_order_" + Date.now(),
    };

    const order = await instance.orders.create(options);
    
    await Payment.create({
      studentId: req.user._id,
      amount,
      status: "Pending",
      transactionRef: order.id
    });
    
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { activateSubscription, processPayment };
