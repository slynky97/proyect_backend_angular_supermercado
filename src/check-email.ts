
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';

async function main() {
    console.log('--- Email Configuration Check ---');

    // 1. Load Environment Variables manually from .development.env
    const envPath = path.resolve(__dirname, '../.development.env');
    if (fs.existsSync(envPath)) {
        console.log(`Loading env from ${envPath}`);
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                let cleanValue = value.trim();
                if ((cleanValue.startsWith("'") && cleanValue.endsWith("'")) ||
                    (cleanValue.startsWith('"') && cleanValue.endsWith('"'))) {
                    cleanValue = cleanValue.slice(1, -1);
                }
                process.env[key.trim()] = cleanValue;
            }
        });
    } else {
        console.log('.development.env not found, relying on existing process.env');
    }

    const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ? '******' : undefined // Hide password in logs
    };

    console.log('Configuration:', config);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ ERROR: SMTP_USER or SMTP_PASS not set.');
        process.exit(1);
    }

    // 2. Create Transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    // 3. Verify Connection
    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');
    } catch (error) {
        console.error('❌ SMTP Connection Failed:', error);
        process.exit(1);
    }

    // 4. Send Test Email
    try {
        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: `"Test Script" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Send to self
            subject: "Test Email from Inventory System",
            html: "<b>Hello world?</b><p>If you see this, email configuration is working!</p>",
        });
        console.log('✅ Message sent:', info.messageId);
    } catch (error) {
        console.error('❌ Error sending mail:', error);
        process.exit(1);
    }
}

main().catch(console.error);
