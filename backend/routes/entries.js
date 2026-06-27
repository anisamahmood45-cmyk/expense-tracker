const express = require('express');
const { v4: uuid } = require('uuid');
const db      = require('../db');
const auth    = require('../middleware/auth');
const router  = express.Router();

const getUser = id => db.get('users').find({ id }).value();

// GET all entries + budget + category budgets
router.get('/', auth, (req, res) => {
  try {
    const user    = getUser(req.user.id);
    const entries = db.get('entries').filter({ user: req.user.id }).orderBy('createdAt', 'desc').value();
    res.json({ entries, budget: user?.budget || 50000, categoryBudgets: user?.categoryBudgets || {}, username: user?.username || '' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add entry
router.post('/', auth, (req, res) => {
  try {
    const { name, amount, category, type, date, recurring } = req.body;
    if (!name || !amount || !type || !date)
      return res.status(400).json({ message: 'Missing required fields' });
    const entry = { _id: uuid(), user: req.user.id, name, amount, category: category || 'Other', type, date, recurring: !!recurring, createdAt: new Date().toISOString() };
    db.get('entries').push(entry).write();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update monthly budget (must be before /:id)
router.put('/budget', auth, (req, res) => {
  try {
    const { budget } = req.body;
    if (!budget || budget <= 0) return res.status(400).json({ message: 'Invalid budget' });
    db.get('users').find({ id: req.user.id }).assign({ budget }).write();
    res.json({ budget });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update category budgets (must be before /:id)
router.put('/category-budget', auth, (req, res) => {
  try {
    const { categoryBudgets } = req.body;
    db.get('users').find({ id: req.user.id }).assign({ categoryBudgets }).write();
    res.json({ categoryBudgets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT edit entry
router.put('/:id', auth, (req, res) => {
  try {
    const entry = db.get('entries').find({ _id: req.params.id, user: req.user.id }).value();
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    const { name, amount, category, type, date, recurring } = req.body;
    const updates = {};
    if (name     !== undefined) updates.name      = name;
    if (amount   !== undefined) updates.amount    = amount;
    if (category !== undefined) updates.category  = category;
    if (type     !== undefined) updates.type      = type;
    if (date     !== undefined) updates.date      = date;
    if (recurring!== undefined) updates.recurring = recurring;
    db.get('entries').find({ _id: req.params.id }).assign(updates).write();
    res.json(db.get('entries').find({ _id: req.params.id }).value());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE single entry
router.delete('/:id', auth, (req, res) => {
  try {
    const entry = db.get('entries').find({ _id: req.params.id, user: req.user.id }).value();
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    db.get('entries').remove({ _id: req.params.id }).write();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE all entries for user
router.delete('/', auth, (req, res) => {
  try {
    db.get('entries').remove({ user: req.user.id }).write();
    res.json({ message: 'All entries deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
