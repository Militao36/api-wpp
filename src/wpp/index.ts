import axios from 'axios'
import { BadRequestExeption } from '../util/exceptions/BadRequest'

export class ClientsWpp {
  private readonly token: string
  private readonly url: string

  constructor() {
    this.token = 'YWRtaW46amlnUUNPUWpTVklwR0hHY0tDbGZheFFJdkV3dUlXeUt4cnROQVM='
    this.url = 'https://mysql-wpp.jbvwrb.easypanel.host'
  }

  public async start(idEmpresa: string) {
    if (!idEmpresa) {
      throw new BadRequestExeption('Não conseguimos conectar ao whatsapp')
    }

    const data = JSON.stringify({
      name: idEmpresa,
      config: {
        proxy: null,
        webhooks: [
          {
            url: `https://c5f5-2804-1b1-b400-351-eedb-296f-f0f0-b01f.ngrok-free.app/zap/?token=${idEmpresa}`,
            events: [
              'message'
            ]
          }
        ]
      }
    })

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${this.url}/api/sessions/start`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.token}`
      },
      data
    }

    const response = await axios.request(config)

    if (response.data.status === 'STARTING') {
      return true
    }

    throw new BadRequestExeption('Erro ao iniciar a integração com o whatsapp')
  }

  public async qrCode(idEmpresa: string) {
    try {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        responseType: 'arraybuffer',
        url: `${this.url}/api/${idEmpresa}/auth/qr`,
        headers: {
          Authorization: `Basic ${this.token}`
        }
      }

      const response = await axios.request(config as any)

      if (response.status === 422 && response.data.message === "Can get QR code only in SCAN_QR_CODE status. The current status is 'WORKING'") {
        return 'WORKING'
      }

      if (response.status === 422) {
        throw new BadRequestExeption('O qrcode ainda está sendo gerado')
      }

      return response.data
    } catch (error) {
      console.log(error)
      throw new BadRequestExeption('Não conseguimos gerar o qrcode')
    }
  }

  public async sendSeen(idEmpresa: string, chatId: string, messageId: string) {
    try {
      if (!this.url || !this.token || !chatId || !messageId) {
        console.info('Webhook capturado porém não usado.')
        return
      }

      await this.sleep(Math.random() * 500)

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${this.url}/api/sendSeen`,
        headers: {
          Authorization: `Basic ${this.token}`
        },
        data: {
          chatId: `55${chatId}@c.us`,
          messageId,
          session: idEmpresa
        }
      }

      await axios.request(config)
    } catch (error) {
      console.log('sendSeen', error)
    }
  }

  async stop(idEmpresa: string) {
    try {
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${this.url}/api/sessions/stop`,
        headers: {
          Authorization: `Basic ${this.token}`
        },
        data: {
          name: idEmpresa,
          logout: true
        }
      }

      const response = await axios.request(config)

      if (response.status === 201) {
        return true
      }

      if (response.status === 404 || response.status === 500) {
        throw new BadRequestExeption('Não existe um whatsapp conectado, para ser parado.')
      }

      return false
    } catch (error) {
      console.log('stop', error)
    }
  }

  async health(idEmpresa: string) {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${this.url}/api/sessions`,
      headers: {
        Authorization: `Basic ${this.token}`
      }
    }

    const response = await axios.request(config)

    if (response?.status === 401) {
      return 'Desconectado'
    }

    const data = response.data.find(e => e.name === idEmpresa)

    if (data?.status === 'STARTING') {
      return 'Iniciando serviços'
    }

    if (data?.status === 'SCAN_QR_CODE') {
      return 'Aguardando leitura do QRCODE'
    }

    if (data?.status === 'WORKING') {
      return 'Conectado'
    }

    if (data?.status === 'FAILED') {
      return 'Desconectado'
    }

    return 'Desconectado'
  }

  async sendMessage(idEmpresa: string, data: { chatId: string, message: string }) {
    const health = await this.health(idEmpresa)

    if (health !== 'Conectado') {
      return
    }

    await this.startTyping(idEmpresa, data.chatId)

    await this.sleep(Math.random() * 1000).catch(console.error)

    await this.stopTyping(idEmpresa, data.chatId)

    try {
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${this.url}/api/sendText`,
        headers: {
          Authorization: `Basic ${this.token}`
        },
        data: {
          chatId: `55${data.chatId.replace(/\(/ig, '').replace(/\)/ig, '').replace(/-/ig, '').replace(/\(/ig, '')}@c.us`,
          text: data.message,
          session: idEmpresa
        }
      }

      const response = await axios.request(config)

      if (response?.status === 201) {
        return response.data
      }

      throw new BadRequestExeption('Erro ao enviar mensagem, entre em contato com o suporte.')
    } catch (error) {
      console.log('sendMessage', error)
    }
  }

  async sendMessageImage(idEmpresa: string, data: { chatId: string, base64: string, caption: string, fileName?: string, mimetype: string }) {
    const health = await this.health(idEmpresa)

    if (health !== 'Conectado') {
      return
    }

    await this.startTyping(idEmpresa, data.chatId)

    await this.sleep(Math.random() * 1000).catch(console.error)

    await this.stopTyping(idEmpresa, data.chatId)

    try {
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${this.url}/api/sendImage`,
        headers: {
          Authorization: `Basic ${this.token}`
        },
        data: {
          chatId: `55${data.chatId.replace(/\(/ig, '').replace(/\)/ig, '').replace(/-/ig, '').replace(/\(/ig, '')}@c.us`,
          session: idEmpresa,
          caption: data.caption,
          file: {
            mimetype: data.mimetype,
            filename: data.fileName,
            data: data.base64
          },
        }
      }

      const response = await axios.request(config)

      if (response?.status === 201) {
        return response.data
      }

      throw new BadRequestExeption('Erro ao enviar mensagem, entre em contato com o suporte.')
    } catch (error) {
      console.log('sendMessage', error)
    }
  }

  async getMessagesByChatId(idEmpresa: string, chatId: string) {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${this.url}/api/messages?chatId=${chatId}&downloadMedia=false&limit=10&session=${idEmpresa}`,
      headers: {
        Authorization: `Basic ${this.token}`
      }
    }

    const response = await axios.request(config)

    return response.data as any[]
  }

  private async startTyping(idEmpresa: string, chatId: string) {
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${this.url}/api/startTyping`,
      headers: {
        Authorization: `Basic ${this.token}`
      },
      data: {
        chatId: `55${chatId}@c.us`,
        session: idEmpresa
      }
    }

    await axios.request(config)
      .catch(console.log)
  }

  private async stopTyping(idEmpresa: string, chatId: string) {
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${this.url}/api/stopTyping`,
      headers: {
        Authorization: `Basic ${this.token}`
      },
      data: {
        chatId: `55${chatId}@c.us`,
        session: idEmpresa
      }
    }

    await axios.request(config)
  }

  private async sleep(seconds: number = 1000) {
    await new Promise((resolve) => {
      setTimeout(() => {
        return resolve('')
      }, seconds)
    })
  }
}
