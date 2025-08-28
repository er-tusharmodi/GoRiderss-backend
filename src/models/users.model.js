import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose, {Schema} from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    emailDisplay: {
      type: Boolean,
      default: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    mobileNumberDisplay: {
      type: Boolean,
      default: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    dob: {
      type: Date, // Using DateTime
    },
    sex: {
      type: String,
      enum: ["m", "f", "o"],
    },
    bloodGroup: {
      type: String,
      trim: true,
    },
    experince: {
      type: Number,
      default: 0,
    },
    instagramLink: {
      type: String,
      trim: true,
    },
    youtubeLink: {
      type: String,
      trim: true,
    },
    linkedinLink: {
      type: String,
      trim: true,
    },
    healthHistory: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    avatarUrl: {
      type: String, // File URL
      default: "",
    },
    avatarFileId:{
      type: String,
      default: ""
    },
    coverImageUrl: {
      type: String, // File URL
      default: "",
    },
    coverFileId:{
      type: String,
      default: ""
    },
    isExpensesDisplay: {
      type: Boolean,
      default: false,
    },
    isVerified:{
      type: Boolean,
      default: false
    },
    refreshToken: {
      type: String,
      default: "",
    },
    lastIP: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inActive","pending","blocked"],
      default: "inActive",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Auto-manage createdAt & updatedAt
    versionKey: false,
  }
);
userSchema.pre("save", async function(next) {
    if(!this.isModified("hashedPassword")) return next();
    this.hashedPassword = await bcrypt.hash(this.hashedPassword, 15);
    next();
});
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.hashedPassword);
}
userSchema.methods.generateAccessToken = function() {
  return jwt.sign({
    _id: this._id,
    email: this.email,
    fullName: this.fullName,
    mobileNumber: this.mobileNumber,
    avatarFileId: this.avatarFileId
  }, process.env.JWT_ACCESS_SECRET, {expiresIn: process.env.JWT_ACCESS_EXPIRATION});
}
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign({
    _id: this._id
  }, process.env.JWT_REFRESH_SECRET, {expiresIn: process.env.JWT_REFRESH_EXPIRATION});
}
export const User = mongoose.model('Users', userSchema);