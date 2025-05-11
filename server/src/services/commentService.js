import mongoose from 'mongoose';
import Task from '../models/Task.js';

/**
 * Service for handling comment operations
 */
class CommentService {
  /**
   * Add a new comment to a task
   * @param {string} taskId - The ID of the task
   * @param {Object} commentData - The comment data
   * @returns {Promise<Object>} - The saved comment
   */
  async addComment(taskId, commentData) {
    try {
      if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
        throw new Error('Invalid task ID');
      }

      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Create the comment object
      const comment = {
        content: commentData.content,
        user: commentData.user,
        authorName: commentData.authorName,
        profileImage: commentData.profileImage,
        createdAt: new Date()
      };

      // Add comment to task
      task.comments.push(comment);
      await task.save();

      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Get all comments for a task
   * @param {string} taskId - The ID of the task
   * @returns {Promise<Array>} - Array of comments
   */
  async getComments(taskId) {
    try {
      if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
        throw new Error('Invalid task ID');
      }

      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      return task.comments || [];
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  /**
   * Delete a comment from a task
   * @param {string} taskId - The ID of the task
   * @param {string} commentId - The ID of the comment
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteComment(taskId, commentId) {
    try {
      if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
        throw new Error('Invalid task ID');
      }

      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Find and remove the comment
      const commentIndex = task.comments.findIndex(c => c._id.toString() === commentId);
      if (commentIndex === -1) {
        throw new Error('Comment not found');
      }

      task.comments.splice(commentIndex, 1);
      await task.save();

      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
}

export default new CommentService();