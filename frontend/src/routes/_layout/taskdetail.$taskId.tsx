import {
  Container,
  VStack,
  Box,
  Badge,
  Flex,
  Heading,
  Text,
  Button,
  HStack,
  Separator,
  SimpleGrid,
} from "@chakra-ui/react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { FiUser, FiClock, FiArrowLeft, FiMessageSquare, FiDatabase, FiHash } from "react-icons/fi"

import { TasksService, type ConversationModel, type RequestModel } from "@/client/TasksService"
import PendingItems from "@/components/Pending/PendingItems"

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed':
    case '已完成':
      return 'green'
    case 'in_progress':
    case 'processing':
    case '进行中':
      return 'blue'
    case 'failed':
    case 'error':
    case '失败':
      return 'red'
    case 'pending':
    case '待处理':
      return 'yellow'
    default:
      return 'gray'
  }
}

function getPriorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'high':
    case '高':
      return 'red'
    case 'medium':
    case '中':
      return 'yellow'
    case 'low':
    case '低':
      return 'green'
    default:
      return 'gray'
  }
}

export const Route = createFileRoute("/_layout/taskdetail/$taskId")({
  component: TaskDetailPage,
})

function TaskDetailPage() {
  const { taskId } = Route.useParams()
  const { data: response, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => TasksService.getTask({ taskId }),
  })

  const task = response?.data

  if (isLoading) {
    return <PendingItems />
  }
  console.log(task)
  if (!task) {
    return (
      <Container maxW="7xl" py={8}>
        <Text>任务未找到</Text>
      </Container>
    )
  }

  return (
    <Container maxW="7xl" py={8}>
      <VStack gap={6} align="stretch">
        <HStack>
          <Link to="/tasks">
            <Button variant="ghost" size="sm">
              <FiArrowLeft />
              返回任务列表
            </Button>
          </Link>
        </HStack>

        <Box bg="white" p={6} rounded="lg" shadow="sm" border="1px" borderColor="gray.200">
            <VStack gap={4} align="stretch">
              <Box>
                <Heading size="lg" mb={2}>
                  {task.name || task.task_id || task.id}
                </Heading>
                {task.description && (
                  <Text color="gray.600" mb={3}>
                    {task.description}
                  </Text>
                )}
              </Box>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                {task.task_id && (
                  <Flex align="center" gap={2}>
                    <FiHash />
                    <Text><strong>任务ID:</strong> {task.task_id}</Text>
                  </Flex>
                )}
                
                {task.user_id && (
                  <Flex align="center" gap={2}>
                    <FiUser />
                    <Text><strong>用户ID:</strong> {task.user_id}</Text>
                  </Flex>
                )}

                {task.assignee && (
                  <Flex align="center" gap={2}>
                    <FiUser />
                    <Text><strong>负责人:</strong> {task.assignee}</Text>
                  </Flex>
                )}

                {task.timestamp && (
                  <Flex align="center" gap={2}>
                    <FiClock />
                    <Text><strong>数据收集时间:</strong> {new Date(task.timestamp).toLocaleString()}</Text>
                  </Flex>
                )}

                {task.created_at && (
                  <Flex align="center" gap={2}>
                    <FiClock />
                    <Text><strong>创建时间:</strong> {new Date(task.created_at).toLocaleString()}</Text>
                  </Flex>
                )}

                {task.updated_at && (
                  <Flex align="center" gap={2}>
                    <FiClock />
                    <Text><strong>更新时间:</strong> {new Date(task.updated_at).toLocaleString()}</Text>
                  </Flex>
                )}
              </SimpleGrid>
            </VStack>
        </Box>

        {/* 对话信息 */}
        {task.conversations && task.conversations.length > 0 && (
          <Box bg="white" p={6} rounded="lg" shadow="sm" border="1px" borderColor="gray.200">
            <Heading size="md" mb={4}>
              <FiMessageSquare style={{ display: 'inline', marginRight: '8px' }} />
              对话记录 ({task.conversations.length})
            </Heading>
            <VStack gap={4} align="stretch">
              {task.conversations.map((conversation: ConversationModel, index: number) => {
                const ConversationItem = () => {
                  const [isOpen, setIsOpen] = useState(false)
                  return (
                    <Box border="1px" borderColor="gray.200" rounded="md">
                      <Button
                        onClick={() => setIsOpen(!isOpen)}
                        variant="ghost"
                        w="full"
                        justifyContent="space-between"
                        p={4}
                      >
                        <Box textAlign="left">
                          <Text fontWeight="medium">
                            对话 {index + 1}: {conversation.conversation_id}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            提供商: {conversation.provider_id} | 请求数: {conversation.requests?.length || 0}
                          </Text>
                        </Box>
                        <Text>{isOpen ? '−' : '+'}</Text>
                      </Button>
                      {isOpen && (
                        <Box p={4}>
                          {conversation.requests && conversation.requests.length > 0 ? (
                            <VStack gap={3} align="stretch">
                              {conversation.requests.map((request: RequestModel, reqIndex: number) => (
                                <Box key={request.request_id || reqIndex} p={4} bg="gray.50" rounded="md">
                                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={2} mb={3}>
                                    <Text fontSize="sm"><strong>请求ID:</strong> {request.request_id}</Text>
                                    <Text fontSize="sm"><strong>状态:</strong> 
                                      <Badge ml={2} colorScheme={getStatusColor(request.status)} size="sm">
                                        {request.status}
                                      </Badge>
                                    </Text>
                                    <Text fontSize="sm"><strong>循环类型:</strong> {request.loop_type}</Text>
                                    <Text fontSize="sm"><strong>响应者:</strong> {request.responded_by}</Text>
                                    <Text fontSize="sm"><strong>响应时间:</strong> {new Date(request.responded_at).toLocaleString()}</Text>
                                  </SimpleGrid>
                                  {request.response && (
                                    <Box mb={2}>
                                      <Text fontSize="sm" fontWeight="medium" mb={1}>响应内容:</Text>
                                      <Box bg="white" p={2} rounded="sm" fontSize="sm" maxH="200px" overflowY="auto">
                                        <pre style={{ whiteSpace: 'pre-wrap' }}>{request.response}</pre>
                                      </Box>
                                    </Box>
                                  )}
                                  {request.feedback && (
                                    <Box mb={2}>
                                      <Text fontSize="sm" fontWeight="medium" mb={1}>反馈:</Text>
                                      <Box bg="white" p={2} rounded="sm" fontSize="sm">
                                        <pre style={{ whiteSpace: 'pre-wrap' }}>{request.feedback}</pre>
                                      </Box>
                                    </Box>
                                  )}
                                  {request.error && (
                                    <Box>
                                      <Text fontSize="sm" fontWeight="medium" mb={1} color="red.600">错误信息:</Text>
                                      <Box bg="red.50" p={2} rounded="sm" fontSize="sm" color="red.700">
                                        <pre style={{ whiteSpace: 'pre-wrap' }}>{request.error}</pre>
                                      </Box>
                                    </Box>
                                  )}
                                </Box>
                              ))}
                            </VStack>
                          ) : (
                            <Text color="gray.500">暂无请求记录</Text>
                          )}
                        </Box>
                      )}
                    </Box>
                  )
                }
                return <ConversationItem key={conversation.conversation_id || index} />
              })}
            </VStack>
          </Box>
        )}

        {/* 元数据信息 */}
        {task.metadata && Object.keys(task.metadata).length > 0 && (
          <Box bg="white" p={6} rounded="lg" shadow="sm" border="1px" borderColor="gray.200">
            <Heading size="md" mb={4}>
              <FiDatabase style={{ display: 'inline', marginRight: '8px' }} />
              元数据信息
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={4}>
              {task.metadata.source && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.600">数据源</Text>
                  <Text>{task.metadata.source}</Text>
                </Box>
              )}
              {task.metadata.client_ip && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.600">客户端IP</Text>
                  <Text fontFamily="mono">{task.metadata.client_ip}</Text>
                </Box>
              )}
              {task.metadata.user_agent && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.600">用户代理</Text>
                  <Text fontSize="sm" title={task.metadata.user_agent} style={{overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                       {task.metadata.user_agent}
                     </Text>
                </Box>
              )}
            </SimpleGrid>
            <Separator mb={4} />
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>完整元数据</Text>
              <Box
                bg="gray.50"
                p={4}
                rounded="md"
                fontSize="sm"
                fontFamily="mono"
                maxH="300px"
                overflowY="auto"
              >
                <pre>{JSON.stringify(task.metadata, null, 2)}</pre>
              </Box>
            </Box>
          </Box>
        )}
      </VStack>
    </Container>
  )
}
