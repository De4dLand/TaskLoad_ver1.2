import User from "../../../models/User.js"
import { generateToken, verifyToken } from "../../../utils/jwt.js"
import { sendPasswordResetEmail } from "../../../utils/email.js"
import { createError, catchAsync } from "../../../utils/error.js"

export class AuthController {
  constructor() {
    // Constructor can be used for dependency injection if needed
  }

  // Register a new user
  register = catchAsync(async (req, res) => {
    const { username, email, password } = req.body
    const redisClient = req.app.locals.redis

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        { username }
      ]
    })

    if (existingUser) {
      if (existingUser.email === email) {
        throw createError(400, "User with this email already exists")
      }
      if (existingUser.username === username) {
        throw createError(400, "Username is already taken")
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password, // Không hash ở đây nữa vì model sẽ tự động hash
    })

    await user.save()

    // Generate tokens
    const token = generateToken({ userId: user._id }, process.env.JWT_SECRET, "1h")
    const refreshToken = generateToken({ userId: user._id }, process.env.JWT_REFRESH_SECRET, "7d")

    // Store refresh token in Redis
    await redisClient.setex(`refresh_token:${user._id}`, 60 * 60 * 24 * 7, refreshToken) // 7 days

    // Return user data and tokens
    res.status(201).json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
      refreshToken,
    })
  });

  // Login user
  login = catchAsync(async (req, res) => {
    const { email, password } = req.body
    const redisClient = req.app.locals.redis

    // DEVELOPMENT ONLY: Allow test user login with fixed credentials
    if (email === 'test@example.com' && password === 'password123') {
      console.log('Using test user login bypass');

      // Find or create test user
      let testUser = await User.findOne({ email: 'test@example.com' });

      if (!testUser) {
        // Create a test user if it doesn't exist
        testUser = new User({
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedpassword', // This won't be used for comparison
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          emailVerified: true
        });
        await testUser.save();
        console.log('Created test user for development');
      }

      // Generate tokens for test user
      const token = generateToken({ userId: testUser._id }, process.env.JWT_SECRET, "1h");
      const refreshToken = generateToken({ userId: testUser._id }, process.env.JWT_REFRESH_SECRET, "7d");

      // Store refresh token in Redis
      await redisClient.setex(`refresh_token:${testUser._id}`, 60 * 60 * 24 * 7, refreshToken) // 7 days

      // Return test user data and tokens
      return res.status(200).json({
        user: {
          _id: testUser._id,
          username: testUser.username,
          email: testUser.email,
        },
        token,
        refreshToken,
      });
    }

    // Normal authentication flow
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      console.log('User not found for email:', email);
      throw createError(401, "Invalid credentials")
    }

    console.log('Found user:', user.email);
    console.log('Stored password hash:', user.password);
    console.log('Input password:', password);

    // Check password using bcrypt directly to avoid any method issues
    try {
      // Log for debugging (remove in production)
      console.log('Comparing passwords for user:', user.email);

      // Use comparePassword function
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        console.log('Password validation failed');
        throw createError(401, "Invalid credentials");
      }

      console.log('Password validation successful');
    } catch (error) {
      console.error("Password comparison error:", error);
      throw createError(500, "Error during authentication");
    }

    // Generate tokens
    const token = generateToken({ userId: user._id }, process.env.JWT_SECRET, "1h")
    const refreshToken = generateToken({ userId: user._id }, process.env.JWT_REFRESH_SECRET, "7d")

    // Store refresh token in Redis
    await redisClient.setex(`refresh_token:${user._id}`, 60 * 60 * 24 * 7, refreshToken) // 7 days

    // Return user data and tokens
    res.status(200).json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
      refreshToken,
    })
  });

  // Logout user
  logout = catchAsync(async (req, res) => {
    const { refreshToken } = req.body
    const redisClient = req.app.locals.redis

    if (!refreshToken) {
      throw createError(400, "Refresh token is required")
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET)
    if (!decoded) {
      throw createError(401, "Invalid refresh token")
    }

    // Remove refresh token from Redis
    await redisClient.del(`refresh_token:${decoded.userId}`)

    res.status(200).json({ message: "Logged out successfully" })
  });

  // Get current user
  getCurrentUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password")
    if (!user) {
      throw createError(404, "User not found")
    }

    res.status(200).json(user)
  });

  // Refresh token
  refreshToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.body
    const redisClient = req.app.locals.redis

    if (!refreshToken) {
      throw createError(400, "Refresh token is required")
    }

    // Verify refresh token
    let decoded
    try {
      decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET)
    } catch (error) {
      throw createError(401, "Invalid refresh token")
    }

    // Check if refresh token exists in Redis
    const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`)
    if (!storedToken || storedToken !== refreshToken) {
      throw createError(401, "Invalid refresh token")
    }

    // Generate new tokens
    const newToken = generateToken({ userId: decoded.userId }, process.env.JWT_SECRET, "1h")
    const newRefreshToken = generateToken({ userId: decoded.userId }, process.env.JWT_REFRESH_SECRET, "7d")

    // Update refresh token in Redis
    await redisClient.setex(`refresh_token:${decoded.userId}`, 60 * 60 * 24 * 7, newRefreshToken) // 7 days

    res.status(200).json({
      token: newToken,
      refreshToken: newRefreshToken,
    })
  });

  // Request password reset
  requestPasswordReset = catchAsync(async (req, res) => {

    const { email } = req.body
    const redisClient = req.app.locals.redis

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      // Don't reveal that the user doesn't exist
      return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" })
    }

    // Generate reset token
    const resetToken = generateToken({ userId: user._id }, process.env.JWT_SECRET, "1h")

    // Store reset token in Redis
    await redisClient.setex(`reset_token:${user._id}`, 60 * 60, resetToken) // 1 hour

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
    await sendPasswordResetEmail(user.email, user.username, resetUrl)

    res.status(200).json({ message: "If your email is registered, you will receive a password reset link" })
  });

  // Reset password
  resetPassword = catchAsync(async (req, res) => {

    const { token } = req.params
    const { password } = req.body
    const redisClient = req.app.locals.redis

    // Verify token
    const decoded = verifyToken(token, process.env.JWT_SECRET)
    if (!decoded) {
      throw createError(401, "Invalid or expired token")
    }

    // Check if reset token exists in Redis
    const storedToken = await redisClient.get(`reset_token:${decoded.userId}`)
    if (!storedToken || storedToken !== token) {
      throw createError(401, "Invalid or expired token")
    }

    // Find user
    const user = await User.findById(decoded.userId)
    if (!user) {
      throw createError(404, "User not found")
    }

    // Hash new password
    const hashedPassword = await hashPassword(password)

    // Update user password
    user.password = hashedPassword
    await user.save()

    // Remove reset token from Redis
    await redisClient.del(`reset_token:${decoded.userId}`)

    res.status(200).json({ message: "Password reset successful" })
  });

  // Update user profile
  updateProfile = catchAsync(async (req, res) => {
    console.log(req.params)
    const { username, email, firstName, lastName, phoneNumber, bio, jobTitle, department } = req.body

    // Find user
    const user = await User.findById(req.params.id)
    if (!user) {
      throw createError(404, "User not found")
    }

    // Update user data
    if (username) user.username = username
    if (email) user.email = email 
    if (firstName) user.firstName = firstName
    if (lastName) user.lastName = lastName
    if (phoneNumber) user.phoneNumber = phoneNumber
    if (bio) user.bio = bio
    if (jobTitle) user.jobTitle = jobTitle
    if (department) user.department = department

    await user.save()

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      bio: user.bio,
      jobTitle: user.jobTitle,
      department: user.department,
    })
  });
}

export default new AuthController();
