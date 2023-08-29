import crypto from 'crypto'

type ReturnHash = {
  hash: string,
  salt: string
}

class CryptoHash {
  hash (password: string, _salt: string): Promise<ReturnHash> {
    return new Promise((resolve, reject) => {
      const salt = _salt ?? crypto.randomBytes(16).toString('hex')
      crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, result) => {
        if (err) {
          return reject(err)
        }

        return resolve({
          hash: result.toString('hex'),
          salt: salt
        })
      })
    })
  }

  async compareHash (passowordHash: string, password: string, salt: string) {
    const { hash } = await this.hash(password, salt)
    return passowordHash === hash
  }
}

export { CryptoHash }