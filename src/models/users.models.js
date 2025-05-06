import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      requried: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      requried: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullname: {
      type: String,
      requried: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //couldnary URL
      requried: true,
    },
    coverimage: {
      type: String,
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    password: {
      type: String,
      requried: [true, 'Password is requried'],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// this is mongoose pre saven hook - it returns before any .save() call on the document
//it is used to modify or validate data before saving   

userSchema.pre('save', async function (next) {

  //checks password field is changed or created
  //if not it skip the hashing for already hashed password
  if (!this.isModified('password')) return next();

  //hashes the password using bcrypt
  this.password = await bcrypt.hash(this.password, 10);
  
  //signale mongoose to continue save process
  //without calling next(),save would hang
  next();
});

// password- entered password
//this.password - the hashed password stored in database
userSchema.methods.isPasswordCorrect = async function(password){
  // hashes entered password and apply check
  return await bcrypt.compare(password,this.password)
}

// It creates (signs) a JSON Web Token (JWT) — a compact, 
// secure string used for authentication and information exchange between 
// a client (like a web app) and server

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
      // This is the data embedded in the token.
      // It will be encoded but visible (so avoid putting sensitive info like passwords here).
      // Typically contains info needed for identifying the user on the backend.
        {
        _id : this._id,
        email : this.email,
        username : this.username,
        fullName : this.fullName
        },

        //A secret key used to sign the token.
        process.env.ACCESS_TOKEN_SECRET,
        {
            //Sets how long the token is valid.
            expiresIn : process.env.ACCESS_TOKEN_EXPIRE
        }
    )
}

// when the access token expires, the client can send the refresh token to get a 
// new access token without forcing the user to log in again.
userSchema.method.generateRefrshToken=function(){
    return jwt.sign(
        {
        _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRE
        }
    )
}

export const User = mongoose.model('User', userSchema);
