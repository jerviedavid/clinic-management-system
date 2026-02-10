import { sendVerificationEmail, sendWelcomeEmail } from './server/utils/email.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmails() {
    console.log('\n🧪 Testing Email Functionality\n');
    console.log('='.repeat(50));
    
    const testEmail = 'test@example.com';
    const testName = 'Test User';
    const testToken = 'test-token-123';
    const testClinic = "Test User's Clinic";

    // Check SMTP configuration
    console.log('\n📧 SMTP Configuration:');
    console.log(`   Host: ${process.env.SMTP_HOST || 'Not configured'}`);
    console.log(`   Port: ${process.env.SMTP_PORT || 'Not configured'}`);
    console.log(`   User: ${process.env.SMTP_USER || 'Not configured'}`);
    console.log(`   Pass: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'Not configured'}`);
    console.log(`   From: ${process.env.SMTP_FROM || 'Not configured'}`);
    console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('\n⚠️  SMTP credentials not configured.');
        console.log('   Emails will be logged to console instead of sent.\n');
    }

    try {
        // Test verification email
        console.log('\n1️⃣  Testing Verification Email...');
        await sendVerificationEmail(testEmail, testName, testToken);
        console.log('   ✅ Verification email processed successfully\n');

        // Test welcome email
        console.log('2️⃣  Testing Welcome Email...');
        await sendWelcomeEmail(testEmail, testName, testClinic);
        console.log('   ✅ Welcome email processed successfully\n');

        console.log('='.repeat(50));
        console.log('\n✅ All email tests passed!\n');
        
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('ℹ️  To send actual emails, configure SMTP settings in .env file.');
            console.log('   See EMAIL_SETUP.md for detailed instructions.\n');
        } else {
            console.log('📬 Check your inbox/spam folder for test emails.\n');
        }

    } catch (error) {
        console.error('\n❌ Email test failed:', error.message);
        console.log('\n💡 Troubleshooting tips:');
        console.log('   1. Verify SMTP credentials in .env file');
        console.log('   2. For Gmail, use App Password (not regular password)');
        console.log('   3. Check if firewall is blocking port 587');
        console.log('   4. Review EMAIL_SETUP.md for detailed setup guide\n');
    }
}

testEmails();
