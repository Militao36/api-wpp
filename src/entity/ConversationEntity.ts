import { Entity } from "./Base/Entity"
import { ContactEntity } from "./ContactEntity"
import { ConversationMessageEntity } from "./ConversationMessageEntity"
import { UserEntity } from "./UserEntity"

export class ConversationEntity extends Entity {
  idEmpresa?: string
  idContact?: string
  idPreviousConversation?: string
  finishedAt?: string
  isRead: boolean
  lastMessage?: string

  users?: UserEntity[]
  contact?: ContactEntity
  conversation?: ConversationEntity
  messages?: ConversationMessageEntity[]

  constructor(conversation: Omit<ConversationEntity, 'id'>, id?: string) {
    super(conversation, id)
    this.idEmpresa = conversation.idEmpresa
    this.idContact = conversation.idContact
    this.idPreviousConversation = conversation.idPreviousConversation
    this.finishedAt = conversation.finishedAt
    this.isRead = conversation.isRead ?? false
    this.lastMessage = conversation.lastMessage
  }
}