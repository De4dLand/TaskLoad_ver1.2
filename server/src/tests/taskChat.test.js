import mongoose from 'mongoose';
import TaskChatService from '../services/taskChatService.js';
import ChatService from '../services/chatService.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

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
  status: 'todo',
  priority: 'high'
};

const mockChatRoom = {
  _id: new mongoose.Types.ObjectId(),
  roomId: `task_${mockTask._id}_${Date.now()}`,
  type: 'task',
  participants: [mockUser._id],
  taskId: mockTask._id,
  projectId: mockProject._id,
  messages: []
};

// Mock the models and services
jest.mock('../services/chatService.js');
jest.mock('../models/Task.js');
jest.mock('../models/User.js');
jest.mock('../models/Project.js');

describe('TaskChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrGetTaskChatRoom', () => {
    it('should return existing chat room if task already has one', async () => {
      // Setup
      const taskWithChatRoom = {
        ...mockTask,
        chatRoomId: mockChatRoom.roomId
      };
      
      ChatService.getChatRoomById = jest.fn().mockResolvedValue(mockChatRoom);
      
      // Execute
      const result = await TaskChatService.createOrGetTaskChatRoom(taskWithChatRoom);
      
      // Assert
      expect(ChatService.getChatRoomById).toHaveBeenCalledWith(mockChatRoom.roomId);
      expect(result).toEqual(mockChatRoom);
    });

    it('should create a new chat room if task does not have one', async () => {
      // Setup
      Project.findById = jest.fn().mockResolvedValue(mockProject);
      ChatService.createChatRoom = jest.fn().mockResolvedValue(mockChatRoom);
      Task.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockTask, chatRoomId: mockChatRoom.roomId });
      
      // Execute
      const result = await TaskChatService.createOrGetTaskChatRoom(mockTask);
      
      // Assert
      expect(Project.findById).toHaveBeenCalledWith(mockTask.project);
      expect(ChatService.createChatRoom).toHaveBeenCalled();
      expect(Task.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toEqual(mockChatRoom);
    });
  });

  describe('sendTaskChatMessage', () => {
    it('should send a message to a task chat room and create notifications', async () => {
      // Setup
      const messageData = {
        sender: mockUser._id,
        content: 'Test message',
        timestamp: new Date()
      };
      
      Task.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            ...mockTask,
            chatRoomId: mockChatRoom.roomId
          })
        })
      });
      
      ChatService.getChatRoomById = jest.fn().mockResolvedValue(mockChatRoom);
      ChatService.saveMessage = jest.fn().mockResolvedValue({
        ...mockChatRoom,
        messages: [messageData]
      });
      
      // Execute
      const result = await TaskChatService.sendTaskChatMessage(mockTask._id, messageData);
      
      // Assert
      expect(Task.findById).toHaveBeenCalledWith(mockTask._id);
      expect(ChatService.getChatRoomById).toHaveBeenCalledWith(mockChatRoom.roomId);
      expect(ChatService.saveMessage).toHaveBeenCalledWith(mockChatRoom.roomId, messageData);
      expect(result.messages).toContainEqual(messageData);
    });
  });

  describe('getTaskChatHistory', () => {
    it('should get chat history for a task', async () => {
      // Setup
      const options = { limit: 50, skip: 0 };
      
      Task.findById = jest.fn().mockResolvedValue({
        ...mockTask,
        chatRoomId: mockChatRoom.roomId
      });
      
      ChatService.getChatHistory = jest.fn().mockResolvedValue({
        ...mockChatRoom,
        messages: [
          {
            sender: mockUser._id,
            content: 'Test message 1',
            timestamp: new Date()
          },
          {
            sender: mockUser._id,
            content: 'Test message 2',
            timestamp: new Date()
          }
        ]
      });
      
      // Execute
      const result = await TaskChatService.getTaskChatHistory(mockTask._id, options);
      
      // Assert
      expect(Task.findById).toHaveBeenCalledWith(mockTask._id);
      expect(ChatService.getChatHistory).toHaveBeenCalledWith(mockChatRoom.roomId, options);
      expect(result.messages.length).toBe(2);
    });

    it('should create a chat room if task does not have one', async () => {
      // Setup
      const options = { limit: 50, skip: 0 };
      
      // First call returns task without chatRoomId
      Task.findById = jest.fn()
        .mockResolvedValueOnce({ ...mockTask, chatRoomId: null })
        // Second call returns task with chatRoomId (after creation)
        .mockResolvedValueOnce({ ...mockTask, chatRoomId: mockChatRoom.roomId });
      
      // Mock the createOrGetTaskChatRoom method
      const createOrGetTaskChatRoomSpy = jest.spyOn(TaskChatService, 'createOrGetTaskChatRoom')
        .mockResolvedValue(mockChatRoom);
      
      ChatService.getChatHistory = jest.fn().mockResolvedValue(mockChatRoom);
      
      // Execute
      const result = await TaskChatService.getTaskChatHistory(mockTask._id, options);
      
      // Assert
      expect(Task.findById).toHaveBeenCalledTimes(2);
      expect(createOrGetTaskChatRoomSpy).toHaveBeenCalledWith({ ...mockTask, chatRoomId: null });
      expect(ChatService.getChatHistory).toHaveBeenCalledWith(mockChatRoom.roomId, options);
      expect(result).toEqual(mockChatRoom);
      
      // Restore the spy
      createOrGetTaskChatRoomSpy.mockRestore();
    });
  });
});
