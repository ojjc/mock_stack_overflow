const mongoose = require("mongoose")
const TagSchema = new mongoose.Schema({
    name: {type: String, required: true},
    add_by: {type: String, required: true},
    add_by_id: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}],
});

TagSchema.virtual('url').get(function () {
    return 'posts/tag/' + this._id;
});
const TagModel = mongoose.model("tags", TagSchema);
module.exports = TagModel;