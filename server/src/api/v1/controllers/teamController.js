import Team from "../../../models/Team.js";
import Project from '../../../models/Project.js';
import logger from '../../../utils/logger.js';
import TeamService from '../../../services/teamServices.js';
import { catchAsync } from '../../../utils/error.js';

// Tạo team mới
export const createTeam = catchAsync(async (req, res, next) => {
    const team = await TeamService.createTeam({
        ...req.body,
        leader: req.user._id,
        members: [req.user._id]
    });

    res.status(201).json({
        status: 'success',
        data: team
    });
});

// Lấy danh sách teams
export const getTeams = catchAsync(async (req, res, next) => {
    const result = await TeamService.getTeams(req.query);

    res.status(200).json({
        status: 'success',
        results: result.teams.length,
        pagination: {
            total: result.total,
            page: result.page,
            pages: result.pages
        },
        data: result.teams
    });
});

// Lấy thông tin team theo ID
export const getTeam = catchAsync(async (req, res, next) => {
    const team = await TeamService.getTeamById(req.params.id);

    res.status(200).json({
        status: 'success',
        data: team
    });
});

// Cập nhật thông tin team
export const updateTeam = catchAsync(async (req, res, next) => {
    const team = await TeamService.updateTeam(req.params.id, req.body);

    res.status(200).json({
        status: 'success',
        data: team
    });
});

// Xóa team
export const deleteTeam = catchAsync(async (req, res, next) => {
    await TeamService.deleteTeam(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Thêm thành viên mới
export const addMember = catchAsync(async (req, res, next) => {
    const team = await TeamService.addMember(req.params.id, req.body.userId);

    res.status(200).json({
        status: 'success',
        data: team
    });
});

// Xóa thành viên
export const removeMember = catchAsync(async (req, res, next) => {
    const team = await TeamService.removeMember(req.params.id, req.params.userId);

    res.status(200).json({
        status: 'success',
        data: team
    });
});

// Cập nhật vai trò thành viên
export const updateMemberRole = async (req, res) => {
    try {
        const { role } = req.body;
        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Kiểm tra quyền cập nhật vai trò
        if (team.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only team owner can update member roles' });
        }

        const member = team.members.find(
            member => member.user.toString() === req.params.userId
        );

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        member.role = role;
        await team.save();

        logger.info(`Member role updated in team: ${team._id}`);
        res.json(team);
    } catch (error) {
        logger.error(`Error updating member role: ${error.message}`);
        res.status(500).json({ message: 'Error updating member role' });
    }
};

// Rời khỏi team
export const leaveTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Không cho phép owner rời team
        if (team.owner.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Team owner cannot leave the team' });
        }

        team.members = team.members.filter(
            member => member.user.toString() !== req.user._id.toString()
        );
        await team.save();

        logger.info(`User left team: ${team._id}`);
        res.json({ message: 'Left team successfully' });
    } catch (error) {
        logger.error(`Error leaving team: ${error.message}`);
        res.status(500).json({ message: 'Error leaving team' });
    }
};

// Lấy danh sách thành viên
export const getTeamMembers = catchAsync(async (req, res, next) => {
    const members = await TeamService.getTeamMembers(req.params.id);

    res.status(200).json({
        status: 'success',
        data: members
    });
});

// Lấy danh sách dự án của team
export const getTeamProjects = catchAsync(async (req, res, next) => {
    const projects = await TeamService.getTeamProjects(req.params.id);

    res.status(200).json({
        status: 'success',
        data: projects
    });
});

// Lấy team statistics
export const getTeamStats = catchAsync(async (req, res, next) => {
    const stats = await TeamService.getTeamStats(req.params.id);

    res.status(200).json({
        status: 'success',
        data: stats
    });
});

// Lấy team timeline
export const getTeamTimeline = catchAsync(async (req, res, next) => {
    const timeline = await TeamService.getTeamTimeline(req.params.id);

    res.status(200).json({
        status: 'success',
        data: timeline
    });
});

// Lấy team custom fields
export const getCustomFields = catchAsync(async (req, res, next) => {
    const customFields = await TeamService.getCustomFields(req.params.id);

    res.status(200).json({
        status: 'success',
        data: customFields
    });
});

// Update team custom fields
export const updateCustomFields = catchAsync(async (req, res, next) => {
    const customFields = await TeamService.updateCustomFields(req.params.id, req.body);

    res.status(200).json({
        status: 'success',
        data: customFields
    });
});

// Add project to team
export const addProject = catchAsync(async (req, res, next) => {
    const team = await TeamService.addProject(req.params.id, req.body.projectId);

    res.status(200).json({
        status: 'success',
        data: team
    });
});

// Remove project from team
export const removeProject = catchAsync(async (req, res, next) => {
    const team = await TeamService.removeProject(req.params.id, req.params.projectId);

    res.status(200).json({
        status: 'success',
        data: team
    });
}); 