import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ListProjectsQuery } from './dto/list-projects.dto.js';
import type { ProjectResponse } from './project.entity.js';
import { type ProjectList, ProjectsService } from './projects.service.js';

// The design body is checked by `validateDesign` (strict, hand-written), not by class-validator.
const DESIGN_BODY = { schema: { type: 'object', description: 'An ad design: name, formatId, width, height, status, background, elements.' } } as const;

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListProjectsQuery): Promise<ProjectList> {
    return this.projects.list(user.id, query);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<ProjectResponse> {
    return this.projects.get(user.id, id);
  }

  @ApiBody(DESIGN_BODY)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown): Promise<ProjectResponse> {
    return this.projects.create(user.id, body);
  }

  @ApiBody(DESIGN_BODY)
  @Put(':id')
  replace(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown): Promise<ProjectResponse> {
    return this.projects.replace(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.projects.remove(user.id, id);
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<ProjectResponse> {
    return this.projects.duplicate(user.id, id);
  }
}
