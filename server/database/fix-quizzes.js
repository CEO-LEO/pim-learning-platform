const db = require('./init');
const { v4: uuidv4 } = require('uuid');

const moduleId = process.argv[2] || 'module_1';

console.log(`🔧 Fixing quizzes for module: ${moduleId}...`);

// Step 1: Add order_index column if it doesn't exist
db.run(
  `ALTER TABLE quizzes ADD COLUMN order_index INTEGER DEFAULT 1`,
  (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Error adding order_index column:', err.message);
    } else {
      console.log('✅ Added order_index column (or already exists)');
    }

    // Step 2: Get all quizzes for this module
    db.all('SELECT quiz_id, title FROM quizzes WHERE module_id = ?', [moduleId], (err, quizzes) => {
      if (err) {
        console.error('❌ Error fetching quizzes:', err.message);
        db.close();
        process.exit(1);
      }

      console.log(`\n📋 Found ${quizzes.length} quizzes in module ${moduleId}`);

      // Step 3: Keep only the first quiz, delete the rest
      if (quizzes.length > 0) {
        const firstQuiz = quizzes[0];
        const quizzesToDelete = quizzes.slice(1);

        // Update first quiz to order_index = 1
        db.run(
          'UPDATE quizzes SET order_index = 1 WHERE quiz_id = ?',
          [firstQuiz.quiz_id],
          (err) => {
            if (err) {
              console.error('❌ Error updating first quiz:', err.message);
            } else {
              console.log(`✅ Updated quiz 1: ${firstQuiz.title} (order_index = 1)`);
            }

            // Delete all other quizzes
            if (quizzesToDelete.length > 0) {
              const quizIds = quizzesToDelete.map(q => q.quiz_id);
              const placeholders = quizIds.map(() => '?').join(',');
              
              // Delete quiz results first
              db.run(
                `DELETE FROM quiz_results WHERE quiz_id IN (${placeholders})`,
                quizIds,
                function(err) {
                  if (err) {
                    console.error('❌ Error deleting quiz results:', err.message);
                  } else {
                    console.log(`✅ Deleted ${this.changes} quiz results`);
                  }

                  // Delete quiz questions
                  db.run(
                    `DELETE FROM quiz_questions WHERE quiz_id IN (${placeholders})`,
                    quizIds,
                    function(err) {
                      if (err) {
                        console.error('❌ Error deleting quiz questions:', err.message);
                      } else {
                        console.log(`✅ Deleted ${this.changes} quiz questions`);
                      }

                      // Delete quizzes
                      db.run(
                        `DELETE FROM quizzes WHERE quiz_id IN (${placeholders})`,
                        quizIds,
                        function(err) {
                          if (err) {
                            console.error('❌ Error deleting quizzes:', err.message);
                          } else {
                            console.log(`✅ Deleted ${this.changes} duplicate quizzes`);
                          }

                          // Step 4: Create quiz 2 if it doesn't exist
                          db.get(
                            'SELECT quiz_id FROM quizzes WHERE module_id = ? AND order_index = 2',
                            [moduleId],
                            (err, existingQuiz2) => {
                              if (err) {
                                console.error('❌ Error checking for quiz 2:', err.message);
                                db.close();
                                process.exit(1);
                              }

                              if (!existingQuiz2) {
                                // Create quiz 2
                                const quiz2Id = uuidv4();
                                db.run(
                                  'INSERT INTO quizzes (quiz_id, module_id, title, time_limit, passing_score, allow_retake, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
                                  [quiz2Id, moduleId, 'แบบทดสอบ - การบริการ (แบบทดสอบที่ 2)', 30, 70, 1, 2],
                                  function(err) {
                                    if (err) {
                                      console.error('❌ Error creating quiz 2:', err.message);
                                    } else {
                                      console.log(`✅ Created quiz 2: ${quiz2Id}`);

                                      // Create 3 sample questions for quiz 2
                                      const questions = [
                                        {
                                          question: 'คำถามที่ 1 เกี่ยวกับการบริการ (แบบทดสอบที่ 2)',
                                          options: ['ตัวเลือก 1', 'ตัวเลือก 2', 'ตัวเลือก 3', 'ตัวเลือก 4'],
                                          correct: 'ตัวเลือก 1',
                                        },
                                        {
                                          question: 'คำถามที่ 2 เกี่ยวกับการบริการ (แบบทดสอบที่ 2)',
                                          options: ['ตัวเลือก A', 'ตัวเลือก B', 'ตัวเลือก C', 'ตัวเลือก D'],
                                          correct: 'ตัวเลือก B',
                                        },
                                        {
                                          question: 'คำถามที่ 3 เกี่ยวกับการบริการ (แบบทดสอบที่ 2)',
                                          options: ['ตัวเลือก X', 'ตัวเลือก Y', 'ตัวเลือก Z', 'ตัวเลือก W'],
                                          correct: 'ตัวเลือก Z',
                                        },
                                      ];

                                      let questionsCreated = 0;
                                      questions.forEach((q, qIndex) => {
                                        const questionId = uuidv4();
                                        db.run(
                                          'INSERT INTO quiz_questions (question_id, quiz_id, question, type, options, correct_answer, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
                                          [
                                            questionId,
                                            quiz2Id,
                                            q.question,
                                            'multiple_choice',
                                            JSON.stringify(q.options),
                                            q.correct,
                                            qIndex + 1,
                                          ],
                                          function(err) {
                                            if (err) {
                                              console.error(`❌ Error creating question ${qIndex + 1}:`, err.message);
                                            } else {
                                              questionsCreated++;
                                              if (questionsCreated === questions.length) {
                                                console.log(`✅ Created ${questionsCreated} questions for quiz 2`);
                                                console.log('\n🎉 Quiz setup completed!');
                                                console.log(`   - Quiz 1: ${firstQuiz.quiz_id} (order_index = 1)`);
                                                console.log(`   - Quiz 2: ${quiz2Id} (order_index = 2)`);
                                                db.close();
                                                process.exit(0);
                                              }
                                            }
                                          }
                                        );
                                      });
                                    }
                                  }
                                );
                              } else {
                                console.log('✅ Quiz 2 already exists');
                                console.log('\n🎉 Quiz setup completed!');
                                db.close();
                                process.exit(0);
                              }
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            } else {
              // No quizzes to delete, just create quiz 2
              db.get(
                'SELECT quiz_id FROM quizzes WHERE module_id = ? AND order_index = 2',
                [moduleId],
                (err, existingQuiz2) => {
                  if (err) {
                    console.error('❌ Error checking for quiz 2:', err.message);
                    db.close();
                    process.exit(1);
                  }

                  if (!existingQuiz2) {
                    const quiz2Id = uuidv4();
                    db.run(
                      'INSERT INTO quizzes (quiz_id, module_id, title, time_limit, passing_score, allow_retake, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
                      [quiz2Id, moduleId, 'แบบทดสอบ - การบริการ (แบบทดสอบที่ 2)', 30, 70, 1, 2],
                      function(err) {
                        if (err) {
                          console.error('❌ Error creating quiz 2:', err.message);
                        } else {
                          console.log(`✅ Created quiz 2: ${quiz2Id}`);
                        }
                        db.close();
                        process.exit(0);
                      }
                    );
                  } else {
                    console.log('✅ Quiz 2 already exists');
                    db.close();
                    process.exit(0);
                  }
                }
              );
            }
          }
        );
      } else {
        console.log('❌ No quizzes found in module');
        db.close();
        process.exit(1);
      }
    });
  }
);

