export const Verification_Email_Template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Email Verification</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Base styles */
        * {
            box-sizing: border-box;
        }
        body, html {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f9f9f9;
            -webkit-font-smoothing: antialiased;
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
        }
        table {
            border-spacing: 0 !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            margin: 0 auto !important;
        }
        img {
            -ms-interpolation-mode: bicubic;
            max-width: 100%;
            border: 0;
            display: block;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #eeeeee;
        }
        .content {
            padding: 30px 20px;
            text-align: center;
        }
        .verification-code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            color: #4a6ee0;
            margin: 20px 0;
            padding: 15px;
            background-color: #f0f4ff;
            border-radius: 8px;
            display: inline-block;
        }
        .message {
            margin-bottom: 30px;
            font-size: 16px;
        }
        .expiry {
            font-size: 14px;
            color: #777777;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
            color: #777777;
            font-size: 12px;
        }
        .social-links {
            margin: 15px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #4a6ee0;
            text-decoration: none;
        }
        
        /* Mobile responsiveness */
        @media screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                padding: 15px !important;
                border-radius: 0 !important;
            }
            .content {
                padding: 20px 15px !important;
            }
            .verification-code {
                font-size: 28px !important;
                letter-spacing: 3px !important;
                padding: 10px !important;
            }
            h1 {
                font-size: 24px !important;
            }
            h2 {
                font-size: 20px !important;
            }
            .message, p {
                font-size: 15px !important;
            }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f9f9f9;">
    <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Verify your email address for PosiVibe - Your verification code is included inside</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0;padding:20px;background-color:#f9f9f9;">
        <tr>
            <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                    <tr>
                        <td style="background-color:#ffffff;border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,0.05);overflow:hidden;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <!-- Header -->
                                <tr>
                                    <td style="padding:25px 0;text-align:center;border-bottom:1px solid #eeeeee;">
                                        <h1 style="color:#4a6ee0;margin:0;font-size:28px;">PosiVibe</h1>
                                    </td>
                                </tr>
                                <!-- Content -->
                                <tr>
                                    <td style="padding:30px 20px;text-align:center;">
                                        <h2 style="margin-top:0;color:#333333;">Verify Your Email</h2>
                                        <p style="margin-bottom:30px;font-size:16px;color:#555555;">Thank you for joining PosiVibe! To complete your registration, please use the verification code below:</p>
                                        <div style="font-size:32px;font-weight:bold;letter-spacing:5px;color:#4a6ee0;margin:20px 0;padding:15px;background-color:#f0f4ff;border-radius:8px;display:inline-block;">{verificationCode}</div>
                                        <p style="margin:15px 0;color:#555555;">This code will expire in <strong>3 minutes</strong>.</p>
                                        <p style="margin:15px 0;color:#555555;">If you didn't request this verification, you can safely ignore this email.</p>
                                        <p style="margin-top:20px;font-size:14px;color:#777777;">For security reasons, this verification code will expire in 3 minutes.</p>
                                    </td>
                                </tr>
                                <!-- Footer -->
                                <tr>
                                    <td style="padding:20px;text-align:center;border-top:1px solid #eeeeee;color:#777777;font-size:12px;">
                                        <p style="margin:5px 0;">© ${new Date().getFullYear()} PosiVibe. All rights reserved.</p>
                                        <p style="margin:15px 0;">
                                            <a href="#" style="color:#4a6ee0;text-decoration:none;margin:0 10px;">Facebook</a> | 
                                            <a href="#" style="color:#4a6ee0;text-decoration:none;margin:0 10px;">Twitter</a> | 
                                            <a href="#" style="color:#4a6ee0;text-decoration:none;margin:0 10px;">Instagram</a>
                                        </p>
                                        <p style="margin:5px 0;">This is an automated message, please do not reply to this email.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

export const Welcome_Email_Template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Welcome to PosiVibe</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Base styles */
        * {
            box-sizing: border-box;
        }
        body, html {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f9f9f9;
            -webkit-font-smoothing: antialiased;
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
        }
        table {
            border-spacing: 0 !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            margin: 0 auto !important;
        }
        img {
            -ms-interpolation-mode: bicubic;
            max-width: 100%;
            border: 0;
            display: block;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        .welcome-message {
            font-size: 18px;
            margin-bottom: 30px;
        }
        .highlight {
            color: #4a6ee0;
            font-weight: bold;
        }
        .features {
            text-align: left;
            margin: 30px 0;
            padding: 0 20px;
        }
        .feature-item {
            margin-bottom: 15px;
        }
        .feature-icon {
            color: #4a6ee0;
            font-weight: bold;
            display: inline-block;
            width: 20px;
            text-align: center;
            margin-right: 10px;
        }
        .cta-button {
            background-color: #4a6ee0;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            padding: 12px 30px;
            display: inline-block;
            margin: 20px 0;
            mso-padding-alt: 12px 30px;
        }
        
        /* Mobile responsiveness */
        @media screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                padding: 15px !important;
            }
            .content {
                padding: 20px 15px !important;
            }
            h1 {
                font-size: 24px !important;
            }
            h2 {
                font-size: 20px !important;
            }
            .welcome-message, p {
                font-size: 15px !important;
                margin-bottom: 20px !important;
            }
            .features {
                padding: 0 10px !important;
            }
            .cta-button {
                padding: 10px 20px !important;
                font-size: 14px !important;
                display: block !important;
                text-align: center !important;
            }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f9f9f9;">
    <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Welcome to PosiVibe! Your account has been successfully created and is ready to use.</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0;padding:20px;background-color:#f9f9f9;">
        <tr>
            <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                    <tr>
                        <td style="background-color:#ffffff;border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,0.05);overflow:hidden;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <!-- Header -->
                                <tr>
                                    <td style="padding:25px 0;text-align:center;border-bottom:1px solid #eeeeee;">
                                        <h1 style="color:#4a6ee0;margin:0;font-size:28px;">PosiVibe</h1>
                                    </td>
                                </tr>
                                <!-- Content -->
                                <tr>
                                    <td style="padding:30px 20px;">
                                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="text-align:center;">
                                                    <h2 style="margin-top:0;color:#333333;">Welcome to PosiVibe, {name}!</h2>
                                                    <p style="font-size:18px;margin-bottom:30px;color:#555555;">We're thrilled to have you join our positive community. Your account has been successfully created and is ready to use.</p>
                                                    <p style="margin:15px 0;color:#555555;">At PosiVibe, we're dedicated to creating a space where positivity thrives and connections flourish.</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding:20px 0;">
                                                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="text-align:left;">

                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <div>Connect with like-minded individuals</div>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <div>Share your positive experiences</div>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <div>Discover inspiring content</div>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <div>Build meaningful relationships</div>
                </div>
            </div>
            
            <a href="#" class="cta-button">Start Exploring</a>
            
            <p>If you have any questions or need assistance, our support team is always here to help.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} PosiVibe. All rights reserved.</p>
            <div class="social-links">
                <a href="#">Facebook</a> | <a href="#">Twitter</a> | <a href="#">Instagram</a>
            </div>
            <p>You're receiving this email because you recently signed up for PosiVibe.</p>
        </div>
    </div>
</body>
</html>
`;

export const Password_Reset_Email_Template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #eee;
        }
        .header img {
            max-width: 150px;
            height: auto;
        }
        .content {
            padding: 30px 20px;
            text-align: center;
        }
        .verification-code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            color: #4a6ee0;
            margin: 20px 0;
            padding: 10px;
            background-color: #f0f4ff;
            border-radius: 4px;
            display: inline-block;
        }
        .message {
            margin-bottom: 30px;
            font-size: 16px;
        }
        .expiry {
            font-size: 14px;
            color: #777;
            margin-top: 20px;
        }
        .security-note {
            background-color: #fff8e1;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            text-align: left;
            border-left: 4px solid #ffc107;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #777;
            font-size: 12px;
        }
        .social-links {
            margin: 15px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #4a6ee0;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #4a6ee0;">PosiVibe</h1>
        </div>
        <div class="content">
            <h2>Password Reset Request</h2>
            <p class="message">We received a request to reset your password. To proceed with the password reset, please use the verification code below:</p>
            <div class="verification-code">{verificationCode}</div>
            <p>This code will expire in <strong>3 minutes</strong>.</p>
            <div class="security-note">
                <p><strong>Security Note:</strong> If you didn't request a password reset, please ignore this email or contact our support team immediately as your account may be at risk.</p>
            </div>
            <p class="expiry">For security reasons, this verification code will expire in 3 minutes.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} PosiVibe. All rights reserved.</p>
            <div class="social-links">
                <a href="#">Facebook</a> | <a href="#">Twitter</a> | <a href="#">Instagram</a>
            </div>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
`;
