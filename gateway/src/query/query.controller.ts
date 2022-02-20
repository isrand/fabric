import { Body, Controller, Get } from '@nestjs/common';
import { QueryDto } from './dto/query.dto';
import { QueryService } from './query.service';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Get()
  create(@Body() queryDto: QueryDto) {
    return this.queryService.query(queryDto);
  }
}
