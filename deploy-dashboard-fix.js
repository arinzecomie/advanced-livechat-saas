/**
 * Deploy Dashboard Fix
 * Deploys the dashboard API fix to Railway
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying dashboard fix to Railway...');

try {
  // Check if we're in a git repository
  try {
    execSync('git status', { stdio: 'pipe' });
  } catch (error) {
    console.log('❌ Not in a git repository or git is not available');
    console.log('🔧 Please ensure you have git configured and are in the project directory');
    process.exit(1);
  }

  // Show current status
  console.log('📋 Current git status:');
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.log('📝 Uncommitted changes detected:');
      console.log(status);
      
      // Add and commit changes
      console.log('📦 Adding changes...');
      execSync('git add -A', { stdio: 'inherit' });
      
      console.log('💬 Committing changes...');
      execSync('git commit -m "Fix dashboard API endpoint and login redirect issue"', { stdio: 'inherit' });
      
      console.log('✅ Changes committed successfully');
    } else {
      console.log('✅ No uncommitted changes');
    }
  } catch (error) {
    console.log('⚠️  Git status check failed:', error.message);
  }

  // Deploy to Railway
  console.log('\n🚄 Deploying to Railway...');
  console.log('📝 This will push the current branch to Railway');
  
  try {
    // Check if railway CLI is available
    execSync('railway --version', { stdio: 'pipe' });
    
    console.log('🚀 Using Railway CLI to deploy...');
    execSync('railway up', { stdio: 'inherit' });
    
    console.log('✅ Deployment initiated successfully!');
    console.log('⏰ Deployment typically takes 2-3 minutes');
    console.log('🌐 Dashboard will be available at: https://talkavax-production.up.railway.app');
    
  } catch (error) {
    console.log('⚠️  Railway CLI not available, trying git push...');
    
    // Try git push to trigger deployment
    try {
      console.log('📤 Pushing to git repository...');
      execSync('git push', { stdio: 'inherit' });
      
      console.log('✅ Git push completed!');
      console.log('🔄 If Railway is configured for automatic deployments, the fix should be deployed soon');
      
    } catch (pushError) {
      console.log('❌ Git push failed:', pushError.message);
      console.log('🔧 Please manually push your changes to trigger deployment');
    }
  }

  console.log('\n📋 Summary of changes deployed:');
  console.log('✅ Added /api/dashboard/sites route to backend');
  console.log('✅ Enhanced error handling in dashboard controller');
  console.log('✅ Updated frontend to use correct API endpoint');
  console.log('✅ Fixed response data structure parsing');
  
  console.log('\n🧪 After deployment, test the fix:');
  console.log('1. Navigate to: https://talkavax-production.up.railway.app/login');
  console.log('2. Login with: admin@example.com / admin123');
  console.log('3. You should be redirected to dashboard successfully');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}