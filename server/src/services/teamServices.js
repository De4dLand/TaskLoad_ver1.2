import Team from '../models/Team.js';
import { createError } from '../utils/error.js';

export class TeamService {
    // Tạo team mới
    async createTeam(teamData) {
        const team = await Team.create(teamData);
        return team;
    }

    // Lấy danh sách team
    async getTeams(query = {}) {
        const {
            leader,
            member,
            page = 1,
            limit = 10,
            sort = '-createdAt'
        } = query;

        const filter = {};
        if (leader) filter.leader = leader;
        if (member) filter.members = member;

        const teams = await Team.find(filter)
            .populate('leader', 'username email profileImage')
            .populate('members', 'username email profileImage')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Team.countDocuments(filter);

        return {
            teams,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        };
    }

    // Lấy chi tiết team
    async getTeamById(teamId) {
        const team = await Team.findById(teamId)
            .populate('leader', 'username email profileImage')
            .populate('members', 'username email profileImage')
            .populate('projects');

        if (!team) {
            throw createError(404, 'Team not found');
        }

        return team;
    }

    // Cập nhật team
    async updateTeam(teamId, updateData) {
        const team = await Team.findById(teamId);
        if (!team) {
            throw createError(404, 'Team not found');
        }

        // Kiểm tra quyền cập nhật
        if (updateData.leader && updateData.leader.toString() !== team.leader.toString()) {
            throw createError(403, 'You do not have permission to change team leader');
        }

        Object.assign(team, updateData);
        await team.save();

        return team;
    }

    // Xóa team
    async deleteTeam(teamId) {
        const team = await Team.findByIdAndDelete(teamId);
        if (!team) {
            throw createError(404, 'Team not found');
        }
        return team;
    }

    // Thêm thành viên vào team
    async addMember(teamId, userId) {
        const team = await Team.findById(teamId);
        if (!team) {
            throw createError(404, 'Team not found');
        }

        if (team.members.includes(userId)) {
            throw createError(400, 'User is already a member of this team');
        }

        team.members.push(userId);
        await team.save();

        return team;
    }

    // Xóa thành viên khỏi team
    async removeMember(teamId, userId) {
        const team = await Team.findById(teamId);
        if (!team) {
            throw createError(404, 'Team not found');
        }

        if (!team.members.includes(userId)) {
            throw createError(400, 'User is not a member of this team');
        }

        team.members = team.members.filter(id => id.toString() !== userId.toString());
        await team.save();

        return team;
    }

    // Thêm project vào team
    async addProject(teamId, projectId) {
        const team = await Team.findById(teamId);
        if (!team) {
            throw createError(404, 'Team not found');
        }

        if (team.projects.includes(projectId)) {
            throw createError(400, 'Project is already in this team');
        }

        team.projects.push(projectId);
        await team.save();

        return team;
    }

    // Xóa project khỏi team
    async removeProject(teamId, projectId) {
        const team = await Team.findById(teamId);
        if (!team) {
            throw createError(404, 'Team not found');
        }

        if (!team.projects.includes(projectId)) {
            throw createError(400, 'Project is not in this team');
        }

        team.projects = team.projects.filter(id => id.toString() !== projectId.toString());
        await team.save();

        return team;
    }

    // Cập nhật cài đặt team
    async updateTeamSettings(teamId, settings) {
        const team = await Team.findById(teamId);
        if (!team) {
            throw createError(404, 'Team not found');
        }

        team.settings = { ...team.settings, ...settings };
        await team.save();

        return team;
    }
}

// Export các hàm riêng lẻ để sử dụng trong middleware
export const findOne = async (teamId) => {
    const team = await Team.findById(teamId);
    if (!team) {
        throw createError(404, 'Team not found');
    }
    return team;
};

export const findByLeader = async (leaderId) => {
    return await Team.find({ leader: leaderId });
};

export const findByMember = async (memberId) => {
    return await Team.find({ members: memberId });
}; 