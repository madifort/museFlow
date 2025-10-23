#!/usr/bin/env node

/**
 * MuseFlow Message Testing Script
 * Tests the message router functionality without Chrome extension context
 */

// Mock Chrome API for testing
const mockChrome = {
  runtime: {
    sendMessage: async (message) => {
      console.log('Mock Chrome: Message received:', message);
      
      // Simulate different responses based on action
      switch (message.action) {
        case 'summarize':
          return {
            success: true,
            data: {
              summary: `Mock summary of: "${message.text}"`,
              timestamp: new Date().toISOString()
            },
            requestId: message.requestId
          };
        case 'rewrite':
          return {
            success: true,
            data: {
              rewrittenText: `Mock rewritten: "${message.text}"`,
              timestamp: new Date().toISOString()
            },
            requestId: message.requestId
          };
        case 'ideate':
          return {
            success: true,
            data: {
              ideas: [
                { title: "Idea 1", description: "Mock idea based on: " + message.text },
                { title: "Idea 2", description: "Another mock idea" }
              ],
              timestamp: new Date().toISOString()
            },
            requestId: message.requestId
          };
        case 'translate':
          return {
            success: true,
            data: {
              translatedText: `Mock translation of: "${message.text}"`,
              timestamp: new Date().toISOString()
            },
            requestId: message.requestId
          };
        case 'ping':
          return {
            success: true,
            data: { status: 'pong', timestamp: new Date().toISOString() },
            requestId: message.requestId
          };
        default:
          return {
            success: false,
            error: `Unknown action: ${message.action}`,
            requestId: message.requestId
          };
      }
    }
  }
};

// Test function
async function testMessageHandling() {
  console.log('🧪 MuseFlow Message Router Test');
  console.log('================================\n');

  const testCases = [
    { action: 'ping', text: '' },
    { action: 'summarize', text: 'This is a test text for summarization.' },
    { action: 'rewrite', text: 'This text needs to be rewritten for better clarity.' },
    { action: 'ideate', text: 'Generate ideas for a new mobile app.' },
    { action: 'translate', text: 'Hello world, this is a test message.' }
  ];

  for (const testCase of testCases) {
    console.log(`Testing action: ${testCase.action}`);
    console.log(`Input text: "${testCase.text}"`);
    
    try {
      const message = {
        action: testCase.action,
        text: testCase.text,
        options: {},
        requestId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'test'
      };

      const result = await mockChrome.runtime.sendMessage(message);
      
      console.log('✅ Result:', JSON.stringify(result, null, 2));
      console.log('---\n');
    } catch (error) {
      console.log('❌ Error:', error.message);
      console.log('---\n');
    }
  }

  console.log('🎉 Test completed!');
  console.log('\nTo test with real Chrome extension:');
  console.log('1. Run: npm run build');
  console.log('2. Load extension in Chrome');
  console.log('3. Open chrome://extensions → Inspect Service Worker');
  console.log('4. Highlight text and click action buttons');
  console.log('5. Check console logs for [MuseFlow] messages');
}

// Run the test
testMessageHandling().catch(console.error);
