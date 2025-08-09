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
import { useTranslation } from "react-i18next"

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
    GoHumanLoop: 'orange',
    wework: 'green',
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
  const { t } = useTranslation()
  return (
    <DialogRoot open={isOpen} onOpenChange={({ open }) => !open && onClose()}>
      <DialogContent maxW="4xl">
        <DialogHeader>
          <DialogTitle>{t('humanLoop.requestDetail')}</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <VStack align="stretch" gap={6}>
            {/* 基本信息 */}
            <Box>
              <Heading size="md" mb={4}>
                {t('humanLoop.basicInfo')}
              </Heading>
              <VStack align="stretch" gap={3}>
                <Flex justify="space-between">
                  <Text fontWeight="medium">{t('humanLoop.taskId')}:</Text>
                  <Code fontSize="sm">{request.task_id}</Code>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">{t('humanLoop.conversationId')}:</Text>
                  <Code fontSize="sm">{request.conversation_id}</Code>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">{t('humanLoop.requestId')}:</Text>
                  <Code fontSize="sm">{request.request_id}</Code>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">{t('humanLoop.loopType')}:</Text>
                  <Badge colorScheme={getLoopTypeColor(request.loop_type)}>
                    {request.loop_type === 'conversation' && t('humanLoop.conversationMode')}
                    {request.loop_type === 'approval' && t('humanLoop.approvalMode')}
                    {request.loop_type === 'information' && t('humanLoop.informationGathering')}
                  </Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">{t('humanLoop.platform')}:</Text>
                  <Badge colorScheme={getPlatformColor(request.platform)}>
                    {request.platform === 'GoHumanLoop' && t('humanLoop.goHumanLoop')}
                    {request.platform === 'wework' && t('humanLoop.wework')}
                    {request.platform === 'feishu' && t('humanLoop.feishu')}
                    {request.platform === 'other' && t('humanLoop.other')}
                  </Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">{t('humanLoop.status')}:</Text>
                  <Badge colorScheme={getStatusColor(request.status)}>
                    {request.status === 'pending' && t('humanLoop.pending')}
                    {request.status === 'inprogress' && t('humanLoop.inProgress')}
                    {request.status === 'completed' && t('humanLoop.completed')}
                    {request.status === 'approved' && t('humanLoop.approved')}
                    {request.status === 'rejected' && t('humanLoop.rejected')}
                    {request.status === 'cancelled' && t('humanLoop.cancelled')}
                    {request.status === 'error' && t('humanLoop.error')}
                    {request.status === 'expired' && t('humanLoop.expired')}
                  </Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">{t('humanLoop.createdAt')}:</Text>
                  <Text>
                    {format(new Date(request.created_at), 'yyyy-MM-dd HH:mm:ss', {
                      locale: zhCN,
                    })}
                  </Text>
                </Flex>
                {request.responded_at && (
                  <Flex justify="space-between">
                    <Text fontWeight="medium">{t('humanLoop.responseTime')}:</Text>
                    <Text>
                      {format(new Date(request.responded_at), 'yyyy-MM-dd HH:mm:ss', {
                        locale: zhCN,
                      })}
                    </Text>
                  </Flex>
                )}
                {request.responded_by && (
                  <Flex justify="space-between">
                    <Text fontWeight="medium">{t('humanLoop.processedBy')}:</Text>
                    <Text>{request.responded_by}</Text>
                  </Flex>
                )}
              </VStack>
            </Box>

            {/* 上下文信息 */}
            <Box>
              <Heading size="md" mb={4}>
                {t('humanLoop.contextInfo')}
              </Heading>
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontWeight="medium" mb={2}>
                  {t('humanLoop.messageContent')}:
                </Text>
                <Text whiteSpace="pre-wrap">{request.context.message}</Text>
                {request.context.user_info && (
                  <>
                    <Text fontWeight="medium" mt={4} mb={2}>
                      {t('humanLoop.userInfo')}:
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
                  {t('humanLoop.responseInfo')}
                </Heading>
                <Box p={4} bg="blue.50" borderRadius="md">
                  <Text fontWeight="medium" mb={2}>
                    {t('humanLoop.responseMessage')}:
                  </Text>
                  <Text whiteSpace="pre-wrap">{request.response.message}</Text>
                  <Text fontWeight="medium" mt={4} mb={2}>
                    {t('humanLoop.messageType')}:
                  </Text>
                  <Text>{request.response.message_type}</Text>
                  {request.response.attachments && request.response.attachments.length > 0 && (
                    <>
                      <Text fontWeight="medium" mt={4} mb={2}>
                        {t('humanLoop.attachments')}:
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
                  {t('humanLoop.feedbackInfo')}
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
                  {t('humanLoop.metadata')}
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