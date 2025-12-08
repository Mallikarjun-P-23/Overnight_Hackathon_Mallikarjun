const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stemChatbotService = require('../services/stemChatbot');

// Get user's STEM learning profile
router.get('/profile', auth, async (req, res) => {
  try {
    const profile = await stemChatbotService.getOrCreateProfile(req.user.id, 'english');
    res.json({
      success: true,
      profile: {
        motherTongue: profile.motherTongue,
        totalQueries: profile.totalQueries,
        preferredDomains: profile.preferredDomains,
        recentHistory: profile.learningHistory.slice(-5),
        historyCount: profile.learningHistory.length
      }
    });
  } catch (error) {
    console.error('Error fetching STEM profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// Update user's preferred language
router.put('/profile/language', auth, async (req, res) => {
  try {
    const { motherTongue } = req.body;
    const profile = await stemChatbotService.getOrCreateProfile(req.user.id, motherTongue);
    res.json({ success: true, motherTongue: profile.motherTongue });
  } catch (error) {
    console.error('Error updating language:', error);
    res.status(500).json({ success: false, message: 'Failed to update language' });
  }
});

// Process STEM query
router.post('/query', auth, async (req, res) => {
  try {
    const { query, motherTongue = 'english' } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const result = await stemChatbotService.processQuery(req.user.id, query.trim(), motherTongue);
    
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing STEM query:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process query',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get learning history
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 10, domain } = req.query;
    const profile = await stemChatbotService.getOrCreateProfile(req.user.id);
    
    let history = profile.learningHistory;
    
    // Filter by domain if specified
    if (domain && domain !== 'all') {
      history = history.filter(h => h.domain === domain);
    }
    
    // Sort by timestamp (most recent first) and limit
    history = history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      history,
      totalQueries: profile.totalQueries,
      preferredDomains: profile.preferredDomains
    });
  } catch (error) {
    console.error('Error fetching learning history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

// Get learning statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const profile = await stemChatbotService.getOrCreateProfile(req.user.id);
    
    // Calculate domain distribution
    const domainCounts = {};
    profile.learningHistory.forEach(entry => {
      domainCounts[entry.domain] = (domainCounts[entry.domain] || 0) + 1;
    });
    
    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = profile.learningHistory.filter(
      entry => new Date(entry.timestamp) > sevenDaysAgo
    ).length;
    
    res.json({
      success: true,
      stats: {
        totalQueries: profile.totalQueries,
        domainDistribution: domainCounts,
        recentActivity,
        motherTongue: profile.motherTongue,
        preferredDomains: profile.preferredDomains,
        joinDate: profile.createdAt,
        lastActive: profile.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching STEM stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

module.exports = router;