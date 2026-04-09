export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message); // Calls the parent Error class constructor with the message.
    this.status = status; // Sets a custom property 'status' that holds the HTTP status code.
  }
}
