import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import NotificationService from './notificationService.js';
import logger from '../utils/logger.js';

/**
 * Service for handling MongoDB Change Streams to detect data changes
 * and trigger real-time actions
 */
class ChangeStreamService {
  constructor(io) {
    this.io = io;
    this.taskStream = null;
    this.projectStream = null;
    this.isInitialized = false;
  }

  /**
   * Initialize change streams for all collections
   */
  async initialize() {
    if (this.isInitialized) {
      logger.warn('ChangeStreamService already initialized');
      return;
    }

    try {
      // Check if we're connected to MongoDB
      if (!mongoose.connection.readyState) {
        throw new Error('MongoDB connection not established');
      }

      const adminDb = mongoose.connection.db.admin();
        const serverStatus = await adminDb.serverStatus();
        const { version } = serverStatus;
        const [major] = version.split('.');
      
      if (parseInt(major) < 4) {
        logger.error('MongoDB version does not support change streams. Version 4.0 or higher required.');
        return;
      }

      // Initialize change streams
      await this.initializeTaskStream();
      await this.initializeProjectStream();
      
      this.isInitialized = true;
      logger.info('ChangeStreamService initialized successfully');
    } catch (error) {
      logger.error('Error initializing ChangeStreamService:', error);
      throw error;
    }
  }

  /**
   * Initialize change stream for Task collection
   */
  async initializeTaskStream() {
    try {
      // Create a change stream pipeline to filter relevant operations
      const pipeline = [
        {
          $match: {
            $or: [
              { operationType: 'insert' },
              { operationType: 'update' },
              { operationType: 'delete' },
              { operationType: 'replace' }
            ]
          }
        }
      ];

      // Create the change stream
      this.taskStream = Task.watch(pipeline, { fullDocument: 'updateLookup' });

      // Handle events
      this.taskStream.on('change', async (change) => {
        try {
          await this.handleTaskChange(change);
        } catch (error) {
          logger.error('Error handling task change event:', error);
        }
      });

      this.taskStream.on('error', (error) => {
        logger.error('Error in task change stream:', error);
        // Attempt to resume the stream after a delay
        setTimeout(() => this.initializeTaskStream(), 5000);
      });

      logger.info('Task change stream initialized');
    } catch (error) {
      logger.error('Error initializing task change stream:', error);
      throw error;
    }
  }
  /**
   * Initialize change stream for Project collection
   */
  async initializeProjectStream() {
    try {
      // Create a change stream pipeline to filter relevant operations
      const pipeline = [
        {
          $match: {
            $or: [
              { operationType: 'insert' },
              { operationType: 'update' },
              { operationType: 'delete' },
              { operationType: 'replace' }
            ]
          }
        }
      ];

      // Create the change stream
      this.projectStream = Project.watch(pipeline, { fullDocument: 'updateLookup' });

      // Handle events
      this.projectStream.on('change', async (change) => {
        try {
          await this.handleProjectChange(change);
        } catch (error) {
          logger.error('Error handling project change event:', error);
        }
      });

      this.projectStream.on('error', (error) => {
        logger.error('Error in project change stream:', error);
        // Attempt to resume the stream after a delay
        setTimeout(() => this.initializeProjectStream(), 5000);
      });

      logger.info('Project change stream initialized');
    } catch (error) {
      logger.error('Error initializing project change stream:', error);
      throw error;
    }
  }

  /**
   * Handle task change events
   * @param {Object} change - The change event from MongoDB
   */
  async handleTaskChange(change) {
    const { operationType, fullDocument, documentKey } = change;
    
    // Get task ID
    const taskId = documentKey._id;
    
    // Handle different operation types
    switch (operationType) {
      case 'insert':
        // New task created
        logger.info(`New task created: ${taskId}`);
        
        // Emit to project room
        if (fullDocument && fullDocument.project) {
          this.io.to(`project:${fullDocument.project}`).emit('task:created', {
            taskId: taskId,
            task: fullDocument
          });
        }
        
        // Create notification
        if (fullDocument) {
          await NotificationService.createTaskNotification(fullDocument);
        }
        break;
        
      case 'update':
      case 'replace':
        // Task updated
        logger.info(`Task updated: ${taskId}`);
        
        if (fullDocument) {
          // Emit to task-specific room
          this.io.to(`task:${taskId}`).emit('task:updated', {
            taskId: taskId,
            task: fullDocument
          });
          
          // Emit to project room
          if (fullDocument.project) {
            this.io.to(`project:${fullDocument.project}`).emit('task:updated', {
              taskId: taskId,
              task: fullDocument
            });
          }
          
          // Check for status change and create notification if needed
          if (change.updateDescription && 
              change.updateDescription.updatedFields && 
              change.updateDescription.updatedFields.status) {
            await NotificationService.createTaskStatusChangeNotification(
              fullDocument,
              change.updateDescription.updatedFields.status
            );
          }
          
          // Check for assignee change
          if (change.updateDescription && 
              change.updateDescription.updatedFields && 
              change.updateDescription.updatedFields.assignedTo) {
            await NotificationService.createTaskAssignmentNotification(fullDocument);
          }
        }
        break;
        
      case 'delete':
        // Task deleted
        logger.info(`Task deleted: ${taskId}`);
        
        // We don't have the full document for deletes, just the ID
        this.io.emit('task:deleted', { taskId: taskId });
        break;
        
      default:
        // Ignore other operation types
        break;
    }
  }

  /**
   * Handle project change events
   * @param {Object} change - The change event from MongoDB
   */
  async handleProjectChange(change) {
    const { operationType, fullDocument, documentKey } = change;
    
    // Get project ID
    const projectId = documentKey._id;
    
    // Handle different operation types
    switch (operationType) {
      case 'insert':
        // New project created
        logger.info(`New project created: ${projectId}`);
        
        // Emit to all connected clients (or to specific users if you have that info)
        this.io.emit('project:created', {
          projectId: projectId,
          project: fullDocument
        });
        
        // Create notification for project members
        if (fullDocument) {
          await NotificationService.createProjectNotification(fullDocument);
        }
        break;
        
      case 'update':
      case 'replace':
        // Project updated
        logger.info(`Project updated: ${projectId}`);
        
        if (fullDocument) {
          // Emit to project-specific room
          this.io.to(`project:${projectId}`).emit('project:updated', {
            projectId: projectId,
            project: fullDocument
          });
          
          // Check for member changes
          if (change.updateDescription && 
              change.updateDescription.updatedFields && 
              change.updateDescription.updatedFields.members) {
            await NotificationService.createProjectMemberChangeNotification(fullDocument);
          }
        }
        break;
        
      case 'delete':
        // Project deleted
        logger.info(`Project deleted: ${projectId}`);
        
        // We don't have the full document for deletes, just the ID
        this.io.emit('project:deleted', { projectId: projectId });
        break;
        
      default:
        // Ignore other operation types
        break;
    }
  }

  /**
   * Close all change streams
   */
  async close() {
    try {
      if (this.taskStream) {
        await this.taskStream.close();
        this.taskStream = null;
      }
      
      if (this.projectStream) {
        await this.projectStream.close();
        this.projectStream = null;
      }
      
      this.isInitialized = false;
      logger.info('ChangeStreamService closed successfully');
    } catch (error) {
      logger.error('Error closing ChangeStreamService:', error);
      throw error;
    }
  }
}

export default ChangeStreamService;