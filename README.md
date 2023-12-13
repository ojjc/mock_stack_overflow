## Instructions to setup and run project
1. Install MongoDB and Node.js on your computer.
2. Run **npm install** in both the _server_ directory and _client_ directory.
3. In the server directory, install </br>
        express (**npm install express**)</br>
        mongoose (**npm install mongoose**)</br>
        nodemon (**npm install nodemon**)</br>
        cors (**npm install cors**)</br>
        bcrypt (**npm install bcrypt**)</br>
        express-session (**npm install express-session**)</br>
        jsonwebtoken (**npm install jsonwebtoken**)</br>
        connect-mongo (**npm install connect-mongo**)</br>
    if not already installed.
4. In the _client_ directory, install axios (**npm install axios**) if not already installed.
5. To start the server, run **nodemon server/server.js** (or run **nodemon server.js** from the _server_ directory) and run **npm start** from the _client_ directory.
6. To populate sample data and create the admin user, enter the _server_ directory and run **node init.js admin 123**. 
    _** Note: The second and third arguments are the admin email and password, respectively. You may enter your own email and password if you'd like._
7. Now you are ready to interact with Fake StackOverflow.

## Team Member 1 Contribution (Joseph Jeong)
- voting and reputation
- created user profile page
- tags page
- coworked on account registration, log in
- coworked on prev/next buttons
- coworked on questions and answers page
- coworked on comments
- coworked on admin page
## Team Member 2 Contribution (Joycelyn Xia)
- edit/delete questions, answers, and tags
- coworked on account registration, log in, and log out
- coworked on prev/next buttons
- coworked on questions and answers page
- coworked on comments
- coworked on admin page
