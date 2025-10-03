import { Entity } from "./Base/Entity"
import { ContactEntity } from "./ContactEntity"
import { ConversationMessageEntity } from "./ConversationMessageEntity"
import { SectorEntity } from "./SectorEntity"
import { UserEntity } from "./UserEntity"

export enum StatusConversation {
  OPEN = 'open',
  CLOSED = 'closed',
  PENDING = 'pending'
}

export class ConversationEntity extends Entity {
  idEmpresa?: string
  idContact?: string
  idSector?: string
  idPreviousConversation?: string
  finishedAt?: string
  isRead: boolean
  lastMessage?: string
  step?: string
  status?: StatusConversation

  users?: Partial<UserEntity>[]
  contact?: ContactEntity
  previusConversation?: ConversationEntity
  messages?: ConversationMessageEntity[]
  sector?: SectorEntity

  constructor(conversation: Omit<ConversationEntity, 'id'>, id?: string) {
    super(conversation, id)
    this.idEmpresa = conversation.idEmpresa
    this.idContact = conversation.idContact
    this.idSector = conversation.idSector
    this.idPreviousConversation = conversation.idPreviousConversation
    this.finishedAt = conversation.finishedAt
    this.isRead = conversation.isRead ?? false
    this.lastMessage = conversation.lastMessage
    this.step = conversation.step
    this.status = conversation.status ?? StatusConversation.PENDING
  }
}