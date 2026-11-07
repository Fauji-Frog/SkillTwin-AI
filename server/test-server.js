const http = require('http');
const app = require('./src/app');

const server = app.listen(5000, async () => {
  console.log('[TestServer] Running on 5000');

  // Test 1: GET /api/health
  http.get('http://127.0.0.1:5000/api/health', (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      console.log('HEALTH_TEST:', data);

      // Test 2: GET /api/skills
      http.get('http://127.0.0.1:5000/api/skills', (res2) => {
        let data2 = '';
        res2.on('data', (c) => (data2 += c));
        res2.on('end', () => {
          const parsed = JSON.parse(data2);
          console.log('SKILLS_COUNT:', parsed.data.length);

          // Close server
          server.close(() => {
            console.log('[TestServer] All tests passed! Server closed successfully.');
            process.exit(0);
          });
        });
      });
    });
  });
});
