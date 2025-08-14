import {
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Badge,
  SimpleGrid,
  Stat,
  Table,
  EmptyState,
  Spinner,
  Box,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import {
  FiUsers,
  FiMessageCircle,
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
  FiDatabase,
  FiGlobe,
} from "react-icons/fi"

import { OpenAPI } from "../../client"
import useAuth from "@/hooks/useAuth"

interface DashboardData {
  tasks: {
    total: number
    total_conversations: number
    total_requests: number
    recent: Array<{
      task_id: string
      created_at: string
      conversations_count: number
      total_requests: number
    }>
  }
  human_loop_requests: {
    total: number
    by_status: Record<string, number>
    by_type: Record<string, number>
    by_platform: Record<string, number>
    recent: Array<{
      id: string
      task_id: string
      conversation_id: string
      loop_type: string
      platform: string
      status: string
      created_at: string
      responded_at: string | null
    }>
  }
  summary: {
    total_tasks: number
    total_users: number
    total_human_loop_requests: number
    pending_requests: number
    completed_requests: number
  }
}

function getDashboardQueryOptions(isSuperuser: boolean = false) {
  const endpoint = isSuperuser
    ? `${OpenAPI.BASE}/api/v1/humanloop/admin/dashboard/stats`
    : `${OpenAPI.BASE}/api/v1/humanloop/admin/dashboard/user-stats`

  return {
    queryKey: ["dashboard", isSuperuser ? "admin" : "user"],
    queryFn: async (): Promise<{ success: boolean; data: DashboardData }> => {
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "orange"
    case "completed":
      return "green"
    case "failed":
      return "red"
    case "in_progress":
      return "blue"
    default:
      return "gray"
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return FiClock
    case "completed":
      return FiCheckCircle
    case "failed":
      return FiAlertCircle
    case "in_progress":
      return FiActivity
    default:
      return FiActivity
  }
}

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case "web":
      return FiGlobe
    default:
      return FiDatabase
  }
}

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function StatsCards({ data }: { data: DashboardData }) {
  const { t } = useTranslation()

  const stats = [
    {
      label: t("dashboard.totalTasks"),
      value: data.tasks.total,
      icon: FiDatabase,
      color: "blue",
    },
    {
      label: t("dashboard.totalConversations"),
      value: data.tasks.total_conversations,
      icon: FiMessageCircle,
      color: "green",
    },
    {
      label: t("dashboard.totalRequests"),
      value: data.tasks.total_requests,
      icon: FiActivity,
      color: "purple",
    },
    {
      label: t("dashboard.totalUsers"),
      value: data.summary.total_users,
      icon: FiUsers,
      color: "orange",
    },
  ]

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
      {stats.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <Card.Root key={index}>
            <Card.Body>
              <Stat.Root>
                <HStack justify="space-between">
                  <VStack align="start" gap={1}>
                    <Stat.Label fontSize="sm" color="gray.600">
                      {stat.label}
                    </Stat.Label>
                    <Stat.ValueText fontSize="2xl" fontWeight="bold">
                      {stat.value.toLocaleString()}
                    </Stat.ValueText>
                  </VStack>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg={`${stat.color}.100`}
                    color={`${stat.color}.600`}
                  >
                    <IconComponent size={24} />
                  </Box>
                </HStack>
              </Stat.Root>
            </Card.Body>
          </Card.Root>
        )
      })}
    </SimpleGrid>
  )
}

function HumanLoopStatsCards({ data }: { data: DashboardData }) {
  const { t } = useTranslation()

  const humanLoopStats = [
    {
      label: t("dashboard.totalHumanLoopRequests"),
      value: data.human_loop_requests.total,
      icon: FiUsers,
      color: "blue",
    },
    {
      label: t("dashboard.pendingRequests"),
      value: data.summary.pending_requests,
      icon: FiClock,
      color: "orange",
    },
    {
      label: t("dashboard.completedRequests"),
      value: data.summary.completed_requests,
      icon: FiCheckCircle,
      color: "green",
    },
    {
      label: t("dashboard.successRate"),
      value: data.human_loop_requests.total > 0
        ? `${Math.round((data.summary.completed_requests / data.human_loop_requests.total) * 100)}%`
        : "0%",
      icon: FiTrendingUp,
      color: "purple",
    },
  ]

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
      {humanLoopStats.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <Card.Root key={index}>
            <Card.Body>
              <Stat.Root>
                <HStack justify="space-between">
                  <VStack align="start" gap={1}>
                    <Stat.Label fontSize="sm" color="gray.600">
                      {stat.label}
                    </Stat.Label>
                    <Stat.ValueText fontSize="2xl" fontWeight="bold">
                      {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                    </Stat.ValueText>
                  </VStack>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg={`${stat.color}.100`}
                    color={`${stat.color}.600`}
                  >
                    <IconComponent size={24} />
                  </Box>
                </HStack>
              </Stat.Root>
            </Card.Body>
          </Card.Root>
        )
      })}
    </SimpleGrid>
  )
}

function RecentTasksTable({ tasks }: { tasks: DashboardData["tasks"]["recent"] }) {
  const { t } = useTranslation()

  if (!tasks || tasks.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiDatabase />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>{t("dashboard.noRecentTasks")}</EmptyState.Title>
            <EmptyState.Description>
              {t("dashboard.noRecentTasksDescription")}
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <Table.Root size="sm">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>{t("dashboard.taskId")}</Table.ColumnHeader>
          <Table.ColumnHeader>{t("dashboard.conversations")}</Table.ColumnHeader>
          <Table.ColumnHeader>{t("dashboard.requests")}</Table.ColumnHeader>
          <Table.ColumnHeader>{t("dashboard.createdAt")}</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {tasks.map((task) => (
          <Table.Row key={task.task_id}>
            <Table.Cell>
              <Link
                to="/taskdetail/$taskId"
                params={{ taskId: task.task_id }}
                style={{ color: "blue.500", textDecoration: "underline" }}
                title={task.task_id}
              >
                {task.task_id.slice(0, 8)}...
              </Link>
            </Table.Cell>
            <Table.Cell>{task.conversations_count}</Table.Cell>
            <Table.Cell>{task.total_requests}</Table.Cell>
            <Table.Cell>
              {new Date(task.created_at).toLocaleDateString()}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}

function RecentHumanLoopTable({ requests }: { requests: DashboardData["human_loop_requests"]["recent"] }) {
  const { t } = useTranslation()

  if (!requests || requests.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiUsers />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>{t("dashboard.noRecentRequests")}</EmptyState.Title>
            <EmptyState.Description>
              {t("dashboard.noRecentRequestsDescription")}
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <Table.Root size="sm">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>{t("dashboard.type")}</Table.ColumnHeader>
          <Table.ColumnHeader>{t("dashboard.platform")}</Table.ColumnHeader>
          <Table.ColumnHeader>{t("dashboard.status")}</Table.ColumnHeader>
          <Table.ColumnHeader>{t("dashboard.createdAt")}</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {requests.map((request) => {
          const StatusIcon = getStatusIcon(request.status)
          const PlatformIcon = getPlatformIcon(request.platform)
          return (
            <Table.Row key={request.id}>
              <Table.Cell>
                <HStack gap={2}>
                  <Text fontSize="sm">{request.loop_type}</Text>
                </HStack>
              </Table.Cell>
              <Table.Cell>
                <HStack gap={2}>
                  <PlatformIcon size={16} />
                  <Text fontSize="sm">{request.platform}</Text>
                </HStack>
              </Table.Cell>
              <Table.Cell>
                <Badge colorScheme={getStatusColor(request.status)} size="sm">
                  <HStack gap={1}>
                    <StatusIcon size={12} />
                    <Text>{request.status}</Text>
                  </HStack>
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Text fontSize="sm">
                  {new Date(request.created_at).toLocaleDateString()}
                </Text>
              </Table.Cell>
            </Table.Row>
          )
        })}
      </Table.Body>
    </Table.Root>
  )
}

function Dashboard() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const { data, isLoading, error } = useQuery(getDashboardQueryOptions(currentUser?.is_superuser || false))

  if (isLoading) {
    return (
      <Container maxW="full" py={8}>
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" />
        </Flex>
      </Container>
    )
  }

  if (error || !data?.success) {
    return (
      <Container maxW="full" py={8}>
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiAlertCircle />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>{t("dashboard.loadError")}</EmptyState.Title>
              <EmptyState.Description>
                {t("dashboard.loadErrorDescription")}
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      </Container>
    )
  }

  return (
    <Container maxW="full" py={8}>
      <VStack align="stretch" gap={8}>
        <Box>
          <Heading size="xl" mb={2}>
            {t('dashboard.welcome', { name: currentUser?.full_name || currentUser?.email })}
          </Heading>
          <Text color="gray.600">{t("dashboard.description")}</Text>
        </Box>

        {/* 主要统计卡片 */}
        <StatsCards data={data.data} />

        {/* 人机协同请求统计卡片 */}
        <Box>
          <Heading size="lg" mb={4}>
            {t("dashboard.humanLoopStats")}
          </Heading>
          <HumanLoopStatsCards data={data.data} />
        </Box>

        {/* 最近任务和请求表格 */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>
          <Card.Root>
            <Card.Header>
              <Heading size="md">{t("dashboard.recentTasks")}</Heading>
            </Card.Header>
            <Card.Body>
              <RecentTasksTable tasks={data.data.tasks.recent} />
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading size="md">{t("dashboard.recentHumanLoopRequests")}</Heading>
            </Card.Header>
            <Card.Body>
              <RecentHumanLoopTable requests={data.data.human_loop_requests.recent} />
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      </VStack>
    </Container>
  )
}
