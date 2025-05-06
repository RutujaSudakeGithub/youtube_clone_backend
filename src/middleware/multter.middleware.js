import multer from "multer";
// multer.diskStorage() is a method that allows you to define how and where to store uploaded files on the disk.

const storage = multer.diskStorage({
  //destination is a function that specifies where to store the uploaded file.
// cb(null, "./public/temp"): This tells Multer to save the file in the ./public/temp directory. 
// If the directory does not exist, it will need to be created beforehand

    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },

  // filename is a function that specifies the name of the file once it’s saved.
// Here, you’re using the original filename (file.originalname) without any modification.
// uniqueSuffix: This line is intended to create a unique string (based on the current timestamp and a random number) 
// but is currently unused in the filename function. If you want to ensure filenames are unique, 
// you could change file.originalname to something like this:

    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.originalname)
    }
  })
  
  export const upload = multer({ storage, })