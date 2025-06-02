const mongoose = require('mongoose');

const productSchema= new mongoose.Schema({
    name:{
        type:String,
        required: true,
        trim: true
    },
    price:{
        type:Number,
        required:true,
        min:0
    },
    description:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true,
        enum:['Electronics','Clothing','Home','Books','Other']
    },
    stock:{
        type:Number,
        required:true,
        min:0,
        default:0
    },
    imageUrl:{
        type:String,
        default:'https://via.placeholder.com/150'
    },
    
})

module.exports = mongoose.model('Product', productSchema);