const {Schema, model} = require("mongoose");

const CartProductSchema = Schema ({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    brand: String,
});


module.exports = model('cartProducts', CartProductSchema);
