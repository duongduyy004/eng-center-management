const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService, otpService } = require('../services');


const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);

  const userObj = await authService.handleRoleId(user)

  res.send({ user: userObj, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordOTP = await otpService.sendOTP(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordOTP);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyCode = catchAsync(async (req, res) => {
  const { email, code } = req.body
  await otpService.verifyOTP(email, code)
  res.status(httpStatus.NO_CONTENT).send()
})

const resetPassword = catchAsync(async (req, res) => {
  const { email, password, code } = req.body
  await authService.resetPassword(email, password, code);
  res.status(httpStatus.NO_CONTENT).send();
});

const changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  const message = await authService.changePassword(req.user, oldPassword, newPassword)
  res.send(message)
})

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});


const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.send(generateVerificationPage('error', 'Verification token is required'));
  }

  try {
    await authService.verifyEmail(token);

    // Return success page with auto-close
    res.send(generateVerificationPage('success', 'Email verified successfully! This window will close automatically.'));

  } catch (error) {
    const errorMessage = error.message || 'Email verification failed';
    res.send(generateVerificationPage('error', errorMessage));
  }
});

const generateVerificationPage = (status, message) => {
  const isSuccess = status === 'success';
  const backgroundColor = isSuccess ? '#4CAF50' : '#f44336';
  const icon = isSuccess ? '✅' : '❌';
  const autoCloseScript = isSuccess ? `
    setTimeout(() => {
      window.close();
      // If window.close() doesn't work (popup blockers), try redirect
      if (!window.closed) {
        window.location.href = '${process.env.FRONTEND_URL || 'about:blank'}';
      }
    }, 3000);
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification ${isSuccess ? 'Success' : 'Failed'}</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 20px; 
                background-color: #f5f5f5;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .container { 
                max-width: 500px; 
                background: white; 
                border-radius: 10px; 
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
                text-align: center;
                padding: 40px 30px;
            }
            .header { 
                background-color: ${backgroundColor}; 
                color: white; 
                padding: 30px; 
                border-radius: 10px 10px 0 0; 
                margin: -40px -30px 30px -30px;
            }
            .icon { 
                font-size: 64px; 
                margin-bottom: 20px; 
            }
            .message { 
                font-size: 18px; 
                margin-bottom: 20px; 
            }
            .countdown { 
                font-size: 14px; 
                color: #666; 
                margin-top: 20px;
            }
            .manual-close-btn {
                background-color: ${backgroundColor};
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 15px;
            }
            .manual-close-btn:hover {
                opacity: 0.8;
            }
            .redirect-info {
                font-size: 12px;
                color: #888;
                margin-top: 15px;
                border-top: 1px solid #eee;
                padding-top: 15px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">${icon}</div>
                <h1>Email Verification ${isSuccess ? 'Successful' : 'Failed'}</h1>
            </div>
            
            <div class="message">${message}</div>
            
            ${isSuccess ? `
                <div class="countdown">
                    This window will close automatically in <span id="countdown">3</span> seconds...
                </div>
                
                <button class="manual-close-btn" onclick="closeWindow()">
                    Close Window Now
                </button>
                
                <div class="redirect-info">
                    If the window doesn't close automatically, you can close it manually or 
                    <a href="${process.env.FRONTEND_URL || '#'}" target="_blank">click here to continue</a>
                </div>
            ` : `
                <button class="manual-close-btn" onclick="closeWindow()">
                    Close Window
                </button>
                
                <div class="redirect-info">
                    <a href="${process.env.FRONTEND_URL || '#'}" target="_blank">Go back to main page</a> |
                    <a href="#" onclick="location.reload()">Try again</a>
                </div>
            `}
        </div>

        <script>
            let countdown = 3;
            
            function updateCountdown() {
                const element = document.getElementById('countdown');
                if (element) {
                    element.textContent = countdown;
                    countdown--;
                    
                    if (countdown < 0) {
                        closeWindow();
                    }
                }
            }
            
            function closeWindow() {
                // Try multiple methods to close the window
                try {
                    // Method 1: Close current window
                    window.close();
                    
                    // Method 2: If close doesn't work, try to go back
                    setTimeout(() => {
                        if (!window.closed) {
                            window.history.back();
                        }
                    }, 500);
                    
                    // Method 3: Last resort - redirect
                    setTimeout(() => {
                        if (!window.closed) {
                            window.location.href = '${process.env.FRONTEND_URL || 'about:blank'}';
                        }
                    }, 1000);
                    
                } catch (error) {
                    console.log('Unable to close window automatically');
                }
            }
            
            // Auto-close functionality for success
            ${autoCloseScript}
            
            // Update countdown every second
            ${isSuccess ? 'setInterval(updateCountdown, 1000);' : ''}
        </script>
    </body>
    </html>
  `;
};

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  changePassword,
  sendVerificationEmail,
  verifyEmail,
  verifyCode
};
