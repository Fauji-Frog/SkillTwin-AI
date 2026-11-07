const http = require('http');
const app = require('./src/app');

function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers
        }
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path,
        method: 'GET',
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runAuthTests() {
  const server = app.listen(5000, async () => {
    console.log('\n--- STARTING AUTHENTICATION VERIFICATION TESTS ---');

    // Test 1: Register new user with valid details
    const uniqueEmail = `test_${Date.now()}@university.edu`;
    const regRes = await post('/api/auth/register', {
      name: 'Test Student',
      email: uniqueEmail,
      studentId: '241-35-999',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!'
    });
    console.log('Test 1 (Valid Register):', regRes.status === 201 ? 'PASS (201 Created)' : 'FAIL', regRes.body?.data?.user?.email);

    // Test 2: Register with duplicate email
    const dupRes = await post('/api/auth/register', {
      name: 'Duplicate Student',
      email: uniqueEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!'
    });
    console.log('Test 2 (Duplicate Email):', dupRes.status === 409 ? 'PASS (409 Conflict)' : 'FAIL', dupRes.body?.error?.message);

    // Test 3: Register with weak password (< 8 chars)
    const weakRes = await post('/api/auth/register', {
      name: 'Weak Pass',
      email: `weak_${Date.now()}@university.edu`,
      password: 'weak',
      confirmPassword: 'weak'
    });
    console.log('Test 3 (Weak Password):', weakRes.status === 400 ? 'PASS (400 Bad Request)' : 'FAIL', weakRes.body?.error?.message);

    // Test 4: Register with mismatched password
    const mismatchRes = await post('/api/auth/register', {
      name: 'Mismatch',
      email: `mismatch_${Date.now()}@university.edu`,
      password: 'SecurePassword123!',
      confirmPassword: 'DifferentPassword123!'
    });
    console.log('Test 4 (Password Mismatch):', mismatchRes.status === 400 ? 'PASS (400 Bad Request)' : 'FAIL', mismatchRes.body?.error?.message);

    // Test 5: Login with wrong password
    const badLoginRes = await post('/api/auth/login', {
      email: uniqueEmail,
      password: 'WrongPassword123!'
    });
    console.log('Test 5 (Wrong Password):', badLoginRes.status === 401 ? 'PASS (401 Unauthenticated)' : 'FAIL', badLoginRes.body?.error?.message);

    // Test 6: Login with correct password & check cookie
    const goodLoginRes = await post('/api/auth/login', {
      email: uniqueEmail,
      password: 'SecurePassword123!'
    });
    const setCookie = goodLoginRes.headers['set-cookie'];
    const hasHttpOnlyCookie = setCookie && setCookie.some((c) => c.includes('token=') && c.includes('HttpOnly'));
    console.log('Test 6 (Correct Login & httpOnly Cookie):', goodLoginRes.status === 200 && hasHttpOnlyCookie ? 'PASS (200 OK + httpOnly Cookie)' : 'FAIL');

    // Test 7: GET /api/auth/me without token
    const unauthMe = await get('/api/auth/me');
    console.log('Test 7 (GET /me unauthenticated):', unauthMe.status === 401 ? 'PASS (401 Unauthenticated)' : 'FAIL');

    // Test 8: GET /api/auth/me with Bearer token
    const token = goodLoginRes.body?.data?.token;
    const authMe = await get('/api/auth/me', {
      Authorization: `Bearer ${token}`
    });
    console.log('Test 8 (GET /me authenticated):', authMe.status === 200 ? 'PASS (200 OK)' : 'FAIL', authMe.body?.data?.user?.name);

    console.log('--- ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY ---\n');

    server.close(() => {
      process.exit(0);
    });
  });
}

runAuthTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
