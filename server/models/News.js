import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    text: {
      type: String,
      required: [true, 'News text is required'],
      trim: true,
      maxlength: [10000, 'Text cannot exceed 10000 characters'],
    },
    imageUrl: {
      type: String,
      default: null,
    },
    aiScore: {
      type: Number,
      min: [0, 'Score must be at least 0'],
      max: [1, 'Score cannot exceed 1'],
      default: 0,
    },
    imageScore: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    hashScore: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    cnnScore: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    newsApiScore: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    trustScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    label: {
      type: String,
      enum: ['Real', 'Fake', 'Misleading'],
      required: true,
    },
    location: {
      lat: {
        type: Number,
        min: -90,
        max: 90,
      },
      lng: {
        type: Number,
        min: -180,
        max: 180,
      },
    },
    votes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        vote: {
          type: String,
          enum: ['Real', 'Fake'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster queries
newsSchema.index({ userId: 1, createdAt: -1 });
newsSchema.index({ trustScore: -1 });

// Virtual for crowd score based on votes
newsSchema.virtual('crowdScore').get(function () {
  if (!this.votes || this.votes.length === 0) return 0.5;

  const realVotes = this.votes.filter((v) => v.vote === 'Real').length;
  return realVotes / this.votes.length;
});

const News = mongoose.model('News', newsSchema);

export default News;

