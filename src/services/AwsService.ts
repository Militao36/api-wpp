import { PutObjectCommand, S3 } from "@aws-sdk/client-s3"
import axios from "axios"

export class AwsService {
  private s3Client: S3

  constructor() {
    this.s3Client = new S3({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.DIGITAL_ACCESS_KEY_ID,
        secretAccessKey: process.env.DIGITAL_SECRET_ACCESS_KEY
      }
    })
  }

  async uploadFile(url: string, fileName: string, folderBucket: string = '') {
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const fileContent = response.data

    const key = folderBucket ? `${folderBucket}/${fileName}` : fileName

    const result = await this.s3Client.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ACL: 'public-read'
    }))

    return {
      ...result,
      url: `${process.env.S3_URL}/${key}`
    }
  }
}