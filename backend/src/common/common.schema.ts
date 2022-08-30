import { ApiProperty } from '@nestjs/swagger'
import type { SuccessResponse } from 'berta-snakes-shared'

export class SuccessResponseClass implements SuccessResponse {
  @ApiProperty()
  success!: boolean
}
