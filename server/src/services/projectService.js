import Project from '../models/Project.js';
import { createError } from '../utils/error.js';

export class ProjectService {
    // Tạo dự án mới
    async createProject(projectData) {
        const project = await Project.create(projectData);
        return project;
    }

    // Lấy danh sách dự án
    async getProjects(query = {}) {
        const {
            team,
            status,
            leader,
            member,
            page = 1,
            limit = 10,
            sort = '-createdAt'
        } = query;

        const filter = {};
        if (team) filter.team = team;
        if (status) filter.status = status;
        if (leader) filter.leader = leader;
        if (member) filter.members = member;

        const projects = await Project.find(filter)
            .populate('leader', 'name email avatar')
            .populate('members', 'name email avatar')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Project.countDocuments(filter);

        return {
            projects,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        };
    }

    // Lấy chi tiết dự án
    async getProjectById(projectId) {
        const project = await Project.findById(projectId)
            .populate('leader', 'name email avatar')
            .populate('members', 'name email avatar')
            .populate('tasks');

        if (!project) {
            throw createError(404, 'Project not found');
        }

        return project;
    }

    // Cập nhật dự án
    async updateProject(projectId, updateData) {
        const project = await Project.findById(projectId);
        if (!project) {
            throw createError(404, 'Project not found');
        }

        // Kiểm tra quyền cập nhật
        if (updateData.leader && updateData.leader.toString() !== project.leader.toString()) {
            throw createError(403, 'You do not have permission to change project leader');
        }

        Object.assign(project, updateData);
        await project.save();

        return project;
    }

    // Xóa dự án
    async deleteProject(projectId) {
        const project = await Project.findByIdAndDelete(projectId);
        if (!project) {
            throw createError(404, 'Project not found');
        }
        return project;
    }

    // Thêm thành viên vào dự án
    async addMember(projectId, userId) {
        const project = await Project.findById(projectId);
        if (!project) {
            throw createError(404, 'Project not found');
        }

        if (project.members.includes(userId)) {
            throw createError(400, 'User is already a member of this project');
        }

        project.members.push(userId);
        await project.save();

        return project;
    }

    // Xóa thành viên khỏi dự án
    async removeMember(projectId, userId) {
        const project = await Project.findById(projectId);
        if (!project) {
            throw createError(404, 'Project not found');
        }

        if (!project.members.includes(userId)) {
            throw createError(400, 'User is not a member of this project');
        }

        project.members = project.members.filter(id => id.toString() !== userId.toString());
        await project.save();

        return project;
    }

    // Cập nhật tiến độ dự án
    async updateProjectProgress(projectId) {
        const project = await Project.findById(projectId);
        if (!project) {
            throw createError(404, 'Project not found');
        }

        await project.updateProgress();
        return project;
    }

    // Thêm file đính kèm
    async addAttachment(projectId, attachmentData) {
        const project = await Project.findById(projectId);
        if (!project) {
            throw createError(404, 'Project not found');
        }

        project.attachments.push(attachmentData);
        await project.save();

        return project;
    }

    // Xóa file đính kèm
    async removeAttachment(projectId, attachmentId) {
        const project = await Project.findById(projectId);
        if (!project) {
            throw createError(404, 'Project not found');
        }

        project.attachments = project.attachments.filter(
            attachment => attachment._id.toString() !== attachmentId
        );
        await project.save();

        return project;
    }

    // Cập nhật cài đặt dự án
    async updateProjectSettings(projectId, settings) {
        const project = await Project.findById(projectId);
        if (!project) {
            throw createError(404, 'Project not found');
        }

        project.settings = { ...project.settings, ...settings };
        await project.save();

        return project;
    }
} 