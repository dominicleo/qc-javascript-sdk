export default class SDKError extends Error {
  code?: any = null;

  constructor(message: any, code?: number) {
    super(message);
    this.name = 'SDKError';
    this.message = message;

    code && (this.code = code);
  }
}
