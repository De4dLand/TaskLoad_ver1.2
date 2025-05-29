import mongoose from "mongoose"

const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Subtask title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters']
    },
    completed: {
      type: Boolean,
      default: false
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Subtask must belong to a task'],
      index: true
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
    dueDate: {
      type: Date
    },
    estimatedHours: {
      type: Number,
      min: 0
    },
    actualHours: {
      type: Number,
      min: 0
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Create indexes for better query performance
subtaskSchema.index({ task: 1, order: 1 })
subtaskSchema.index({ completed: 1 })
subtaskSchema.index({ assignedTo: 1 })

// Pre-save middleware to update task progress when subtask status changes
subtaskSchema.pre('save', async function(next) {
  try {
    if (this.isModified('completed')) {
      // Get the Task model
      const Task = mongoose.model('Task')
      
      // Find the parent task
      const task = await Task.findById(this.task)
      
      if (task) {
        // Update task progress based on subtasks completion
        await task.updateProgress()
      }
    }
    next()
  } catch (error) {
    next(error)
  }
})

// Post-remove hook to update task progress
subtaskSchema.post('findOneAndDelete', async function(doc) {
  if (!doc) return
  
  try {
    // Get the Task model
    const Task = mongoose.model('Task')
    
    // Find the parent task
    const task = await Task.findById(doc.task)
    
    if (task) {
      // Update task progress
      await task.updateProgress()
    }
  } catch (error) {
    console.error('Error updating task progress after subtask deletion:', error)
  }
})

const Subtask = mongoose.model("Subtask", subtaskSchema)

export default Subtask