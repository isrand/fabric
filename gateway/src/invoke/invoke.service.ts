import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract } from 'fabric-network';
import {
  MESSAGE_INVOKE_FAIL,
  MESSAGE_INVOKE_SUCCESS,
} from 'src/configurations/constants';
import { getContractAux } from 'src/shared/helper';
import { InvokeDto } from './dto/invoke.dto';

@Injectable()
export class InvokeService {
  public constructor(private configService: ConfigService) {}

  private readonly logger = new Logger(InvokeService.name);

  public async invoke(invokeDto: InvokeDto): Promise<any> {
    let responseMessage = '';
    try {
      // Get the contract from the network.
      const contract: Contract = await getContractAux(
        invokeDto,
        this.configService,
      );

      // Submit the specified transaction.
      await contract.submitTransaction(
        invokeDto.functionName,
        ...invokeDto.params,
      );

      this.logger.debug(`${MESSAGE_INVOKE_SUCCESS}`);
      responseMessage = `${MESSAGE_INVOKE_SUCCESS}`;
      return responseMessage;
    } catch (error) {
      this.logger.error(`${MESSAGE_INVOKE_FAIL}: ${error}`);
      return new InternalServerErrorException(error);
    }
  }
}
