import {
  Controller,
  Body,
  Res,
  Post,
  HttpStatus,
  Get,
  Param,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { PautasService } from './pautas.service';
import {
  CriarPautaResource,
  NovaSessaoResource,
  toDomain,
  toRepresentation,
} from './pautas.resource';
import { Pauta } from './pauta.entity';
import { ErrorResponse } from 'src/common/erro.resource';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('pautas')
@ApiTags('Pautas')
export class PautasController {
  private readonly logger = new Logger(PautasController.name);
  constructor(private readonly service: PautasService) {}

  @Post()
  @ApiOperation({ description: 'Criar uma nova pauta' })
  async save(@Body() pauta: CriarPautaResource, @Res() response: Response) {
    this.logger.log(`Criando pauta: ${JSON.stringify(pauta)}`);
    const pautaDomain: Pauta = toDomain(pauta);
    const result = await this.service.save(pautaDomain);

    if (result.isError()) {
      this.logger.error(`Erro ao criar pauta: ${result.error.message}`);
      return response
        .status(HttpStatus.CONFLICT)
        .send(new ErrorResponse(result.error.message));
    }

    this.logger.log(`Pauta criada: ${JSON.stringify(result.value)}`);
    return response
      .status(HttpStatus.CREATED)
      .send(toRepresentation(result.value));
  }

  @Get()
  async list(@Res() response: Response) {
    const result = await this.service.findAll();

    return response.status(HttpStatus.OK).send(result.map(toRepresentation));
  }

  @Post(':id/sessao')
  async iniciarSessao(
    @Param('id') id: string,
    @Body() resource: NovaSessaoResource,
    @Res() response: Response,
  ) {
    const pauta: Pauta = await this.service.findById(id);

    if (!pauta) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new ErrorResponse('Pauta não encontrada'));
    }

    const sucesso = await this.service.iniciarSessao(pauta, resource.minutos);

    if (sucesso) {
      return response.status(HttpStatus.OK).send();
    } else {
      return response
        .status(HttpStatus.CONFLICT)
        .send(new ErrorResponse('Sessão já iniciada ou encerrada!'));
    }
  }
}
