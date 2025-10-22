const express = require('express');
const { authenticate } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const { Notification } = require('../models');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await notificationService.markNotificationAsRead(req.params.id);
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.post('/mark-all-read', authenticate, async (req, res) => {
  try {
    await Notification.update(
      { status: 'read', readAt: new Date() },
      { where: { userId: req.user.id, status: { [require('sequelize').Op.ne]: 'read' } } }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

module.exports = router;
