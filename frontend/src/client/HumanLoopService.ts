import { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"

// 人机循环请求数据模型
export interface HumanLoopRequest {
  id: string
  task_id: string
  conversation_id: string
  request_id: string
  loop_type: 'conversation' | 'approval' | 'information'
  platform: 'GoHumanLoop' | 'wework' | 'feishu' | 'other'
  status: 'pending' | 'inprogress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'error' | 'expired'
  context: {
    message: string
    user_info?: any
    [key: string]: any
  }
  metadata?: any
  response?: {
    message: string
    message_type: string
    attachments?: any[]
  } | null
  feedback?: string | null
  responded_by?: string | null
  responded_at?: string | null
  created_at: string
  updated_at: string
  owner_id: string
}

// 人机循环请求列表响应
export interface HumanLoopRequestsResponse {
  data: HumanLoopRequest[]
  count: number
}

// 统计信息响应
export interface HumanLoopStatsResponse {
  success: boolean
  data: {
    by_status: {
      pending: number
      inprogress: number
      completed: number
      cancelled: number
      approved: number
      rejected: number
      error: number
      expired: number
    }
    by_type: {
      conversation: number
      approval: number
      information: number
    }
    by_platform: {
      wechat: number
      feishu: number
      other: number
    }
    total: number
  }
}

// 审批请求体
export interface ApprovalRequest {
  request_id: string
  action: 'approved' | 'rejected'
  feedback?: string
  response?: {
    message: string
    message_type: string
    attachments?: any[]
  }
}

// 信息获取请求体
export interface InformationRequest {
  request_id: string
  response: {
    message: string
    message_type: string
    attachments?: any[]
  }
  feedback?: string
}

// 对话请求体
export interface ConversationRequest {
  request_id: string
  response: {
    message: string
    message_type: string
    attachments?: any[]
  }
  feedback?: string
  is_complete: boolean
}

// 批量处理请求体
export interface BatchRequest {
  request_ids: string[]
  action: 'approved' | 'rejected' | 'cancelled'
  feedback?: string
}

// 基础响应
export interface BaseResponse {
  success: boolean
  error?: string
}

// 单个请求详情响应
export interface HumanLoopRequestDetailResponse {
  success: boolean
  data: HumanLoopRequest
  error?: string
}

export class HumanLoopService {
  /**
   * 获取人机循环请求列表
   */
  public static getRequests({
    loop_type,
    status,
    platform,
    created_at_start,
    created_at_end,
    skip = 0,
    limit = 100,
  }: {
    loop_type?: 'conversation' | 'approval' | 'information'
    status?: 'pending' | 'inprogress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'error' | 'expired'
    platform?: 'wechat' | 'feishu' | 'other'
    created_at_start?: string
    created_at_end?: string
    skip?: number
    limit?: number
  } = {}): CancelablePromise<HumanLoopRequestsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/admin/humanloop/requests',
      query: {
        loop_type,
        status,
        platform,
        created_at_start,
        created_at_end,
        skip,
        limit,
      },
    })
  }

  /**
   * 获取单个请求详情
   */
  public static getRequestDetail({
    requestId,
  }: {
    requestId: string
  }): CancelablePromise<HumanLoopRequestDetailResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/admin/humanloop/requests/{request_id}',
      path: {
        request_id: requestId,
      },
    })
  }

  /**
   * 处理审批模式请求
   */
  public static processApproval({
    requestBody,
  }: {
    requestBody: ApprovalRequest
  }): CancelablePromise<BaseResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/admin/humanloop/approval',
      body: requestBody,
      mediaType: 'application/json',
    })
  }

  /**
   * 处理信息获取模式请求
   */
  public static processInformation({
    requestBody,
  }: {
    requestBody: InformationRequest
  }): CancelablePromise<BaseResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/admin/humanloop/information',
      body: requestBody,
      mediaType: 'application/json',
    })
  }

  /**
   * 处理对话模式请求
   */
  public static processConversation({
    requestBody,
  }: {
    requestBody: ConversationRequest
  }): CancelablePromise<BaseResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/admin/humanloop/conversation',
      body: requestBody,
      mediaType: 'application/json',
    })
  }

  /**
   * 批量处理请求
   */
  public static batchProcess({
    requestBody,
  }: {
    requestBody: BatchRequest
  }): CancelablePromise<BaseResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/admin/humanloop/batch',
      body: requestBody,
      mediaType: 'application/json',
    })
  }

  /**
   * 更新请求状态
   */
  public static updateRequestStatus({
    requestId,
    status,
  }: {
    requestId: string
    status: 'pending' | 'inprogress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'error' | 'expired'
  }): CancelablePromise<BaseResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/admin/humanloop/requests/{request_id}/status',
      path: {
        request_id: requestId,
      },
      query: {
        status,
      },
    })
  }

  /**
   * 获取统计信息
   */
  public static getStats(): CancelablePromise<HumanLoopStatsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/admin/humanloop/stats',
    })
  }
}