import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, phone, message } = req.body;

        // Required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                error: 'Name, email, and message are required.'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email address'
            });
        }

        // Create mail transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Email to SKMS owner
        const businessEmail = {
            from: `"SKMS Website Contact" <${process.env.SMTP_USER}>`,
            to: process.env.BUSINESS_EMAIL || process.env.SMTP_USER,
            subject: `New Contact Form Message from ${name}`,
            html: `
                <div style="font-family: Arial; padding: 20px;">
                    <h2>New Contact Form Submission - SKMS</h2>
                    
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                    
                    <h3>Message:</h3>
                    <p style="white-space: pre-wrap;">${message}</p>

                    <hr />
                    <p>Submitted: ${new Date().toLocaleString('en-ZA')}</p>
                </div>
            `
        };

        // Auto-reply to customer
        const autoReply = {
            from: `"SKMS Accounting & Taxation" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Thank you for contacting SKMS",
            html: `
                <div style="font-family: Arial; padding: 20px;">
                    <h2>Thank You for Contacting SKMS</h2>

                    <p>Hello ${name},</p>
                    <p>Thank you for reaching out. We have received your message and will respond as soon as possible.</p>

                    <h3>Our Contact Details</h3>
                    <p><strong>Email:</strong> anaidoo.skms@gmail.com</p>
                    <p><strong>Phone:</strong> +27 65 895 4832</p>
                    
                    <p>Warm regards,<br>SKMS Accounting & Taxation</p>

                    <hr />
                    <p style="font-size: 12px; color: #777;">This is an automated confirmation email.</p>
                </div>
            `
        };

        // Send emails
        await transporter.sendMail(businessEmail);
        await transporter.sendMail(autoReply);

        res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully.'
        });

    } catch (error) {
        console.error('Contact form error:', error);

        res.status(500).json({
            error: 'Internal server error. Please try again later.'
        });
    }
}
