import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Stat,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { zhCN, enUS } from "date-fns/locale"

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
  platform: z.enum(['GoHumanLoop', 'wework', 'feishu', 'other']).optional(),
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
    pending: 'yellow',
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

function StatsCards() {
  const { t } = useTranslation()
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
        <Stat.Label>{t('humanLoop.totalRequests')}</Stat.Label>
        <Stat.ValueText>{stats.total}</Stat.ValueText>
      </Stat.Root>
      <Stat.Root>
        <Stat.Label>{t('humanLoop.pending')}</Stat.Label>
        <Stat.ValueText color="orange.500">{stats.by_status.pending}</Stat.ValueText>
      </Stat.Root>
      <Stat.Root>
        <Stat.Label>{t('humanLoop.inProgress')}</Stat.Label>
        <Stat.ValueText color="blue.500">{stats.by_status.inprogress}</Stat.ValueText>
      </Stat.Root>
      <Stat.Root>
        <Stat.Label>{t('humanLoop.completed')}</Stat.Label>
        <Stat.ValueText color="green.500">{stats.by_status.completed + stats.by_status.approved}</Stat.ValueText>
      </Stat.Root>
    </Grid>
  )
}

// 注册日期选择器的语言包
registerLocale('zh', zhCN)
registerLocale('en', enUS)

function FilterBar() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
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
        <Text fontSize="sm" mb={1}>{t('humanLoop.loopType')}</Text>
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
          <option value="">{t('humanLoop.allTypes')}</option>
          <option value="conversation">{t('humanLoop.conversationMode')}</option>
          <option value="approval">{t('humanLoop.approvalMode')}</option>
          <option value="information">{t('humanLoop.informationGathering')}</option>
        </select>
      </Box>
      <Box>
        <Text fontSize="sm" mb={1}>{t('humanLoop.status')}</Text>
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
          <option value="">{t('humanLoop.allStatuses')}</option>
          <option value="pending">{t('humanLoop.pending')}</option>
          <option value="inprogress">{t('humanLoop.inProgress')}</option>
          <option value="completed">{t('humanLoop.completed')}</option>
          <option value="approved">{t('humanLoop.approved')}</option>
          <option value="rejected">{t('humanLoop.rejected')}</option>
          <option value="cancelled">{t('humanLoop.cancelled')}</option>
          <option value="error">{t('humanLoop.error')}</option>
          <option value="expired">{t('humanLoop.expired')}</option>
        </select>
      </Box>
      <Box>
        <Text fontSize="sm" mb={1}>{t('humanLoop.platform')}</Text>
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
          <option value="">{t('humanLoop.allPlatforms')}</option>
          <option value="GoHumanLoop">{t('humanLoop.goHumanLoop')}</option>
          <option value="wework">{t('humanLoop.wework')}</option>
          <option value="feishu">{t('humanLoop.feishu')}</option>
          <option value="other">{t('humanLoop.other')}</option>
        </select>
      </Box>
      <Box width="160px">
         <Text fontSize="sm" mb={1}>{t('humanLoop.startDate')}</Text>
         <DatePicker
           selected={created_at_start ? new Date(created_at_start) : null}
           onChange={(date) => updateDateFilter('created_at_start', date ? date.toISOString().split('T')[0] : '')}
           placeholderText={t('humanLoop.startDatePlaceholder')}
           dateFormat="yyyy-MM-dd"
           className="chakra-input css-4plu0y"
           locale={i18n.language === 'zh' ? 'zh' : 'en'}
         />
       </Box>
       <Box width="160px">
         <Text fontSize="sm" mb={1}>{t('humanLoop.endDate')}</Text>
         <DatePicker
           selected={created_at_end ? new Date(created_at_end) : null}
           onChange={(date) => updateDateFilter('created_at_end', date ? date.toISOString().split('T')[0] : '')}
           placeholderText={t('humanLoop.endDatePlaceholder')}
           dateFormat="yyyy-MM-dd"
           className="chakra-input css-4plu0y"
           locale={i18n.language === 'zh' ? 'zh' : 'en'}
         />
       </Box>
    </HStack>
  )
}

function RequestsTable() {
  const { t } = useTranslation()
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
            <Table.ColumnHeader>{t('humanLoop.requestId')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('humanLoop.type')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('humanLoop.platform')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('humanLoop.status')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('humanLoop.createdAt')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('humanLoop.actions')}</Table.ColumnHeader>
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
            <Table.ColumnHeader>{t('humanLoop.requestId')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('humanLoop.type')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('humanLoop.platform')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('humanLoop.status')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('humanLoop.messageContent')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('humanLoop.createdAt')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('humanLoop.actions')}</Table.ColumnHeader>
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
                  {request.loop_type === 'conversation' && t('humanLoop.conversationMode')}
                  {request.loop_type === 'approval' && t('humanLoop.approvalMode')}
                  {request.loop_type === 'information' && t('humanLoop.informationGathering')}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Badge colorScheme={getPlatformColor(request.platform)}>
                  {request.platform === 'GoHumanLoop' && t('humanLoop.goHumanLoop')}
                  {request.platform === 'wework' && t('humanLoop.wework')}
                  {request.platform === 'feishu' && t('humanLoop.feishu')}
                  {request.platform === 'other' && t('humanLoop.other')}
                </Badge>
              </Table.Cell>
              <Table.Cell>
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
                    {t('humanLoop.view')}
                  </Button>
                  {['pending', 'inprogress'].includes(request.status) && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleProcessRequest(request)}
                    >
                      {t('humanLoop.process')}
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
  const { t } = useTranslation()
  return (
    <Container maxW="full">
      <VStack align="stretch" gap={6}>
        <Heading size="lg" pt={4}>
          {t('humanLoop.title')}
        </Heading>

        <StatsCards />
        <FilterBar />
        <RequestsTable />
      </VStack>
    </Container>
  )
}
