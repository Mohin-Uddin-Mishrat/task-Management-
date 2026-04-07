import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import sendResponse from '../utils/sendResponse';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetAllLogsQueryDto } from './dto/get-all-logs-query.dto';
import { GetAllTasksQueryDto } from './dto/get-all-tasks-query.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';
import { Role } from '@prisma';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role?: string;
    email?: string;
    name?: string;
  };
};

@ApiTags('Tasks')
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a task (Admin)' })
  async createTask(
    @Body() dto: CreateTaskDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const result = await this.taskService.createTask(dto, req.user);

    return sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Task created successfully',
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Edit a task (Admin)' })
  async updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const result = await this.taskService.updateTask(id, dto, req.user);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Task updated successfully',
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a task (Admin)' })
  async deleteTask(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const result = await this.taskService.deleteTask(id, req.user);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Task deleted successfully',
      data: result,
    });
  }

  @Patch(':id/status')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Update task status (User)' })
  async updateTaskStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const result = await this.taskService.updateTaskStatus(id, dto, req.user);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Task status updated successfully',
      data: result,
    });
  }

  @Get('logs')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get paginated audit logs (Admin)' })
  async getAllLogs(
    @Query() query: GetAllLogsQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.taskService.getAllLogs(query);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Logs retrieved successfully',
      data: result,
    });
  }

  @Get('my-tasks')
  @ApiOperation({ summary: 'Get authenticated user tasks' })
  async getMyTasks(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetAllTasksQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.taskService.getMyTasks(req.user, query);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User tasks retrieved successfully',
      data: result,
    });
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get paginated tasks (Admin)' })
  async getAllTasks(
    @Query() query: GetAllTasksQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.taskService.getAllTasks(query);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Tasks retrieved successfully',
      data: result,
    });
  }
}
