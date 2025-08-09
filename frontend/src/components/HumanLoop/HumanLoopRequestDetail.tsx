import {
  Badge,
  Box,
  Code,
  Flex,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

import type { HumanLoopRequest } from "@/client/HumanLoopService"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../ui/dialog"

interface HumanLoopRequestDetailProps {
  request: HumanLoopRequest
  isOpen: boolean
  onClose: () => void
}

// 状态标签颜色映射
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: 'orange',
    inprogress: 'blue',
    completed: 'green',
    cancelled: 'gray',
    approved: 'green',
    rejected: 'red',
    error: 'red',
    expired: 'yellow',
  }
  return colorMap[status] || 'gray'
}

// 循环类型标签颜色映射
const getLoopTypeColor = (loopType: string) => {
  const colorMap: Record<string, string> = {
    conversation: 'blue',
    approval: 'purple',
    information: 'teal',
  }
  return colorMap[loopType] || 'gray'
}

// 平台标签颜色映射
const getPlatformColor = (platform: string) => {
  const colorMap: Record<string, string> = {
    wechat: 'green',
    feishu: 'blue',
    other: 'gray',
  }
  return colorMap[platform] || 'gray'
}

const HumanLoopRequestDetail = ({
  request,
  isOpen,
  onClose,
}: HumanLoopRequestDetailProps) => {
  return (
    <DialogRoot open={isOpen} onOpenChange={({ open }) => !open && onClose()}>
      <DialogContent maxW="4xl">
        <DialogHeader>
          <DialogTitle>请求详情</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <VStack align="stretch" gap={6}>
            {/* 基本信息 */}
            <Box>
              <Heading size="md" mb={4}>
                基本信息
              </Heading>
              <VStack align="stretch" gap={3}>
                <Flex justify="space-between">
                  <Text fontWeight="medium">任务ID:</Text>
                  <Code fontSize="sm">{request.task_id}</Code>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">会话ID:</Text>
                  <Code fontSize="sm">{request.conversation_id}</Code>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">请求ID:</Text>
                  <Code fontSize="sm">{request.request_id}</Code>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">循环类型:</Text>
                  <Badge colorScheme={getLoopTypeColor(request.loop_type)}>
                    {request.loop_type === 'conversation' && '对话模式'}
                    {request.loop_type === 'approval' && '审批模式'}
                    {request.loop_type === 'information' && '信息获取'}
                  </Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">平台:</Text>
                  <Badge colorScheme={getPlatformColor(request.platform)}>
                    {request.platform === 'GoHumanLoop' && 'GoHumanLoop'}
                    {request.platform === 'wework' && ' 企业微信'}
                    {request.platform === 'feishu' && '飞书'}
                    {request.platform === 'other' && '其他'}
                  </Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">状态:</Text>
                  <Badge colorScheme={getStatusColor(request.status)}>
                    {request.status === 'pending' && '待处理'}
                    {request.status === 'inprogress' && '处理中'}
                    {request.status === 'completed' && '已完成'}
                    {request.status === 'approved' && '已审批'}
                    {request.status === 'rejected' && '已拒绝'}
                    {request.status === 'cancelled' && '已取消'}
                    {request.status === 'error' && '错误'}
                    {request.status === 'expired' && '已过期'}
                  </Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">创建时间:</Text>
                  <Text>
                    {format(new Date(request.created_at), 'yyyy-MM-dd HH:mm:ss', {
                      locale: zhCN,
                    })}
                  </Text>
                </Flex>
                {request.responded_at && (
                  <Flex justify="space-between">
                    <Text fontWeight="medium">响应时间:</Text>
                    <Text>
                      {format(new Date(request.responded_at), 'yyyy-MM-dd HH:mm:ss', {
                        locale: zhCN,
                      })}
                    </Text>
                  </Flex>
                )}
                {request.responded_by && (
                  <Flex justify="space-between">
                    <Text fontWeight="medium">处理人:</Text>
                    <Text>{request.responded_by}</Text>
                  </Flex>
                )}
              </VStack>
            </Box>

            {/* 上下文信息 */}
            <Box>
              <Heading size="md" mb={4}>
                上下文信息
              </Heading>
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontWeight="medium" mb={2}>
                  消息内容:
                </Text>
                <Text whiteSpace="pre-wrap">{request.context.message}</Text>
                {request.context.user_info && (
                  <>
                    <Text fontWeight="medium" mt={4} mb={2}>
                      用户信息:
                    </Text>
                    <Code display="block" p={2} whiteSpace="pre-wrap">
                      {JSON.stringify(request.context.user_info, null, 2)}
                    </Code>
                  </>
                )}
              </Box>
            </Box>

            {/* 响应信息 */}
            {request.response && (
              <Box>
                <Heading size="md" mb={4}>
                  响应信息
                </Heading>
                <Box p={4} bg="blue.50" borderRadius="md">
                  <Text fontWeight="medium" mb={2}>
                    响应消息:
                  </Text>
                  <Text whiteSpace="pre-wrap">{request.response.message}</Text>
                  <Text fontWeight="medium" mt={4} mb={2}>
                    消息类型:
                  </Text>
                  <Text>{request.response.message_type}</Text>
                  {request.response.attachments && request.response.attachments.length > 0 && (
                    <>
                      <Text fontWeight="medium" mt={4} mb={2}>
                        附件:
                      </Text>
                      <Code display="block" p={2} whiteSpace="pre-wrap">
                        {JSON.stringify(request.response.attachments, null, 2)}
                      </Code>
                    </>
                  )}
                </Box>
              </Box>
            )}

            {/* 反馈信息 */}
            {request.feedback && (
              <Box>
                <Heading size="md" mb={4}>
                  反馈信息
                </Heading>
                <Box p={4} bg="green.50" borderRadius="md">
                  <Text whiteSpace="pre-wrap">{request.feedback}</Text>
                </Box>
              </Box>
            )}

            {/* 元数据 */}
            {request.metadata && (
              <Box>
                <Heading size="md" mb={4}>
                  元数据
                </Heading>
                <Code display="block" p={4} whiteSpace="pre-wrap">
                  {JSON.stringify(request.metadata, null, 2)}
                </Code>
              </Box>
            )}
          </VStack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}

export default HumanLoopRequestDetail