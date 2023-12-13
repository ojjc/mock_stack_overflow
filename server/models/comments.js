const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    text: {type: String, required: true, maxLength: 140},
    com_by: {type: String, required: true},
    com_by_id: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}],
    com_date_time: {type: Date, default: Date.now},
    votes: {type: Number, default: 0}
});

CommentSchema.virtual('url').get(function () {
    return 'posts/comment/' + this._id;
});

const CommentModel = mongoose.model("comments", CommentSchema);
module.exports = CommentModel;