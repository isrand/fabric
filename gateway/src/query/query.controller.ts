import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransactionRequest } from '../common/transaction.request';
import { QueryService } from './query.service';
import { QueryResponse } from './response/query.response';

@Controller('query')
@ApiTags('Query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  public async query(@Body() queryDto: TransactionRequest): Promise<QueryResponse> {
    return await this.queryService.query(queryDto);
  }
}
