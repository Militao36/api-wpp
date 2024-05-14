class BadRequestExeption extends Error {
  statusCode: number
  constructor (message: string) {
    super(message)
    this.message = message
    this.statusCode = 400
  }
}

export { BadRequestExeption }
