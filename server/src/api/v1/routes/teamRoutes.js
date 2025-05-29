import express from 'express';
import TeamController from '../controllers/teamController.js';
import auth from '../../../middlewares/auth.js';
import { validateTeam } from '../validator/teamValidator.js';
import { checkTeamPermission } from '../../../utils/permissionMiddleware.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(auth.verifyToken);

// Team routes
router
    .route('/')
    .get(TeamController.getTeams)
    .post(validateTeam, TeamController.createTeam);

router
    .route('/:id')
    .get(checkTeamPermission(false), TeamController.getTeam)
    .patch(checkTeamPermission(true), validateTeam, TeamController.updateTeam)
    .delete(checkTeamPermission(true), TeamController.deleteTeam);

// Team member routes
router
    .route('/:id/members')
    .get(checkTeamPermission(false), TeamController.getTeamMembers)
    .post(checkTeamPermission(true), TeamController.addMember);

router
    .route('/:id/members/:userId')
    .delete(checkTeamPermission(true), TeamController.removeMember);

// Team project routes
router
    .route('/:id/projects')
    .get(checkTeamPermission(false), TeamController.getTeamProjects)
    .post(checkTeamPermission(true), TeamController.addProject);

router
    .route('/:id/projects/:projectId')
    .delete(checkTeamPermission(true), TeamController.removeProject);

// Team statistics routes
router
    .route('/:id/stats')
    .get(checkTeamPermission(false), TeamController.getTeamStats);

// Team timeline routes
router
    .route('/:id/timeline')
    .get(checkTeamPermission(false), TeamController.getTeamTimeline);

// Team custom fields routes
router
    .route('/:id/custom-fields')
    .get(checkTeamPermission(false), TeamController.getCustomFields)
    .patch(checkTeamPermission(true), TeamController.updateCustomFields);

export default router;