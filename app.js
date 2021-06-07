const express = require('express');
// const path = require('path');
const morgan = require('morgan');
const mongoose = require('mongoose');

//código creado por Gonzalo Sánchez-Bayo

// npm install bcryptjs --save
const bcrypt = require("bcryptjs");

const fs = require('fs');
const path = require('path');

const ejs = require('ejs');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');


const app = express();
app.use(express.json()); // to handle post data
app.use(cookieParser());

const CartProduct = require('./model/cartProduct');



// connection to db
mongoose.connect('mongodb://localhost/crud-mongo-blog',{
    useNewUrlParser:true,
    useUnifiedTopology:true
})
    .then(db => console.log('db connected'))
    .catch(err => console.log(err));

// importing routes
const indexRoutes = require('./routes/routeindex');


// settings
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'ejs');

// middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended:false}));

const secret = "5tr0n6P@55W0rD";
function generateToken(user) {
    let payload = {
      name: user.name,
       id: user.id,
       password: user.password,
       email: user.email
    };
    let oneDay = 60 * 60 * 24;
    return token = jwt.sign(payload, secret, { expiresIn: oneDay });
}

// middleware that add the user
function requireLogin(req, res, next){
    let accessToken = req.cookies.authorization
    // if there is no token stored in cookies, the request is unauthorized
    if (!accessToken){
        console.log('Unauthorized user, redirecting to login');
        return res.redirect('/login');
    }

    try{
        // use the jwt.verify method to verify the access token, itthrows an error if the token has expired or has a invalid signature
        payload = jwt.verify(accessToken, secret)
        console.log('Logged user accessing the site ' + payload.email);
        req.user = payload; // you can retrieve further details from the database. Here I am just taking the name to render it wherever it is needed.
        next()
    }
    catch(e){
        //if an error occured return request unauthorized error, or redirect to login
        // return res.status(401).send():
        res.redirect(403, '/login');
    }
}

// Multer is a middleware that allows to store uploaded files
const multer = require('multer')
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'uploads');
    },
    filename: (req, file, callback) => {
        callback(null, file.fieldname + '-' + Date.now())
    }
});
const upload = multer({ storage: storage});

const UsersModel = require('./model/users');
const { response } = require('express');

// Creating user record
app.get('/users/register', (req, res) => {
    res.sendFile('register.html', {root: './views/'});
});

app.post('/users/register', upload.single('avatar'), (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;

    avatarObject = {
        data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
        contentType: 'image/jpg'
    };

    let user = new UsersModel({name: name, email: email, password: password, avatar:avatarObject});
    user.save((err) => {

        if (err) res.status(503).send(`error: ${err}`);
        else res.send(user);
    });
});

// show the page for all users
app.route('/users/all').get((req, res) => {
    res.sendFile('usersList.html', {root: './views/'});
});

// read all users
app.route('/users').get(async (req, res) => {
    let allUsers = await UsersModel.find();

    // create an empty array
    let modifiedUsers = []

    allUsers.forEach(u => {
        modifiedUsers.push({
            _id: u._id,
            name: u.name,
            email: u.email,
            password: u.password,
            avatar: {
                contentType: u.avatar.contentType,
                data: u.avatar.data.toString('base64')
            }
        });
    });

    res.send(modifiedUsers);

});

// show the page for updating
app.route('/users/:id/edit').get((req, res) => {
    let userId  = req.params.id;
    ejs.renderFile('./views/edit.html', {userId: userId}, null, function(err, str){
        if (err) res.status(503).send(`error when rendering the view: ${err}`);
        else {
            res.end(str);
        }
    });
});


// To get a user's data to be updated
app.route('/users/:id').get(async (req, res) => {
    let userId  = req.params.id;
    let user = await UsersModel.findOne({_id: userId});
    if (user)
        res.send({
            _id: user._id,
            name: user.name,
            email: user.email,
            password: user.password,
            avatar: {
                contentType: user.avatar.contentType,
                data: user.avatar.data.toString('base64')
            }
        });
    else
        res.status(404).end(`User with id ${userId} does not exist`)
});

// To modify a user's data
app.put('/users/:id', upload.single('avatar'), async (req, res) => {
    let userId = req.params.id;
    let user = await UsersModel.findOne({_id: userId});
    user.name = req.body.name;
    user.email = req.body.email;
    user.password = req.body.password;

    if (req.file){
        console.log('User modified the avatar');
        avatarObject = {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: 'image/jpg'
        };
        user.avatar = avatarObject;
    }

    user.save()
    .then(user => res.send(user))
    .catch(err => { console.log(error); res.status(503).end(`Could not update user ${error}`); });
});

// to delete
app.route('/users/:id').delete((req, res) => {
    let userId  = req.params.id;
    UsersModel.findOneAndDelete({_id: userId})
    .then(user => res.send(user))
    .catch(err => { console.log(error); res.status(503).end(`Could not delete user ${error}`); });
});


// check the passwords idea
app.route('/login/').get((req, res) => {
    res.sendFile('login.html', {root: './views/'});
});

app.route('/login/').post(async (req, res) => {

    let {email, password} = req.body;
    let user = await UsersModel.findOne({email: email});

        let success = bcrypt.compareSync(req.body.password, user.password);
        if (success === true)
        {      console.log(`Succesfully logged ${user.name} in`);
              // Generate an access token
              const accessToken = generateToken(user);
              res.cookie("authorization", accessToken, {secure: true, httpOnly: true});
              res.status(200).json(accessToken);
            //  res.status(200).send(`Succesfully logged ${user.name} in`);
        }
        else
            res.status(404).send('Invalid credentials');

});

app.post('/logout', async function(req, res){
    console.log(`Logging out ${req.name}`)
    await CartProduct.deleteMany({});
    res.clearCookie('authorization');
    res.send('User logged out');
});

app.post('/purchase', async function(req, res){
    console.log(`Purchasing ${req.name}`)
    await CartProduct.deleteMany({});
    res.send('User made a purchase');
});



// routes
app.use('/', indexRoutes);

app.listen(app.get('port'), () =>{
    console.log(`server on port ${app.get('port')}`);
})
