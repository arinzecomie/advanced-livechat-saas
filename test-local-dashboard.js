/**
 * Test Local Dashboard Logic
 * Test the dashboard controller logic locally
 */

import SiteModel from './backend/models/SiteModel.js';
import VisitorModel from './backend/models/VisitorModel.js';
import MessageModel from './backend/models/MessageModel.js';
import PaymentService from './backend/services/PaymentService.js';

async function testDashboardLogic() {
  try {
    console.log('🧪 Testing dashboard logic...');
    
    // Initialize models
    const siteModel = new SiteModel();
    const visitorModel = new VisitorModel();
    const messageModel = new MessageModel();
    const paymentService = new PaymentService();
    
    const userId = 1; // Test user ID
    
    console.log('🔍 Fetching sites for user:', userId);
    const sites = await siteModel.findByUserId(userId);
    console.log('📊 Found sites:', sites.length);
    
    if (sites.length === 0) {
      console.log('⚠️  No sites found for user');
      return;
    }
    
    console.log('🔍 Processing site statistics...');
    const siteStats = await Promise.all(
      sites.map(async (site) => {
        console.log(`📊 Processing site: ${site.domain} (ID: ${site.id})`);
        
        try {
          const visitorCount = await visitorModel.getVisitorCount(site.id);
          console.log(`  👥 Visitor count: ${visitorCount}`);
          
          const activeVisitors = await visitorModel.getActiveVisitors(site.id);
          console.log(`  🟢 Active visitors: ${activeVisitors.length}`);
          
          const subscription = await paymentService.getSubscriptionStatus(site.site_id);
          console.log(`  💳 Subscription:`, subscription);
          
          return {
            ...site,
            stats: {
              totalVisitors: visitorCount,
              activeVisitors: activeVisitors.length,
              subscription
            }
          };
        } catch (error) {
          console.error(`❌ Error processing site ${site.id}:`, error.message);
          return {
            ...site,
            stats: {
              totalVisitors: 0,
              activeVisitors: 0,
              subscription: null
            }
          };
        }
      })
    );
    
    console.log('✅ Dashboard data prepared successfully!');
    console.log('📦 Final data structure:', JSON.stringify({
      success: true,
      data: {
        sites: siteStats
      }
    }, null, 2));
    
  } catch (error) {
    console.error('💥 Dashboard logic test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testDashboardLogic();