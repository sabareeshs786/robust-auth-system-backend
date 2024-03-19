const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RatingAndReviewSchema = new Schema({
    userid: {
        type: Number,
        required: true,
    },
    skuid: {
        type: Number,
        required: true
    },
    review: {
        type: String
    },
    rating: {
        type: Number,
        enum: [1, 2, 3, 4, 5],
        required: true
    }
});

RatingAndReviewSchema.index({ userid: 1, skuid: 1 }, { unique: true })
RatingAndReviewSchema.index({ skuid: 1 });

const RatingAndReview = mongoose.model('RatingAndReview', RatingAndReviewSchema, 'ratingsandreviews');

module.exports = RatingAndReview;