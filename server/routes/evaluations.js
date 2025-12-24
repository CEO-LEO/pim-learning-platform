const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Submit evaluation
router.post('/submit', authenticateToken, (req, res) => {
  const { module_id, answers } = req.body;
  const { userId } = req.user;

  if (!module_id || !answers) {
    return res.status(400).json({ error: 'Module ID and answers required' });
  }

  const evaluationId = uuidv4();
  db.run(
    'INSERT INTO evaluations (evaluation_id, user_id, module_id, answers) VALUES (?, ?, ?, ?)',
    [evaluationId, userId, module_id, JSON.stringify(answers)],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to submit evaluation' });
      }
      res.json({ message: 'Evaluation submitted successfully', evaluation_id: evaluationId });
    }
  );
});

// Get user's evaluations
router.get('/my-evaluations', authenticateToken, (req, res) => {
  const { userId } = req.user;

  db.all(
    `SELECT e.*, m.title as module_title
     FROM evaluations e
     JOIN modules m ON e.module_id = m.module_id
     WHERE e.user_id = ?
     ORDER BY e.submitted_at DESC`,
    [userId],
    (err, evaluations) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(evaluations.map(e => ({
        ...e,
        answers: JSON.parse(e.answers)
      })));
    }
  );
});

module.exports = router;

