import { Entity } from "./Base/Entity"

export class ConversationUserEntity extends Entity {
  idEmpresa: string
  idUser: string
  idConversation: string

  constructor(data: Partial<ConversationUserEntity>, id?: string) {
    super(data, id)
    this.idEmpresa = data.idEmpresa
    this.idUser = data.idUser
    this.idConversation = data.idConversation
  }
}