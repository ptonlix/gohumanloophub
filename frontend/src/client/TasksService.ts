import { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"

export interface TaskData {
  id?: string
  name: string
  description?: string
  status: string
  priority?: string
  assignee?: string
  created_at?: string
  updated_at?: string
  metadata?: Record<string, any>
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
  }): CancelablePromise<TaskData> {
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