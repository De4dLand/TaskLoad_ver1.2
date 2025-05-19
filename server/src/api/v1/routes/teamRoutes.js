import express from 'express';
import TeamController from '../controllers/teamController.js';
import auth from '../../../middlewares/auth.js';
import { validateTeam } from '../validator/teamValidator.js';
import { checkTeamPermission } from '../../../utils/permissionMiddleware.js';

const router = express.Router();
const teamController = new TeamController();

// Protect all routes after this middleware
router.use(auth.verifyToken);

// Team routes
router
    .route('/')
    .get(teamController.getTeams)
    .post(validateTeam, teamController.createTeam);

router
    .route('/:id')
    .get(checkTeamPermission(false), teamController.getTeam)
    .patch(checkTeamPermission(true), validateTeam, teamController.updateTeam)
    .delete(checkTeamPermission(true), teamController.deleteTeam);

// Team member routes
router
    .route('/:id/members')
    .get(checkTeamPermission(false), teamController.getTeamMembers)
    .post(checkTeamPermission(true), teamController.addMember);

router
    .route('/:id/members/:userId')
    .delete(checkTeamPermission(true), teamController.removeMember);

// Team project routes
router
    .route('/:id/projects')
    .get(checkTeamPermission(false), teamController.getTeamProjects)
    .post(checkTeamPermission(true), teamController.addProject);

router
    .route('/:id/projects/:projectId')
    .delete(checkTeamPermission(true), teamController.removeProject);

// Team statistics routes
router
    .route('/:id/stats')
    .get(checkTeamPermission(false), teamController.getTeamStats);

// Team timeline routes
router
    .route('/:id/timeline')
    .get(checkTeamPermission(false), teamController.getTeamTimeline);

// Team custom fields routes
router
    .route('/:id/custom-fields')
    .get(checkTeamPermission(false), teamController.getCustomFields)
    .patch(checkTeamPermission(true), teamController.updateCustomFields);

export default router;