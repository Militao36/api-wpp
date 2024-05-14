class NotAuthorization extends Error {
  statusCode: number
  constructor (message: string) {
    super(message)
    this.message = message
    this.statusCode = 401
  }
}

export { NotAuthorization }
