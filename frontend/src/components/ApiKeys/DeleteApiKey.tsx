import { Button, Text, useDisclosure } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { type ApiKeyPublic, ApiKeysService } from "@/client/ApiKeysService"
import useCustomToast from "@/hooks/useCustomToast"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DeleteApiKeyProps {
  apiKey: ApiKeyPublic
  isOpen?: boolean
  onClose?: () => void
  children?: React.ReactNode
}

const DeleteApiKey = ({ apiKey, isOpen = true, onClose: onCloseProp, children }: DeleteApiKeyProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const handleClose = () => {
    if (onCloseProp) {
      onCloseProp()
    }
  }

  const mutation = useMutation({
    mutationFn: () => ApiKeysService.deleteApiKey({ apiKeyId: apiKey.id }),
    onSuccess: () => {
      showSuccessToast("API Key deleted successfully!")
      handleClose()
    },
    onError: (err: any) => {
      const errDetail = err.body?.detail
      showErrorToast("Something went wrong. Please try again later.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] })
    },
  })

  const handleDelete = () => {
    mutation.mutate()
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={({ open }) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("apiKeys.deleteApiKey")}</DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger />
        <DialogBody pb={6}>
          <Text>
            {t("apiKeys.deleteConfirmation", { name: apiKey.name })}
          </Text>
        </DialogBody>
        <DialogFooter gap={3}>
          <Button
            variant="solid"
            colorScheme="red"
            onClick={handleDelete}
            loading={mutation.isPending}
          >
            {t("apiKeys.delete")}
          </Button>
          <DialogActionTrigger asChild>
            <Button variant="outline">{t("apiKeys.cancel")}</Button>
          </DialogActionTrigger>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export default DeleteApiKey
