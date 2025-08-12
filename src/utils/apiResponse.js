class apiResponse{
    constructor(stattusCode, data, message = "success") {
        this.statusCode = stattusCode;
        this.message = message;
        this.data = data;
        this.success = stattusCode < 400;
    }
}
export {apiResponse};