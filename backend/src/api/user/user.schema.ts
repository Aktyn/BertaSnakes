import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { ApiProperty } from '@nestjs/swagger'
import type { User } from 'berta-snakes-shared'
import type { Document } from 'mongoose'
import mongoose from 'mongoose'

export type UserDocument = Omit<UserClass, 'id'> & Document

@Schema()
export class UserClass implements User {
  @ApiProperty()
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: false })
  id!: string

  @ApiProperty()
  @Prop({ type: String, required: true })
  name!: string
}

export function documentToUserClass(document: UserDocument): UserClass {
  const userClass = new UserClass()
  userClass.id = document._id
  userClass.name = document.name
  return userClass
}

export const UserSchema = SchemaFactory.createForClass(UserClass)
