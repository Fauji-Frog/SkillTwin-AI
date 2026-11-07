const http = require('http');

async function run() {
  const ts = Date.now();
  const email = `newstudent_${ts}@example.com`;
  const password = 'StrongPassword123!';
  const name = 'New Test Student';

  console.log(`[Test] Registering new student: ${email}...`);

  // Step 1: Register
  const regData = JSON.stringify({ name, email, password, confirmPassword: password });
  const regRes = await post('/api/auth/register', regData);
  console.log('[Test] Register response:', regRes.status, regRes.body);

  if (regRes.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
  }

  // Extract cookies
  const cookies = regRes.headers['set-cookie'] || [];
  const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
  console.log('[Test] Cookie received:', cookieHeader ? 'YES' : 'NO');

  // Step 2: Get Dashboard Stats
  const statsRes = await get('/api/dashboard/stats', cookieHeader);
  console.log('[Test] Stats response:', JSON.stringify(statsRes.body, null, 2));

  const data = statsRes.body.data;
  if (!data) {
    throw new Error('No data returned from /api/dashboard/stats');
  }

  const assertions = [
    { name: 'coverage === 0', pass: data.coverage === 0, val: data.coverage },
    { name: 'recordedSkills === 0', pass: data.recordedSkills === 0, val: data.recordedSkills },
    { name: 'processedEvidence === 0', pass: data.processedEvidence === 0, val: data.processedEvidence },
    { name: 'reportsGenerated === 0', pass: data.reportsGenerated === 0, val: data.reportsGenerated },
    { name: 'skillsToStrengthen is empty []', pass: Array.isArray(data.skillsToStrengthen) && data.skillsToStrengthen.length === 0, val: data.skillsToStrengthen },
    { name: 'latestAnalysis === null', pass: data.latestAnalysis === null, val: data.latestAnalysis },
    { name: 'latestReport === null', pass: data.latestReport === null, val: data.latestReport },
  ];

  let failed = false;
  for (const a of assertions) {
    if (a.pass) {
      console.log(`  PASS: ${a.name}`);
    } else {
      console.log(`  FAIL: ${a.name} (got ${JSON.stringify(a.val)})`);
      failed = true;
    }
  }

  if (failed) {
    console.error('[Test] Some assertions failed!');
    process.exit(1);
  } else {
    console.log('[Test] ALL ASSERTIONS PASSED! Brand new user receives pure zero/null dashboard stats.');
  }
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(path, cookie) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (cookie) headers['Cookie'] = cookie;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method: 'GET',
      headers
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

run().catch(err => {
  console.error('[Test Error]:', err);
  process.exit(1);
});
