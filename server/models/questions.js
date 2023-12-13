const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
    {
        title: {type: String, required: true, maxLength: 50},
        summary: {type: String, required: true, maxLength: 100 },
        text: {type: String, required: true},
        tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag', required: true}],
        answers: [{type: mongoose.Schema.Types.ObjectId, ref: 'Answer'}],
        comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}],
        asked_by: {type: String, required: true},
        asked_by_id: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}],
        ask_date_time: {type: Date, default: Date.now},
        views: {type: Number, default: 0},
        votes: {type: Number, default: 0}
    }
);

QuestionSchema.virtual('url').get(function () {
    return 'posts/question/' + this._id;
});

const QuestionModel = mongoose.model("questions", QuestionSchema);
module.exports = QuestionModel;