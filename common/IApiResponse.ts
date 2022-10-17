export interface IApiError {
  code:number,
  message: string,
  extra?: unknown
}

export default interface IApiResponse<T> {
  data:T;
  error?:IApiError
};

export class ApiResponse<T> implements IApiResponse<T> {

  constructor(data:T, error?:IApiError) {
    this.data = data;
    this.error = error;
  }

  static fail<T>(data:T, errorCode:number, errorMessage:string, errorExtra?:unknown) {
    return new ApiResponse(data, new ApiError(
      errorCode,
      errorMessage,
      errorExtra
    ));
  }

  static success<T>(data:T) {
    return new ApiResponse(data);
  }

  data: T;
  error?: IApiError;

}

export class ApiError implements IApiError {

  constructor(code:number, message:string, extra?:unknown) {
    this.code = code;
    this.message = message;
    this.extra = extra;
  }

  code: number;
  message: string;
  extra?: unknown;
}
