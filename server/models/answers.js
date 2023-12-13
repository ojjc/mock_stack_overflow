const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
    text: {type: String, required: true},
    ans_by: {type: String, required: true},
    ans_by_id: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}],
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}],
    ans_date_time: {type: Date, default: Date.now},
    votes: {type: Number, default: 0},
    answered_q: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
});

AnswerSchema.virtual('url').get(function () {
    return 'posts/answer/' + this._id;
});
const AnswerModel = mongoose.model("answers", AnswerSchema);
module.exports = AnswerModel;
