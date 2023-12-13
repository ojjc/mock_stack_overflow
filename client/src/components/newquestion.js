export default function NewQuestion({model,title,text,tags,name}) {
    console.log(model.getTags())

    const tagsArray = tags.toLowerCase().trim().split(/\s+/);
    // add new tags to appData
    const uniqueTags = [...new Set(tagsArray)];
    // console.log('unique: '+uniqueTags)

    let currentTagIds = [];
    uniqueTags.forEach((tag) => {
      const existingTag = model.getTags().find((existingTag) => existingTag.name === tag);
      if (existingTag) {
        // if the tag already exists, use its ID
        currentTagIds.push(existingTag.tid);
      } else {
        const newTag = { 
          tid: 't' + (model.getTags().length + 1), 
          name: tag, 
        };
        model.getTags().push(newTag);
        currentTagIds.push(newTag.tid);
        console.log(`Tag "${tag}" added.`);
      }
      console.log(model.getTags())
       // create a new question object
       console.log(model.getAllQstns())
    const newQuestion = {
        qid: 'q' + (model.getAllQstns().length + 1), // generate a unique id
        title,
        text,
        // tagIds: tags.split(' '), // split tags into array
        tagIds: currentTagIds,
        askedBy: name,
        askDate: new Date(), // date and time added
        ansIds: [],
        views: 0,
      };
  
      // add the new question to the data object
      model.getAllQstns().push(newQuestion);
      console.log(model.getAllQstns())
    //   HomePage({model})
});
}