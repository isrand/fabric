/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import {
  MESSAGE_EVAL_FAIL,
  MESSAGE_EVAL_SUCCESS,
} from 'src/configurations/constants';
import { getContractAux } from '../shared/helper';
import { QueryDto } from './dto/query.dto';

@Injectable()
export class QueryService {
  public constructor(private configService: ConfigService) {}

  private readonly logger = new Logger(QueryService.name);

  public async query(queryDto: QueryDto): Promise<any> {
    let responseMessage = '';
    try {
      const contract = await getContractAux(queryDto, this.configService);
      // Evaluate the specified transaction.
      const result = await contract.evaluateTransaction(
        queryDto.functionName,
        ...queryDto.params,
      );
      this.logger.debug(`${MESSAGE_EVAL_SUCCESS}: ${result.toString()}`);
      return JSON.parse(result.toString());
    } catch (error) {
      this.logger.error(`${MESSAGE_EVAL_FAIL}: ${error}`);
      responseMessage = `${MESSAGE_EVAL_FAIL}: ${error}`;
      return responseMessage;
    }
  }
}
