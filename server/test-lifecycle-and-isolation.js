const http = require('http');

async function testLifecycleAndIsolation() {
  console.log('\n======================================================');
  console.log('   SKILLTWIN USER ISOLATION & LIFECYCLE VERIFICATION  ');
  console.log('======================================================\n');

  // USER A
  const tsA = Date.now();
  const userA = {
    name: 'Alice Pioneer',
    email: `alice_${tsA}@university.edu`,
    password: 'Password123!'
  };

  console.log(`[Lifecycle] 1. Registering User A (${userA.email})...`);
  const regA = await postJson('/api/auth/register', {
    name: userA.name,
    email: userA.email,
    password: userA.password,
    confirmPassword: userA.password
  });
  if (regA.status !== 201) throw new Error(`User A registration failed: ${JSON.stringify(regA.body)}`);
  const cookieA = extractCookie(regA.headers);

  // Check User A initial stats
  const statsA1 = await get('/api/dashboard/stats', cookieA);
  console.log('[Lifecycle] User A initial stats:', JSON.stringify(statsA1.body.data));
  assert(statsA1.body.data.coverage === 0, 'User A coverage is 0');
  assert(statsA1.body.data.recordedSkills === 0, 'User A recorded skills is 0');
  assert(statsA1.body.data.processedEvidence === 0, 'User A processed evidence is 0');
  assert(statsA1.body.data.reportsGenerated === 0, 'User A reports is 0');
  assert(statsA1.body.data.latestAnalysis === null, 'User A latestAnalysis is null');
  assert(statsA1.body.data.latestReport === null, 'User A latestReport is null');

  // USER B
  const tsB = Date.now() + 10;
  const userB = {
    name: 'Bob Explorer',
    email: `bob_${tsB}@university.edu`,
    password: 'Password123!'
  };

  console.log(`\n[Lifecycle] 2. Registering User B (${userB.email})...`);
  const regB = await postJson('/api/auth/register', {
    name: userB.name,
    email: userB.email,
    password: userB.password,
    confirmPassword: userB.password
  });
  if (regB.status !== 201) throw new Error(`User B registration failed: ${JSON.stringify(regB.body)}`);
  const cookieB = extractCookie(regB.headers);

  // Check User B initial stats
  const statsB1 = await get('/api/dashboard/stats', cookieB);
  console.log('[Lifecycle] User B initial stats:', JSON.stringify(statsB1.body.data));
  assert(statsB1.body.data.coverage === 0, 'User B coverage is 0');
  assert(statsB1.body.data.recordedSkills === 0, 'User B recorded skills is 0');
  assert(statsB1.body.data.reportsGenerated === 0, 'User B reports is 0');

  // Fetch Catalog to get valid skillId
  const skillsRes = await get('/api/skills');
  const catalog = skillsRes.body.data || [];
  const targetSkill = catalog[0] || { id: 'mock-skill-id', _id: 'mock-skill-id' };
  const skillId = targetSkill.id || targetSkill._id;

  // USER A records a skill
  console.log('\n[Lifecycle] 3. User A records a skill...');
  await postJson('/api/student-skills', {
    skillId,
    level: 'Intermediate',
    note: 'Completed course and labs'
  }, cookieA);

  const statsA_after_skill = await get('/api/dashboard/stats', cookieA);
  assert(statsA_after_skill.body.data.recordedSkills === 1, 'User A recorded skills increased to 1');

  // USER B check -> User B recorded skills MUST STILL BE 0!
  const statsB_after_skill = await get('/api/dashboard/stats', cookieB);
  assert(statsB_after_skill.body.data.recordedSkills === 0, 'User B recorded skills remains 0');

  // USER A uploads evidence
  console.log('\n[Lifecycle] 4. User A uploads evidence for the skill...');
  const boundary = '----WebKitFormBoundary' + Math.random().toString(16);
  let multipart = '';
  multipart += `--${boundary}\r\nContent-Disposition: form-data; name="skillId"\r\n\r\n${skillId}\r\n`;
  multipart += `--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nProject_Report.pdf\r\n`;
  multipart += `--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nCompleted architecture diagram and implementation for backend services.\r\n`;
  multipart += `--${boundary}\r\nContent-Disposition: form-data; name="evidenceType"\r\n\r\nproject\r\n`;
  multipart += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="Project_Report.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4 Mock binary content\r\n`;
  multipart += `--${boundary}--\r\n`;

  const upRes = await postRaw('/api/evidence', multipart, `multipart/form-data; boundary=${boundary}`, cookieA);
  console.log('[Lifecycle] User A evidence upload status:', upRes.status);
  assert(upRes.status === 201, 'User A evidence upload returns 201');

  // Wait 1.8s for async evidence processing simulation to complete
  await new Promise(r => setTimeout(r, 1800));

  // USER A checks stats -> processed evidence and coverage update
  const statsA2 = await get('/api/dashboard/stats', cookieA);
  console.log('[Lifecycle] User A stats after evidence processed:', JSON.stringify(statsA2.body.data));
  assert(statsA2.body.data.processedEvidence === 1, 'User A processed evidence is 1');
  assert(statsA2.body.data.coverage === 100, 'User A coverage updated to 100%');

  // USER B checks stats -> MUST REMAIN 0! (User isolation)
  const statsB2 = await get('/api/dashboard/stats', cookieB);
  console.log('[Lifecycle] User B stats (ISOLATION CHECK):', JSON.stringify(statsB2.body.data));
  assert(statsB2.body.data.processedEvidence === 0, 'User B processed evidence remains 0 (ISOLATION VERIFIED)');
  assert(statsB2.body.data.coverage === 0, 'User B coverage remains 0%');

  // USER A submits job circular and generates report
  console.log('\n[Lifecycle] 5. User A submits job circular and generates gap report...');
  const jobResA = await postJson('/api/job-circulars', {
    title: 'Senior Backend Engineer',
    company: 'Fintech Cloud Ltd',
    rawText: 'Requirements: Node.js, Docker, Kubernetes, PostgreSQL.'
  }, cookieA);
  const circularId = jobResA.body.data.circular.id || jobResA.body.data.circular._id;

  const reportResA = await postJson(`/api/job-circulars/${circularId}/analyze`, {}, cookieA);
  console.log('[Lifecycle] User A report generated:', reportResA.status, 'matchScore:', reportResA.body.data?.matchScore);

  // USER A dashboard stats
  const statsA3 = await get('/api/dashboard/stats', cookieA);
  console.log('[Lifecycle] User A stats after report:', JSON.stringify(statsA3.body.data));
  assert(statsA3.body.data.reportsGenerated === 1, 'User A reports generated is 1');
  assert(statsA3.body.data.latestAnalysis === 'Senior Backend Engineer', 'User A latestAnalysis matches circular');
  assert(statsA3.body.data.latestReport !== null, 'User A latestReport is populated');

  // USER B dashboard stats MUST STILL BE 0 / null
  const statsB3 = await get('/api/dashboard/stats', cookieB);
  console.log('[Lifecycle] User B stats final check:', JSON.stringify(statsB3.body.data));
  assert(statsB3.body.data.reportsGenerated === 0, 'User B reports generated remains 0');
  assert(statsB3.body.data.latestAnalysis === null, 'User B latestAnalysis remains null');
  assert(statsB3.body.data.latestReport === null, 'User B latestReport remains null');

  console.log('\n======================================================');
  console.log('   ALL USER ISOLATION & LIFECYCLE TESTS PASSED!       ');
  console.log('======================================================\n');
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAILED]: ${message}`);
    process.exit(1);
  }
  console.log(`  [PASSED]: ${message}`);
}

function extractCookie(headers) {
  const cookies = headers['set-cookie'] || [];
  return cookies.map(c => c.split(';')[0]).join('; ');
}

function postJson(path, body, cookie = '') {
  const payload = JSON.stringify(body);
  return postRaw(path, payload, 'application/json', cookie);
}

function postRaw(path, payload, contentType, cookie = '') {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': contentType,
      'Content-Length': Buffer.byteLength(payload)
    };
    if (cookie) headers['Cookie'] = cookie;

    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method: 'POST',
      headers
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path, cookie = '') {
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
      res.on('data', c => data += c);
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

testLifecycleAndIsolation().catch(err => {
  console.error('[Lifecycle Test Fatal Error]:', err);
  process.exit(1);
});
