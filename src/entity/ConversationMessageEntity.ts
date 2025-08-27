import { Entity } from "./Base/Entity"

export class ConversationMessageEntity extends Entity {
  idEmpresa: string
  idConversation: string
  idUser: string
  message: string
  messageId: string
  hasMedia: boolean
  file: string

  // user: User
  // conversation: Conversation
  constructor(data: Partial<ConversationMessageEntity> = {}, id?: string) {
    super(data, id)
    this.idEmpresa = data.idEmpresa
    this.idConversation = data.idConversation
    this.idUser = data.idUser
    this.message = data.message
    this.messageId = data.messageId
    this.hasMedia = data.hasMedia ?? false
    this.file = data.file ?? ''
  }
}