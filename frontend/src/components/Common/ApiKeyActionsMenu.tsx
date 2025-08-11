import { IconButton } from "@chakra-ui/react"
import { FiEdit, FiMoreHorizontal, FiTrash2 } from "react-icons/fi"
import { useTranslation } from "react-i18next"

import type { ApiKeyPublic } from "@/client/ApiKeysService"
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu"

interface ApiKeyActionsMenuProps {
  apiKey: ApiKeyPublic
  onEdit: () => void
  onDelete: () => void
}

export const ApiKeyActionsMenu = ({
  apiKey,
  onEdit,
  onDelete,
}: ApiKeyActionsMenuProps) => {
  const { t } = useTranslation()
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton
          aria-label="Actions"
          variant="ghost"
          size="sm"
        >
          <FiMoreHorizontal />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <MenuItem value="edit" onClick={onEdit}>
          <FiEdit />
          {t("apiKeys.edit")}
        </MenuItem>
        <MenuItem
          value="delete"
          onClick={onDelete}
          color="red.500"
          _hover={{ bg: "red.50" }}
        >
          <FiTrash2 />
          {t("apiKeys.delete")}
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  )
}
