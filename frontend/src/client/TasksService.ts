import { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"

export interface RequestModel {
  request_id: string
  status: string
  loop_type: string
  response: string
  feedback?: string
  responded_by: string
  responded_at: string
  error?: string
}

export interface ConversationModel {
  conversation_id: string
  provider_id: string
  requests: RequestModel[]
}

export interface MetadataModel {
  source: string
  client_ip: string
  user_agent: string
}

export interface TaskData {
  id?: string
  _id?: string
  task_id?: string
  user_id?: string
  name?: string
  description?: string
  assignee?: string
  timestamp?: string
  conversations?: ConversationModel[]
  metadata?: MetadataModel
  created_at?: string
  updated_at?: string
}

export interface APIResponse {
  success: boolean
  error?: string
}

export interface APIResponseWithData<T> extends APIResponse {
  data: T
}

export interface TasksPublic {
  data: TaskData[]
  count: number
}

export interface TaskSyncRequest {
  tasks: TaskData[]
}

export interface Message {
  message: string
}

export class TasksService {
  /**
   * Sync Task Data
   * Sync task data from client.
   */
  public static syncTaskData({
    requestBody,
  }: {
    requestBody: TaskSyncRequest
  }): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/humanloop/tasks/sync",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Get User Tasks
   * Get tasks for the current user.
   */
  public static getUserTasks({
    skip = 0,
    limit = 100,
  }: {
    skip?: number
    limit?: number
  } = {}): CancelablePromise<TasksPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/humanloop/tasks/",
      query: {
        skip,
        limit,
      },
    })
  }

  /**
   * Get Task
   * Get a specific task by ID.
   */
  public static getTask({
    taskId,
  }: {
    taskId: string
  }): CancelablePromise<APIResponseWithData<TaskData>> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/humanloop/tasks/{task_id}",
      path: {
        task_id: taskId,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Task
   * Update a task.
   */
  public static updateTask({
    taskId,
    requestBody,
  }: {
    taskId: string
    requestBody: Partial<TaskData>
  }): CancelablePromise<TaskData> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/v1/humanloop/tasks/{task_id}",
      path: {
        task_id: taskId,
      },
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete Task
   * Delete a task.
   */
  public static deleteTask({
    taskId,
  }: {
    taskId: string
  }): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/humanloop/tasks/{task_id}",
      path: {
        task_id: taskId,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }
}