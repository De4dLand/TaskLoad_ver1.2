import mongoose from "mongoose"

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: ['new', 'assigned','todo', 'in_progress', 'reviewing', 'completed'],
      default: 'new'
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high","urgent"],
      default: "medium",
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Task must belong to a project']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      set: v => (v === '' ? undefined : v)
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    comments: [{
      content: {
        type: String,
        required: true,
        trim: true
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    }],
    attachments: [{
      name: String,
      url: String,
      type: String,
      size: Number,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    estimatedHours: {
      type: Number,
      min: 0
    },
    actualHours: {
      type: Number,
      min: 0
    },
    dependencies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }],
    subtasks: [{
      title: String,
      completed: {
        type: Boolean,
        default: false
      }
    }],
    customFields: [{
      name: String,
      value: mongoose.Schema.Types.Mixed
    }],
    chatRoomId: {
      type: String,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  },
)

// Create indexes for better query performance
taskSchema.index({ title: 1, project: 1 })
taskSchema.index({ status: 1 })
taskSchema.index({ assignedTo: 1 })
taskSchema.index({ dueDate: 1 })
taskSchema.index({ createdBy: 1 })

// Virtual populate comments
taskSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'task',
  count: true
})

// Pre-save middleware
taskSchema.pre('save', function (next) {
  if (this.isModified('dueDate') && this.dueDate < this.createdAt) {
    next(new Error('Due date cannot be before creation date'))
  }
  next()
})

// Update user's assignedTasks and createdTasks arrays
taskSchema.pre('save', async function(next) {
  try {
    const User = mongoose.model('User')
    
    // If this is a new task or the assignedTo field has been modified
    if (this.isNew || this.isModified('assignedTo')) {
      if (this.assignedTo) {
        // Add this task to the user's assignedTasks array if not already there
        await User.findByIdAndUpdate(
          this.assignedTo,
          { $addToSet: { assignedTasks: this._id, tasks: this._id } },
          { new: true }
        )
      }
    }
    
    // If this is a new task, add it to the creator's createdTasks array
    if (this.isNew && this.createdBy) {
      await User.findByIdAndUpdate(
        this.createdBy,
        { $addToSet: { createdTasks: this._id, tasks: this._id } },
        { new: true }
      )
    }
    
    next()
  } catch (error) {
    next(error)
  }
})

// Create notification when a new task is created
taskSchema.post('save', async function() {
  try {
    if (this.isNew) {
      // Dynamically import to avoid circular dependency issues
      const NotificationService = (await import('../services/notificationService.js')).default;
      await NotificationService.createTaskNotification(this);
    }
  } catch (error) {
    console.error('Error creating task notification:', error);
    // Don't throw the error to prevent disrupting the main task flow
  }
})

// Create chat room for new tasks
taskSchema.post('save', async function() {
  try {
    if (this.isNew || !this.chatRoomId) {
      // Dynamically import to avoid circular dependency issues
      const TaskChatService = (await import('../services/taskChatService.js')).default;
      await TaskChatService.createOrGetTaskChatRoom(this);
    }
  } catch (error) {
    console.error('Error creating task chat room:', error);
    // Don't throw the error to prevent disrupting the main task flow
  }
})

// Static method to update a task with all fields including subtasks
taskSchema.statics.findOneAndUpdateWithSubtasks = async function(conditions, update, options = {}) {
  try {
    // Handle subtasks if they exist in the update
    if (update.subtasks && Array.isArray(update.subtasks)) {
      // Process each subtask to ensure it has the required fields
      const processedSubtasks = update.subtasks.map(subtask => ({
        _id: new mongoose.Types.ObjectId(),
        title: subtask.title,
        completed: Boolean(subtask.completed)
      }));
      
      // Use $set to update the subtasks array
      update.$set = update.$set || {};
      update.$set.subtasks = processedSubtasks;
      delete update.subtasks; // Remove the original subtasks to avoid conflicts
    }
    
    // Handle other fields
    const allowedUpdates = [
      'title', 'description', 'status', 'priority', 'startDate', 'dueDate',
      'project', 'assignedTo', 'tags', 'estimatedHours', 'actualHours',
      'dependencies', 'customFields', 'chatRoomId'
    ];
    
    // Process regular updates
    const updateObj = { $set: update.$set || {} };
    
    // Add other update operators if present
    if (update.$push) updateObj.$push = update.$push;
    if (update.$pull) updateObj.$pull = update.$pull;
    if (update.$addToSet) updateObj.$addToSet = update.$addToSet;
    
    // Process regular fields
    allowedUpdates.forEach(field => {
      if (update[field] !== undefined) {
        updateObj.$set[field] = update[field];
      }
    });
    
    // Set updatedAt timestamp
    updateObj.$set.updatedAt = new Date();
    
    // Execute the update
    options.new = options.new !== false; // Default to returning the updated document
    options.runValidators = true; // Always run validators on update
    
    const task = await this.findOneAndUpdate(conditions, updateObj, options);
    
    if (!task) {
      throw new Error('Task not found');
    }
    
    return task;
  } catch (error) {
    console.error('Error in findOneAndUpdateWithSubtasks:', error);
    throw error;
  }
};

// Methods
taskSchema.methods.updateProgress = async function () {
  try {
    // Get the Subtask model
    const Subtask = mongoose.model('Subtask')
    
    // Count total subtasks for this task
    const totalSubtasks = await Subtask.countDocuments({ task: this._id })
    
    if (totalSubtasks === 0) {
      return
    }
    
    // Count completed subtasks
    const completedSubtasks = await Subtask.countDocuments({ task: this._id, completed: true })
    
    // Calculate progress percentage
    const progress = Math.round((completedSubtasks / totalSubtasks) * 100)
    
    // Update task status based on progress
    if (progress === 100) {
      this.status = 'completed'
    } else if (progress > 0) {
      this.status = 'in_progress'
    }
    
    await this.save()
  } catch (error) {
    console.error('Error updating task progress:', error)
  }
}

// Post-remove hook to clean up references in User model
taskSchema.post('findOneAndDelete', async function(doc) {
  if (!doc) return
  
  try {
    const User = mongoose.model('User')
    
    // Remove task from assignedTo user's arrays
    if (doc.assignedTo) {
      await User.findByIdAndUpdate(
        doc.assignedTo,
        { 
          $pull: { 
            assignedTasks: doc._id,
            tasks: doc._id 
          } 
        }
      )
    }
    
    // Remove task from createdBy user's arrays
    if (doc.createdBy) {
      await User.findByIdAndUpdate(
        doc.createdBy,
        { 
          $pull: { 
            createdTasks: doc._id,
            tasks: doc._id 
          } 
        }
      )
    }
  } catch (error) {
    console.error('Error cleaning up task references:', error)
  }
})

const Task = mongoose.model("Task", taskSchema)

export default Task
