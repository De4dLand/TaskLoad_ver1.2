import mongoose from 'mongoose';
import NotificationService from '../services/notificationService.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';

// Mock data
const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  username: 'testuser',
  email: 'test@example.com'
};

const mockProject = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test Project',
  members: [{ user: mockUser._id, role: 'member' }]
};

const mockTask = {
  _id: new mongoose.Types.ObjectId(),
  title: 'Test Task',
  description: 'Test Description',
  project: mockProject._id,
  assignedTo: mockUser._id,
  createdBy: mockUser._id,
  dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
  status: 'todo',
  priority: 'high'
};

// Mock the models
jest.mock('../models/User.js');
jest.mock('../models/Project.js');
jest.mock('../models/Task.js');
jest.mock('../models/Notification.js');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTaskNotification', () => {
    it('should create a notification when a task is created', async () => {
      // Mock Project.findById
      Project.findById = jest.fn().mockResolvedValue(mockProject);
      
      // Mock Notification.save
      const saveMock = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        ...mockTask,
        type: 'task',
        recipients: [mockUser._id],
        content: `New task created: ${mockTask.title}`
      });
      
      Notification.prototype.save = saveMock;
      
      // Call the function
      const result = await NotificationService.createTaskNotification(mockTask);
      
      // Assertions
      expect(Project.findById).toHaveBeenCalledWith(mockTask.project);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('checkDueDateNotifications', () => {
    it('should create notifications for upcoming tasks', async () => {
      // Mock Task.find
      Task.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([mockTask])
          })
        })
      });
      
      // Mock Notification.findOne
      Notification.findOne = jest.fn().mockResolvedValue(null);
      
      // Mock Notification.save
      const saveMock = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        type: 'deadline',
        recipients: [mockUser._id],
        content: expect.stringContaining('Reminder')
      });
      
      Notification.prototype.save = saveMock;
      
      // Call the function
      const result = await NotificationService.checkDueDateNotifications();
      
      // Assertions
      expect(Task.find).toHaveBeenCalled();
      expect(Notification.findOne).toHaveBeenCalled();
      expect(saveMock).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('createCustomNotification', () => {
    it('should create a custom notification for project members', async () => {
      // Mock Project.findById
      Project.findById = jest.fn().mockResolvedValue(mockProject);
      
      // Mock Notification.save
      const saveMock = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        type: 'system',
        recipients: [mockUser._id],
        sender: mockUser._id,
        content: 'Custom notification',
        relatedProject: mockProject._id
      });
      
      Notification.prototype.save = saveMock;
      
      // Call the function
      const result = await NotificationService.createCustomNotification(
        mockUser._id,
        mockProject._id,
        'Custom notification'
      );
      
      // Assertions
      expect(Project.findById).toHaveBeenCalledWith(mockProject._id);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
