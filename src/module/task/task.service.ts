import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from '@prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetAllLogsQueryDto } from './dto/get-all-logs-query.dto';
import { GetAllTasksQueryDto } from './dto/get-all-tasks-query.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type Actor = {
  id: string;
  role?: string;
  email?: string;
  name?: string;
};

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async createTask(dto: CreateTaskDto, actor: Actor) {
    if (dto.assigneeId) {
      await this.ensureUserExists(dto.assigneeId);
    }

    const task = await this.prisma.client.task.create({
      data: {
        title: dto.title,
        status: dto.status ?? TaskStatus.TODO,
        assigneeId: dto.assigneeId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await this.createLog({
      userId: actor.id,
      action: 'Task Created',
      details: dto.assigneeId
        ? `Task "${task.title}" created and assigned to "${task.assignee?.name ?? task.assignee?.email ?? dto.assigneeId}".`
        : `Task "${task.title}" created.`,
    });

    return task;
  }

  async updateTask(id: string, dto: UpdateTaskDto, actor: Actor) {
    const existingTask = await this.findTaskOrThrow(id);

    if (dto.assigneeId) {
      await this.ensureUserExists(dto.assigneeId);
    }

    const updatedTask = await this.prisma.client.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const changes: string[] = [];

    if (dto.title !== undefined && dto.title !== existingTask.title) {
      changes.push(`title from "${existingTask.title}" to "${dto.title}"`);
    }

    if (dto.status !== undefined && dto.status !== existingTask.status) {
      changes.push(`status from "${existingTask.status}" to "${dto.status}"`);
    }

    if (dto.assigneeId !== undefined && dto.assigneeId !== existingTask.assigneeId) {
      const previousAssignee =
        existingTask.assignee?.name ??
        existingTask.assignee?.email ??
        existingTask.assigneeId ??
        'Unassigned';
      const nextAssignee =
        updatedTask.assignee?.name ??
        updatedTask.assignee?.email ??
        updatedTask.assigneeId ??
        'Unassigned';

      changes.push(`assignee from "${previousAssignee}" to "${nextAssignee}"`);
    }

    await this.createLog({
      userId: actor.id,
      action: 'Task Updated',
      details: changes.length
        ? `Task "${updatedTask.title}" updated: ${changes.join(', ')}.`
        : `Task "${updatedTask.title}" updated.`,
    });

    return updatedTask;
  }

  async deleteTask(id: string, actor: Actor) {
    const task = await this.findTaskOrThrow(id);

    await this.prisma.client.task.delete({
      where: { id },
    });

    await this.createLog({
      userId: actor.id,
      action: 'Task Deleted',
      details: `Task "${task.title}" deleted.`,
    });

    return { id };
  }

  async updateTaskStatus(id: string, dto: UpdateTaskStatusDto, actor: Actor) {
    const task = await this.findTaskOrThrow(id);

    if (task.assigneeId !== actor.id) {
      throw new ForbiddenException('You can only update your assigned tasks');
    }

    const updatedTask = await this.prisma.client.task.update({
      where: { id },
      data: {
        status: dto.status,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await this.createLog({
      userId: actor.id,
      action: 'Task Status Changed',
      details: `Task "${task.title}" status changed from "${task.status}" to "${dto.status}".`,
    });

    return updatedTask;
  }

  async getAllTasks(query: GetAllTasksQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where = {
      ...(search
        ? {
            title: {
              contains: search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.client.task.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: query.sortOrder === 'asc' ? 'asc' : 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.client.task.count({ where }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: tasks,
    };
  }

  async getMyTasks(actor: Actor, query: GetAllTasksQueryDto) {
    return this.getAllTasks({
      ...query,
      assigneeId: actor.id,
    });
  }

  async getAllLogs(query: GetAllLogsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.client.log.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.client.log.count(),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: logs,
    };
  }

  private async findTaskOrThrow(id: string) {
    const task = await this.prisma.client.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Assignee user not found');
    }

    return user;
  }

  private async createLog(data: {
    userId: string;
    action: string;
    details?: string;
  }) {
    await this.prisma.client.log.create({
      data,
    });
  }
}
