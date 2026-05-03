const express = require('express');
const router = express.Router();
const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    updateLeaveStatus
} = require('../controllers/leaveController');
const { protect, adminOrHR } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, applyLeave)
    .get(protect, adminOrHR, getAllLeaves);

router.get('/my', protect, getMyLeaves);

router.route('/:id')
    .put(protect, adminOrHR, updateLeaveStatus);

module.exports = router;
