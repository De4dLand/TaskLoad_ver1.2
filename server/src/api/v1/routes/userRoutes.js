import express from 'express';
import auth from '../../../middlewares/auth.js';
import {
    register,
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    updateProfile
} from '../../v1/controllers/authController.js';
import { UserController } from '../../v1/controllers/userController.js';
const userController = new UserController();

// Aliases for user-specific operations
const getProfile = getCurrentUser;
const changePassword = userController.updateMe;
const updateAvatar = userController.updateAvatar;
const deleteAccount = userController.deleteMe;

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.use(auth);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.put('/avatar', updateAvatar);
router.delete('/account', deleteAccount);

// Search users by username or email
router.get('/search', userController.searchUsers);

export default router;