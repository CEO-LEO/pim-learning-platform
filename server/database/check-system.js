const db = require('./init');

/**
 * System Health Check Script
 * Check database integrity and system readiness
 */

function checkSystem() {
  console.log('🔍 Checking system status...\n');

  const checks = [
    {
      name: 'Users',
      query: 'SELECT COUNT(*) as count, SUM(CASE WHEN role = "admin" THEN 1 ELSE 0 END) as admins, SUM(CASE WHEN role = "student" THEN 1 ELSE 0 END) as students FROM users'
    },
    {
      name: 'Modules',
      query: 'SELECT COUNT(*) as count FROM modules'
    },
    {
      name: 'Videos',
      query: 'SELECT COUNT(*) as count FROM videos'
    },
    {
      name: 'Quizzes',
      query: 'SELECT COUNT(*) as count FROM quizzes'
    },
    {
      name: 'Rooms',
      query: 'SELECT COUNT(*) as count, SUM(CASE WHEN status = "available" THEN 1 ELSE 0 END) as available FROM rooms'
    },
    {
      name: 'Room Bookings',
      query: 'SELECT COUNT(*) as count, SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status = "approved" THEN 1 ELSE 0 END) as approved FROM room_bookings'
    },
    {
      name: 'Practical Exams',
      query: 'SELECT COUNT(*) as count, SUM(CASE WHEN status = "open" THEN 1 ELSE 0 END) as open FROM practical_exams'
    },
    {
      name: 'Notifications',
      query: 'SELECT COUNT(*) as count, SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread FROM notifications'
    }
  ];

  let completed = 0;
  const results = {};

  checks.forEach(check => {
    db.get(check.query, [], (err, result) => {
      if (err) {
        console.error(`❌ ${check.name}: Error - ${err.message}`);
      } else {
        results[check.name] = result;
        
        // Display result
        if (check.name === 'Users') {
          console.log(`✅ ${check.name}: ${result.count} total (${result.admins} admins, ${result.students} students)`);
        } else if (check.name === 'Rooms') {
          console.log(`✅ ${check.name}: ${result.count} total (${result.available} available)`);
        } else if (check.name === 'Room Bookings') {
          console.log(`✅ ${check.name}: ${result.count} total (${result.pending} pending, ${result.approved} approved)`);
        } else if (check.name === 'Practical Exams') {
          console.log(`✅ ${check.name}: ${result.count} total (${result.open} open)`);
        } else if (check.name === 'Notifications') {
          console.log(`✅ ${check.name}: ${result.count} total (${result.unread} unread)`);
        } else {
          console.log(`✅ ${check.name}: ${result.count}`);
        }
      }
      
      completed++;
      if (completed === checks.length) {
        displaySummary(results);
      }
    });
  });
}

function displaySummary(results) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 SYSTEM SUMMARY');
  console.log('='.repeat(50));
  
  const issues = [];
  
  // Check for issues
  if (!results.Users || results.Users.admins === 0) {
    issues.push('⚠️  No admin users found! Please create an admin account.');
  }
  
  if (!results.Modules || results.Modules.count === 0) {
    issues.push('⚠️  No modules found! Please run database seed.');
  }
  
  if (!results.Rooms || results.Rooms.count === 0) {
    issues.push('⚠️  No rooms found! Run: node server/database/setup-rooms.js');
  }
  
  if (!results['Practical Exams'] || results['Practical Exams'].count === 0) {
    issues.push('⚠️  No exam slots found! They should be auto-generated on startup.');
  }
  
  if (issues.length > 0) {
    console.log('\n🔧 ISSUES FOUND:');
    issues.forEach(issue => console.log(issue));
  } else {
    console.log('\n✅ System is ready for production!');
  }
  
  console.log('\n💡 USEFUL COMMANDS:');
  console.log('   - Setup rooms: node server/database/setup-rooms.js');
  console.log('   - Seed database: node server/database/seed.js');
  console.log('   - Create admin: node server/database/create-instructor.js');
  console.log('   - Check system: node server/database/check-system.js');
  
  console.log('\n🌐 API Endpoints for Admin:');
  console.log('   - Dashboard: GET /api/admin/dashboard/room-bookings');
  console.log('   - Pending bookings: GET /api/admin/room-bookings/pending');
  console.log('   - Today bookings: GET /api/admin/room-bookings/today');
  console.log('   - Notifications: GET /api/notifications');
  
  console.log('\n' + '='.repeat(50));
  process.exit(0);
}

// Run the check
checkSystem();
