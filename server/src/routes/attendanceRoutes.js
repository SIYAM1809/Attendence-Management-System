const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut,
    getMyAttendance,
    getAllAttendance
} = require('../controllers/attendanceController');
const { protect, adminOrHR } = require('../middlewares/authMiddleware');

router.post('/check-in', protect, checkIn);
router.put('/check-out', protect, checkOut);
router.get('/my', protect, getMyAttendance);
router.get('/', protect, adminOrHR, getAllAttendance);

module.exports = router;
