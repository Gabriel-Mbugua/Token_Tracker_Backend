export const errorHandler = async (err, req, res, next) => {
    const statusCode = err.statusCode || 400;
    const errorCode = err.errorCode || "UNKNOWN_ERROR";

    console.error(errorCode, err.stack);

    res.locals.responseBody = {
        success: false,
        message: err?.message || "An error occurred",
        errorCode: errorCode,
    };

    res.status(statusCode).json(res.locals.responseBody);
};
