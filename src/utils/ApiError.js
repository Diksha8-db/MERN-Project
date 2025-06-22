class ApiError extends Error{
    // constructor
    constructor(
       statusCode,
       message = "Something went wrong",
       errors = [],
       stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = NULL
        this.message = message
        this.success = false
        this.errors = errors

        // read about this
        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }
    }   
}

export {ApiError}