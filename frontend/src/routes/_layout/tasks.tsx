import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  Table,
  Text,
  VStack,
  Card,
  CardBody,
  SimpleGrid,
  Tag,
  TagLabel,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { FiCheckCircle, FiClock, FiAlertCircle, FiUser } from "react-icons/fi"

import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import { TasksService } from "@/client/TasksService"

const tasksSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 10

function getTasksQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      TasksService.getUserTasks({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["tasks", { page }],
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
    case "done":
      return <FiCheckCircle color="green" />
    case "in_progress":
    case "running":
      return <FiClock color="blue" />
    case "failed":
    case "error":
      return <FiAlertCircle color="red" />
    default:
      return <FiClock color="gray" />
  }
}

function getStatusColor(status: string) {
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

export const Route = createFileRoute("/_layout/tasks")({ 
  component: Tasks,
  validateSearch: (search) => tasksSearchSchema.parse(search),
})

function Tasks() {
  const navigate = useNavigate({ from: "/tasks" })
  const { page } = Route.useSearch()
  const { data, isPending, isError, error } = useQuery({
    ...getTasksQueryOptions({ page }),
  })

  const handlePageChange = (page: number) => {
    navigate({ search: { page } })
  }

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        任务管理
      </Heading>

      <VStack gap={4} align="stretch" w="full">
        {isPending ? (
          <Flex justify="center" align="center" height="200px">
            <Text>加载中...</Text>
          </Flex>
        ) : isError ? (
          <Flex justify="center" align="center" height="200px">
            <Text color="red.500">加载失败: {error?.message}</Text>
          </Flex>
        ) : (
          <Box>
            {data?.data && data.data.length > 0 ? (
              <>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mb={6}>
                  {data.data.map((task) => (
                    <Card key={task.id} variant="outline">
                      <CardBody>
                        <VStack align="start" spacing={3}>
                          <Flex justify="space-between" w="full" align="start">
                            <Heading size="sm" noOfLines={2}>
                              {task.name}
                            </Heading>
                            <Flex align="center" gap={1}>
                              {getStatusIcon(task.status)}
                            </Flex>
                          </Flex>
                          
                          {task.description && (
                            <Text fontSize="sm" color="gray.600" noOfLines={3}>
                              {task.description}
                            </Text>
                          )}
                          
                          <Flex wrap="wrap" gap={2}>
                            <Badge colorScheme={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                            {task.priority && (
                              <Tag size="sm" colorScheme={getPriorityColor(task.priority)}>
                                <TagLabel>{task.priority}</TagLabel>
                              </Tag>
                            )}
                          </Flex>
                          
                          {task.assignee && (
                            <Flex align="center" gap={2}>
                              <FiUser size={14} />
                              <Text fontSize="sm" color="gray.600">
                                {task.assignee}
                              </Text>
                            </Flex>
                          )}
                          
                          <Flex justify="space-between" w="full" fontSize="xs" color="gray.500">
                            <Text>
                              创建: {task.created_at ? new Date(task.created_at).toLocaleDateString('zh-CN') : '-'}
                            </Text>
                            {task.updated_at && (
                              <Text>
                                更新: {new Date(task.updated_at).toLocaleDateString('zh-CN')}
                              </Text>
                            )}
                          </Flex>
                          
                          {task.metadata && Object.keys(task.metadata).length > 0 && (
                            <Box w="full">
                              <Text fontSize="xs" color="gray.500" mb={1}>元数据:</Text>
                              <Box 
                                bg="gray.50" 
                                p={2} 
                                borderRadius="md" 
                                fontSize="xs"
                                fontFamily="mono"
                                maxH="100px"
                                overflowY="auto"
                              >
                                <pre>{JSON.stringify(task.metadata, null, 2)}</pre>
                              </Box>
                            </Box>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
                
                <PaginationRoot
                  count={data.count}
                  pageSize={PER_PAGE}
                  page={page}
                  onPageChange={(e) => handlePageChange(e.page)}
                >
                  <PaginationPrevTrigger />
                  <PaginationItems />
                  <PaginationNextTrigger />
                </PaginationRoot>
              </>
            ) : (
              <Flex justify="center" align="center" height="200px">
                <VStack>
                  <FiClock size={48} color="gray" />
                  <Text color="gray.500">暂无任务</Text>
                  <Text fontSize="sm" color="gray.400">
                    当前没有同步的任务数据
                  </Text>
                </VStack>
              </Flex>
            )}
          </Box>
        )}
      </VStack>
    </Container>
  )
}

export default Tasks