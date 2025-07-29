import { IconButton } from "@chakra-ui/react"
import { FiEdit, FiMoreHorizontal, FiTrash2 } from "react-icons/fi"

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
          编辑
        </MenuItem>
        <MenuItem
          value="delete"
          onClick={onDelete}
          color="red.500"
          _hover={{ bg: "red.50" }}
        >
          <FiTrash2 />
          删除
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  )
}