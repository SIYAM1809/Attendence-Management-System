const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/reportController');
const { protect, adminOrHR } = require('../middlewares/authMiddleware');

router.get('/dashboard', protect, adminOrHR, getDashboardStats);

module.exports = router;
