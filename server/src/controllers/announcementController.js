const Announcement = require('../models/Announcement');
const User = require('../models/User');
const sendEmail = require('../utils/emailSender');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('createdBy', 'name role')
            .sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an announcement
// @route   POST /api/announcements
// @access  Private/Admin
const createAnnouncement = async (req, res) => {
    try {
        const { title, content } = req.body;

        const announcement = await Announcement.create({
            title,
            content,
            createdBy: req.user._id
        });

        const populatedAnnouncement = await announcement.populate('createdBy', 'name role');

        // Send announcement email to all active employees (non-blocking on errors)
        try {
            const employees = await User.find({ role: 'Employee', status: 'Active' }).select('email name');
            const recipients = employees.map(e => e.email).filter(Boolean);

            if (recipients.length > 0) {
                const fromName = process.env.SMTP_FROM_NAME || 'Attendance System';
                const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.EMAIL_USER;
                const from = fromEmail ? `${fromName} <${fromEmail}>` : undefined;

                const subject = `[Announcement] ${title}`;
                const text = `${title}\n\n${content}\n\n— ${populatedAnnouncement.createdBy?.name || 'Admin'}`;
                const html = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                        <h2 style="margin: 0 0 12px;">${title}</h2>
                        <div style="white-space: pre-wrap; color: #111;">${content}</div>
                        <p style="margin-top: 16px; color: #555;">
                            — ${populatedAnnouncement.createdBy?.name || 'Admin'}
                        </p>
                    </div>
                `;

                // Use BCC to avoid leaking employee emails to each other
                await sendEmail({
                    from,
                    to: fromEmail || process.env.EMAIL_USER,
                    bcc: recipients,
                    subject,
                    message: text,
                    html,
                });
            }
        } catch (emailErr) {
            console.error('Announcement email dispatch failed:', emailErr?.message || emailErr);
        }

        res.status(201).json(populatedAnnouncement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
const deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (announcement) {
            await Announcement.deleteOne({ _id: announcement._id });
            res.json({ message: 'Announcement removed' });
        } else {
            res.status(404).json({ message: 'Announcement not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement
};
