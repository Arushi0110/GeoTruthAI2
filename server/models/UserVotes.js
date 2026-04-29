import mongoose from 'mongoose';

/**
 * ============================================================
 * UserVotes Schema
 * ============================================================
 * Tracks individual user votes to prevent duplicate voting
 * and enable vote updates. Each document represents one
 * user's vote on one news article.
 *
 * Collection: uservotes
 * ============================================================
 */

const userVotesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    newsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'News',
      required: [true, 'News ID is required'],
      index: true,
    },
    voteType: {
      type: String,
      required: [true, 'Vote type is required'],
      enum: {
        values: ['real', 'fake', 'misleading'],
        message: 'Vote type must be real, fake, or misleading',
      },
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate votes from same user on same news
userVotesSchema.index({ userId: 1, newsId: 1 }, { unique: true });

// Index for efficient queries by newsId
userVotesSchema.index({ newsId: 1, createdAt: -1 });

const UserVotes = mongoose.model('UserVotes', userVotesSchema);

export default UserVotes;

