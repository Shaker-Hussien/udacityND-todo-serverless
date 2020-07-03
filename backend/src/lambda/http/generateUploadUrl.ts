import 'source-map-support/register'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult
} from 'aws-lambda'

import { getUserId } from '../utils'
import { generateUploadURL } from '../../businessLogic/todo'

import { createLogger } from '../../utils/logger'
const logger = createLogger('generateUploadURL')

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Start Handling generateUploadURL Event', event)

  try {
    const userId = getUserId(event)
    const taskId = event.pathParameters.todoId

    const uploadUrl = await generateUploadURL(userId, taskId)

    logger.info('End Handling generateUploadURL Event Successfully.')

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        uploadUrl
      })
    }
  } catch (e) {
    logger.error('End Handling generateUploadURL Event With Errors.', {
      Error: e.message
    })

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: e.message
      })
    }
  }
}
