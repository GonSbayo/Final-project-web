const { render } = require('ejs');
const express = require('express');
const router = express.Router();
const Product = require('../model/product');
const CartProduct = require('../model/cartProduct');
const UsersModel = require('../model/users');
const cookieParser = require('cookie-parser');
const ejs = require('ejs');
const jwt = require('jsonwebtoken');

router.use(express.json()); // middleware
router.use(cookieParser());
const secret = "5tr0n6P@55W0rD";

function generateToken(user) {
    let payload = {
      name: user.name,
       id: user.id,
       password: user.password,
       email: user.email
    };
  //  let oneDay = 60 * 60 * 24;
    return token = jwt.sign(payload, secret);
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
        console.log('Logged user accessing the site ' + payload.name);
        req.user = payload; // you can retrieve further details from the database. Here I am just taking the name to render it wherever it is needed.
        next()
    }
    catch(e){
        //if an error occured return request unauthorized error, or redirect to login
        // return res.status(401).send():
        console.log(e);
        res.redirect(403, '/login');
    }
}



router.get('/',requireLogin,  async function(req,res){

if (req.user.name==="admin"){
  res.redirect('/indexwithoutediting')

}
  else{
  var products = await Product.find();
      let {id} = req.body;
      let userId = await UsersModel.findOne({id: id});

  let total = 0;
  products.forEach(product => {
    total = total + product.price;
  });
  // res.render('index', {products, total});
      ejs.renderFile('./views/index.ejs', {products, total, user: req.user}, null, function(err, str){
          if (err) res.status(503).send(`error when rendering the view: ${err}`);
          else {
              res.end(str);
          }
      });

    }
  });

  router.get('/indexwithoutediting',requireLogin,  async function(req,res){

    var products = await Product.find();
        let {id} = req.body;
        let userId = await UsersModel.findOne({id: id});

    let total = 0;
    products.forEach(product => {
      total = total + product.price;
    });
    // res.render('index', {products, total});
        ejs.renderFile('./views/indexwithoutediting.ejs', {products, total, user: req.user}, null, function(err, str){
            if (err) res.status(503).send(`error when rendering the view: ${err}`);
            else {
                res.end(str);
            }
        });
    });

    router.get('/cart',requireLogin,  async function(req,res){

      var cartProducts = await CartProduct.find();
          let {id} = req.body;
          let userId = await UsersModel.findOne({id: id});

      let total = 0;
      cartProducts.forEach(cartProduct => {
        total = total + cartProduct.price;
      });
      // res.render('index', {products, total});
          ejs.renderFile('./views/cart.ejs', {cartProducts, total, user: req.user}, null, function(err, str){
              if (err) res.status(503).send(`error when rendering the view: ${err}`);
              else {
                  res.end(str);
              }
          });
      });



router.get('/newProduct', async (req,res) =>{
  res.render('newProduct');
});


// CRUD
router.post('/newProduct', async (req,res) =>{
  var product = new Product(req.body);
  await product.save();
  res.redirect('/')
});

router.get('/edit/:id', async(req,res) =>{
  var product = await Product.findById(req.params.id);
  res.render('edit', {product});
})

router.post('/edit/:id', async(req,res) =>{
  var id = req.params.id;
  await Product.update({_id: id}, req.body);
  res.redirect('/')
})


router.get('/delete/:id',  async (req,res) =>{
  var product = await Product.findById(req.params.id);
  res.render('delete', {product});
})

router.post('/delete/:id',  async (req,res) =>{
  var id = req.params.id;
  await Product.deleteOne({_id: id});
  res.redirect('/');
})

//CART
router.get('/addCart/:id', async (req,res) =>{
  var cartProduct = await Product.findById(req.params.id);
  res.render('addCart', {cartProduct});
});

router.post('/addCart/:id', async (req,res) =>{
  var cartProduct = new CartProduct(req.body);
  await cartProduct.save();
  res.redirect('/')
});


router.get('/deleteCart/:id',  async (req,res) =>{
  var cartProduct = await CartProduct.findById(req.params.id);
  res.render('deleteCart', {cartProduct});
})

router.post('/deleteCart/:id',  async (req,res) =>{
  var id = req.params.id;
  await CartProduct.deleteOne({_id: id});
  res.redirect('/cart');
})

module.exports = router;
