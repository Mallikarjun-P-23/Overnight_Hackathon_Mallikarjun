const express = require('express');
const ForumPost = require('../models/ForumPost');
const auth = require('../middleware/auth');

const router = express.Router();

// Get Forum Posts
router.get('/', auth, async (req, res) => {
    try {
        const { language, category } = req.query;
        const filter = {};
        if (language) filter.language = language;
        if (category) filter.category = category;

        const posts = await ForumPost.find(filter)
            .sort({ createdAt: -1 })
            .populate('author', 'name')
            .populate('replies.author', 'name');
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch forum posts', error: error.message });
    }
});

// Create Forum Post
router.post('/', auth, async (req, res) => {
    try {
        const { title, content, language, category } = req.body;
        const post = new ForumPost({
            title,
            content,
            language,
            category,
            author: req.user.userId
        });
        await post.save();
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create post', error: error.message });
    }
});

// Add Reply
router.post('/:id/reply', auth, async (req, res) => {
    try {
        const { content } = req.body;
        const post = await ForumPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        post.replies.push({
            author: req.user.userId,
            content
        });
        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add reply', error: error.message });
    }
});

module.exports = router;
