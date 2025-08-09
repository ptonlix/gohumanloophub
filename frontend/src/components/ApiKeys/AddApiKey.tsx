import {
  Button,
  Input,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiPlus } from "react-icons/fi"
import { useTranslation } from "react-i18next"

import { type ApiKeyCreate, ApiKeysService } from "@/client/ApiKeysService"
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
  DialogTrigger,
} from "@/components/ui/dialog"

interface AddApiKeyProps {
  name: string
  description: string
}

const AddApiKey = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const { open, onOpen, onClose } = useDisclosure()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddApiKeyProps>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ApiKeyCreate) =>
      ApiKeysService.createApiKey({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("API Key created successfully!")
      reset()
      onClose()
    },
    onError: (err: any) => {
      const errDetail = err.body?.detail
      showErrorToast("Something went wrong. Please try again later.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] })
    },
  })

  const onSubmit: SubmitHandler<AddApiKeyProps> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot open={open} onOpenChange={({ open }) => !open && onClose()}>
      <DialogTrigger asChild>
        <Button
          variant="solid"
          size="sm"
          onClick={onOpen}
        >
          <FiPlus />
          {t("apiKeys.addApiKey")}
        </Button>
      </DialogTrigger>
      <DialogContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{t("apiKeys.addApiKey")}</DialogTitle>
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

export default AddApiKey