const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:5000';
let authToken = '';
let testUserId = '';
let testBookId = '';

// Test data
const testUser = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!'
};

const testBook = {
  googleBookId: 'test_book_123',
  title: 'Test Book Title',
  authors: ['Test Author'],
  thumbnail: 'https://example.com/thumbnail.jpg',
  description: 'This is a test book description',
  infoLink: 'https://example.com/book'
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsedBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testRootEndpoint() {
  console.log('\n=== Testing Root Endpoint ===');
  try {
    const response = await makeRequest('GET', '/');
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.body);
    return response.status === 200;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testSignup() {
  console.log('\n=== Testing Signup ===');
  try {
    const response = await makeRequest('POST', '/api/auth/signup', testUser);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.body);
    
    if (response.status === 201 && response.body.token) {
      authToken = response.body.token;
      testUserId = response.body.user?.id;
      console.log('✓ Signup successful, token saved');
      return true;
    } else if (response.status === 400 && response.body.message?.includes('already exists')) {
      console.log('⚠ User already exists, trying login instead...');
      return await testLogin();
    }
    return false;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n=== Testing Login ===');
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.body);
    
    if (response.status === 200 && response.body.token) {
      authToken = response.body.token;
      testUserId = response.body.user?.id;
      console.log('✓ Login successful, token saved');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testGetUser() {
  console.log('\n=== Testing Get User ===');
  try {
    const response = await makeRequest('GET', '/api/auth/user', null, authToken);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.body);
    return response.status === 200;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testGetUserWithoutToken() {
  console.log('\n=== Testing Get User (No Token) ===');
  try {
    const response = await makeRequest('GET', '/api/auth/user');
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.body);
    return response.status === 401;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testGetSavedBooks() {
  console.log('\n=== Testing Get Saved Books ===');
  try {
    const response = await makeRequest('GET', '/api/books', null, authToken);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, Array.isArray(response.body) ? `Found ${response.body.length} books` : response.body);
    return response.status === 200 && Array.isArray(response.body);
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testSaveBook() {
  console.log('\n=== Testing Save Book ===');
  try {
    const response = await makeRequest('POST', '/api/books', testBook, authToken);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.body);
    
    if (response.status === 201 && response.body.book) {
      testBookId = response.body.book._id || response.body.book.id;
      console.log('✓ Book saved successfully');
      return true;
    } else if (response.status === 400 && response.body.message?.includes('already saved')) {
      console.log('⚠ Book already saved, continuing...');
      // Try to get the existing book
      const booksResponse = await makeRequest('GET', '/api/books', null, authToken);
      if (booksResponse.status === 200 && Array.isArray(booksResponse.body)) {
        const existingBook = booksResponse.body.find(b => b.googleBookId === testBook.googleBookId);
        if (existingBook) {
          testBookId = existingBook._id || existingBook.id;
          console.log('✓ Found existing book');
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testUpdateBook() {
  console.log('\n=== Testing Update Book ===');
  if (!testBookId) {
    console.log('⚠ No book ID available, skipping update test');
    return false;
  }
  try {
    const updateData = {
      status: 'Reading',
      review: 'This is a test review'
    };
    const response = await makeRequest('PUT', `/api/books/${testBookId}`, updateData, authToken);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.body);
    return response.status === 200;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testUpdateBookInvalidStatus() {
  console.log('\n=== Testing Update Book (Invalid Status) ===');
  if (!testBookId) {
    console.log('⚠ No book ID available, skipping test');
    return false;
  }
  try {
    const updateData = {
      status: 'InvalidStatus'
    };
    const response = await makeRequest('PUT', `/api/books/${testBookId}`, updateData, authToken);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.body);
    return response.status === 400;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testDeleteBook() {
  console.log('\n=== Testing Delete Book ===');
  if (!testBookId) {
    console.log('⚠ No book ID available, skipping delete test');
    return false;
  }
  try {
    const response = await makeRequest('DELETE', `/api/books/${testBookId}`, null, authToken);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.body);
    return response.status === 200;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testSaveBookWithoutToken() {
  console.log('\n=== Testing Save Book (No Token) ===');
  try {
    const response = await makeRequest('POST', '/api/books', testBook);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.body);
    return response.status === 401;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testSignupValidation() {
  console.log('\n=== Testing Signup Validation ===');
  try {
    const response = await makeRequest('POST', '/api/auth/signup', { username: 'test' });
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.body);
    return response.status === 400;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testLoginValidation() {
  console.log('\n=== Testing Login Validation ===');
  try {
    const response = await makeRequest('POST', '/api/auth/login', { email: 'test' });
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.body);
    return response.status === 400;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testSaveBookValidation() {
  console.log('\n=== Testing Save Book Validation ===');
  try {
    const response = await makeRequest('POST', '/api/books', { title: 'Test' }, authToken);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.body);
    return response.status === 400;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('========================================');
  console.log('API Test Suite - Personal Library Manager');
  console.log('========================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log('Make sure the server is running!');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  const tests = [
    { name: 'Root Endpoint', fn: testRootEndpoint },
    { name: 'Signup', fn: testSignup },
    { name: 'Login', fn: testLogin },
    { name: 'Get User', fn: testGetUser },
    { name: 'Get User (No Token)', fn: testGetUserWithoutToken },
    { name: 'Get Saved Books', fn: testGetSavedBooks },
    { name: 'Save Book', fn: testSaveBook },
    { name: 'Update Book', fn: testUpdateBook },
    { name: 'Update Book (Invalid Status)', fn: testUpdateBookInvalidStatus },
    { name: 'Delete Book', fn: testDeleteBook },
    { name: 'Save Book (No Token)', fn: testSaveBookWithoutToken },
    { name: 'Signup Validation', fn: testSignupValidation },
    { name: 'Login Validation', fn: testLoginValidation },
    { name: 'Save Book Validation', fn: testSaveBookValidation },
  ];

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        results.passed++;
        results.tests.push({ name: test.name, status: 'PASSED' });
      } else {
        results.failed++;
        results.tests.push({ name: test.name, status: 'FAILED' });
      }
    } catch (error) {
      results.failed++;
      results.tests.push({ name: test.name, status: 'ERROR', error: error.message });
      console.error(`Error in ${test.name}:`, error.message);
    }
  }

  // Print summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('\nDetailed Results:');
  results.tests.forEach(test => {
    const icon = test.status === 'PASSED' ? '✓' : '✗';
    console.log(`${icon} ${test.name}: ${test.status}`);
    if (test.error) {
      console.log(`  Error: ${test.error}`);
    }
  });
  console.log('========================================\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

