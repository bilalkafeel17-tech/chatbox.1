const mongoose = require('mongoose');
const User = require('./src/models/User');
const { MONGODB_URI } = require('./src/config/env');
const { PRESET_AVATARS } = require('../client/src/utils/avatarUtils');

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected to MongoDB');

    // Seed User 1: Alex
    let alex = await User.findOne({ username: 'alex' });
    if (!alex) {
      alex = await User.create({
        username: 'alex',
        email: 'alex@chatbox.internal',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=131E30',
        bio: 'Senior Full Stack Engineer',
        isOnline: false
      });
      console.log('✓ Created demo user: alex');
    } else {
      console.log('• Demo user alex already exists');
    }

    // Seed User 2: Sarah
    let sarah = await User.findOne({ username: 'sarah' });
    if (!sarah) {
      sarah = await User.create({
        username: 'sarah',
        email: 'sarah@chatbox.internal',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aria&backgroundColor=131E30',
        bio: 'Lead UI/UX Designer',
        isOnline: false
      });
      console.log('✓ Created demo user: sarah');
    } else {
      console.log('• Demo user sarah already exists');
    }

    console.log('[Seed] Completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error:', err.message);
    process.exit(1);
  }
}

seed();

