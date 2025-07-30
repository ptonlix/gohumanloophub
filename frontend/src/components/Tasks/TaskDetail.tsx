import {
  Button,
  DialogTitle,
  Text,
  VStack,
  Box,
  Badge,
  Flex,
  Heading,
  HStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { FiEye, FiUser, FiClock, FiMessageCircle, FiActivity, FiAlertCircle, FiCheckCircle } from "react-icons/fi"

import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog"

interface TaskDetailProps {
  task: any
}

function getStatusColor(status: string) {
  if (!status) {
    return "gray"
  }
  switch (status.toLowerCase()) {
    case "completed":
    case "done":
      return "green"
    case "in_progress":
    case "running":
      return "blue"
    case "failed":
    case "error":
      return "red"
    default:
      return "gray"
  }
}

function getPriorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case "high":
      return "red"
    case "medium":
      return "yellow"
    case "low":
      return "green"
    default:
      return "gray"
  }
}

function getRequestStatusColor(status: string) {
  if (!status) {
    return "gray"
  }
  switch (status.toLowerCase()) {
    case "completed":
    case "done":
      return "green"
    case "in_progress":
    case "running":
      return "blue"
    case "failed":
    case "error":
      return "red"
    default:
      return "gray"
  }
}

function getRequestStatusIcon(status: string) {
  if (!status) {
    return <FiClock size={12} color="gray" />
  }
  switch (status.toLowerCase()) {
    case "completed":
    case "done":
      return <FiCheckCircle size={12} color="green" />
    case "in_progress":
    case "running":
      return <FiActivity size={12} color="blue" />
    case "failed":
    case "error":
      return <FiAlertCircle size={12} color="red" />
    default:
      return <FiClock size={12} color="gray" />
  }
}

const TaskDetail = ({ task }: TaskDetailProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DialogRoot
      size={{ base: "sm", md: "lg" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" colorPalette="blue">
          <FiEye fontSize="16px" />
          查看详情
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogCloseTrigger />
        <DialogHeader>
          <DialogTitle>任务详情</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack gap={4} align="stretch">
            <Box>
              <Heading size="md" mb={2}>
                {task.name || task.task_id}
              </Heading>
              {task.description && (
                <Text color="gray.600" mb={3}>
                  {task.description}
                </Text>
              )}
            </Box>

            <Flex gap={2} wrap="wrap">
              <Badge colorScheme={getStatusColor(task.status)}>
                状态: {task.status}
              </Badge>
              {task.priority && (
                <Badge colorScheme={getPriorityColor(task.priority)}>
                  优先级: {task.priority}
                </Badge>
              )}
            </Flex>

            {task.assignee && (
              <Flex align="center" gap={2}>
                <FiUser />
                <Text>负责人: {task.assignee}</Text>
              </Flex>
            )}

            <Box>
              <Flex align="center" gap={2} mb={2}>
                <FiClock />
                <Text fontWeight="semibold">时间信息</Text>
              </Flex>
              <VStack align="start" gap={1} fontSize="sm" color="gray.600">
                <Text>
                  创建时间: {task.created_at ? new Date(task.created_at).toLocaleString('zh-CN') : '-'}
                </Text>
                {task.updated_at && (
                  <Text>
                    更新时间: {new Date(task.updated_at).toLocaleString('zh-CN')}
                  </Text>
                )}
                {task.timestamp && (
                  <Text>
                    时间戳: {new Date(task.timestamp).toLocaleString('zh-CN')}
                  </Text>
                )}
              </VStack>
            </Box>

            {task.conversations && task.conversations.length > 0 && (
              <Box>
                <Flex align="center" gap={2} mb={3}>
                  <FiMessageCircle />
                  <Text fontWeight="semibold">
                    对话记录 ({task.conversations.length})
                  </Text>
                </Flex>
                <Box maxH="300px" overflowY="auto">
                  {task.conversations.map((conv: any, index: number) => (
                    <Box key={index} p={3} bg="gray.50" borderRadius="md" mb={3}>
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text fontSize="sm" fontWeight="medium">
                          对话 {index + 1} (ID: {conv.conversation_id})
                        </Text>
                        <Badge size="sm" colorScheme="blue">
                          Provider: {conv.provider_id}
                        </Badge>
                      </Flex>
                      
                      {conv.requests && conv.requests.length > 0 && (
                        <VStack align="stretch" gap={2}>
                          <Flex align="center" gap={2}>
                            <FiActivity size={14} />
                            <Text fontSize="xs" color="gray.600">
                              请求数: {conv.requests.length}
                            </Text>
                          </Flex>
                          
                          <Box pl={4}>
                            {conv.requests.map((req: any, reqIndex: number) => (
                              <Box key={reqIndex} p={2} bg="white" borderRadius="sm" mb={2} borderLeft="3px solid" borderColor={getRequestStatusColor(req.status)}>
                                <Flex justify="space-between" align="center" mb={1}>
                                  <Text fontSize="xs" fontWeight="medium">
                                    请求 {reqIndex + 1}
                                  </Text>
                                  <HStack gap={1}>
                                    {getRequestStatusIcon(req.status)}
                                    <Badge size="xs" colorScheme={getRequestStatusColor(req.status)}>
                                      {req.status}
                                    </Badge>
                                  </HStack>
                                </Flex>
                                
                                <VStack align="start" gap={1} fontSize="xs" color="gray.600">
                                  <Text>ID: {req.request_id}</Text>
                                  <Text>循环类型: {req.loop_type}</Text>
                                  <Text>响应者: {req.responded_by}</Text>
                                  <Text>响应时间: {new Date(req.responded_at).toLocaleString('zh-CN')}</Text>
                                  {req.feedback && (
                                    <Text>反馈: {req.feedback}</Text>
                                  )}
                                  {req.error && (
                                    <Text color="red.500">错误: {req.error}</Text>
                                  )}
                                </VStack>
                              </Box>
                            ))}
                          </Box>
                        </VStack>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {task.metadata && Object.keys(task.metadata).length > 0 && (
              <Box>
                <Text fontWeight="semibold" mb={2}>元数据</Text>
                <Box
                  bg="gray.50"
                  p={3}
                  borderRadius="md"
                  fontSize="xs"
                  fontFamily="mono"
                  maxH="200px"
                  overflowY="auto"
                >
                  <pre>{JSON.stringify(task.metadata, null, 2)}</pre>
                </Box>
              </Box>
            )}
          </VStack>
        </DialogBody>

        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">关闭</Button>
          </DialogActionTrigger>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export default TaskDetail