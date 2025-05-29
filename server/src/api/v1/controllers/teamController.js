import Team from "../../../models/Team.js";
import Project from '../../../models/Project.js';
import logger from '../../../utils/logger.js';
import TeamService from '../../../services/teamServices.js';
import { catchAsync, createError } from '../../../utils/error.js';

export class TeamController {
    constructor() {
        this.teamService = TeamService;
    }

    // Tạo team mới
    createTeam = catchAsync(async (req, res) => {
        const team = await this.teamService.createTeam({
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
    getTeams = catchAsync(async (req, res) => {
        const result = await this.teamService.getTeams(req.query);

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
    getTeam = catchAsync(async (req, res) => {
        const team = await this.teamService.getTeamById(req.params.id);

        res.status(200).json({
            status: 'success',
            data: team
        });
    });

    // Cập nhật thông tin team
    updateTeam = catchAsync(async (req, res) => {
        const team = await this.teamService.updateTeam(req.params.id, req.body);

        res.status(200).json({
            status: 'success',
            data: team
        });
    });

    // Xóa team
    deleteTeam = catchAsync(async (req, res) => {
        await this.teamService.deleteTeam(req.params.id);

        res.status(204).json({
            status: 'success',
            data: null
        });
    });

    // Thêm thành viên mới
    addMember = catchAsync(async (req, res) => {
        const team = await this.teamService.addMember(req.params.id, req.body.userId);

        res.status(200).json({
            status: 'success',
            data: team
        });
    });

    // Xóa thành viên
    removeMember = catchAsync(async (req, res) => {
        const team = await this.teamService.removeMember(req.params.id, req.params.userId);

        res.status(200).json({
            status: 'success',
            data: team
        });
    });

    // Cập nhật vai trò thành viên
    updateMemberRole = catchAsync(async (req, res) => {
        const { role } = req.body;
        const team = await Team.findById(req.params.id);

        if (!team) {
            throw createError(404, 'Team not found');
        }

        // Kiểm tra quyền cập nhật vai trò
        if (team.owner.toString() !== req.user._id.toString()) {
            throw createError(403, 'Only team owner can update member roles');
        }

        const member = team.members.find(
            member => member.user.toString() === req.params.userId
        );

        if (!member) {
            throw createError(404, 'Member not found');
        }

        member.role = role;
        await team.save();

        logger.info(`Member role updated in team: ${team._id}`);
        res.json(team);
    });

    // Rời khỏi team
    leaveTeam = catchAsync(async (req, res) => {
        const team = await Team.findById(req.params.id);

        if (!team) {
            throw createError(404, 'Team not found');
        }

        // Không cho phép owner rời team
        if (team.owner.toString() === req.user._id.toString()) {
            throw createError(400, 'Team owner cannot leave the team');
        }

        team.members = team.members.filter(
            member => member.user.toString() !== req.user._id.toString()
        );
        await team.save();

        logger.info(`User left team: ${team._id}`);
        res.json({ message: 'Left team successfully' });
    });

    // Lấy danh sách thành viên
    getTeamMembers = catchAsync(async (req, res) => {
        const members = await this.teamService.getTeamMembers(req.params.id);

        res.status(200).json({
            status: 'success',
            data: members
        });
    });

    // Lấy danh sách dự án của team
    getTeamProjects = catchAsync(async (req, res) => {
        const projects = await this.teamService.getTeamProjects(req.params.id);

        res.status(200).json({
            status: 'success',
            data: projects
        });
    });

    // Lấy team statistics
    getTeamStats = catchAsync(async (req, res) => {
        const stats = await this.teamService.getTeamStats(req.params.id);

        res.status(200).json({
            status: 'success',
            data: stats
        });
    });

    // Lấy team timeline
    getTeamTimeline = catchAsync(async (req, res) => {
        const timeline = await this.teamService.getTeamTimeline(req.params.id);

        res.status(200).json({
            status: 'success',
            data: timeline
        });
    });

    // Lấy team custom fields
    getCustomFields = catchAsync(async (req, res) => {
        const customFields = await this.teamService.getCustomFields(req.params.id);

        res.status(200).json({
            status: 'success',
            data: customFields
        });
    });

    // Update team custom fields
    updateCustomFields = catchAsync(async (req, res) => {
        const customFields = await this.teamService.updateCustomFields(req.params.id, req.body);

        res.status(200).json({
            status: 'success',
            data: customFields
        });
    });

    // Add project to team
    addProject = catchAsync(async (req, res) => {
        const team = await this.teamService.addProject(req.params.id, req.body.projectId);

        res.status(200).json({
            status: 'success',
            data: team
        });
    });

    // Remove project from team
    removeProject = catchAsync(async (req, res) => {
        const team = await this.teamService.removeProject(req.params.id, req.params.projectId);

        res.status(200).json({
            status: 'success',
            data: team
        });
    });
}

export default new TeamController();