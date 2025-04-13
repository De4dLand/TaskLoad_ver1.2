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
      enum: ['todo', 'in_progress', 'review', 'completed'],
      default: 'todo'
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
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
      ref: 'User'
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
    }]
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

// Methods
taskSchema.methods.updateProgress = async function () {
  if (this.subtasks.length === 0) {
    return
  }

  const completedSubtasks = this.subtasks.filter(subtask => subtask.completed).length
  const progress = Math.round((completedSubtasks / this.subtasks.length) * 100)

  if (progress === 100) {
    this.status = 'completed'
  } else if (progress > 0) {
    this.status = 'in_progress'
  }

  await this.save()
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

