import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly s3 = createS3(),
    private readonly tasksTable = process.env.TODOS_TABLE,
    private readonly attchments_bucket = process.env.ATTACHMENTS_BUCKET,
    private readonly expiration = process.env.SIGNED_URL_EXPIRATION
  ) {}

  async getTasksPerUser(userId: string): Promise<TodoItem[]> {
    const params = {
      TableName: this.tasksTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false
    }

    const result = await this.docClient.query(params).promise()

    return result.Items as TodoItem[]
  }

  async createTask(newTask: TodoItem): Promise<TodoItem> {
    const params = {
      TableName: this.tasksTable,
      Item: newTask
    }
    await this.docClient.put(params).promise()

    return newTask
  }

  async updateTask(
    userId: string,
    taskId: string,
    updatedTask: TodoUpdate
  ): Promise<void> {
    const params = {
      TableName: this.tasksTable,
      Key: {
        userId: userId,
        todoId: taskId
      },
      UpdateExpression: 'set #taskName= :name, dueDate= :dueDate, done= :done',
      ExpressionAttributeNames: {
        '#taskName': 'name'
      },
      ExpressionAttributeValues: {
        ':name': updatedTask.name,
        ':dueDate': updatedTask.dueDate,
        ':done': updatedTask.done
      }
    }

    await this.docClient.update(params).promise()
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const params = {
      TableName: this.tasksTable,
      Key: {
        userId: userId,
        todoId: taskId
      }
    }

    await this.docClient.delete(params).promise()
  }

  async generateUploadURL(userId: string, taskId: string): Promise<string> {
    const attachmentUrl = `https://${this.attchments_bucket}.s3.amazonaws.com/${taskId}`

    const params = {
      TableName: this.tasksTable,
      Key: {
        userId: userId,
        todoId: taskId
      },
      UpdateExpression: 'set attachmentUrl= :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': attachmentUrl
      },
      // ReturnValues: 'UPDATED_NEW'
    }

    await this.docClient.update(params).promise()
    
    //return signed url
    return this.s3.getSignedUrl('putObject', {
      Bucket: this.attchments_bucket,
      Key: taskId,
      Expires: this.expiration
    })
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}

function createS3() {
  return new XAWS.S3({
    signatureVersion: 'v4'
  })
}
