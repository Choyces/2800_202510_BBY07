## About Us
Team Name: BBY-07
Team Members: 
- Ziheng Zhao
- Cameron Morris
- Justin Chik
- Qian Zhang
- Prabhraj Guron

## Project Title
HUH!

## Project Description (One Sentence Pitch)
HUH is a web-based platform that helps users learn and understand slang terms through an interactive and social experience, blending educational content with community-driven posts and chat features.

## Technologies used
Frontend:
HTML5, CSS3, JavaScript
Bootstrap 5 – for responsive UI
Backend:
Node.js with Express.js
Database:
MongoDB (hosted on MongoDB Atlas)
Other:
EJS – templating engine

Gemina API – for slang definition extraction
Socket.IO – for real-time chat
GitHub – version control
Render – deployment
Listing of File Contents of folder

## File Structure
|   .env
|   .gitignore
|   about.html
|   databaseconnection.js
|   index.html (landing page)
|   index.js (main server)
|   package-lock.json
|   package.json
|   README.md
|   
+---image
|       default-avatar.png
|       output.png
|           
+---public
|   \---uploads
|           
+---routes
|       messageRoutes.js 
routes for messages
|       notificationRoutes.js 
routes for notifications
|       PostRoutes.js 
	Routes for posts
|       profileRoutes.js 
routes for profiles
|       
+---scripts (client side js files for their corresponding pages and features)
|       editProfile.js 
|       express.js 
|       footer.js
|       game.js
|       main.js
|       makepost.js
|       messages.js
|       navbar.js
|       notification.js
|       postDetail.js
|       postEdit.js
|       profile.js
|       skeleton.js 
|       weather.js
|       
+---styles (style sheets for their respective pages)
|       error.css
|       followers.css
|       footer.css
|       game.css
|       index.css
|       insidePost.css
|       login.css
|       main.css
|       makepost.css
|       message.css
|       navbar.css
|       nonexist_makepost.css
|       notification.css
|       profile.css
|       public_post.css
|       signup.css
|       success.css
|       test.css
|       weather.css
|       your_page.css
|       
+---text
|       editProfile.html
	Edit profile page
|       edit_post.html
	Edit post page
|       followers.html
|       follower_following.html
|       following.html
|       footer.html 
	Footer section
|       game.html
	Game page
|       login.html
	Login page
|       main.html
	Main page
|       makepost.html
	Post creation page
|       nav.html
	navbar
|       search.html
	Search page
|       signup.html
	Signup page
|       weather.html
	Weather page from surprise challenge #2
|       
\---views
        404.ejs
	404 page
        insidePost.ejs
	Display post page
        inside_messages.ejs
	Page for within a conversation
        messages.ejs
	Page for list of conversations
        notifications.ejs
	notification page
        postDetail.ejs
	post detail page
        postEdit.ejs
	post edit page
        profile.ejs
	profile page
        userProfile.ejs
        	current user profile page


## How to install or run the project

Clone the Repo
git clone https://github.com/Choyces/2800_202510_BBY07.git  
cd 2800_202510_BBY07  
Install Required Software
Node.js and npm: https://nodejs.org
MongoDB (use MongoDB Atlas)
Install Dependencies:
npm install
Npm I ejs 
Set Up Environment Variables
Create a .env file in the root folder and include:
MONGODB_USER=yourMongoUsername
MONGODB_PASSWORD=yourMongoPassword
MONGODB_HOST=cluster0.ztyzxn3.mongodb.net
MONGODB_DATABASE=yourDB
MONGODB_SESSION_SECRET=yourSessionSecret
NODE_SESSION_SECRET=yourNodeSecret
GEMINA_API_KEY=yourGeminaAPIKey
Start the App:
node index.js
Access in Browser
Visit http://localhost:8000

## How to use the product (Features)
Search for slang and see real-time definitions
Make Posts using slang and images
Play games, an interactive game to help you practice slang
Chat with others in real time
View Profiles of users and follow them
Make Posts about slang terms
Customize Profile page


## Include Credits, References, and Licenses
Gemina API – for slang term definitions
Cloudinary - storing photos
Bootstrap – frontend styling
MongoDB – backend database
Render – deployment
How did you use AI or any API’s? Tell us exactly what services and products you used and how you used them. Be very specific.
Gemina API was used to fetch definitions and examples for slang terms.
OpenAI ChatGPT was used to assist in code planning, debugging, and UX writing.

## Contact Information
Ziheng Zhao: zhaojerry4@gmail.com
Cameron Morris: cmorris49@my.bcit.ca
Justin chik jchik4@my.bcit.ca
Qian zhang qzhang116@my.bcit.ca
Prabh: prabhten@gmail.com






