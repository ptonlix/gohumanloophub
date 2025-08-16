import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  IconButton,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"
import { FiKey, FiCopy } from "react-icons/fi"
import { useTranslation } from "react-i18next"

import AddApiKey from "@/components/ApiKeys/AddApiKey"
import EditApiKey from "@/components/ApiKeys/EditApiKey"
import DeleteApiKey from "@/components/ApiKeys/DeleteApiKey"
import { ApiKeyActionsMenu } from "@/components/Common/ApiKeyActionsMenu"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import { type ApiKeyPublic, ApiKeysService } from "@/client/ApiKeysService"
import useCustomToast from "@/hooks/useCustomToast"

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
  const { t } = useTranslation()
  const navigate = useNavigate({ from: "/api-keys" })
  const { page } = Route.useSearch()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [editingApiKey, setEditingApiKey] = useState<ApiKeyPublic | null>(null)
  const [deletingApiKey, setDeletingApiKey] = useState<ApiKeyPublic | null>(null)
  const { data, isPending, isError, error } = useQuery({
    ...getApiKeysQueryOptions({ page }),
  })

  const handlePageChange = (page: number) => {
    navigate({ search: { page } })
  }

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      showSuccessToast("API Key copied to clipboard!")
    } catch (err) {
      showErrorToast("Failed to copy API Key")
    }
  }

  const handleEdit = (apiKey: ApiKeyPublic) => {
    setEditingApiKey(apiKey)
  }

  const handleDelete = (apiKey: ApiKeyPublic) => {
    setDeletingApiKey(apiKey)
  }

  const handleCloseEdit = () => {
    setEditingApiKey(null)
  }

  const handleCloseDelete = () => {
    setDeletingApiKey(null)
  }

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        {t("apiKeys.title")}
      </Heading>

      <VStack gap={4} align="stretch" w="full">
        <AddApiKey />

        {isPending ? (
          <Flex justify="center" align="center" height="200px">
            <Text>{t("apiKeys.loading")}</Text>
          </Flex>
        ) : isError ? (
          <Flex justify="center" align="center" height="200px">
            <Text color="red.500">{t("apiKeys.loadError")} {error?.message}</Text>
          </Flex>
        ) : (
          <Box>
            {data?.data && data.data.length > 0 ? (
              <>
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{t("apiKeys.name")}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t("apiKeys.key")}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t("apiKeys.status")}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t("apiKeys.createdAt")}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t("apiKeys.actions")}</Table.ColumnHeader>
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
                          <Flex align="center" gap={2}>
                            <Text fontFamily="mono" fontSize="sm">
                              {apiKey.key ? `${apiKey.key.slice(0, 8)}...` : t("apiKeys.hidden")}
                            </Text>
                            {apiKey.key && (
                              <IconButton
                                aria-label="Copy API Key"
                                size="xs"
                                variant="ghost"
                                onClick={() => handleCopyKey(apiKey.key!)}
                              >
                                <FiCopy />
                              </IconButton>
                            )}
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge colorScheme={apiKey.is_active ? "green" : "red"}>
                            {apiKey.is_active ? t("apiKeys.active") : t("apiKeys.disabled")}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm">
                            {new Date(apiKey.created_at).toLocaleDateString('zh-CN')}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <ApiKeyActionsMenu
                            onEdit={() => handleEdit(apiKey)}
                            onDelete={() => handleDelete(apiKey)}
                          />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>

                <Flex justify="flex-end" mt={4}>
                  <PaginationRoot
                    count={data.count}
                    pageSize={PER_PAGE}
                    page={page}
                    onPageChange={(e) => handlePageChange(e.page)}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <PaginationPrevTrigger />
                    <PaginationItems />
                    <PaginationNextTrigger />
                  </PaginationRoot>
                </Flex>
              </>
            ) : (
              <Flex justify="center" align="center" height="200px">
                <VStack>
                  <FiKey size={48} color="gray" />
                  <Text color="gray.500">{t("apiKeys.noApiKeys")}</Text>
                  <Text fontSize="sm" color="gray.400">
                    {t("apiKeys.createFirstKey")}
                  </Text>
                </VStack>
              </Flex>
            )}
          </Box>
        )}
      </VStack>

      {/* 编辑对话框 */}
      {editingApiKey && (
        <EditApiKey
          apiKey={editingApiKey}
          isOpen={!!editingApiKey}
          onClose={handleCloseEdit}
        />
      )}

      {/* 删除对话框 */}
      {deletingApiKey && (
        <DeleteApiKey
          apiKey={deletingApiKey}
          isOpen={!!deletingApiKey}
          onClose={handleCloseDelete}
        />
      )}
    </Container>
  )
}

export default ApiKeys
