#!/usr/bin/env node

/**
 * AquaSentinel Deployment Test Script
 * Tests frontend-backend communication for production deployment
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  frontendUrl: process.env.FRONTEND_URL || 'https://aquasentinel.netlify.app',
  backendUrl: process.env.BACKEND_URL || 'https://aquasentinel-backend.onrender.com',
  timeout: 30000, // 30 seconds
};

console.log('🚀 AquaSentinel Deployment Test');
console.log(`Frontend URL: ${config.frontendUrl}`);
console.log(`Backend URL: ${config.backendUrl}`);
console.log('=' * 50);

// Test functions
async function testEndpoint(url, description) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    console.log(`📡 Testing ${description}...`);
    
    const req = client.get(url, (res) => {
      const duration = Date.now() - startTime;
      const success = res.statusCode >= 200 && res.statusCode < 300;
      
      if (success) {
        console.log(`✅ ${description} - OK (${res.statusCode}) - ${duration}ms`);
        resolve({ success: true, status: res.statusCode, duration });
      } else {
        console.log(`❌ ${description} - Failed (${res.statusCode}) - ${duration}ms`);
        resolve({ success: false, status: res.statusCode, duration });
      }
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`❌ ${description} - Error: ${error.message} - ${duration}ms`);
      resolve({ success: false, error: error.message, duration });
    });
    
    req.setTimeout(config.timeout, () => {
      req.abort();
      console.log(`⏰ ${description} - Timeout (${config.timeout}ms)`);
      resolve({ success: false, error: 'Timeout', duration: config.timeout });
    });
  });
}

async function testAPIEndpoint(endpoint, description) {
  return testEndpoint(`${config.backendUrl}${endpoint}`, description);
}

async function runTests() {
  console.log('\n🔍 Running deployment tests...\n');
  
  const tests = [
    // Frontend tests
    () => testEndpoint(config.frontendUrl, 'Frontend Homepage'),
    
    // Backend API tests
    () => testAPIEndpoint('/health', 'Backend Health Check'),
    () => testAPIEndpoint('/model-info', 'ML Model Information'),
    () => testAPIEndpoint('/sensors/current', 'Current Sensor Data'),
    () => testAPIEndpoint('/ml/analyze', 'ML Analysis'),
  ];
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  for (const test of tests) {
    const result = await test();
    results.push(result);
    
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('=' * 30);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Deployment is ready.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the deployment configuration.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test runner error:', error);
  process.exit(1);
}); 