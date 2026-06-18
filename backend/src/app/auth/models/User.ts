import mongoose, { Document, Model } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IUser extends Document {
  email: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  password?: string;
  passwordConfirm?: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  passwordResetToken?: string;
  passwordResetTokenExpires?: Date;
  confirmPassword(
    candidatePassword: string,
    userPassword: string,
  ): Promise<boolean>;
  createPasswordResetToken(): string;
  createVerificationToken(): string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Please provide a user email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    firstName: String,
    lastName: String,
    image: String,
    password: {
      type: String,
      required: [true, "Please provide a password"],
      select: false,
      minLength: 8,
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please confirm your password"],
      validate: {
        validator: function (this: IUser, value: string) {
          return value === this.password;
        },
        message: "Passwords do not match",
      },
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    verificationTokenExpires: Date,
    passwordResetToken: { type: String, select: false },
    passwordResetTokenExpires: Date,
  },
  { timestamps: true },
);

userSchema.pre<IUser>("save", async function (this: IUser) {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});

userSchema.methods.confirmPassword = async function (
  candidatePassword: string,
  userPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function (this: IUser): string {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
  return resetToken;
};

userSchema.methods.createVerificationToken = function (this: IUser): string {
  const verificationToken = crypto.randomBytes(32).toString("hex");
  this.verificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return verificationToken;
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
