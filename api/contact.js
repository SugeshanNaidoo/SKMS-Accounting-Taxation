import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed' 
        });
    }

    try {
        const { name, email, phone, message } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, and message are required.'
            });
        }

        // Validate name length
        if (name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid name.'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid email address.'
            });
        }

        // Validate message length
        if (message.trim().length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Message must be at least 10 characters long.'
            });
        }

        // Phone validation (optional)
        if (phone) {
            const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({
                    success: false,
                    error: 'Please enter a valid phone number.'
                });
            }
        }

        // Sanitize inputs to prevent XSS
        const sanitizedName = name.trim().replace(/[<>]/g, '');
        const sanitizedMessage = message.trim().replace(/[<>]/g, '');
        const sanitizedPhone = phone ? phone.trim() : 'Not provided';

        // Check environment variables
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('Missing SMTP credentials in environment variables');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error. Please contact us directly.'
            });
        }

        // Create mail transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // Use TLS
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false // For development; remove in production if possible
            }
        });

        // Verify transporter configuration
        try {
            await transporter.verify();
        } catch (verifyError) {
            console.error('SMTP verification failed:', verifyError);
            return res.status(500).json({
                success: false,
                error: 'Email service configuration error. Please contact us directly.'
            });
        }

        const businessEmailAddress = process.env.BUSINESS_EMAIL || process.env.SMTP_USER;

        // Email to SKMS owner
        const businessEmail = {
            from: `"SKMS Website Contact" <${process.env.SMTP_USER}>`,
            to: businessEmailAddress,
            replyTo: email,
            subject: `New Contact Form Message from ${sanitizedName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #1E40AF; color: white; padding: 20px; text-align: center; }
                        .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
                        .field { margin-bottom: 15px; }
                        .label { font-weight: bold; color: #1E40AF; }
                        .value { margin-top: 5px; }
                        .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>New Contact Form Submission</h2>
                            <p>SKMS Accounting & Taxation</p>
                        </div>
                        <div class="content">
                            <div class="field">
                                <div class="label">Name:</div>
                                <div class="value">${sanitizedName}</div>
                            </div>
                            <div class="field">
                                <div class="label">Email:</div>
                                <div class="value"><a href="mailto:${email}">${email}</a></div>
                            </div>
                            <div class="field">
                                <div class="label">Phone:</div>
                                <div class="value">${sanitizedPhone}</div>
                            </div>
                            <div class="field">
                                <div class="label">Message:</div>
                                <div class="value" style="white-space: pre-wrap; background: white; padding: 15px; border-left: 3px solid #1E40AF;">${sanitizedMessage}</div>
                            </div>
                        </div>
                        <div class="footer">
                            <p>Submitted: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
                            <p>This message was sent from the SKMS website contact form</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Auto-reply to customer
        const autoReply = {
            from: `"SKMS Accounting & Taxation" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Thank you for contacting SKMS",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #1E40AF; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; }
                        .contact-box { background: #f0f4ff; padding: 15px; margin: 20px 0; border-left: 4px solid #1E40AF; }
                        .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; border-top: 1px solid #ddd; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Thank You for Contacting SKMS</h2>
                        </div>
                        <div class="content">
                            <p>Hello ${sanitizedName},</p>
                            <p>Thank you for reaching out to us. We have received your message and one of our team members will respond to you as soon as possible.</p>
                            <p>We typically respond within 24 hours during business days.</p>
                            
                            <div class="contact-box">
                                <h3 style="margin-top: 0; color: #1E40AF;">Our Contact Details</h3>
                                <p><strong>Email:</strong> anaidoo.skms@gmail.com</p>
                                <p><strong>Phone:</strong> +27 65 895 4832</p>
                                <p><strong>Address:</strong> Esselmont Avenue, Essenwood, Durban, KZN 4001</p>
                                <p><strong>Hours:</strong><br>
                                Monday - Friday: 8:00 AM - 6:00 PM<br>
                                Saturday: 9:00 AM - 2:00 PM<br>
                                Sunday: Closed</p>
                            </div>
                            
                            <p>If you need immediate assistance, please don't hesitate to call us.</p>
                            <p>Warm regards,<br><strong>SKMS Accounting & Taxation Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>This is an automated confirmation email.</p>
                            <p>&copy; 2025 SKMS Accounting & Taxation. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Send both emails
        await Promise.all([
            transporter.sendMail(businessEmail),
            transporter.sendMail(autoReply)
        ]);

        // Success response
        return res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you soon!'
        });

    } catch (error) {
        console.error('Contact form error:', error);

        // Send detailed error info but generic message to user
        return res.status(500).json({
            success: false,
            error: 'We encountered an error sending your message. Please try again or contact us directly at anaidoo.skms@gmail.com or +27 65 895 4832.'
        });
    }
}