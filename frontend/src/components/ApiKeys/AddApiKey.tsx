import {
  Button,
  Input,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiPlus } from "react-icons/fi"

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
        >
          <FiPlus />
          添加 API Key
        </Button>
      </DialogTrigger>
      <DialogContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>添加 API Key</DialogTitle>
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

export default AddApiKey