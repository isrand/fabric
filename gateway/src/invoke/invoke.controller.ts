import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransactionRequest } from '../common/transaction.request';
import { InvokeService } from './invoke.service';
import { InvokeResponse } from './response/invoke.response';

@Controller('invoke')
@ApiTags('Invoke')
export class InvokeController {
  constructor(private readonly invokeService: InvokeService) {}

  @Post()
  public async invoke(@Body() invokeDto: TransactionRequest): Promise<InvokeResponse> {
    return await this.invokeService.invoke(invokeDto);
  }
}
