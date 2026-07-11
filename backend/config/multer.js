import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      const err = new Error('Only PDF files are allowed!');
      err.statusCode = 400;
      cb(err, false);
    }
};

const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB limit
    }
});

export default upload;