import { ApiProperty } from '@nestjs/swagger'
import type { OrderByRequest, SuccessResponse } from 'berta-snakes-shared'

export class SuccessResponseClass implements SuccessResponse {
  @ApiProperty()
  success!: boolean
}

export class OrderByBaseClass implements Pick<OrderByRequest, 'direction'> {
  @ApiProperty({ enum: ['asc', 'desc'], default: 'desc', required: false })
  direction: 'asc' | 'desc' = 'desc'
}
