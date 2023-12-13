const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    pwhash: { type: String, required: true },
    rep: { type: Number, default: 0, required: true},
    bio: { type: String, default: "Please add bio info", required: true },
    questions: [{type: mongoose.Schema.Types.ObjectId, ref: 'Question'}],
    answers: [{type: mongoose.Schema.Types.ObjectId, ref: 'Answer'}],
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}],
    tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
    role: { type: String, default: 'user' },
  }, { timestamps: true });

  UserSchema.virtual('url').get(function () {
    return 'posts/user/' + this._id;
});

const UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;