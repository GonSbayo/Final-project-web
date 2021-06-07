const mongoose = require('mongoose');
mongoose.set("useCreateIndex", true);
const bcrypt = require("bcryptjs");

var UsersSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avatar:
    {
        data: Buffer, // An array
        contentType: String
    }
});

UsersSchema.pre("save", function (next) {
    const user = this

    if (this.isModified("password") || this.isNew) {
      bcrypt.genSalt(10, function (saltError, salt) {
        if (saltError) {
          return next(saltError)
        } else {
          bcrypt.hash(user.password, salt, function(hashError, hash) {
            if (hashError) {
              return next(hashError)
            }
  
            user.password = hash
            next()
          })
        }
      })
    } else {
      return next()
    }
  })

module.exports = new mongoose.model('UserModel', UsersSchema);
