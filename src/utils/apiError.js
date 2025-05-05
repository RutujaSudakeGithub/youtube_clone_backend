class ApiError extends Error {
    constructor(
        statusCode,
        message = "Someting went wrong",
        errors=[],
        stack=''
    ){
        super(message)  // calling error class constructor
        this.statusCode=statusCode
        this.data = null
        this.message=message
        this.success = false
        this.errors = errors

        if(stack){            //  This checks if a stack value was provided when creating the ApiError object
            this.stack=stack   
        }
        else{
             Error.captureStackTrace(this,this.constructor) //It automatically generates a stack trace from the current location in the code.
        }

    }
}

export {ApiError}

// ApiError is child class of base class error
// StackTrace-A stack trace is a snapshot of 
// the sequence of function calls that were active in your program at the moment an error occurred

