import mongoose from "mongoose"
import pkg from 'bcryptjs'
const { genSalt, hash, compare } = pkg
import crypto from 'crypto'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      index: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
      index: true
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    profileImage: {
      type: String,
      default: "default-profile.png",
    },
    role: {
      type: String,
      enum: ["admin", "user", "owner", "member", "supervisor"],
      default: "user",
    },
    teams: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    }],
    projects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    }],
    tasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    }],
    createdTasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    }],
    assignedTasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    }],
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    customFields: [{
      name: String,
      value: mongoose.Schema.Types.Mixed,
      createdAt: { type: Date, default: Date.now }
    }],
    preferences: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map()
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes
userSchema.index({ role: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ teams: 1 })
userSchema.index({ projects: 1 })
userSchema.index({ tasks: 1 })
userSchema.index({ createdTasks: 1 })
userSchema.index({ assignedTasks: 1 })

// Virtual populate teams
userSchema.virtual("teamCount", {
  ref: "Team",
  localField: "_id",
  foreignField: "members",
  count: true,
})

// Virtual populate projects
userSchema.virtual("projectCount", {
  ref: "Project",
  localField: "_id",
  foreignField: "members",
  count: true,
})

// Virtual populate tasks
userSchema.virtual("taskCount", {
  ref: "Task",
  localField: "_id",
  foreignField: "assignedTo",
  count: true,
})

// Virtual populate created tasks
userSchema.virtual("createdTaskCount", {
  ref: "Task",
  localField: "_id",
  foreignField: "createdBy",
  count: true,
})

// Virtual populate tasks by status
userSchema.virtual("tasksByStatus", {
  ref: "Task",
  localField: "_id",
  foreignField: "assignedTo",
  options: { select: "status" },
})

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  const salt = await genSalt(10)
  this.password = await hash(this.password, salt)
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await compare(candidatePassword, this.password)
}

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex")
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex")
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // 10 minutes
  return resetToken
}

userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex")
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex")
  return verificationToken
}

userSchema.methods.verifyEmail = function () {
  this.emailVerified = true
  this.emailVerificationToken = undefined
}

// Add custom field method
userSchema.methods.addCustomField = async function(name, value) {
  if (!this.customFields) this.customFields = [];
  this.customFields.push({ name, value, createdAt: new Date() });
  await this.save();
  return this;
};

// Update custom field method
userSchema.methods.updateCustomField = async function(name, value) {
  const field = this.customFields.find(f => f.name === name);
  if (field) {
    field.value = value;
    await this.save();
    return true;
  }
  return false;
};

// Set preference method
userSchema.methods.setPreference = async function(key, value) {
  if (!this.preferences) this.preferences = new Map();
  this.preferences.set(key, value);
  await this.save();
  return this;
};

const User = mongoose.model("User", userSchema)

export default User

