const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    if (err.name === "castError") {
        message = 'Resource not found';
        statusCode = 404;
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists`;
        statusCode = 400;
    }

    if (err.name === "ValidationError") {
        message = Object.values(err.errors).map(v => v.message).join(",");
        statusCode = 400;
    }

    if (err.name === "JsonWebTokenError") {
        message = "Invalid token";
        statusCode = 401;
    }

    if (err.name === "TokenExpiredError") {
        message = "Token expired";
        statusCode = 401;
    }

    if (err.code === "LIMIT_FILE_SIZE") {
        message = "File size too large";
        statusCode = 400;
    }

    if (err.message === "Only PDF files are allowed!") {
        statusCode = 400;
    }

    console.error("❌ Error:", err);

    res.status(statusCode).json({
        success: false,
        error: message
    });
};

export default errorHandler;