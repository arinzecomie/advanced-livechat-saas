#!/usr/bin/env node

/**
 * Network binding test for Railway
 */

console.log('🌐 NETWORK BINDING TEST');
console.log('📅', new Date().toISOString());

const http = require('http');
const PORT = process.env.PORT || 3000;

// Create HTTP server directly
const server = http.createServer((req, res) => {
  console.log(`📨 ${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'network-test',
      port: PORT
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Network test server is running');
  }
});

// Try different binding approaches
const host = '0.0.0.0'; // Bind to all interfaces
const port = parseInt(PORT);

console.log(`🎯 Attempting to bind to ${host}:${port}`);

try {
  server.listen(port, host, () => {
    console.log(`🎉 SUCCESS: Server bound to ${host}:${port}`);
    console.log(`🌐 Address: ${server.address().address}`);
    console.log(`🔢 Port: ${server.address().port}`);
    console.log('✅ Health check available at /health');
    
    // Log every 10 seconds to show it's alive
    setInterval(() => {
      console.log('💓 Server alive -', new Date().toISOString());
    }, 10000);
  });
  
  server.on('error', (error) => {
    console.error('❌ Server error:', error.message);
    console.error('📋 Error code:', error.code);
    console.error('💥 Stack:', error.stack);
    process.exit(1);
  });
  
} catch (error) {
  console.error('💥 Failed to start server:', error.message);
  console.error('📋 Error code:', error.code);
  console.error('💥 Stack:', error.stack);
  process.exit(1);
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});