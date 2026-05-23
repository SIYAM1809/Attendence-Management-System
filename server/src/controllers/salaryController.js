const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

// @desc    Get Salary Prediction for Employee
// @route   GET /api/salary/predict
// @access  Private
const predictSalary = async (req, res) => {
    try {
        let employeeId = req.user._id;
        
        if (req.params.id) {
            if (req.user.role === 'Admin' || req.user.role === 'HR') {
                employeeId = req.params.id;
            } else if (req.params.id !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized' });
            }
        }

        const employee = await User.findById(employeeId);
        
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const baseSalary = employee.baseSalary || 0;
        
        // Calculate current month's start and end dates
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        // Calculate working days dynamically based on joining date
        let workingDaysInMonth = 0;
        const joinDate = employee.joiningDate || employee.createdAt;
        const joinStart = new Date(joinDate);
        joinStart.setHours(0, 0, 0, 0);

        for (let i = 1; i <= lastDay.getDate(); i++) {
            const d = new Date(date.getFullYear(), date.getMonth(), i);
            const dStart = new Date(d);
            dStart.setHours(0, 0, 0, 0);
            
            if (dStart >= joinStart) {
                if (d.getDay() !== 0 && d.getDay() !== 6) workingDaysInMonth++;
            }
        }
        
        // Prevent division by zero
        workingDaysInMonth = Math.max(1, workingDaysInMonth);
        
        // Find attendance this month
        const attendances = await Attendance.find({
            employeeId,
            date: { $gte: firstDay, $lte: lastDay }
        });
        
        // Calculate metrics
        let presentDays = 0;
        let lateDays = 0;
        let totalLateMinutes = 0;
        
        attendances.forEach(att => {
            if (att.status === 'Present') presentDays++;
            if (att.status === 'Late') {
                presentDays++; // Count late as present but note the late
                lateDays++;
                totalLateMinutes += att.lateDuration;
            }
        });

        // Simplified salary logic
        // E.g., deduct 0.5 day salary for every 3 late days
        const latePenaltyDays = Math.floor(lateDays / 3) * 0.5;
        
        const dailyRate = baseSalary / workingDaysInMonth;
        
        // Find approved leaves this month
        const approvedLeaves = await Leave.find({
            employeeId,
            status: 'Approved',
            $or: [
                { startDate: { $lte: lastDay }, endDate: { $gte: firstDay } }
            ]
        });

        // We calculate absent days up to today, not the end of the month
        let workingDaysPassed = 0;
        let leaveDaysPassed = 0;
        const today = new Date();
        const daysPassed = today.getDate();
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
        
        const lateDeduction = latePenaltyDays * dailyRate;
        const absentDeduction = absentDays * dailyRate;
        
        const predictedSalary = baseSalary - lateDeduction - absentDeduction;
        
        const breakdown = [
            { id: 1, type: 'Earnings', description: 'Base Salary', amount: baseSalary.toFixed(2), isDeduction: false },
            { id: 2, type: 'Deduction', description: `Absences (${absentDays} days @ ${dailyRate.toFixed(2)}/day)`, amount: absentDeduction.toFixed(2), isDeduction: true },
            { id: 3, type: 'Deduction', description: `Late Penalty (${lateDays} days late -> ${latePenaltyDays} penalty days @ ${dailyRate.toFixed(2)}/day)`, amount: lateDeduction.toFixed(2), isDeduction: true }
        ];

        res.json({
            employeeName: employee.name,
            baseSalary,
            workingDaysInMonth,
            presentDays,
            absentDays,
            lateDays,
            totalLateMinutes,
            lateDeduction: lateDeduction.toFixed(2),
            absentDeduction: absentDeduction.toFixed(2),
            predictedSalary: predictedSalary.toFixed(2),
            currency: '৳',
            breakdown,
            dailyRate: dailyRate.toFixed(2),
            month: firstDay.toLocaleString('default', { month: 'long', year: 'numeric' })
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { predictSalary };
