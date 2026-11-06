const axios = require('axios');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE INTEGRATION TESTS ---');

  try {
    // 1. Health Check
    console.log('[Test 1] Checking server health...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log('✓ Server health check passed:', healthRes.data);

    // Unique suffix for this test run
    const rand = Math.floor(Math.random() * 10000);
    const user1Data = {
      username: `alex_${rand}`,
      email: `alex_${rand}@example.com`,
      password: 'password123'
    };
    const user2Data = {
      username: `sarah_${rand}`,
      email: `sarah_${rand}@example.com`,
      password: 'password123'
    };

    // 2. Register User 1
    console.log('[Test 2] Registering User 1 (Alex)...');
    const reg1Res = await axios.post(`${BASE_URL}/auth/register`, user1Data);
    const user1 = reg1Res.data.data.user;
    const token1 = reg1Res.data.data.token;
    console.log(`✓ User 1 registered: ${user1.username} (${user1._id})`);

    // 3. Register User 2
    console.log('[Test 3] Registering User 2 (Sarah)...');
    const reg2Res = await axios.post(`${BASE_URL}/auth/register`, user2Data);
    const user2 = reg2Res.data.data.user;
    const token2 = reg2Res.data.data.token;
    console.log(`✓ User 2 registered: ${user2.username} (${user2._id})`);

    // 4. Test Login
    console.log('[Test 4] Testing login for User 1...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: user1Data.email,
      password: user1Data.password
    });
    console.log('✓ Login successful, token returned:', !!loginRes.data.data.token);

    // 5. Test Protected Route (/auth/me)
    console.log('[Test 5] Verifying protected /auth/me route with JWT...');
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    console.log('✓ Protected route returned user:', meRes.data.data.username);

    // 6. Test User Search
    console.log('[Test 6] Testing user search API...');
    const searchRes = await axios.get(`${BASE_URL}/users/search?q=sarah_${rand}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    console.log(`✓ Search found ${searchRes.data.data.length} user(s). First match: ${searchRes.data.data[0]?.username}`);

    // 7. Create or Get Conversation between User 1 and User 2
    console.log('[Test 7] Creating conversation between Alex and Sarah...');
    const convRes = await axios.post(
      `${BASE_URL}/conversations`,
      { recipientId: user2._id },
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    const conversationId = convRes.data.data._id;
    console.log(`✓ Conversation established: ID ${conversationId}`);

    // 8. Connect User 1 and User 2 via Socket.IO
    console.log('[Test 8] Connecting User 1 and User 2 sockets with JWT authentication...');
    const socket1 = io(SOCKET_URL, { auth: { token: token1 } });
    const socket2 = io(SOCKET_URL, { auth: { token: token2 } });

    await new Promise((resolve) => {
      let count = 0;
      const checkDone = () => {
        count++;
        if (count === 2) resolve();
      };
      socket1.on('connect', () => {
        console.log('✓ Socket 1 connected');
        checkDone();
      });
      socket2.on('connect', () => {
        console.log('✓ Socket 2 connected');
        checkDone();
      });
    });

    // 9. Join Conversation Room
    console.log('[Test 9] User 1 and User 2 joining conversation room...');
    socket1.emit('join_conversation', { conversationId });
    socket2.emit('join_conversation', { conversationId });

    // 10. Real-Time Messaging & Read Receipts over Socket.IO
    console.log('[Test 10] Testing real-time message exchange & read receipts...');
    const messagePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for real-time message')), 8000);

      socket2.on('receive_message', (incomingMsg) => {
        console.log(`✓ Socket 2 received message in real-time: "${incomingMsg.text}" from ${incomingMsg.sender.username}`);
        clearTimeout(timeout);

        // Sarah reads the message
        socket2.emit('mark_as_read', { conversationId });
      });

      socket1.on('messages_read', (readData) => {
        console.log(`✓ Socket 1 received read receipt for conversation: ${readData.conversationId}`);
        resolve();
      });

      // User 1 sends message
      socket1.emit('send_message', {
        conversationId,
        text: 'Hello Sarah! This is a real-time message with zero refresh.'
      });
    });

    await messagePromise;

    // 11. Persistence Check via MongoDB REST API
    console.log('[Test 11] Verifying messages persisted in MongoDB...');
    const msgListRes = await axios.get(`${BASE_URL}/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    console.log(`✓ Retrieved ${msgListRes.data.data.length} persisted message(s) from MongoDB`);
    const lastMsg = msgListRes.data.data[msgListRes.data.data.length - 1];
    console.log(`✓ Persisted message text: "${lastMsg.text}", status: "${lastMsg.status}"`);

    // 12. Security Test: Unauthorized Access
    console.log('[Test 12] Testing security: Unauthorized user accessing conversation...');
    const user3Data = {
      username: `hacker_${rand}`,
      email: `hacker_${rand}@example.com`,
      password: 'password123'
    };
    const reg3Res = await axios.post(`${BASE_URL}/auth/register`, user3Data);
    const token3 = reg3Res.data.data.token;

    try {
      await axios.get(`${BASE_URL}/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token3}` }
      });
      console.error('FAILED: Unauthorized user was able to access messages!');
      process.exit(1);
    } catch (authErr) {
      console.log(`✓ Security verified: Unauthorized user received HTTP ${authErr.response?.status} (${authErr.response?.data?.message})`);
    }

    // Clean up sockets
    socket1.disconnect();
    socket2.disconnect();

    console.log('\n--- ALL 12 INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
    process.exit(0);
  } catch (err) {
    console.error('Test failed with error:', err.response?.data || err.message);
    process.exit(1);
  }
}

// Give server a moment if starting
setTimeout(runTests, 1500);

