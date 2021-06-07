const {Schema, model} = require("mongoose");

const ProductSchema = Schema ({
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


module.exports = model('products', ProductSchema);