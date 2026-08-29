const { run, get } = require('../config/database');
const cryptoService = require('./cryptoService');

/**
 * Auto-seed demo account and encrypted vault entries if demo user does not exist
 */
async function seedDemoAccount() {
  try {
    const demoEmail = 'demo@passvault.com';
    const demoPlainPassword = 'Demo@123';

    // Check if demo user already exists
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [demoEmail]);

    let userId;
    if (existingUser) {
      console.log(`Demo account (${demoEmail}) already exists (User ID: ${existingUser.id}).`);
      userId = existingUser.id;
    } else {
      const passwordHash = await cryptoService.hashPassword(demoPlainPassword);
      const res = await run(
        'INSERT INTO users (email, password_hash, theme_preference, autolock_timeout) VALUES (?, ?, ?, ?)',
        [demoEmail, passwordHash, 'dark', 5]
      );
      userId = res.lastID;
      console.log(`Created demo user: ${demoEmail} (ID: ${userId})`);

      // Log initial seed audit
      await run(
        'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
        [userId, 'SYSTEM_SEED', 'Demo user account created automatically', 'SUCCESS']
      );
    }

    // Check if vault items exist for demo user
    const existingCount = await get('SELECT COUNT(*) as count FROM vault_items WHERE user_id = ?', [userId]);

    if (existingCount && existingCount.count > 0) {
      console.log(`Demo user already has ${existingCount.count} vault entries. Skipping seed items.`);
      return;
    }

    // Master key secret for encryption of demo items
    const masterSecret = `${demoEmail}:${demoPlainPassword}`;

    // 5 Seed entries with realistic generated passwords
    const seedItems = [
      {
        title: 'Gmail',
        username: 'alex.johnson@gmail.com',
        plainPassword: 'G3m!a#9xK$7pL2vM',
        url: 'https://mail.google.com',
        category: 'Personal',
        tags: 'email,google,primary',
        is_favorite: 1,
        notes: 'Primary personal email account used for recovery and subscriptions.'
      },
      {
        title: 'GitHub',
        username: 'alexdev',
        plainPassword: 'G!t#98Hub$Secure_Pass2026',
        url: 'https://github.com',
        category: 'Work',
        tags: 'developer,code,git',
        is_favorite: 1,
        notes: 'Work GitHub account with 2FA backup codes stored in secure notes.'
      },
      {
        title: 'HDFC Bank',
        username: 'alex.johnson',
        plainPassword: 'Hdfc$Bank#2026!Vault99',
        url: 'https://netbanking.hdfcbank.com',
        category: 'Finance',
        tags: 'banking,finance,critical',
        is_favorite: 1,
        notes: 'NetBanking account. Transaction password updated quarterly.'
      },
      {
        title: 'Netflix',
        username: 'alex@netflix.com',
        plainPassword: 'N3t#fl!x_Stream2026$',
        url: 'https://netflix.com',
        category: 'Entertainment',
        tags: 'streaming,media',
        is_favorite: 0,
        notes: 'Premium 4K family subscription.'
      },
      {
        title: 'LinkedIn',
        username: 'alex.johnson@linkedin.com',
        plainPassword: 'L!nk3d#In_Pro2026$XyZ',
        url: 'https://linkedin.com',
        category: 'Social',
        tags: 'professional,networking',
        is_favorite: 0,
        notes: 'Professional career profile and messaging.'
      }
    ];

    for (const item of seedItems) {
      const encryptedPassword = cryptoService.encrypt(item.plainPassword, masterSecret);

      await run(
        `INSERT INTO vault_items 
         (user_id, title, username, encrypted_password, url, category, tags, is_favorite, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          item.title,
          item.username,
          encryptedPassword,
          item.url,
          item.category,
          item.tags,
          item.is_favorite,
          item.notes
        ]
      );
    }

    // Seed 2 secure notes as well
    const seedNotes = [
      {
        title: 'Master Recovery Keys & Seeds',
        content: 'BIP39 Seed: apple banana cherry dragon eagle forest grape honey iris jungle kiwi lemon\nEmergency Key: PV-2026-9874-ABCD-EFGH',
        tags: 'crypto,recovery,critical',
        is_favorite: 1
      },
      {
        title: 'Home WiFi & Server Access',
        content: 'SSID: PassVault_5G_Secure\nPassword: W!Fi#Pass2026$Home\nSSH Host: 192.168.1.100 (Port 2222)',
        tags: 'network,home,server',
        is_favorite: 0
      }
    ];

    for (const note of seedNotes) {
      const encryptedContent = cryptoService.encrypt(note.content, masterSecret);
      await run(
        `INSERT INTO secure_notes (user_id, title, encrypted_content, tags, is_favorite) VALUES (?, ?, ?, ?, ?)`,
        [userId, note.title, encryptedContent, note.tags, note.is_favorite]
      );
    }

    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'DATA_SEED', 'Seeded 5 encrypted vault items and 2 secure notes', 'SUCCESS']
    );

    console.log(`Successfully seeded 5 encrypted vault items and 2 secure notes for demo account.`);
  } catch (err) {
    console.error('Error seeding demo account:', err);
  }
}

module.exports = {
  seedDemoAccount
};
