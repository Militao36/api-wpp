import { ContactEntity } from "./ContactEntity";
import { UserEntity } from "./UserEntity";
import { Entity } from "./base/Entity";

export class ConversationEntity extends Entity {
  idContact: number
  idUser: number
  idPreviousConversation: number
  finishedAt: string

  // aux
  users?: UserEntity[]
  contact?: ContactEntity
  conversation?: ConversationEntity

  constructor(body: Omit<ConversationEntity, 'id'>, id?: string) {
    super(body, id)
    this.idContact = body.idContact
    this.idUser = body.idUser
    this.idPreviousConversation = body.idPreviousConversation
    this.finishedAt = body.finishedAt

    this.users = body.users
    this.contact = body.contact
    this.conversation = body.conversation
  }
}