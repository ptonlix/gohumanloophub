import {
  Button,
  Input,
  Textarea,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { useTranslation } from "react-i18next"

import { type ApiKeyUpdate, type ApiKeyPublic, ApiKeysService } from "@/client/ApiKeysService"
import useCustomToast from "@/hooks/useCustomToast"
import { Field } from "@/components/ui/field"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"

interface EditApiKeyProps {
  name: string
  description: string
}

interface EditApiKeyComponentProps {
  apiKey: ApiKeyPublic
  isOpen?: boolean
  onClose?: () => void
}

const EditApiKey = ({ apiKey, isOpen = true, onClose: onCloseProp }: EditApiKeyComponentProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const handleClose = () => {
    if (onCloseProp) {
      onCloseProp()
    }
  }
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditApiKeyProps>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: apiKey.name,
      description: apiKey.description || "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ApiKeyUpdate) =>
      ApiKeysService.updateApiKey({ apiKeyId: apiKey.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("API Key updated successfully!")
      handleClose()
    },
    onError: () => {
      showErrorToast("Something went wrong. Please try again later.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] })
    },
  })

  const onSubmit: SubmitHandler<EditApiKeyProps> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={({ open }) => !open && handleClose()}>
      <DialogContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogHeader>
          <DialogTitle>{t("apiKeys.editApiKey")}</DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger />
        <DialogBody pb={6}>
          <Field
            label={t("apiKeys.nameLabel")}
            required
            errorText={errors.name?.message}
          >
            <Input
              id="name"
              {...register("name", {
                required: t("apiKeys.nameRequired"),
              })}
              placeholder={t("apiKeys.namePlaceholder")}
            />
          </Field>
          <Field label={t("apiKeys.descriptionLabel")} mt={4}>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={t("apiKeys.descriptionPlaceholder")}
            />
          </Field>
        </DialogBody>
        <DialogFooter gap={3}>
          <Button variant="solid" type="submit" loading={isSubmitting}>
            {t("apiKeys.save")}
          </Button>
          <DialogActionTrigger asChild>
            <Button variant="outline">{t("apiKeys.cancel")}</Button>
          </DialogActionTrigger>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export default EditApiKey
