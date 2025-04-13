import express from 'express';
import auth from '../../../middlewares/auth.js';
import {
    register,
    login,
    logout,
    refreshToken,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    updateAvatar,
    deleteAccount
} from '../../v1/controllers/userController.js';

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

export default router; 