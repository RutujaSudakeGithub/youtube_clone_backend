import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const vedioSchema = new mongoose.Schema(
  {
    vedioFile: {
      type: String,
      requried: true,
    },
    thumbNail: {
      type: String,
      requried: true,
    },
    title: {
      type: String,
      requried: true,
    },
    description: {
      type: String,
      requried: true,
    },
    duration: {
      type: Number,
      requried: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

vedioSchema.plugin(mongooseAggregatePaginate);

export const Vedio = mongoose.model('Vedio', vedioSchema);
