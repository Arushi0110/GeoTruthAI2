import mongoose from 'mongoose';

/**
 * ============================================================
 * NewsVotes Schema
 * ============================================================
 * Stores aggregated vote counts for each news article.
 * Uses atomic $inc operations for concurrent-safe updates.
 *
 * Collection: newsvotes
 * ============================================================
 */

const newsVotesSchema = new mongoose.Schema(
  {
    newsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'News',
      required: [true, 'News ID is required'],
      unique: true,
      index: true,
    },
    votes: {
      real: {
        type: Number,
        default: 0,
        min: [0, 'Vote count cannot be negative'],
      },
      fake: {
        type: Number,
        default: 0,
        min: [0, 'Vote count cannot be negative'],
      },
      misleading: {
        type: Number,
        default: 0,
        min: [0, 'Vote count cannot be negative'],
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for total vote count
newsVotesSchema.virtual('totalVotes').get(function () {
  return (this.votes?.real || 0) + (this.votes?.fake || 0) + (this.votes?.misleading || 0);
});

// Static method to get or create vote record
newsVotesSchema.statics.getOrCreate = async function (newsId) {
  let record = await this.findOne({ newsId });
  if (!record) {
    record = await this.create({ newsId, votes: { real: 0, fake: 0, misleading: 0 } });
  }
  return record;
};

const NewsVotes = mongoose.model('NewsVotes', newsVotesSchema);

export default NewsVotes;

