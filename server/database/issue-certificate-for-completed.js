const db = require('./init');
const { v4: uuidv4 } = require('uuid');

const userId = process.argv[2] || 'admin_1';
const moduleId = process.argv[3] || 'module_1';

console.log(`🔍 Checking course completion for user: ${userId}, module: ${moduleId}...`);

// Check if certificate already exists
db.get(
  'SELECT * FROM certificates WHERE user_id = ? AND module_id = ?',
  [userId, moduleId],
  (err, existing) => {
    if (err) {
      console.error('❌ Error checking existing certificate:', err.message);
      db.close();
      process.exit(1);
    }

    if (existing) {
      console.log('✅ Certificate already exists:');
      console.log(`   Certificate ID: ${existing.certificate_id}`);
      console.log(`   Certificate Number: ${existing.certificate_number}`);
      console.log(`   Issued at: ${existing.issued_at}`);
      db.close();
      process.exit(0);
    }

    // Check if all videos are 100% complete
    db.all(
      `SELECT v.video_id, v.title, v.order_index, COALESCE(vp.is_complete, 0) as is_complete
       FROM videos v
       LEFT JOIN video_progress vp ON v.video_id = vp.video_id AND vp.user_id = ?
       WHERE v.module_id = ? AND v.url IS NOT NULL AND v.url != ''
       ORDER BY v.order_index`,
      [userId, moduleId],
      (err, videos) => {
        if (err) {
          console.error('❌ Error checking video completion:', err.message);
          db.close();
          process.exit(1);
        }

        console.log(`\n📹 Videos completion status:`);
        videos.forEach(v => {
          console.log(`   Video ${v.order_index}: ${v.title} - ${v.is_complete === 1 ? '✅ Complete' : '❌ Incomplete'}`);
        });

        const allVideosComplete = videos.length > 0 && videos.every(v => v.is_complete === 1);

        if (!allVideosComplete) {
          console.log('\n❌ Not all videos are complete yet');
          db.close();
          process.exit(1);
        }

        console.log('\n✅ All videos are complete');

        // Check if all quizzes are passed
        db.all(
          `SELECT q.quiz_id, q.order_index, q.title,
                  (SELECT qr2.passed FROM quiz_results qr2 
                   WHERE qr2.quiz_id = q.quiz_id AND qr2.user_id = ? 
                   ORDER BY qr2.completed_at DESC LIMIT 1) as passed,
                  (SELECT qr2.score FROM quiz_results qr2 
                   WHERE qr2.quiz_id = q.quiz_id AND qr2.user_id = ? 
                   ORDER BY qr2.completed_at DESC LIMIT 1) as score
           FROM quizzes q
           WHERE q.module_id = ?
           ORDER BY q.order_index`,
          [userId, userId, moduleId],
          (err, quizzes) => {
            if (err) {
              console.error('❌ Error checking quiz completion:', err.message);
              db.close();
              process.exit(1);
            }

            console.log(`\n📝 Quizzes completion status:`);
            quizzes.forEach(q => {
              const status = q.passed === 1 ? `✅ Passed (${q.score}%)` : `❌ Not passed (${q.score || 'N/A'}%)`;
              console.log(`   Quiz ${q.order_index}: ${q.title} - ${status}`);
            });

            const allQuizzesPassed = quizzes.length > 0 && quizzes.every(q => q.passed === 1);

            if (!allQuizzesPassed) {
              console.log('\n❌ Not all quizzes are passed yet');
              db.close();
              process.exit(1);
            }

            console.log('\n✅ All quizzes are passed');

            // All requirements met - issue certificate
            const certificateId = uuidv4();
            const certificateNumber = `PIM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            const systemUserId = 'system';

            db.run(
              `INSERT INTO certificates (certificate_id, user_id, module_id, certificate_number, issued_by)
               VALUES (?, ?, ?, ?, ?)`,
              [certificateId, userId, moduleId, certificateNumber, systemUserId],
              function(err) {
                if (err) {
                  console.error('❌ Error issuing certificate:', err.message);
                  db.close();
                  process.exit(1);
                }

                console.log('\n🎉 Certificate issued successfully!');
                console.log(`   Certificate ID: ${certificateId}`);
                console.log(`   Certificate Number: ${certificateNumber}`);
                console.log(`   Issued by: System (automatic)`);

                // Create notification
                const notifId = uuidv4();
                db.run(
                  `INSERT INTO notifications (notification_id, user_id, title, message, type, link)
                   VALUES (?, ?, ?, ?, ?, ?)`,
                  [notifId, userId, 'ได้รับใบประกาศนียบัตร', 'คุณได้รับใบประกาศนียบัตรใหม่จากการจบหลักสูตร', 'certificate', `/certificates/${certificateId}`],
                  (err) => {
                    if (err) {
                      console.error('⚠️  Warning: Failed to create notification:', err.message);
                    } else {
                      console.log('✅ Notification created');
                    }
                    db.close();
                    process.exit(0);
                  }
                );
              }
            );
          }
        );
      }
    );
  }
);

