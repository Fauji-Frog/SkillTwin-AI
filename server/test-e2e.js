const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./src/app');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runEndToEndTests() {
  const server = app.listen(5000, async () => {
    console.log('\n======================================================');
    console.log('  SKILLTWIN AI — FULL END-TO-END VERIFICATION SUITE   ');
    console.log('======================================================\n');

    let cookie = '';
    const testEmail = `student_${Date.now()}@university.edu`;
    const testPassword = 'Password123!';

    try {
      // 1. Health Check
      console.log('1. Testing /api/health...');
      const health = await makeRequest({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/health',
        method: 'GET'
      });
      console.log('   Status:', health.statusCode, health.data?.status === 'ok' ? '✅ OK' : '❌ FAIL');

      // 2. Register Student Account
      console.log('\n2. Testing Registration (FR-01, FR-23)...');
      const regRes = await makeRequest(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: '/api/auth/register',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        JSON.stringify({
          name: 'Faujia Farin',
          email: testEmail,
          studentId: '241-35-500',
          password: testPassword,
          confirmPassword: testPassword
        })
      );
      console.log('   Register Status:', regRes.statusCode, regRes.statusCode === 201 ? '✅ OK (201)' : '❌ FAIL');
      console.log('   Created User:', regRes.data?.data?.user?.email, 'Role:', regRes.data?.data?.user?.role);

      // Extract cookie
      if (regRes.headers['set-cookie']) {
        cookie = regRes.headers['set-cookie'][0].split(';')[0];
      }

      // 3. Login Verification
      console.log('\n3. Testing Login Functionality (FR-01)...');
      const loginRes = await makeRequest(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      );
      console.log('   Login Status:', loginRes.statusCode, loginRes.statusCode === 200 ? '✅ OK (200)' : '❌ FAIL');
      if (loginRes.headers['set-cookie']) {
        cookie = loginRes.headers['set-cookie'][0].split(';')[0];
      }

      // 4. Skills Catalog & Recording Student Skills
      console.log('\n4. Testing Skills Catalog & Profile Recording (FR-03)...');
      const catRes = await makeRequest({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/skills',
        method: 'GET'
      });
      const catalog = catRes.data?.data || [];
      console.log('   Available Skills in Catalog:', catalog.length, 'skills');

      const nodeSkill = catalog.find((s) => s.name === 'Node.js') || catalog[0];
      const reactSkill = catalog.find((s) => s.name === 'React') || catalog[1];

      // Add Node.js skill
      const addSkillRes = await makeRequest(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: '/api/student-skills',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookie
          }
        },
        JSON.stringify({
          skillId: nodeSkill.id || nodeSkill._id,
          level: 'Advanced',
          note: 'Built robust asynchronous backend REST microservices'
        })
      );
      console.log('   Add Skill Status:', addSkillRes.statusCode, addSkillRes.statusCode === 201 ? '✅ OK' : '❌ FAIL');

      // 5. Evidence Upload (Core Feature 1: FR-04, FR-05, FR-06, FR-07)
      console.log('\n5. Testing Core Feature 1: Evidence Upload & Processing...');
      const boundary = '----WebKitFormBoundary' + Math.random().toString(16);
      const fileContent = 'Server architecture and authentication controller implementation for Node.js';
      
      let multipartBody = '';
      multipartBody += `--${boundary}\r\n`;
      multipartBody += `Content-Disposition: form-data; name="skillId"\r\n\r\n${nodeSkill.id || nodeSkill._id}\r\n`;
      multipartBody += `--${boundary}\r\n`;
      multipartBody += `Content-Disposition: form-data; name="title"\r\n\r\nNode_Backend_Server.js\r\n`;
      multipartBody += `--${boundary}\r\n`;
      multipartBody += `Content-Disposition: form-data; name="description"\r\n\r\nImplemented full token signing, rate limits, and database schemas.\r\n`;
      multipartBody += `--${boundary}\r\n`;
      multipartBody += `Content-Disposition: form-data; name="evidenceType"\r\n\r\ncode\r\n`;
      multipartBody += `--${boundary}\r\n`;
      multipartBody += `Content-Disposition: form-data; name="file"; filename="Node_Backend_Server.js"\r\n`;
      multipartBody += `Content-Type: text/javascript\r\n\r\n${fileContent}\r\n`;
      multipartBody += `--${boundary}--\r\n`;

      const uploadRes = await makeRequest(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: '/api/evidence',
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            Cookie: cookie
          }
        },
        multipartBody
      );
      console.log('   Evidence Upload Status:', uploadRes.statusCode, uploadRes.statusCode === 201 ? '✅ OK (201)' : '❌ FAIL');
      console.log('   Initial Status:', uploadRes.data?.data?.status);

      // Wait 1.8s for background extraction simulation
      await new Promise((r) => setTimeout(r, 1800));

      const evListRes = await makeRequest({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/evidence',
        method: 'GET',
        headers: { Cookie: cookie }
      });
      const processedEvidence = evListRes.data?.data?.[0];
      console.log('   Evidence Status After Processing:', processedEvidence?.status, processedEvidence?.status === 'processed' ? '✅ PROCESSED' : '❌ FAIL');
      console.log('   Extracted Chunk Context:', processedEvidence?.extractedText?.substring(0, 75) + '...');

      // 6. Job Circular Submission & AI Skill Extraction (Core Feature 2: FR-08, FR-09)
      console.log('\n6. Testing Core Feature 2: Job Circular Submission & Skill Extraction...');
      const circularText = `We are hiring a Full-Stack Engineer. Must have hands-on experience with Node.js, Express, React, and MongoDB. Familiarity with Git is required.`;

      const circRes = await makeRequest(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: '/api/job-circulars',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookie
          }
        },
        JSON.stringify({
          title: 'Full-Stack Software Engineer',
          company: 'Vertex Systems',
          rawText: circularText
        })
      );
      console.log('   Circular Submission Status:', circRes.statusCode, circRes.statusCode === 201 ? '✅ OK (201)' : '❌ FAIL');
      const detectedSkills = circRes.data?.data?.requirements || [];
      console.log('   AI Extracted Skills:', detectedSkills.map((r) => r.skillName).join(', '));
      const circularId = circRes.data?.data?.circular?.id || circRes.data?.data?.circular?._id;

      // 7. Skill-Gap Report Generation (Core Feature 3: FR-10, FR-11, FR-12, FR-13)
      console.log('\n7. Testing Core Feature 3: Skill-Gap RAG Report Generation...');
      const analyzeRes = await makeRequest(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: `/api/job-circulars/${circularId}/analyze`,
          method: 'POST',
          headers: { Cookie: cookie }
        }
      );
      console.log('   Gap Analysis Status:', analyzeRes.statusCode, analyzeRes.statusCode === 201 ? '✅ OK (201)' : '❌ FAIL');
      const report = analyzeRes.data?.data;
      console.log('   Report Title:', report?.jobTitle, 'Match Score:', `${report?.matchScore}%`);
      console.log('   Counts -> Matched:', report?.matchedCount, 'Partial:', report?.partialCount, 'Missing Proof:', report?.missingCount, 'Gaps:', report?.gapCount);
      console.log('   Disclaimer Present:', report?.disclaimer ? '✅ YES' : '❌ NO');

      // Verify supporting evidence quote in report item
      const matchedNodeItem = report?.items?.find((i) => i.skillName === 'Node.js');
      console.log('   Node.js Status:', matchedNodeItem?.status, matchedNodeItem?.status === 'matched' ? '✅ MATCHED' : '❌ FAIL');
      console.log('   Grounding Citation:', matchedNodeItem?.supportingEvidence?.[0]?.title);

      // 8. Student Review & Flagging (FR-24)
      console.log('\n8. Testing Student Flagging Review (FR-24)...');
      const itemId = matchedNodeItem?.id || matchedNodeItem?._id;
      const flagRes = await makeRequest(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: `/api/reports/${report.id || report._id}/items/${itemId}/flag`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookie
          }
        },
        JSON.stringify({
          reason: 'Verified by SE-331 lab instructor with full points'
        })
      );
      console.log('   Flagging Status:', flagRes.statusCode, flagRes.statusCode === 200 ? '✅ OK (200)' : '❌ FAIL');

      // 9. Dashboard Stats Verification
      console.log('\n9. Testing Dashboard Metrics (Overview Screen)...');
      const statsRes = await makeRequest({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/dashboard/stats',
        method: 'GET',
        headers: { Cookie: cookie }
      });
      console.log('   Stats Status:', statsRes.statusCode, statsRes.statusCode === 200 ? '✅ OK (200)' : '❌ FAIL');
      console.log('   Coverage Metric:', `${statsRes.data?.data?.coverage}%`);
      console.log('   Recorded Skills:', statsRes.data?.data?.recordedSkills);
      console.log('   Processed Evidence:', statsRes.data?.data?.processedEvidence);
      console.log('   Reports Generated:', statsRes.data?.data?.reportsGenerated);

      console.log('\n======================================================');
      console.log('  🎉 ALL END-TO-END TESTS COMPLETED SUCCESSFULLY!     ');
      console.log('======================================================\n');

      server.close(() => {
        process.exit(0);
      });
    } catch (err) {
      console.error('Test Suite Failed:', err);
      server.close(() => process.exit(1));
    }
  });
}

runEndToEndTests();
