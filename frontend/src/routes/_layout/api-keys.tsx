import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { FiKey } from "react-icons/fi"

import AddApiKey from "@/components/ApiKeys/AddApiKey"
import { ApiKeyActionsMenu } from "@/components/Common/ApiKeyActionsMenu"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import { ApiKeysService } from "@/client/ApiKeysService"

const apiKeysSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 10

function getApiKeysQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      ApiKeysService.getMyApiKeys({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["apiKeys", { page }],
  }
}

export const Route = createFileRoute("/_layout/api-keys")({ 
  component: ApiKeys,
  validateSearch: (search) => apiKeysSearchSchema.parse(search),
})

function ApiKeys() {
  const queryClient = useQueryClient()
  const navigate = useNavigate({ from: "/api-keys" })
  const { page } = Route.useSearch()
  const { data, isPending, isError, error } = useQuery({
    ...getApiKeysQueryOptions({ page }),
  })

  const handlePageChange = (page: number) => {
    navigate({ search: { page } })
  }

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        API Keys 管理
      </Heading>

      <VStack gap={4} align="stretch" w="full">
        <AddApiKey />
        
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
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>名称</Table.ColumnHeader>
                      <Table.ColumnHeader>Key</Table.ColumnHeader>
                      <Table.ColumnHeader>状态</Table.ColumnHeader>
                      <Table.ColumnHeader>创建时间</Table.ColumnHeader>
                      <Table.ColumnHeader>操作</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {data.data.map((apiKey) => (
                      <Table.Row key={apiKey.id}>
                        <Table.Cell>
                          <Flex align="center" gap={2}>
                            <FiKey />
                            <Text fontWeight="medium">{apiKey.name}</Text>
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontFamily="mono" fontSize="sm">
                            {apiKey.key ? `${apiKey.key.slice(0, 8)}...` : "隐藏"}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge colorScheme={apiKey.is_active ? "green" : "red"}>
                            {apiKey.is_active ? "活跃" : "禁用"}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm">
                            {new Date(apiKey.created_at).toLocaleDateString('zh-CN')}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <ApiKeyActionsMenu
                            apiKey={apiKey}
                            onEdit={() => {
                              // TODO: 实现编辑功能
                            }}
                            onDelete={() => {
                              // TODO: 实现删除功能
                            }}
                          />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
                
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
                  <FiKey size={48} color="gray" />
                  <Text color="gray.500">暂无 API Keys</Text>
                  <Text fontSize="sm" color="gray.400">
                    点击上方按钮创建您的第一个 API Key
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

export default ApiKeys