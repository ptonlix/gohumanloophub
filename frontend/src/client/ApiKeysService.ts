import { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"

export interface ApiKeyCreate {
  name: string
  description?: string
}

export interface ApiKeyPublic {
  id: string
  name: string
  description?: string
  key?: string
  is_active: boolean
  created_at: string
  updated_at: string
  owner_id: string
}

export interface ApiKeysPublic {
  data: ApiKeyPublic[]
  count: number
}

export interface ApiKeyUpdate {
  name?: string
  description?: string
  is_active?: boolean
}

export interface Message {
  message: string
}

export class ApiKeysService {
  /**
   * Get My Api Keys
   * Retrieve API keys for the current user.
   */
  public static getMyApiKeys({
    skip = 0,
    limit = 100,
  }: {
    skip?: number
    limit?: number
  } = {}): CancelablePromise<ApiKeysPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/api-keys/",
      query: {
        skip,
        limit,
      },
    })
  }

  /**
   * Create Api Key
   * Create new API key.
   */
  public static createApiKey({
    requestBody,
  }: {
    requestBody: ApiKeyCreate
  }): CancelablePromise<ApiKeyPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/api-keys/",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Get Api Key
   * Get API key by ID.
   */
  public static getApiKey({
    apiKeyId,
  }: {
    apiKeyId: string
  }): CancelablePromise<ApiKeyPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/api-keys/{api_key_id}",
      path: {
        api_key_id: apiKeyId,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Api Key
   * Update an API key.
   */
  public static updateApiKey({
    apiKeyId,
    requestBody,
  }: {
    apiKeyId: string
    requestBody: ApiKeyUpdate
  }): CancelablePromise<ApiKeyPublic> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/v1/api-keys/{api_key_id}",
      path: {
        api_key_id: apiKeyId,
      },
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete Api Key
   * Delete an API key.
   */
  public static deleteApiKey({
    apiKeyId,
  }: {
    apiKeyId: string
  }): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/api-keys/{api_key_id}",
      path: {
        api_key_id: apiKeyId,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }
}