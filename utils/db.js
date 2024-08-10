import mongoose from "mongoose";

const connectDB=async()=>{

    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`mongodb connected sucessfully ${process.env.MONGO_URI}`);
    }
    catch(error){
        console.log(error)
    }
}
export default connectDB;

// mongoose.connect(process.env.MONGO_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => {
//     console.log('Connected to MongoDB ${process.env.MONGO_URL}');
// }).catch(err => {
//     console.error('Could not connect to MongoDB...', err);
// });