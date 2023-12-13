// Setup database with initial test data.
// Include an admin user. 
// Script should take admin credentials as arguments as described in the requirements doc.

// admin 
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // for hashing passwords
const UserModel = require('./models/user');
const QuestionModel = require('./models/questions');
const AnswerModel = require('./models/answers');
const TagModel = require('./models/tags');
const CommentModel = require('./models/comments');

// Connect to the MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/fake_so', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;

// Check for database connection errors
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const saltRounds = 10;

// Define a function to create an admin user
async function createAdminUser(email, password) {
  try {
    // Hash the admin password
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the admin user
    const adminUser = new UserModel({
      username: 'admin',
      email: email,
      pwhash: hashedPassword,
      rep: 1000, 
      bio: 'Admin user bio',
      role: 'admin',
    });

    // Save the admin user to the database
    await adminUser.save();
    console.log('Admin user created successfully:', adminUser);
    return adminUser;
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Define a function to seed initial test data
async function seedTestData(adminUser) {
  try {
    const salt = await bcrypt.genSalt(saltRounds);

    const user1pw = await bcrypt.hash('123', salt);
    const user1 = new UserModel({
        username: 'joyce',
        email: 'joyce@gmail.com',
        pwhash: user1pw,
        rep: 55, 
        bio: 'miu',
        questions:[],
        answers:[],
        comments:[],
      });

    const user2pw = await bcrypt.hash('abc', salt);
    const user2 = new UserModel({
        username: 'apple',
        email: 'apple@me.com',
        pwhash: user2pw,
        rep: 200, 
        bio: 'sleep zzz',
        questions:[],
        answers:[],
        comments:[],
      });

    const t1 = new TagModel({
        name: 'sleep',
        add_by: user1.username,
        add_by_id: user1._id,
    });
    await t1.save();

    const t2 = new TagModel({
        name: 'over',
        add_by: user1.username,
        add_by_id: user1._id,
    });
    await t2.save();

    const t3 = new TagModel({
        name: 'college',
        add_by: user2.username,
        add_by_id: user2._id,
    });
    await t3.save();

    const q1 = new QuestionModel({
      title: 'almost free',
      summary: 'ready to sleep',
      text: 'This is a sample question content.',
      asked_by: user1.username,
      asked_by_id: user1._id, 
      tags: [t1._id, t2._id],
      ask_date_time: new Date('2021-11-21'),
      views: 10,
      votes: 2,
      answers:[],
      comments:[],
    });
    await q1.save();
    user1.questions.push(q1._id)

    const q2 = new QuestionModel({
        title: 'broke',
        summary: 'i need money',
        text: 'retail therpay :))',
        asked_by: user2.username,
        asked_by_id: user2._id, 
        tags: [t2._id], 
        ask_date_time: new Date('2023-11-21'),
        views: 9,
        votes: 3,
        answers:[],
        comments:[],
      });
    await q2.save();
    user2.questions.push(q2._id)
      
    const q3 = new QuestionModel({
        title: 'finals season',
        summary: 'almost there',
        text: 'i cant wait to be done with school',
        asked_by: user2.username,
        asked_by_id: user2._id, 
        tags: [t2._id, t3._id], 
        answers:[],
        comments:[],
      });
      await q3.save();
      user2.questions.push(user2._id)

    // Example: create a sample answer
    const a1 = new AnswerModel({
      text: 'This is a sample answer content.',
      ans_by: user2.username,
      ans_by_id: user2._id,
      ans_date_time: new Date('2021-11-21'),
      answered_q: q1._id, 
      votes: -1,
    });
    await a1.save();
    user2.answers.push(a1._id);
    q1.answers.push(a1._id);
 
    const a2 = new AnswerModel({
        text: 'to fix this problem you should ....',
        ans_by: user1.username,
        ans_by_id: user1._id, 
        votes: 7,
        answered_q: q2._id,
      });
      await a2.save();
      user1.answers.push(a2._id);
      q2.answers.push(a2._id);

      await adminUser.save();
      await user1.save();
      await user2.save();
      await q1.save();
      await q2.save();
    
  } catch (error) {
    console.error('Error seeding test data:', error);
  }
}

// Close the database connection after seeding data
async function closeConnection() {
  try {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Get admin credentials from command line arguments
const adminEmail = process.argv[2];
const adminPassword = process.argv[3];

// Check if admin credentials are provided
if (!adminEmail || !adminPassword) {
  console.error('Please provide admin credentials: <email> <password>');
  process.exit(1);
}

// Connect to the database and create admin user
db.once('open', async () => {
  // Create the admin user
  const adminUser = await createAdminUser(adminEmail, adminPassword);

  // Seed initial test data
  await seedTestData(adminUser);

  // Close the database connection
  await closeConnection();
});

