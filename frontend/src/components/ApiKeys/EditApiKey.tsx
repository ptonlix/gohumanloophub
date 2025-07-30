import {
  Button,
  Input,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiEdit } from "react-icons/fi"

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
  DialogTrigger,
} from "@/components/ui/dialog"

interface EditApiKeyProps {
  name: string
  description: string
}

interface EditApiKeyComponentProps {
  apiKey: ApiKeyPublic
  isOpen?: boolean
  onClose?: () => void
  children?: React.ReactNode
}

const EditApiKey = ({ apiKey, isOpen = true, onClose: onCloseProp, children }: EditApiKeyComponentProps) => {
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
    reset,
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
    onError: (err: any) => {
      const errDetail = err.body?.detail
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
          <DialogTitle>编辑 API Key</DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger />
        <DialogBody pb={6}>
          <Field
            label="名称"
            required
            errorText={errors.name?.message}
          >
            <Input
              id="name"
              {...register("name", {
                required: "名称是必填项",
              })}
              placeholder="输入 API Key 名称"
            />
          </Field>
          <Field label="描述" mt={4}>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="输入 API Key 描述（可选）"
            />
          </Field>
        </DialogBody>
        <DialogFooter gap={3}>
          <Button variant="solid" type="submit" loading={isSubmitting}>
            保存
          </Button>
          <DialogActionTrigger asChild>
            <Button variant="outline">取消</Button>
          </DialogActionTrigger>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export default EditApiKey