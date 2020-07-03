import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'

const todoAccess = new TodoAccess()
const logger = createLogger('TodoAccess')

export async function getAllTasks(userId: string): Promise<TodoItem[]> {
  logger.info(`Getting all Todos For User : ${userId}`)

  return todoAccess.getTasksPerUser(userId)
}

export async function createTask(
  userId: string,
  createTodoRequest: CreateTodoRequest
): Promise<TodoItem> {
  logger.info(`Creating new Todo For User : ${userId}`, {
    TaskRequest: createTodoRequest
  })

  return await todoAccess.createTask({
    userId,
    todoId: uuid.v4(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    createdAt: new Date().toISOString(),
    done: false
  })
}

export async function updateTask(
  userId: string,
  taskId: string,
  updatedTodo: UpdateTodoRequest
): Promise<void> {
  logger.info(`Updating Todo For User : ${userId}`, {
    TodoId: taskId,
    TaskRequest: updatedTodo
  })

  await todoAccess.updateTask(userId, taskId, updatedTodo)
}

export async function deleteTask(
  userId: string,
  taskId: string
): Promise<void> {
  logger.info(`Deleting Todo For User : ${userId}`, { TodoId: taskId })

  await todoAccess.deleteTask(userId, taskId)
}

export async function generateUploadURL(
  userId: string,
  taskId: string
): Promise<string> {
  logger.info(`Generating Upload URL For User : ${userId} and Todo : ${taskId}`)

  return await todoAccess.generateUploadURL(userId,taskId)
}
