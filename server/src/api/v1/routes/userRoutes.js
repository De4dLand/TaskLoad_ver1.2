import express from 'express';
import auth from '../../../middlewares/auth.js';
import authController from '../../v1/controllers/authController.js';
import { UserController } from '../../v1/controllers/userController.js';
const userController = new UserController();

// Aliases for user-specific operations
const getProfile = authController.getCurrentUser;
const changePassword = userController.updateMe;
const updateAvatar = userController.updateAvatar;
const deleteAccount = userController.deleteMe;

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.use(auth.verifyToken);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/profile', getProfile);
router.put('/profile', authController.updateProfile);
router.put('/change-password', changePassword);
router.put('/avatar', updateAvatar);
router.delete('/account', deleteAccount);

// Search users by username or email
router.get('/search', userController.searchUsers);

// Additional user routes
router.get('/preferences', userController.getUserPreferences);
router.put('/preferences', userController.updateUserPreferences);
router.get('/stats', userController.getUserStats);

// Custom fields routes
router.get('/custom-fields', userController.getCustomFields);
router.post('/custom-fields', userController.addCustomField);
router.put('/custom-fields', userController.updateCustomField);

export default router;