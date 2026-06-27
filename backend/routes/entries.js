const express = require('express');
const Entry   = require('../models/Entry');
const User    = require('../models/User');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET all entries + user budget
router.get('/', auth, async (req, res) => {
  try {
    const [entries, user] = await Promise.all([
      Entry.find({ user: req.user.id }).sort({ createdAt: -1 }),
      User.findById(req.user.id).select('budget username'),
    ]);
    res.json({ entries, budget: user.budget, username: user.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add entry
router.post('/', auth, async (req, res) => {
  try {
    const { name, amount, category, type, date, recurring } = req.body;
    if (!name || !amount || !type || !date)
      return res.status(400).json({ message: 'Missing required fields' });
    const entry = await Entry.create({
      user: req.user.id, name, amount, category: category || 'Other', type, date, recurring: !!recurring,
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await Entry.findOne({ _id: req.params.id, user: req.user.id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    await entry.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update budget
router.put('/budget', auth, async (req, res) => {
  try {
    const { budget } = req.body;
    if (!budget || budget <= 0) return res.status(400).json({ message: 'Invalid budget' });
    await User.findByIdAndUpdate(req.user.id, { budget });
    res.json({ budget });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE all entries for user
router.delete('/', auth, async (req, res) => {
  try {
    await Entry.deleteMany({ user: req.user.id });
    res.json({ message: 'All entries deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
