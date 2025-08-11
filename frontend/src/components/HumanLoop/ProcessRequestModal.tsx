import {
  Badge,
  Button,
  Flex,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type {
  ApprovalRequest,
  ConversationRequest,
  HumanLoopRequest,
  InformationRequest,
} from "@/client/HumanLoopService"
import type { ApiError } from "@/client"
import { HumanLoopService } from "@/client/HumanLoopService"
import useCustomToast from "@/hooks/useCustomToast"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface ProcessRequestModalProps {
  request: HumanLoopRequest
  isOpen: boolean
  onClose: () => void
}

interface ProcessFormData {
  action?: 'approved' | 'rejected'
  message: string
  message_type: string
  feedback?: string
  is_complete?: boolean
}

const ProcessRequestModal = ({
  request,
  isOpen,
  onClose,
}: ProcessRequestModalProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProcessFormData>({
    defaultValues: {
      message: '',
      message_type: 'text',
      feedback: '',
      is_complete: true,
    },
  })

  const processMutation = useMutation({
    mutationFn: async (data: ProcessFormData) => {
      if (request.loop_type === 'approval') {
        const requestBody: ApprovalRequest = {
          request_id: request.id,
          action: data.action!,
          feedback: data.feedback,
          response: {
            message: data.message,
            message_type: data.message_type,
          },
        }
        return HumanLoopService.processApproval({ requestBody })
      } else if (request.loop_type === 'information') {
        const requestBody: InformationRequest = {
          request_id: request.id,
          response: {
            message: data.message,
            message_type: data.message_type,
          },
          feedback: data.feedback,
        }
        return HumanLoopService.processInformation({ requestBody })
      } else if (request.loop_type === 'conversation') {
        const requestBody: ConversationRequest = {
          request_id: request.id,
          response: {
            message: data.message,
            message_type: data.message_type,
          },
          feedback: data.feedback,
          is_complete: data.is_complete || false,
        }
        return HumanLoopService.processConversation({ requestBody })
      }
      throw new Error('未知的循环类型')
    },
    onSuccess: () => {
      showToast.showSuccessToast('请求已成功处理')
      queryClient.invalidateQueries({ queryKey: ['humanloop-requests'] })
      queryClient.invalidateQueries({ queryKey: ['humanloop-stats'] })
      reset()
      onClose()
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail
      let errorMessage = errDetail || "Something went wrong."
      if (Array.isArray(errDetail) && errDetail.length > 0) {
        errorMessage = errDetail[0].msg
      }
      showToast.showErrorToast(errorMessage)
    },
  })

  const onSubmit: SubmitHandler<ProcessFormData> = async (data) => {
    setIsLoading(true)
    try {
      await processMutation.mutateAsync(data)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={({ open }) => !open && handleClose()}>
      <DialogContent maxW="2xl">
        <DialogHeader>
          <DialogTitle>{t('humanLoop.processRequest')}</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody>
            <VStack align="stretch" gap={4}>
              {/* 请求信息 */}
              <VStack align="stretch" gap={2}>
                <Text fontWeight="medium">{t('humanLoop.requestInfo')}:</Text>
                <Flex gap={2}>
                  <Badge colorScheme="blue">
                    {request.loop_type === 'conversation' && t('humanLoop.conversationMode')}
                    {request.loop_type === 'approval' && t('humanLoop.approvalMode')}
                    {request.loop_type === 'information' && t('humanLoop.informationMode')}
                  </Badge>
                  <Badge colorScheme="green">
                    {request.platform === 'GoHumanLoop' && 'GoHumanLoop'}
                    {request.platform === 'wework' && '企业微信'}
                    {request.platform === 'feishu' && '飞书'}
                    {request.platform === 'other' && '其他'}
                  </Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600">
                  {request.context.message}
                </Text>
              </VStack>

              {/* 审批模式特有的操作选择 */}
              {request.loop_type === 'approval' && (
                <Field label={t('humanLoop.approvalAction')} required errorText={errors.action?.message}>
                  <Controller
                    name="action"
                    control={control}
                    rules={{ required: '请选择审批操作' }}
                    render={({ field }) => (
                      <Flex gap={4}>
                        <Button
                          variant={field.value === 'approved' ? 'solid' : 'outline'}
                          colorScheme="green"
                          onClick={() => field.onChange('approved')}
                        >
                          {t('humanLoop.approve')}
                        </Button>
                        <Button
                          variant={field.value === 'rejected' ? 'solid' : 'outline'}
                          colorScheme="red"
                          onClick={() => field.onChange('rejected')}
                        >
                          {t('humanLoop.reject')}
                        </Button>
                      </Flex>
                    )}
                  />
                </Field>
              )}

              {/* 响应消息 */}
              <Field label={t('humanLoop.responseMessage')} required errorText={errors.message?.message}>
                <Controller
                  name="message"
                  control={control}
                  rules={{ required: '请输入响应消息' }}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder={t('humanLoop.responsePlaceholder')}
                      rows={4}
                    />
                  )}
                />
              </Field>

              {/* 对话模式特有的完成选项 */}
              {request.loop_type === 'conversation' && (
                <Field label={t('humanLoop.conversationStatus')}>
                  <Controller
                    name="is_complete"
                    control={control}
                    render={({ field }) => (
                      <Flex gap={4}>
                        <Button
                          variant={field.value ? 'solid' : 'outline'}
                          colorScheme="green"
                          onClick={() => field.onChange(true)}
                        >
                          {t('humanLoop.completeConversation')}
                        </Button>
                        <Button
                          variant={!field.value ? 'solid' : 'outline'}
                          colorScheme="blue"
                          onClick={() => field.onChange(false)}
                        >
                          {t('humanLoop.continueConversation')}
                        </Button>
                      </Flex>
                    )}
                  />
                </Field>
              )}

              {/* 反馈信息 */}
              <Field label={t('humanLoop.feedbackOptional')} errorText={errors.feedback?.message}>
                <Controller
                  name="feedback"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder={t('humanLoop.feedbackPlaceholder')}
                      rows={2}
                    />
                  )}
                />
              </Field>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {t('humanLoop.cancel')}
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              loading={isLoading}
              loadingText={t('humanLoop.processing')}
            >
              {t('humanLoop.submitResponse')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default ProcessRequestModal
