import { Controller, Post, Body, Logger } from '@nestjs/common';
import { InvokeService } from './invoke.service';
import { InvokeDto } from './dto/invoke.dto';

@Controller('invoke')
export class InvokeController {
  constructor(private readonly invokeService: InvokeService) {}

  private readonly logger = new Logger(InvokeService.name);

  @Post()
  create(@Body() invokeDto: InvokeDto) {
    return this.invokeService.invoke(invokeDto);
  }
}
