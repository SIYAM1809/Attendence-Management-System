const User = require('../models/User');
const Attendance = require('../models/Attendance');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/reports/dashboard
// @access  Private/Admin or HR
const getDashboardStats = async (req, res) => {
    try {
        const totalEmployees = await User.countDocuments({ role: 'Employee' });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendancesToday = await Attendance.find({ date: { $gte: today } });

        let presentCount = 0;
        let lateCount = 0;

        attendancesToday.forEach(att => {
            if (att.status === 'Present') presentCount++;
            if (att.status === 'Late') {
                presentCount++; // Late is still present
                lateCount++;
            }
        });

        // Abstract: Absent = Total Employees - Present
        const absentCount = totalEmployees - presentCount;

        res.json({
            totalEmployees,
            presentCount,
            absentCount,
            lateCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats };
