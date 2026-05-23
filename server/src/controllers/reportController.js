const User = require('../models/User');
const Attendance = require('../models/Attendance');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/reports/dashboard
// @access  Private/Admin
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

        // Fetch leaves for today
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        const Leave = require('../models/Leave');
        const leavesToday = await Leave.find({
            status: 'Approved',
            startDate: { $lte: endOfToday },
            endDate: { $gte: today }
        }).populate('employeeId', 'name email department');

        const onLeaveEmployees = leavesToday.filter(l => l.employeeId).map(l => ({
            id: l.employeeId._id,
            name: l.employeeId.name,
            department: l.employeeId.department,
            type: l.type
        }));
        
        const onLeaveCount = onLeaveEmployees.length;

        // Abstract: Absent = Total Employees - Present - On Leave
        const absentCount = Math.max(0, totalEmployees - presentCount - onLeaveCount);

        res.json({
            totalEmployees,
            presentCount,
            absentCount,
            lateCount,
            onLeaveCount,
            onLeaveEmployees
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Employee Performance Stats
// @route   GET /api/reports/employee/:id
// @access  Private/Admin
const getEmployeePerformance = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const employee = await User.findById(employeeId);
        
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const attendances = await Attendance.find({ 
            employeeId,
            date: { $gte: startOfMonth }
        });

        let presentDays = 0;
        let lateDays = 0;
        let totalLateMinutes = 0;

        attendances.forEach(att => {
            if (att.status === 'Present' || att.status === 'Late') presentDays++;
            if (att.status === 'Late') {
                lateDays++;
                totalLateMinutes += (att.lateDuration || 0);
            }
        });

        const today = new Date();
        let daysPassed = today.getDate();
        let workingDaysPassed = 0;
        
        const joinDate = employee.joiningDate || employee.createdAt;
        const joinStart = new Date(joinDate);
        joinStart.setHours(0, 0, 0, 0);

        const Leave = require('../models/Leave');
        const approvedLeaves = await Leave.find({
            employeeId,
            status: 'Approved',
            $or: [
                { startDate: { $lte: today }, endDate: { $gte: startOfMonth } }
            ]
        });

        let leaveDaysPassed = 0;
        for(let i = 1; i <= daysPassed; i++) {
            const d = new Date(today.getFullYear(), today.getMonth(), i);
            const dStart = new Date(d);
            dStart.setHours(0, 0, 0, 0);

            if (dStart >= joinStart) {
                if(d.getDay() !== 0 && d.getDay() !== 6) {
                    workingDaysPassed++;
                    
                    // Check if on approved leave
                    for (const leave of approvedLeaves) {
                        const ls = new Date(leave.startDate); ls.setHours(0,0,0,0);
                        const le = new Date(leave.endDate); le.setHours(0,0,0,0);
                        if (dStart >= ls && dStart <= le) {
                            leaveDaysPassed++;
                            break;
                        }
                    }
                }
            }
        }
        
        const absentDays = Math.max(0, workingDaysPassed - presentDays - leaveDaysPassed);

        let score = 100;
        score -= (absentDays * 10); 
        score -= (lateDays * 5);

        let rating = 'Excellent';
        let color = '16, 185, 129'; // success green
        if (score < 50) {
            rating = 'Unsatisfactory';
            color = '244, 63, 94'; // danger red
        } else if (score < 75) {
            rating = 'Needs Improvement';
            color = '245, 158, 11'; // warning yellow
        } else if (score < 90) {
            rating = 'Good';
            color = '59, 130, 246'; // primary blue
        }

        res.json({
            employeeName: employee.name,
            presentDays,
            lateDays,
            absentDays,
            totalLateMinutes,
            score: Math.max(0, score),
            rating,
            color,
            month: startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats, getEmployeePerformance };
