const express= require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const productRoutes=require('./src/routes/productRoutes');

const app=express();
app.use(cors());
app.use(express.json());

app.use('/api/products' , productRoutes);

const MONGODB_URL='mongodb://localhost:27017/Ecommerce'

mongoose.connect(MONGODB_URL)
  .then(()=>{
     console.log('Connected to MongoDB');
     const PORT=5000;

     app.listen(PORT, ()=>{
        console.log(`Server running on port ${PORT}`);
     })
}).catch(err =>console.error('MongoDB connection error:',err));6



