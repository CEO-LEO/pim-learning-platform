const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('./auth');
const db = require('../database/init');

// Get quiz by module and order_index
router.get('/module/:moduleId', authenticateToken, (req, res) => {
  const { moduleId } = req.params;
  const { orderIndex } = req.query; // Get order_index from query parameter
  const { userId } = req.user;

  // If orderIndex is provided, get specific quiz
  if (orderIndex) {
    db.get(
      `SELECT q.*, 
              COALESCE((SELECT qr2.score FROM quiz_results qr2 
                        WHERE qr2.quiz_id = q.quiz_id AND qr2.user_id = ? 
                        ORDER BY qr2.completed_at DESC LIMIT 1), -1) as last_score,
              COALESCE((SELECT qr2.passed FROM quiz_results qr2 
                        WHERE qr2.quiz_id = q.quiz_id AND qr2.user_id = ? 
                        ORDER BY qr2.completed_at DESC LIMIT 1), -1) as last_passed,
              COALESCE((SELECT qr2.completed_at FROM quiz_results qr2 
                        WHERE qr2.quiz_id = q.quiz_id AND qr2.user_id = ? 
                        ORDER BY qr2.completed_at DESC LIMIT 1), '') as last_completed
       FROM quizzes q
       WHERE q.module_id = ? AND q.order_index = ?
       ORDER BY q.order_index
       LIMIT 1`,
      [userId, userId, userId, moduleId, parseInt(orderIndex)],
      (err, quiz) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!quiz) {
          return res.status(404).json({ error: 'Quiz not found for this module and order' });
        }
        res.json(quiz);
      }
    );
  } else {
    // Default: return quiz 1 (for backward compatibility)
    db.get(
      `SELECT q.*, 
              COALESCE((SELECT qr2.score FROM quiz_results qr2 
                        WHERE qr2.quiz_id = q.quiz_id AND qr2.user_id = ? 
                        ORDER BY qr2.completed_at DESC LIMIT 1), -1) as last_score,
              COALESCE((SELECT qr2.passed FROM quiz_results qr2 
                        WHERE qr2.quiz_id = q.quiz_id AND qr2.user_id = ? 
                        ORDER BY qr2.completed_at DESC LIMIT 1), -1) as last_passed,
              COALESCE((SELECT qr2.completed_at FROM quiz_results qr2 
                        WHERE qr2.quiz_id = q.quiz_id AND qr2.user_id = ? 
                        ORDER BY qr2.completed_at DESC LIMIT 1), '') as last_completed
       FROM quizzes q
       WHERE q.module_id = ? AND (q.order_index = 1 OR q.order_index IS NULL)
       ORDER BY q.order_index, q.quiz_id
       LIMIT 1`,
      [userId, userId, userId, moduleId],
      (err, quiz) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!quiz) {
          return res.status(404).json({ error: 'Quiz not found for this module' });
        }
        res.json(quiz);
      }
    );
  }
});

// Get all quizzes by module
router.get('/module/:moduleId/all', authenticateToken, (req, res) => {
  const { moduleId } = req.params;
  const { userId } = req.user;

  db.all(
    `SELECT q.*, 
            COALESCE((SELECT qr2.score FROM quiz_results qr2 
                      WHERE qr2.quiz_id = q.quiz_id AND qr2.user_id = ? 
                      ORDER BY qr2.completed_at DESC LIMIT 1), -1) as last_score,
            COALESCE((SELECT qr2.passed FROM quiz_results qr2 
                      WHERE qr2.quiz_id = q.quiz_id AND qr2.user_id = ? 
                      ORDER BY qr2.completed_at DESC LIMIT 1), -1) as last_passed,
            COALESCE((SELECT qr2.completed_at FROM quiz_results qr2 
                      WHERE qr2.quiz_id = q.quiz_id AND qr2.user_id = ? 
                      ORDER BY qr2.completed_at DESC LIMIT 1), '') as last_completed
     FROM quizzes q
     WHERE q.module_id = ?
     ORDER BY q.order_index, q.quiz_id`,
    [userId, userId, userId, moduleId],
    (err, quizzes) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      // Ensure last_passed and last_score are numbers (SQLite may return strings)
      // Handle null/undefined explicitly - if no result exists, set to -1
      const normalizedQuizzes = quizzes.map(quiz => {
        let lastScore = quiz.last_score;
        let lastPassed = quiz.last_passed;
        
        // Normalize last_score
        if (lastScore === null || lastScore === undefined) {
          lastScore = -1;
        } else if (typeof lastScore === 'string') {
          const parsed = parseInt(lastScore, 10);
          lastScore = isNaN(parsed) ? -1 : parsed;
        }
        
        // Normalize last_passed
        // -1 means no attempt, 0 means attempted but failed, 1 means attempted and passed
        if (lastPassed === null || lastPassed === undefined) {
          lastPassed = -1;
        } else if (typeof lastPassed === 'string') {
          const parsed = parseInt(lastPassed, 10);
          // Only accept -1, 0, or 1, everything else becomes -1
          lastPassed = (parsed === -1 || parsed === 0 || parsed === 1) ? parsed : -1;
        } else if (typeof lastPassed === 'number') {
          // Only accept -1, 0, or 1, everything else becomes -1
          lastPassed = (lastPassed === -1 || lastPassed === 0 || lastPassed === 1) ? lastPassed : -1;
        } else {
          lastPassed = -1;
        }
        
        
        return {
          ...quiz,
          last_score: lastScore,
          last_passed: lastPassed,
          order_index: typeof quiz.order_index === 'string' ? parseInt(quiz.order_index, 10) : quiz.order_index,
          allow_retake: typeof quiz.allow_retake === 'string' ? parseInt(quiz.allow_retake, 10) : quiz.allow_retake
        };
      });
      
      res.json(normalizedQuizzes);
    }
  );
});

// Get quiz with questions
router.get('/:quizId', authenticateToken, (req, res) => {
  const { quizId } = req.params;
  const { userId } = req.user;

  db.get('SELECT * FROM quizzes WHERE quiz_id = ?', [quizId], (err, quiz) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Pre-test (order_index = 0) doesn't require video completion
    // Convert order_index to number if it's a string (SQLite may return strings)
    // Handle null/undefined by defaulting to 1 (non-pre-test)
    const orderIndex = quiz.order_index === null || quiz.order_index === undefined 
      ? 1 
      : (typeof quiz.order_index === 'string' ? parseInt(quiz.order_index, 10) : quiz.order_index);
    const isPretest = orderIndex === 0;
    
    if (isPretest) {
      // For pre-test, check if already attempted (any attempt, passed or failed) and retake not allowed
      if (!quiz.allow_retake) {
        db.get(
          'SELECT * FROM quiz_results WHERE user_id = ? AND quiz_id = ? ORDER BY completed_at DESC LIMIT 1',
          [userId, quizId],
          (err, existing) => {
            
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            if (existing) {
              return res.status(403).json({ 
                error: 'คุณได้ทำแบบทดสอบก่อนเรียน (Pre-test) แล้ว ไม่สามารถทำซ้ำได้',
                already_completed: true,
                module_id: quiz.module_id
              });
            }
            
            // Not attempted yet, allow attempt - fetch questions
            fetchPreTestQuestions();
          }
        );
      } else {
        // Retake allowed, fetch questions directly
        fetchPreTestQuestions();
      }
      
      function fetchPreTestQuestions() {
        db.all(
          'SELECT question_id, question, type, options, order_index FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index',
          [quizId],
          (err, questions) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            if (!questions || questions.length === 0) {
              return res.status(404).json({ 
                error: 'ไม่พบคำถามในแบบทดสอบนี้',
                module_id: quiz.module_id
              });
            }

            // Remove correct answers from questions
            const questionsWithoutAnswers = questions.map(q => ({
              ...q,
              options: JSON.parse(q.options || '[]')
            }));
            
            res.json({
              ...quiz,
              questions: questionsWithoutAnswers
            });
          }
        );
      }
    } else {
      // For other quizzes, check if required video is 100% complete
      // Use orderIndex (converted to number) instead of quiz.order_index
      // If orderIndex is 0 (pre-test), it shouldn't reach here, but handle edge cases
      const requiredVideoOrder = (orderIndex !== null && orderIndex !== undefined && orderIndex !== 0) ? orderIndex : 1;
      db.get(
        `SELECT v.video_id, v.order_index, COALESCE(vp.is_complete, 0) as is_complete
         FROM videos v
         LEFT JOIN video_progress vp ON v.video_id = vp.video_id AND vp.user_id = ?
         WHERE v.module_id = ? AND v.order_index = ?`,
        [userId, quiz.module_id, requiredVideoOrder],
        (err, video) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (!video || video.is_complete !== 1) {
            return res.status(403).json({ 
              error: 'กรุณาดูวิดีโอให้ครบ 100% ก่อนทำแบบทดสอบ',
              requires_video_completion: true,
              video_order: requiredVideoOrder,
              module_id: quiz.module_id
            });
          }

          // Video is complete, fetch quiz questions
          db.all(
            'SELECT question_id, question, type, options, order_index FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index',
            [quizId],
            (err, questions) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              if (!questions || questions.length === 0) {
                return res.status(404).json({ 
                  error: 'ไม่พบคำถามในแบบทดสอบนี้',
                  module_id: quiz.module_id
                });
              }

              // Remove correct answers from questions
              const questionsWithoutAnswers = questions.map(q => ({
                ...q,
                options: JSON.parse(q.options || '[]')
              }));
              
              res.json({
                ...quiz,
                questions: questionsWithoutAnswers
              });
            }
          );
        }
      );
    }
  });
});

// Submit quiz
router.post('/:quizId/submit', authenticateToken, (req, res) => {
  const { quizId } = req.params;
  const { answers } = req.body;
  const { userId } = req.user;
  const MAX_ATTEMPTS = 20;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Answers required' });
  }

  // Get quiz and questions
  db.get('SELECT * FROM quizzes WHERE quiz_id = ?', [quizId], (err, quiz) => {
    if (err || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check attempt count (max 20 attempts)
    db.get(
      'SELECT COUNT(*) as attempt_count FROM quiz_results WHERE user_id = ? AND quiz_id = ?',
      [userId, quizId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const attemptCount = result.attempt_count || 0;
        if (attemptCount >= MAX_ATTEMPTS) {
          return res.status(400).json({ 
            error: `คุณทำแบบทดสอบครบ ${MAX_ATTEMPTS} ครั้งแล้ว ไม่สามารถทำได้อีก`,
            attempt_count: attemptCount,
            max_attempts: MAX_ATTEMPTS
          });
        }

        // Check if already completed and retake not allowed
        if (!quiz.allow_retake) {
          db.get(
            'SELECT * FROM quiz_results WHERE user_id = ? AND quiz_id = ?',
            [userId, quizId],
            (err, existing) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              if (existing) {
                return res.status(400).json({ error: 'Quiz already completed. Retake not allowed.' });
              }
              processQuizSubmission(attemptCount + 1);
            }
          );
        } else {
          processQuizSubmission(attemptCount + 1);
        }
      }
    );

    function processQuizSubmission(attemptNumber) {
      db.all(
        'SELECT question_id, correct_answer FROM quiz_questions WHERE quiz_id = ?',
        [quizId],
        (err, questions) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          let correctCount = 0;
          const answerMap = {};
          answers.forEach(answer => {
            answerMap[answer.question_id] = answer.answer;
          });

          questions.forEach(question => {
            const userAnswer = answerMap[question.question_id];
            if (userAnswer === question.correct_answer) {
              correctCount++;
            }
          });

          const score = Math.round((correctCount / questions.length) * 100);
          const passed = score >= quiz.passing_score;

          const resultId = uuidv4();
          db.run(
            'INSERT INTO quiz_results (result_id, user_id, quiz_id, score, passed, answers) VALUES (?, ?, ?, ?, ?, ?)',
            [resultId, userId, quizId, score, passed ? 1 : 0, JSON.stringify(answers)],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to save result' });
              }

              // Update learning hours if passed
              if (passed) {
                db.get('SELECT module_id, order_index FROM quizzes WHERE quiz_id = ?', [quizId], (err, quizData) => {
                  if (!err && quizData) {
                    updateLearningHoursFromQuiz(userId, quizData.module_id);
                    
                    // Check if this is the final quiz and issue certificate automatically
                    checkAndIssueCertificate(userId, quizData.module_id, quizData.order_index || 1);
                  }
                });
              }

              res.json({
                result_id: resultId,
                score,
                passed,
                total_questions: questions.length,
                correct_answers: correctCount,
                passing_score: quiz.passing_score,
                attempt_number: attemptNumber,
                remaining_attempts: MAX_ATTEMPTS - attemptNumber
              });
            }
          );
        }
      );
    }
  });
});

// Get quiz attempt count
router.get('/:quizId/attempts', authenticateToken, (req, res) => {
  const { quizId } = req.params;
  const { userId } = req.user;
  const MAX_ATTEMPTS = 20;

  db.get('SELECT * FROM quizzes WHERE quiz_id = ?', [quizId], (err, quiz) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    db.get(
      'SELECT COUNT(*) as attempt_count FROM quiz_results WHERE user_id = ? AND quiz_id = ?',
      [userId, quizId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const attemptCount = result ? result.attempt_count : 0;
        const isPretest = (typeof quiz.order_index === 'string' ? parseInt(quiz.order_index, 10) : quiz.order_index) === 0;
        
        // For pre-test, check if already attempted (any attempt, passed or failed)
        let canAttempt = true;
        if (isPretest && attemptCount > 0 && !quiz.allow_retake) {
          canAttempt = false; // Pre-test already attempted, no retake allowed
        } else if (attemptCount >= MAX_ATTEMPTS && !quiz.allow_retake) {
          canAttempt = false; // Max attempts reached, no retake allowed
        }

        res.json({
          attempts: attemptCount,
          attempt_count: attemptCount, // For backward compatibility
          max_attempts: MAX_ATTEMPTS,
          remaining_attempts: Math.max(0, MAX_ATTEMPTS - attemptCount),
          can_attempt: canAttempt
        });
      }
    );
  });
});

// Get quiz results for user
router.get('/:quizId/results', authenticateToken, (req, res) => {
  const { quizId } = req.params;
  const { userId } = req.user;

  db.all(
    'SELECT * FROM quiz_results WHERE user_id = ? AND quiz_id = ? ORDER BY completed_at DESC',
    [userId, quizId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    }
  );
});

// Helper function to update learning hours from quiz
function updateLearningHoursFromQuiz(userId, moduleId) {
  const hours = 0.5; // 30 minutes for completing quiz

  db.get(
    'SELECT * FROM learning_hours WHERE user_id = ? AND module_id = ?',
    [userId, moduleId],
    (err, existing) => {
      if (err) return;

      if (existing) {
        db.run(
          'UPDATE learning_hours SET hours = hours + ?, updated_at = CURRENT_TIMESTAMP WHERE hours_id = ?',
          [hours, existing.hours_id]
        );
      } else {
        const hoursId = uuidv4();
        db.run(
          'INSERT INTO learning_hours (hours_id, user_id, module_id, hours) VALUES (?, ?, ?, ?)',
          [hoursId, userId, moduleId, hours]
        );
      }
    }
  );
}

// Check if course is completed and issue certificate automatically
function checkAndIssueCertificate(userId, moduleId, quizOrderIndex) {
  // Check if certificate already exists
  db.get(
    'SELECT * FROM certificates WHERE user_id = ? AND module_id = ?',
    [userId, moduleId],
    (err, existing) => {
      if (err) {
        console.error('Error checking existing certificate:', err);
        return;
      }

      if (existing) {
        // Certificate already issued
        return;
      }

      // Check if all videos are 100% complete
      db.all(
        `SELECT v.video_id, COALESCE(vp.is_complete, 0) as is_complete
         FROM videos v
         LEFT JOIN video_progress vp ON v.video_id = vp.video_id AND vp.user_id = ?
         WHERE v.module_id = ? AND v.url IS NOT NULL AND v.url != ''`,
        [userId, moduleId],
        (err, videos) => {
          if (err) {
            console.error('Error checking video completion:', err);
            return;
          }

          // Check if all videos are complete
          const allVideosComplete = videos.length > 0 && videos.every(v => v.is_complete === 1);

          if (!allVideosComplete) {
            // Not all videos completed yet
            return;
          }

          // Check if all quizzes are passed
          db.all(
            `SELECT q.quiz_id, q.order_index,
                    (SELECT qr2.passed FROM quiz_results qr2 
                     WHERE qr2.quiz_id = q.quiz_id AND qr2.user_id = ? 
                     ORDER BY qr2.completed_at DESC LIMIT 1) as passed
             FROM quizzes q
             WHERE q.module_id = ?
             ORDER BY q.order_index`,
            [userId, moduleId],
            (err, quizzes) => {
              if (err) {
                console.error('Error checking quiz completion:', err);
                return;
              }

              // Check if all quizzes are passed
              const allQuizzesPassed = quizzes.length > 0 && quizzes.every(q => q.passed === 1);

              if (!allQuizzesPassed) {
                // Not all quizzes passed yet
                return;
              }

              // All requirements met - issue certificate automatically
              const certificateId = uuidv4();
              const certificateNumber = `PIM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
              
              // Use system user ID for auto-issued certificates
              const systemUserId = 'system';

              db.run(
                `INSERT INTO certificates (certificate_id, user_id, module_id, certificate_number, issued_by)
                 VALUES (?, ?, ?, ?, ?)`,
                [certificateId, userId, moduleId, certificateNumber, systemUserId],
                function(err) {
                  if (err) {
                    console.error('Error issuing certificate:', err);
                    return;
                  }

                  console.log(`✅ Certificate issued automatically for user ${userId}, module ${moduleId}`);

                  // Create notification
                  const notifId = uuidv4();
                  db.run(
                    `INSERT INTO notifications (notification_id, user_id, title, message, type, link)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [notifId, userId, 'ได้รับใบประกาศนียบัตร', 'คุณได้รับใบประกาศนียบัตรใหม่จากการจบหลักสูตร', 'certificate', `/certificates/${certificateId}`]
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}

module.exports = router;

