
export const getOtpEmailTemplate = (otp: string, name: string = 'User') => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 20px auto; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #2563eb; margin: 0; }
            .otp-box { background: #f0f7ff; color: #2563eb; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
            .footer { font-size: 12px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <p>Hi ${name},</p>
            <p>Thank you for signing up for ChatFusion. To complete your registration, please use the following verification code:</p>
            <div class="otp-box">${otp}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, you can safely ignore this email.</p>
            <div class="footer">
              &copy; ${new Date().getFullYear()} ChatFusion. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `;
};

export const getPasswordResetTemplate = (otp: string, name: string = 'User') => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 20px auto; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #2563eb; margin: 0; }
            .otp-box { background: #f0f7ff; color: #2563eb; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
            .footer { font-size: 12px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Use the code below to reset it:</p>
            <div class="otp-box">${otp}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <div class="footer">
              &copy; ${new Date().getFullYear()} ChatFusion. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `;
};

export const getInviteTemplate = (senderName: string, inviteLink: string = 'https://chatfusion.com') => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 20px auto; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #2563eb; margin: 0; }
            .btn { display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
            .footer { font-size: 12px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Join ChatFusion!</h1>
            </div>
            <p>Hi there,</p>
            <p>${senderName} has invited you to join ChatFusion, a new way to connect with friends.</p>
            <div style="text-align: center;">
                <a href="${inviteLink}" class="btn">Join Now</a>
            </div>
            <p>If you have questions, reply to this email.</p>
            <div class="footer">
              &copy; ${new Date().getFullYear()} ChatFusion. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `;
};
