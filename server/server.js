// Run this script to launch the server.
// The server should run on localhost port 8000.
// This is where you should start writing server-side code for this application.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require("bcrypt");
const session = require("express-session");
const jwt = require('jsonwebtoken');
const fs = require('fs');
const MongoStore = require('connect-mongo');
const app = express();
const PORT = 8000;

const server = app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});

const secret = process.argv[2];

mongoose.connect('mongodb://127.0.0.1:27017/fake_so', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.once('open', () => {
  console.log('Connected to MongoDB');
});

// import schemas
const QuestionModel = require('./models/questions');
const AnswerModel = require('./models/answers'); 
const TagModel = require('./models/tags');
const UserModel = require('./models/user');
const CommentModel = require('./models/comments');
const cookieParser = require('cookie-parser');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(cookieParser());
app.use(
  session({
    secret: `secret`,
    cookie: {httpOnly: true, maxAge: 1000*60*60}, //one hour
    httpOnly: true,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/fake_so'})
  })
);

// session/cookies stuff

// key pair generated online: https://cryptotools.net/rsagen
const privateKey = fs.readFileSync('./private.key', 'utf8');
const publicKey = fs.readFileSync('./public.key', 'utf8');

const signOptions = {
    algorithm: "RS256",
};

const verifyOptions = {
    algorithm: ['RS256'],
};

app.get("/user/:uid", (req, res) => {
  console.log("UID:", req.params.uid)
  const token = jwt.sign({userID : req.params.uid}, privateKey, signOptions);
  res.cookie('token', token, {
      httpOnly: true, sameSite: 'lax'}).status(200).json({
      success: true
      }).send();
});

app.get("/tokens", (req, res) => {
  console.log("COOKIE:", req.cookies);
  const verdict = jwt.verify(req.cookies.token, publicKey, verifyOptions);
  res.send("Verified: " + JSON.stringify(verdict));
})
  
// api routing

app.get('/getQuestions', async (req, res) => {
  try {
    const questions = await QuestionModel.find(); 
    res.json(questions);
  } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/addQuestion', async (req, res) => {
  try {
    const { title, summary, text, tags, asked_by, asked_by_id } = req.body;
    console.log(req.body)
    // validate and process tags
    const tagIds = [];
    for (const tag of tags) {
      let tagDocument = await TagModel.findOne({ name: tag }).exec();
      if (!tagDocument) {
        tagDocument = new TagModel({ 
          name: tag,
          add_by: asked_by,
          add_by_id: asked_by_id,
         });
        await tagDocument.save();
      }
      console.log('new tag:', tagDocument)
      tagIds.push(tagDocument._id);
    }

    // check if user exits
    const userExists = await UserModel.find({asked_by}).exec();
    if (!userExists) {
      return res.status(400).json({ error: 'User does not exist' });
    }

    // create the question
    const question = new QuestionModel({
      title,
      summary,
      text,
      tags: tagIds,
      asked_by,
      asked_by_id,
      ask_date_time: new Date(),
      views: 0,
      votes: 0,
      comments: [],
    });

    await question.save();

    res.status(201).json(question);
  } catch (error) {
    console.error('Error posting the question:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/updateQuestion/:questionId', async (req, res) => {
  // console.log('updating question', req.body)
  try {
    const { questionId } = req.params;
    const { title, summary, text, tags, asked_by, asked_by_id } = req.body;
    
    const tagIds = [];
    for (const tag of tags) {
      let tagDocument = await TagModel.findOne({ name: tag }).exec();
      if (!tagDocument) {
        tagDocument = new TagModel({ 
          name: tag,
          add_by: asked_by,
          add_by_id: asked_by_id,
         });
        await tagDocument.save();
      }
      tagIds.push(tagDocument._id);
    }
    console.log('tags', tagIds)

    const updatedQuestion = await QuestionModel.findByIdAndUpdate(
      questionId,
      { title, summary, text, tags:tagIds,},
      { new: true } // To get the updated document
    );

    console.log('updated question', updatedQuestion)

    if (!updatedQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/getTags', async (req,res) => {
  console.log('getting tags')
  try {
    const tags = await TagModel.find();
    res.json(tags);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/getQuestionsByTag/:tagId', async (req, res) => {
  try {
    const { tagId } = req.params;
    const questions = await QuestionModel.find({ tags: tagId });
    res.json(questions);
  } catch (error) {
    console.error('error getting tags', error);
    res.status(500).json({ error: 'server errrrrr' });
  }
});


app.post('/getTagNames', async (req, res) => {
  try {
    const { tagIds } = req.body;

    // look up tag based on ObjectIds
    const tagDocuments = await TagModel.find({ _id: { $in: tagIds } }).exec();

    // get tag names from tag documents
    const tagNames = tagDocuments.map((tag) => tag.name);

    res.status(200).json(tagNames);
  } catch (error) {
    console.error('Error fetching tag names:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/addTag', (req, res) => {
  // Access data from req.body
  const tagData = req.body;

  const newTag = new TagModel(tagData);
  newTag.save()
    .then(result => {
      // Data saved successfully
      res.json({ message: 'Tag added successfully', result });
    })
    .catch(error => {
      // Handle the error
      res.status(500).json({ error: 'An error occurred while saving the tag' });
    });
});

app.get('/getAnswers', async (req,res) => {
  try {
    const answers = await AnswerModel.find();
    res.json(answers);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/updateAnswer/:ansId', async (req, res) => {
  try{
    const { ansId } = req.params;
    const { text } = req.body;

    const updatedAnswer = await AnswerModel.findByIdAndUpdate(
      ansId,
      { text },
      { new: true } // To get the updated document
    );

    if (!updatedAnswer) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(updatedAnswer);
  } catch (error) {
    console.error('Error updating answer:', error);
  }
})

app.get('/search', async (req, res) => {
  try {
    const searchQuery = req.query.q;
    const tagMatch = searchQuery.match(/\[([^\]]+)\]/g);

    // let searchResults = [];

    if (tagMatch) {
      // console.log(tagMatch)
      
      // if tag is detected, search for tags
      const tagNames = tagMatch.map(match => match.slice(1, -1));
      const tagOids = await TagModel.find({ name: { $in: tagNames } });
      const tagOids_array = tagOids.map(tag => tag._id);

      const query = {
        tags: { $in: tagOids_array }
      };

      const tagResults = await QuestionModel.find(query);
      // console.log(tagResults)

      // Perform a text search for the remaining text
      const textWords = searchQuery.replace(/\[.*?\]/g, '').trim().toLowerCase().split(/\s+/);
      // console.log('text words: ' + textWords);
      if (textWords.length > 0 && textWords != '') {
        console.log('tag and text');
        const textQuery = {
          $or: [
            { title: { $regex: new RegExp(textWords.join('|'), 'i') } },
            { text: { $regex: new RegExp(textWords.join('|'), 'i') } }
          ]
        };
  
        const textResults = await QuestionModel.find(textQuery);
  
        // Combine the tag and text results
        const combinedResults = [...tagResults, ...textResults];
        const searchResults = Array.from(new Set(combinedResults.map(result => result._id))).map(id => combinedResults.find(result => result._id === id));
        res.json(searchResults);
        return;
      }
      res.json(tagResults);
    } else {
      // if no tags, just do normal title/text search
      const textWords = searchQuery.trim().toLowerCase().split(/\s+/);

      console.log('only text: ' + textWords)

      const query = {
        $or: [
          { title: { $regex: new RegExp(textWords.join('|'), 'i') } },
          { text: { $regex: new RegExp(textWords.join('|'), 'i') } }
        ]
      };

      const searchResults = await QuestionModel.find(query);
      if (searchResults.length === 0)return res.json('invalid')
      res.json(searchResults);
    }
  } catch (error) {
    console.error('Error searching for questions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// add answer to question array
app.post('/addAnswerToQuestion/:questionId', async (req, res) => {
  try {
    const { text, ans_by, ans_by_id } = req.body;
    const questionId = req.params.questionId; // Extract questionId from URL parameter.

    // Create the answer.
    const answer = new AnswerModel({
      text,
      ans_by,
      ans_by_id,
      ans_date_time: new Date(),
      comments: [],
      answered_q: questionId,
    });

    // Save the answer to the database.
    await answer.save();

    // Find the associated question and add the answer to its answers array.
    const question = await QuestionModel.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    question.answers.push(answer._id);

    // Save the updated question.
    await question.save();

    res.status(201).json(answer);
  } catch (error) {
    console.error('Error posting the answer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/updateViews/:questionId', async (req, res) => {
  try {
    const { views } = req.body;
    const questionId = req.params.questionId; // Extract questionId from the URL parameter.

    // Find the question by its ID and update the views count.
    const question = await QuestionModel.findById(questionId);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Increment the views count by 1 (or by the desired amount).
    question.views = views;

    // Save the updated question document.
    await question.save();

    res.status(200).json({ message: 'Views updated successfully' });
  } catch (error) {
    console.error('Error updating views:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// add comment to question
app.post('/addCommentToQuestion/:questionId', async (req, res) => {
  try {
    const { text, com_by, com_by_id } = req.body;
    // console.log({ text, com_by, com_by_id });
    const questionId = req.params.questionId; // Extract questionId from URL parameter.

    // Create the comment
    const comment = new CommentModel({
      text,
      com_by,
      com_by_id,
      com_date_time: new Date(),
      votes: 0,
    });

    // Save the comment to the database.
    await comment.save();

    // Find the associated question and add the comment to its comments array.
    const question = await QuestionModel.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    question.comments.push(comment._id);

    // Save the updated question.
    await question.save();

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error posting the comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// add comment to answer
app.post('/addCommentToAnswer/:answerId', async (req, res) => {
  try {
    const { text, com_by, com_by_id } = req.body;
    // console.log({ text, com_by, com_by_id });
    const answerId = req.params.answerId;

    const comment = new CommentModel({
      text,
      com_by,
      com_by_id,
      com_date_time: new Date(),
      votes: 0,
    });

    await comment.save();

    // find the associated question and add the comment to its comments array.
    const answer = await AnswerModel.findById(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'answer not found' });
    }

    answer.comments.push(comment._id);

    // Save the updated question.
    await answer.save();

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error posting the comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

process.on('SIGINT', () => {
    db.close();
    console.log('Server closed. Database instance disconnected');
    process.exit(0);
});


app.get('/sortedQuestions', async (req, res) => {
  const { sort } = req.query;
  console.log(sort);

  try {
    const questions = await QuestionModel.find({}).exec();
    const answers = await AnswerModel.find({}).exec()

    // add sorted questions to "sortedQuestions"
    let sortedQuestions = questions;

    if (sort === 'newest') {
      // sort by most recent in descending order
      sortedQuestions = sortedQuestions.sort((a, b) => b.ask_date_time - a.ask_date_time);
    } else if (sort === 'active') {
      console.log('sorting by active:');

      const getMostRecentAnswerDate = async (answerIds) => {
        const answerPromises = answerIds.map(async (ansId) => {
          const answer = await AnswerModel.findById(ansId).exec();
          return answer ? answer.ans_date_time : 0;
        });
        const answerDates = await Promise.all(answerPromises);
        return Math.max(...answerDates);
      };
    
      sortedQuestions = await Promise.all(
        sortedQuestions.map(async (question) => {
          const recentDate = await getMostRecentAnswerDate(question.answers);
          return { ...question.toObject(), recentDate };
        })
      );
    
      // sort by most recent in descending order
      sortedQuestions = sortedQuestions.sort((a, b) => b.recentDate - a.recentDate);
    } else if (sort === 'unanswered') {
      sortedQuestions = sortedQuestions.filter(question => question.answers.length === 0);
    }

    // console.log(sortedQuestions);
    res.json(sortedQuestions);
  } catch (error) {
    console.error('Error fetching and sorting questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/getComments', async (req, res) => {
  try {
    const comments = await CommentModel.find(); 
    res.json(comments);
  } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/getQuestionComment/:questionId', async (req, res) => {
  try {
    const questionId = req.params.questionId;

    const question = await QuestionModel.findById(questionId).populate('comments').exec();

    if (!question) {
      return res.status(404).json({ error: 'question not found' });
    }

    const comments = question.comments;

    res.json(comments);
  } catch (error) {
      console.error('error fetching questions:', error);
      res.status(500).json({ error: 'internal server error' });
  }
});

// user-login stuff

const saltRounds = 10;

app.post('/register', async (req, res) => {
  try {
    const { username, email, pw } = req.body;

    console.log('registration items:', { username, email, pw });

    // check if the email is already used
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'email already used :(' });
    }

    const salt = await bcrypt.genSalt(saltRounds);
    const pwhashed = await bcrypt.hash(req.body.pw, salt);

    // create a new user
    const newUser = new UserModel({
      username,
      email,
      pwhash: pwhashed,
    });

    await newUser.save();

    res.status(201).json({ message: 'account added successfully' });
  } catch (error) { 
    console.error('error creating account', error);
    res.status(500).json({ error: 'L server error' });
  }
});


app.get('/getName', async (req, res) => {
  try {
    console.log('in getName session', req.session)
    const { username, email } = req.session;

    if (!email) {
      return res.status(404).json({ error: 'email not found in session' });
    }

    console.log('email', email, 'username', username)

    res.json({ username, email });
  } catch (error) {
    console.error('error getting email and username:', error);
    res.status(500).json({ error: 'L server error' });
  }
});


app.post('/login', async (req, res) => {
  try {
    const email = req.body.email;
    const epw = req.body.pw;

    const user = await UserModel.findOne({ email }).exec();

    if (!user) {
      return res.status(401).json({ errorMessage: 'User not found' });
    }

    const verdict = await bcrypt.compare(epw, user.pwhash);

    if (verdict) {
      // create a JWT token containing user information
      const token = jwt.sign({ email: user.email }, privateKey, signOptions);

      // store the token and username in the session
      req.session.token = token;
      req.session.username = user.username;
      req.session.email = email;

      // send the token to the client
      return res.status(200).json({
        message: 'successful login',
        username: user.username,
        email: user.email,
        userId: user._id,
        role: user.role,
        token: token,
      });
    } else {
      return res.status(401).json({ errorMessage: 'wrong email address or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    // res.redirect("/")
    if (err) {
      res.status(500).json({ message: "Logout failed" });
    } else {
      res.status(200).json({ message: "Logout successful" });
    }
  });
});



app.post('/updateQVotes/:questionId', async (req, res) => {
  try {
    const { voteType } = req.body;
    const questionId = req.params.questionId;

    const question = await QuestionModel.findById(questionId);

    if (!question) {
      return res.status(404).json({ error: 'question not found' });
    }

    if (voteType === 'upvote') {
      question.votes += 1;
    } else if (voteType === 'downvote') {
      question.votes -= 1;
    }

    await question.save();

    res.status(200).json({ message: 'q votes updated successfully' });
  } catch (error) {
    console.error('error updating question votes:', error);
    res.status(500).json({ error: 'erm server error 🤓🤓🤓' });
  }
});

app.post('/updateAVotes/:answerId', async (req, res) => {
  try {
    const { voteType } = req.body;
    const answerId = req.params.answerId;

    const answer = await AnswerModel.findById(answerId);

    if (!answer) {
      return res.status(404).json({ error: 'answer not found' });
    }

    if (voteType === 'upvote') {
      answer.votes += 1;
    } else if (voteType === 'downvote') {
      answer.votes -= 1;
    }

    await answer.save();

    res.status(200).json({ message: 'a votes updated successfully' });
  } catch (error) {
    console.error('error updating answer votes:', error);
    res.status(500).json({ error: 'erm server error 🤓🤓🤓' });
  }
});

app.post('/updateCVotes/:commentId', async (req, res) => {
  try {
    const { voteType } = req.body;
    const commentId = req.params.commentId;

    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'comment not found' });
    }

    if (voteType === 'upvote') {
      comment.votes += 1;
    } else if (voteType === 'downvote') {
      comment.votes -= 1;
    }

    await comment.save();

    res.status(200).json({ message: 'c votes updated successfully' , votes:comment.votes});
  } catch (error) {
    console.error('error updating comment votes:', error);
    res.status(500).json({ error: 'erm server error 🤓🤓🤓' });
  }
});

app.post('/updateARep/:ansId', async (req, res) => {
  try {
    const { ansId } = req.params;
    const { voteType } = req.body;

    const answer = await AnswerModel.findById(ansId);
    const user = await UserModel.findById(answer.ans_by_id);

    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    if (voteType === 'upvote') {
      user.rep += 5;
    } else if (voteType === 'downvote') {
      user.rep -= 10;
    }

    await user.save();
    console.log(user.username, 'rep', user.rep)

    res.status(200).json({ message: 'Rep updated successfully', reputation: user.rep });
  } catch (error) {
    console.error('Error updating reputation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/updateQRep/:qid', async (req, res) => {
  try {
    const { qid } = req.params;
    const { voteType } = req.body;

    const question = await QuestionModel.findById(qid);
    const user = await UserModel.findById(question.asked_by_id);

    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    if (voteType === 'upvote') {
      user.rep += 5;
    } else if (voteType === 'downvote') {
      user.rep -= 10;
    }

    await user.save();
    console.log(user.username, 'rep', user.rep)
    res.status(200).json({ message: 'Rep updated successfully', reputation: user.rep });
  } catch (error) {
    console.error('Error updating reputation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/edit_bio/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { bio } = req.body;

    // check user exit
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    // update bio
    user.bio = bio;
    await user.save();

    // send success
    res.status(200).json({ message: 'Bio updated successfully', user: user });
  } catch (error) {
    console.error('Error editing bio', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/getUsers', async (req, res) => {
  try {
    const users = await UserModel.find(); 
    res.json(users);
  } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/getUserInfo/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // find the user by username and return the user information
    const user = await UserModel.findOne({ email }).exec();

    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    const userInfo = {
      userId: user._id,
      username: user.username,
      rep: user.rep,
    };

    res.json(userInfo);
  } catch (error) {
    console.error('error getting user information by username:', error);
    res.status(500).json({ error: 'internal Server Error' });
  }
});

// for user-profile.js
app.get('/getUserProfile/:email', async(req,res) =>  {
  try {
    const { email } = req.params;
    const user = await UserModel.findOne({ email }).exec();

    res.json(user);

  } catch (e) {
    console.error('error fetching user data: ', e);
    res.status(500).json({ e: "bad server error"});
  }
});


app.post('/addQuestionToUser/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { questionId } = req.body;

    // find by id and push question to user so that it possesses it
    await UserModel.findByIdAndUpdate(userId, { $push: { questions: questionId } }).exec();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('error adding question to user:', error);
    res.status(500).json({ error: 'erm server error 🤓🤓🤓' });
  }
});

app.post('/addAnswerToUser/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { answerId } = req.body;

    // find by id and push answer to user so that it possesses it
    await UserModel.findByIdAndUpdate(userId, { $push: { answers: answerId } }).exec();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('error adding answer to user:', error);
    res.status(500).json({ error: 'erm server error 🤓🤓🤓' });
  }
});

app.post('/addCommentToUser/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { commentId } = req.body;

    // find by id and push comment to user so that it possesses it
    await UserModel.findByIdAndUpdate(userId, { $push: { comments: commentId } }).exec();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('error adding answer to user:', error);
    res.status(500).json({ error: 'erm server error 🤓🤓🤓' });
  }
});

app.post('/addTagToUser/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { tagId } = req.body;

    // find by id and push comment to user so that it possesses it
    await UserModel.findByIdAndUpdate(userId, { $push: { tags: tagId } }).exec();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('error adding tag to user:', error);
    res.status(500).json({ error: 'erm server error 🤓🤓🤓' });
  }
});

app.get('/FromId/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await QuestionModel.findById(questionId);

    const questionInfo = {
      title: question.title,
      summary: question.summary,
      text: question.text,
      tags: question.tags,
      // tags: question.tags.map(tag => ({ _id: tag._id, name: tag.name })),
      votes: question.votes,
      views: question.views,
      date_time: question.ask_date_time,
      comments: question.comments,
      asked_by_id: question.asked_by_id,
    };

    res.json(questionInfo);
  } catch (error) {
    console.error('error finding question:', error);
    res.status(500).json({ error: 'erm server error 🤓🤓🤓' });
  }
});

app.get('/getAnswerFromId/:answerId', async (req, res) => {
  try {
    const { answerId } = req.params;

    const answer = await AnswerModel.findById(answerId);

    if (!answer) {
      return res.status(404).json({ error: 'answer not found' });
    }

    const answered_question = await QuestionModel.findById(answer.answered_q);

    const questionInfo = {
      title: answered_question.title,
      text: answered_question.text,
      tags: answered_question.tags,
      answers: answered_question.answers,
      comments: answered_question.comments,
      asked_by: answered_question.asked_by,
      asked_by_id: answered_question.asked_by_id,
      date_time: answered_question.ask_date_time,
      votes: answered_question.votes,
      views: answered_question.views,
      _id: answer.answered_q,
    };

    res.json(questionInfo);
  } catch (error) {
    console.error('error finding question info from answer:', error);
    res.status(500).json({ error: 'erm server error 🤓🤓🤓' });
  }
});

app.get('/getCommentFromId/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'answer not found' });
    }

    const commentInfo = {
      text: comment.text,
      com_by: comment.com_by,
      com_by_id: comment.com_by_id,
      com_date_time: comment.com_date_time,
      votes: comment.votes,
    };

    res.json(commentInfo);
  } catch (error) {
    console.error('error finding question info from answer:', error);
    res.status(500).json({ error: 'erm server error 🤓🤓🤓' });
  }
});


app.get('/getTagFromId/:tagId', async (req, res) => {
  try {
    const { tagId } = req.params;

    const tag = await TagModel.findById(tagId);

    const tagInfo = {
      name: tag.name,
    };

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Return the tag details
    res.json({
      _id: tag._id,
      name: tag.name,
      // Add other tag details you want to include
    });

  } catch (error) {
    console.error('error finding tag:', error);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/getTagsFromUser/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserModel.findById(userId).exec();

    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    const userTags = await TagModel.find({ add_by_id: userId }).exec();

    // const tagDetails = userTags.map(tag => ({
    //   name: tag.name,
    // }));

    // res.json(tagDetails);
    res.json(userTags);
  } catch (error) {
    console.error('error getting tag name from user:', error);
    res.status(500).json({ error: 'erm server error 🤓🤓🤓' });
  }
});

app.get('/getAllUsers', async (req, res) => {
  try {
    const users = await UserModel.find().exec();
    res.json(users);
  } catch (e) {
    console.error('error fetching all users: ', error);
    res.status(500).json({ error: 'erm server error 🤓🤓🤓' });
  }
}) 

app.delete(`/deleteQuestion/:qid`, async (req, res) => {
try {
    const { qid } = req.params;
    // Find the question and populate its answers and comments
    const question = await QuestionModel.findById(qid).exec();
    const user = await UserModel.findOne({questions:qid}).exec();

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Delete associated answers
    for (const answer of question.answers) {
      await deleteAnswer(answer);
    }

    // Delete associated comments
    for (const comment of question.comments) {
      await deleteComment(comment);
    }

    // remove question from user
    if (user) {
      user.questions.pull(qid);
      await user.save();
    }

    // delete question
    await QuestionModel.findByIdAndDelete(qid);

    res.json({ message: 'Question and associated data deleted successfully' });
  } catch (error) {
    // console.log('qid', id)
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete(`/deleteAnswer/:aid`, async (req, res) => {
  try {
    const { aid } = req.params;
    // delete ans and its comments
    await deleteAnswer(aid);
    
    res.json({ message: 'Answer and associated comments deleted successfully' });
    } catch (error) {
    console.error('Error deleting answer:', error);
    res.status(500).json({ error: 'Internal server error' });
    }
});

// Function to delete an answer and its associated comments
async function deleteAnswer(answerId) {
  const answer = await AnswerModel.findById(answerId).exec();
  const user = await UserModel.findOne({answers:answerId}).exec()
  const question = await QuestionModel.findOne({answers:answerId}).exec();
  
  if (!answer) {
    return; // or throw an error 
  }

  for (const comment of answer.comments) {
    await deleteComment(comment);
  }

  // delete answer from user 
  if (user) {
    user.answers.pull(answerId);
    await user.save();
  }

  // delete ans from question it answered
  if (question) {
    question.answers.pull(answerId);
    await question.save();
  }

  await AnswerModel.findByIdAndDelete(answerId);
}

async function deleteComment(commentId) {
  const comment = await CommentModel.findById(commentId).exec();
  const user = await UserModel.findOne({comments:commentId}).exec(); 
  const answer = await AnswerModel.findOne({comments:commentId}).exec();
  const question = await QuestionModel.findOne({comments:commentId}).exec();

  if (!comment){
    return
  }

  if (user) {
    user.comments.pull(commentId);
    await user.save();
  }

  if (answer) {
    answer.comments.pull(commentId);
    await answer.save();
  }

  if (question) {
    question.comments.pull(commentId);
    await question.save();
  }

  await CommentModel.findByIdAndDelete(commentId);
}

app.delete(`/deleteUser/:userId`, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all questions, answers, and comments created by the user
    await Promise.all([
      QuestionModel.deleteMany({ asked_by_id: userId }),
      AnswerModel.deleteMany({ ans_by_id: userId }),
      CommentModel.deleteMany({ com_by_id: userId }),
    ]);

    // Delete the user
    await UserModel.findByIdAndDelete(userId);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete(`/deleteTag/:tagId`, async (req, res) => {
  const { tagId } = req.params;
  console.log('deleting tag ', tagId)
  try {
    const tag = await TagModel.findById(tagId);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await TagModel.findByIdAndDelete(tagId);

    return res.status(200).json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
})

app.get('/isTagInUse/:tagId', async (req, res) => {
  try {
    const { tagId } = req.params;

    // Check if the tag is associated with any questions
    const inUse = await QuestionModel.exists({ tags: tagId });

    res.json({ inUse });
  } catch (error) {
    console.error('Error checking if tag is in use:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/editTag/:tagId', async (req, res) => {
  try{
    const { tagId } = req.params;
    const { name } = req.body;

    const updatedTag = await TagModel.findByIdAndUpdate(
      tagId,
      { name },
      { new: true } // To get the updated document
    );

    if (!updatedTag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(updatedTag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

function isAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    next('route');
  }
}