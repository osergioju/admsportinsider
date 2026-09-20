export class MediaError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "MediaError";
    this.status = status;
  }
}
