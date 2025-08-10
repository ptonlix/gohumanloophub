import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { FiBriefcase, FiHome, FiSettings, FiUsers, FiKey, FiCheckSquare, FiRefreshCw } from "react-icons/fi"
import type { IconType } from "react-icons/lib"
import { useTranslation } from "react-i18next"

import type { UserPublic } from "@/client"

const getItems = (t: any) => [
  { icon: FiHome, title: t('navigation.dashboard'), path: "/" },
  { icon: FiCheckSquare, title: t('navigation.tasks'), path: "/tasks" },
  { icon: FiRefreshCw, title: t('navigation.humanLoop'), path: "/humanloop" },
  { icon: FiKey, title: t('navigation.apiKeys'), path: "/api-keys" },
  { icon: FiSettings, title: t('navigation.userSettings'), path: "/settings" },
]

interface SidebarItemsProps {
  onClose?: () => void
}

interface Item {
  icon: IconType
  title: string
  path: string
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  
  const items = getItems(t)
  const finalItems: Item[] = currentUser?.is_superuser
    ? [...items, { icon: FiUsers, title: t('navigation.admin'), path: "/admin" }]
    : items

  const listItems = finalItems.map(({ icon, title, path }) => (
    <RouterLink key={title} to={path} onClick={onClose}>
      <Flex
        gap={4}
        px={4}
        py={2}
        _hover={{
          background: "ui.muted",
          color: "ui.mainHover",
        }}
        alignItems="center"
        fontSize="sm"
        color="ui.secondary"
        transition="all 0.2s"
        borderRadius="md"
        mx={2}
      >
        <Icon as={icon} alignSelf="center" />
        <Text ml={2}>{title}</Text>
      </Flex>
    </RouterLink>
  ))

  return (
    <>
      <Text fontSize="sm" px={4} py={3} fontWeight="600" color="ui.main" letterSpacing="wide" textTransform="uppercase">
        {t('common.menu')}
      </Text>
      <Box>{listItems}</Box>
    </>
  )
}

export default SidebarItems
