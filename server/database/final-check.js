const db = require('./init');

const moduleIds = ['module_1', 'module_2'];

const check = async () => {
  for (const moduleId of moduleIds) {
    console.log(`\n--- Checking Module: ${moduleId} ---`);
    
    const videos = await new Promise((resolve) => {
      db.all('SELECT title, order_index, url FROM videos WHERE module_id = ? AND url IS NOT NULL AND url != "" ORDER BY order_index', [moduleId], (err, rows) => resolve(rows));
    });
    console.log(`📹 Videos: ${videos.length}`);
    videos.forEach(v => console.log(`   - [${v.order_index}] ${v.title} (${v.url})`));
    
    const quizzes = await new Promise((resolve) => {
      db.all('SELECT title, order_index FROM quizzes WHERE module_id = ? ORDER BY order_index', [moduleId], (err, rows) => resolve(rows));
    });
    console.log(`📝 Quizzes: ${quizzes.length}`);
    quizzes.forEach(q => console.log(`   - [${q.order_index}] ${q.title}`));
  }
  db.close();
};

check();

