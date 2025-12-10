#!/usr/bin/env node

/**
 * Fix Frontend API URLs
 * Updates all localhost:3000 references to production URL
 */

const fs = require('fs');
const path = require('path');

const PRODUCTION_URL = 'https://talkavax-production.up.railway.app';
const LOCALHOST_URL = 'http://localhost:3000';

// Files to update
const filesToUpdate = [
  'src/api/axiosClient.js',
  'src/api/superAdmin.js',
  'src/components/ChatPanel/ChatPanel.jsx',
  'src/components/forms/SignupForm.jsx',
  'src/stores/authStore.js',
  'src/stores/chatStore.js',
  'src/stores/dashboardStore.js'
];

console.log('🚀 Fixing Frontend API URLs...');
console.log('=====================================');

let totalReplacements = 0;

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, 'frontend', file);
  
  if (fs.existsSync(filePath)) {
    console.log(`📁 Processing: ${file}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let replacements = 0;
    
    // Replace localhost:3000 URLs
    const updatedContent = content.replace(
      new RegExp(LOCALHOST_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      PRODUCTION_URL
    );
    
    // Count replacements
    replacements = (content.match(new RegExp(LOCALHOST_URL, 'g')) || []).length;
    
    if (replacements > 0) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Updated ${replacements} localhost references in ${file}`);
      totalReplacements += replacements;
    } else {
      console.log(`ℹ️  No localhost references found in ${file}`);
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('\n🎉 Summary:');
console.log(`✅ Total replacements made: ${totalReplacements}`);
console.log('\n🔧 Next steps:');
console.log('1. Rebuild frontend: npm run build (in frontend directory)');
console.log('2. Deploy to Railway: railway up');
console.log('3. Test frontend login/signup functionality');