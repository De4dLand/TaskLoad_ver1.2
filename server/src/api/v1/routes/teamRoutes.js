import express from 'express';
import TeamController from '../controllers/teamController.js';
import auth from '../../../middlewares/auth.js';
import { validateTeam } from '../validator/teamValidator.js';

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
    .get(teamController.getTeam)
    .patch(validateTeam, teamController.updateTeam)
    .delete(teamController.deleteTeam);

// Team member routes
router
    .route('/:id/members')
    .get(teamController.getTeamMembers)
    .post(teamController.addMember);

router
    .route('/:id/members/:userId')
    .delete(teamController.removeMember);

// Team project routes
router
    .route('/:id/projects')
    .get(teamController.getTeamProjects)
    .post(teamController.addProject);

router
    .route('/:id/projects/:projectId')
    .delete(teamController.removeProject);

// Team statistics routes
router
    .route('/:id/stats')
    .get(teamController.getTeamStats);

// Team timeline routes
router
    .route('/:id/timeline')
    .get(teamController.getTeamTimeline);

// Team custom fields routes
router
    .route('/:id/custom-fields')
    .get(teamController.getCustomFields)
    .patch(teamController.updateCustomFields);

export default router; 