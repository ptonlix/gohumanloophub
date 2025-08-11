import {
  Container,
  Flex,
  Heading,
  Table,
  Text,
  VStack,
  IconButton,
  EmptyState,
  HStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { FiCheckCircle, FiClock, FiAlertCircle, FiSearch, FiMessageCircle, FiActivity, FiGlobe } from "react-icons/fi"
import { BsThreeDotsVertical } from "react-icons/bs"
import { useTranslation } from "react-i18next"

import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import { MenuContent, MenuRoot, MenuTrigger } from "@/components/ui/menu"
import { TasksService } from "@/client/TasksService"
import TaskDetail from "@/components/Tasks/TaskDetail"
import DeleteTask from "@/components/Tasks/DeleteTask"

const tasksSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 10

function getTasksQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      TasksService.getUserTasks({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["tasks", { page }],
    placeholderData: (prevData: any) => prevData,
  }
}

// 获取任务整体状态（基于所有请求的状态）
function getTaskOverallStatus(conversations: any[]) {
  if (!conversations || conversations.length === 0) {
    return { status: 'pending', icon: <FiClock color="gray" />, color: 'gray' }
  }

  let hasError = false
  let hasRunning = false
  let totalRequests = 0
  let completedRequests = 0

  conversations.forEach(conv => {
    if (conv.requests) {
      conv.requests.forEach((req: any) => {
        totalRequests++
        if (req.status === 'completed' || req.status === 'done') {
          completedRequests++
        } else if (req.status === 'error' || req.status === 'failed') {
          hasError = true
        } else if (req.status === 'running' || req.status === 'in_progress') {
          hasRunning = true
        }
      })
    }
  })

  if (hasError) {
    return { status: 'error', icon: <FiAlertCircle color="red" />, color: 'red' }
  }
  if (hasRunning) {
    return { status: 'running', icon: <FiActivity color="blue" />, color: 'blue' }
  }
  if (completedRequests === totalRequests && totalRequests > 0) {
    return { status: 'completed', icon: <FiCheckCircle color="green" />, color: 'green' }
  }

  return { status: 'pending', icon: <FiClock color="gray" />, color: 'gray' }
}

// 获取任务统计信息
function getTaskStats(conversations: any[]) {
  let totalConversations = conversations?.length || 0
  let totalRequests = 0
  let loopTypes = new Set()

  conversations?.forEach(conv => {
    if (conv.requests) {
      totalRequests += conv.requests.length
      conv.requests.forEach((req: any) => {
        if (req.loop_type) {
          loopTypes.add(req.loop_type)
        }
      })
    }
  })

  return {
    totalConversations,
    totalRequests,
    loopTypes: Array.from(loopTypes)
  }
}

interface TaskActionsMenuProps {
  task: any
}

const TaskActionsMenu = ({ task }: TaskActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <TaskDetail task={task} />
        <DeleteTask taskId={task.task_id} />
      </MenuContent>
    </MenuRoot>
  )
}

export const Route = createFileRoute("/_layout/tasks")({
  component: Tasks,
  validateSearch: (search) => tasksSearchSchema.parse(search),
})

function TasksTable() {
  const { t } = useTranslation()
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getTasksQueryOptions({ page }),
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    })

  const tasks = data?.data ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return (
      <Container maxW="7xl" py={8}>
        <Text>{t("tasks.loading")}</Text>
      </Container>
    )
  }

  if (tasks.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>{t("tasks.noData")}</EmptyState.Title>
            <EmptyState.Description>
              {t("tasks.noDataDescription")}
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <>
      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="md">{t("tasks.taskId")}</Table.ColumnHeader>
            <Table.ColumnHeader w="md">{t("tasks.conversationStats")}</Table.ColumnHeader>
            <Table.ColumnHeader w="md">{t("tasks.requestStats")}</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">{t("tasks.dataSource")}</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">{t("tasks.dataCollectionTime")}</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">{t("tasks.createdAt")}</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">{t("tasks.updatedAt")}</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">{t("tasks.actions")}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {tasks?.map((task: any) => {
            const stats = getTaskStats(task.conversations)

            return (
              <Table.Row key={task.task_id} opacity={isPlaceholderData ? 0.5 : 1}>
                <Table.Cell>
                  <VStack align="start" gap={1}>
                    <Text fontWeight="medium" fontSize="sm">
                      {task.task_id}
                    </Text>
                    {task.user_id && (
                      <Text fontSize="xs" color="gray.500">
                        {t("tasks.user")}: {task.user_id.slice(-8)}
                      </Text>
                    )}
                  </VStack>
                </Table.Cell>
                <Table.Cell>
                  <HStack gap={2}>
                    <FiMessageCircle size={14} color="gray" />
                    <Text fontSize="sm">{stats.totalConversations}</Text>
                  </HStack>
                </Table.Cell>
                <Table.Cell>
                  <HStack gap={2}>
                    <FiActivity size={14} color="gray" />
                    <Text fontSize="sm">{stats.totalRequests}</Text>
                  </HStack>
                </Table.Cell>
                <Table.Cell>
                  <HStack gap={1}>
                    <FiGlobe size={12} color="gray" />
                    <Text fontSize="xs" color="gray.600">
                      {task.metadata?.source || '-'}
                    </Text>
                  </HStack>
                </Table.Cell>
                <Table.Cell>
                  <Text fontSize="xs" color="gray.600">
                    {task.timestamp
                      ? new Date(task.timestamp).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })
                      : '-'}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text fontSize="xs" color="gray.600">
                    {task.created_at
                      ? new Date(task.created_at).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })
                      : '-'}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text fontSize="xs" color="gray.600">
                    {task.updated_at
                      ? new Date(task.updated_at).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })
                      : '-'}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <TaskActionsMenu task={task} />
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table.Root>
      <Flex justifyContent="flex-end" mt={4}>
        <PaginationRoot
          count={count}
          pageSize={PER_PAGE}
          onPageChange={({ page }) => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </Flex>
        </PaginationRoot>
      </Flex>
    </>
  )
}

function Tasks() {
  const { t } = useTranslation()
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        {t("tasks.title")}
      </Heading>
      <TasksTable />
    </Container>
  )
}

export default Tasks
