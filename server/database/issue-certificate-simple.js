const db = require('./init');
const { v4: uuidv4 } = require('uuid');

// Usage: node issue-certificate-simple.js <userId> <moduleId>
const userId = process.argv[2] || 'admin_1';
const moduleId = process.argv[3] || 'module_1';

console.log(`🔍 Simple issue certificate for user: ${userId}, module: ${moduleId}...`);

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
      db.close();
      process.exit(0);
    }

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

        console.log('🎉 Certificate issued successfully!');
        console.log(`   Certificate ID: ${certificateId}`);
        console.log(`   Certificate Number: ${certificateNumber}`);

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


