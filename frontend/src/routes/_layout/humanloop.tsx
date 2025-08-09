import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Stat,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"

import { HumanLoopService, type HumanLoopRequest } from "@/client"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import { SkeletonText } from "@/components/ui/skeleton.tsx"
import HumanLoopRequestDetail from "@/components/HumanLoop/HumanLoopRequestDetail"
import ProcessRequestModal from "@/components/HumanLoop/ProcessRequestModal"

const humanLoopSearchSchema = z.object({
  page: z.number().catch(1),
  loop_type: z.enum(['conversation', 'approval', 'information']).optional(),
  status: z.enum(['pending', 'inprogress', 'completed', 'cancelled', 'approved', 'rejected', 'error', 'expired']).optional(),
  platform: z.enum(['wechat', 'feishu', 'other']).optional(),
  created_at_start: z.string().optional(),
  created_at_end: z.string().optional(),
})

const PER_PAGE = 10

function getHumanLoopRequestsQueryOptions({
  page,
  loop_type,
  status,
  platform,
  created_at_start,
  created_at_end,
}: {
  page: number
  loop_type?: string
  status?: string
  platform?: string
  created_at_start?: string
  created_at_end?: string
}) {
  return {
    queryFn: () =>
      HumanLoopService.getRequests({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        loop_type: loop_type as any,
        status: status as any,
        platform: platform as any,
        created_at_start,
        created_at_end,
      }),
    queryKey: ['humanloop-requests', { page, loop_type, status, platform, created_at_start, created_at_end }],
  }
}

function getStatsQueryOptions() {
  return {
    queryFn: () => HumanLoopService.getStats(),
    queryKey: ['humanloop-stats'],
    refetchInterval: 30000, // 每30秒刷新一次统计数据
  }
}

export const Route = createFileRoute("/_layout/humanloop")({
  component: HumanLoop,
  validateSearch: (search) => humanLoopSearchSchema.parse(search),
})

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

function StatsCards() {
  const { data: statsData, isLoading } = useQuery(getStatsQueryOptions())

  if (isLoading) {
    return (
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
        {[...Array(4)].map((_, index) => (
          <Box key={index} p={4} borderWidth={1} borderRadius="md">
            <SkeletonText noOfLines={2} />
          </Box>
        ))}
      </Grid>
    )
  }

  const stats = statsData?.data
  if (!stats) return null

  return (
    <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
      <Stat.Root>
        <Stat.Label>总请求数</Stat.Label>
        <Stat.ValueText>{stats.total}</Stat.ValueText>
      </Stat.Root>
      <Stat.Root>
        <Stat.Label>待处理</Stat.Label>
        <Stat.ValueText color="orange.500">{stats.by_status.pending}</Stat.ValueText>
      </Stat.Root>
      <Stat.Root>
        <Stat.Label>处理中</Stat.Label>
        <Stat.ValueText color="blue.500">{stats.by_status.inprogress}</Stat.ValueText>
      </Stat.Root>
      <Stat.Root>
        <Stat.Label>已完成</Stat.Label>
        <Stat.ValueText color="green.500">{stats.by_status.completed + stats.by_status.approved}</Stat.ValueText>
      </Stat.Root>
    </Grid>
  )
}

function FilterBar() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { loop_type, status, platform, created_at_start, created_at_end } = Route.useSearch()

  const updateFilter = (key: string, value: string) => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        [key]: value || undefined,
        page: 1, // 重置到第一页
      }),
    })
  }

  const updateDateFilter = (key: string, value: string) => {
    navigate({
      search: (prev: any) => ({ ...prev, [key]: value || undefined, page: 1 }),
    })
  }

  return (
    <HStack gap={4} mb={6}>
      <Box>
        <Text fontSize="sm" mb={1}>循环类型</Text>
        <select
          value={loop_type || ''}
          onChange={(e) => updateFilter('loop_type', e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            width: '150px',
            backgroundColor: 'white'
          }}
        >
          <option value="">全部类型</option>
          <option value="conversation">对话模式</option>
          <option value="approval">审批模式</option>
          <option value="information">信息获取</option>
        </select>
      </Box>
      <Box>
        <Text fontSize="sm" mb={1}>状态</Text>
        <select
          value={status || ''}
          onChange={(e) => updateFilter('status', e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            width: '150px',
            backgroundColor: 'white'
          }}
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="inprogress">处理中</option>
          <option value="completed">已完成</option>
          <option value="approved">已审批</option>
          <option value="rejected">已拒绝</option>
          <option value="cancelled">已取消</option>
          <option value="error">错误</option>
          <option value="expired">已过期</option>
        </select>
      </Box>
      <Box>
        <Text fontSize="sm" mb={1}>平台</Text>
        <select
          value={platform || ''}
          onChange={(e) => updateFilter('platform', e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            width: '150px',
            backgroundColor: 'white'
          }}
        >
          <option value="">全部平台</option>
          <option value="GoHumanLoop">GoHumanLoop</option>
          <option value="wework">企业微信</option>
          <option value="feishu">飞书</option>
          <option value="other">其他</option>
        </select>
      </Box>
      <Box>
         <Text fontSize="sm" mb={1}>开始日期</Text>
         <Input
           type="date"
           value={created_at_start || ''}
           onChange={(e) => updateDateFilter('created_at_start', e.target.value)}
           size="sm"
           width="160px"
         />
       </Box>
       <Box>
         <Text fontSize="sm" mb={1}>结束日期</Text>
         <Input
           type="date"
           value={created_at_end || ''}
           onChange={(e) => updateDateFilter('created_at_end', e.target.value)}
           size="sm"
           width="160px"
         />
       </Box>
    </HStack>
  )
}

function RequestsTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page, loop_type, status, platform, created_at_start, created_at_end } = Route.useSearch()
  const [selectedRequest, setSelectedRequest] = useState<HumanLoopRequest | null>(null)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [processRequest, setProcessRequest] = useState<HumanLoopRequest | null>(null)

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getHumanLoopRequestsQueryOptions({ page, loop_type, status, platform, created_at_start, created_at_end }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: any) => ({ ...prev, page }),
    })

  const requests = data?.data ?? []
  const count = data?.count ?? 0

  const handleViewDetail = (request: HumanLoopRequest) => {
    setSelectedRequest(request)
  }

  const handleProcessRequest = (request: HumanLoopRequest) => {
    setProcessRequest(request)
    setShowProcessModal(true)
  }

  if (isLoading) {
    return (
      <Table.Root size={{ base: 'sm', md: 'md' }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>请求ID</Table.ColumnHeader>
            <Table.ColumnHeader>类型</Table.ColumnHeader>
            <Table.ColumnHeader>平台</Table.ColumnHeader>
            <Table.ColumnHeader>状态</Table.ColumnHeader>
            <Table.ColumnHeader>创建时间</Table.ColumnHeader>
            <Table.ColumnHeader>操作</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {[...Array(PER_PAGE)].map((_, index) => (
            <Table.Row key={index}>
              <Table.Cell><SkeletonText noOfLines={1} /></Table.Cell>
              <Table.Cell><SkeletonText noOfLines={1} /></Table.Cell>
              <Table.Cell><SkeletonText noOfLines={1} /></Table.Cell>
              <Table.Cell><SkeletonText noOfLines={1} /></Table.Cell>
              <Table.Cell><SkeletonText noOfLines={1} /></Table.Cell>
              <Table.Cell><SkeletonText noOfLines={1} /></Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    )
  }

  return (
    <>
      <Table.Root size={{ base: 'sm', md: 'md' }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>请求ID</Table.ColumnHeader>
            <Table.ColumnHeader>类型</Table.ColumnHeader>
            <Table.ColumnHeader>平台</Table.ColumnHeader>
            <Table.ColumnHeader>状态</Table.ColumnHeader>
            <Table.ColumnHeader>消息内容</Table.ColumnHeader>
            <Table.ColumnHeader>创建时间</Table.ColumnHeader>
            <Table.ColumnHeader>操作</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {requests.map((request) => (
            <Table.Row key={request.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell>
                <Text fontSize="sm" fontFamily="mono">
                  {request.request_id.slice(0, 8)}...
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Badge colorScheme={getLoopTypeColor(request.loop_type)}>
                  {request.loop_type === 'conversation' && '对话模式'}
                  {request.loop_type === 'approval' && '审批模式'}
                  {request.loop_type === 'information' && '信息获取'}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Badge colorScheme={getPlatformColor(request.platform)}>
                  {request.platform === 'GoHumanLoop' && 'GoHumanLoop平台'}
                  {request.platform === 'wework' && '企业微信'}
                  {request.platform === 'feishu' && '飞书'}
                  {request.platform === 'other' && '其他'}
                </Badge>
              </Table.Cell>
              <Table.Cell>
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
              </Table.Cell>
              <Table.Cell maxW="200px">
                <Text 
                  truncate 
                  whiteSpace="pre-wrap"
                  maxH="60px"
                  overflow="hidden"
                  lineHeight="1.4"
                >
                  {request.context.message}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Text fontSize="sm">
                  {new Date(request.created_at).toLocaleString('zh-CN')}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <HStack gap={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetail(request)}
                  >
                    查看
                  </Button>
                  {['pending', 'inprogress'].includes(request.status) && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleProcessRequest(request)}
                    >
                      处理
                    </Button>
                  )}
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
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

      {/* 请求详情模态框 */}
      {selectedRequest && (
        <HumanLoopRequestDetail
          request={selectedRequest}
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}

      {/* 处理请求模态框 */}
      {processRequest && (
        <ProcessRequestModal
          request={processRequest}
          isOpen={showProcessModal}
          onClose={() => {
            setShowProcessModal(false)
            setProcessRequest(null)
          }}
        />
      )}
    </>
  )
}

function HumanLoop() {
  return (
    <Container maxW="full">
      <VStack align="stretch" gap={6}>
        <Heading size="lg" pt={4}>
          人机协同管理
        </Heading>

        <StatsCards />
        <FilterBar />
        <RequestsTable />
      </VStack>
    </Container>
  )
}