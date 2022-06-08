import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { ApiProperty } from '@nestjs/swagger'
import type { UserPublic, UserPrivate } from 'berta-snakes-shared'
import mongoose from 'mongoose'

@Schema()
export class UserPublicClass implements UserPublic {
  @ApiProperty()
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: false })
  id!: string

  @ApiProperty()
  @Prop({ type: String, required: true, unique: true })
  name!: string

  @ApiProperty({ type: Number, required: true })
  created!: number
}

@Schema()
export class UserPrivateClass extends UserPublicClass implements UserPrivate {
  @ApiProperty()
  @Prop({ type: String, required: true, unique: true })
  email!: string

  @ApiProperty()
  @Prop({ type: Boolean, required: true })
  confirmed!: boolean

  @Prop({ type: String, required: true })
  password!: string
}

export const UserSchema = SchemaFactory.createForClass(UserPrivateClass)
UserSchema.index({ name: 'hashed' }, { name: 'username_search', unique: true })
UserSchema.index({ created: -1 }, { name: 'creation_date_sorting' })
