import { Container, Flex, Image, Input, Text } from "@chakra-ui/react"
import {
  Link as RouterLink,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock, FiUser, FiMail } from "react-icons/fi"
import { useTranslation } from "react-i18next"
import { useState } from "react"

import type { UserRegisterWithCode } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { confirmPasswordRules, getEmailPattern, passwordRules } from "@/utils"
import { UsersService } from "@/client"
import { toaster } from "@/components/ui/toaster"
import Logo from "/assets/images/gohumanloop-logo.svg"

export const Route = createFileRoute("/signup")({
  component: SignUp,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

interface UserRegisterForm extends UserRegisterWithCode {
  confirm_password: string
}

function SignUp() {
  const { t } = useTranslation()
  const {} = useAuth()
  const navigate = useNavigate()
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserRegisterForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
      verification_code: "",
    },
  })

  const emailValue = watch("email")

  const sendVerificationCode = async () => {
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      toaster.create({
        title: "请输入有效的邮箱地址",
        type: "error",
      })
      return
    }

    setIsSendingCode(true)
    try {
       await UsersService.sendVerificationCode({ requestBody: { email: emailValue } })
       setIsCodeSent(true)
      toaster.create({
        title: "验证码已发送",
        description: "请查看您的邮箱",
        type: "success",
      })
    } catch (error) {
      toaster.create({
        title: "发送失败",
        description: "请稍后重试",
        type: "error",
      })
    } finally {
      setIsSendingCode(false)
    }
  }

  const onSubmit: SubmitHandler<UserRegisterForm> = async (data) => {
    if (!isCodeSent) {
      toaster.create({
        title: "请先发送验证码",
        type: "error",
      })
      return
    }

    try {
       await UsersService.signupWithCode({
         requestBody: {
           email: data.email,
           password: data.password,
           full_name: data.full_name,
           verification_code: data.verification_code,
         }
       })
      toaster.create({
        title: "注册成功",
        description: "请登录您的账户",
        type: "success",
      })
      // 跳转到登录页面
      navigate({ to: "/login" })
    } catch (error) {
      toaster.create({
        title: "注册失败",
        description: "请检查验证码是否正确",
        type: "error",
      })
    }
  }

  return (
    <>
      <Flex flexDir={{ base: "column", md: "row" }} justify="center" h="100vh">
        <Container
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          h="100vh"
          maxW="sm"
          alignItems="stretch"
          justifyContent="center"
          gap={4}
          centerContent
        >
          <Image
            src={Logo}
            alt="FastAPI logo"
            height="auto"
            maxW="2xs"
            alignSelf="center"
            mb={4}
          />
          <Field
            invalid={!!errors.full_name}
            errorText={errors.full_name?.message}
          >
            <InputGroup w="100%" startElement={<FiUser />}>
              <Input
                id="full_name"
                minLength={2}
                {...register("full_name", {
                  required: t('validation.fullNameRequired'),
                })}
                placeholder={t('placeholders.fullName')}
                type="text"
              />
            </InputGroup>
          </Field>

          <Field invalid={!!errors.email} errorText={errors.email?.message}>
            <InputGroup w="100%" startElement={<FiUser />}>
              <Input
                id="email"
                {...register("email", {
                  required: t('validation.emailRequired'),
                  pattern: getEmailPattern(t),
                })}
                placeholder={t('placeholders.email')}
                type="email"
              />
            </InputGroup>
          </Field>

          <Flex gap={2}>
            <Field flex={1} invalid={!!errors.verification_code} errorText={errors.verification_code?.message}>
              <InputGroup w="100%" startElement={<FiMail />}>
                <Input
                  id="verification_code"
                  {...register("verification_code", {
                    required: "请输入验证码",
                    minLength: {
                      value: 6,
                      message: "验证码长度为6位"
                    },
                    maxLength: {
                      value: 6,
                      message: "验证码长度为6位"
                    }
                  })}
                  placeholder="请输入验证码"
                  type="text"
                  maxLength={6}
                />
              </InputGroup>
            </Field>
            <Button
              variant="outline"
              onClick={sendVerificationCode}
              loading={isSendingCode}
              disabled={!emailValue || isSendingCode}
              minW="120px"
            >
              {isCodeSent ? "重新发送" : "发送验证码"}
            </Button>
          </Flex>
          <PasswordInput
            type="password"
            startElement={<FiLock />}
            {...register("password", passwordRules(true, t))}
            placeholder={t('placeholders.password')}
            errors={errors}
          />
          <PasswordInput
            type="confirm_password"
            startElement={<FiLock />}
            {...register("confirm_password", confirmPasswordRules(getValues, true, t))}
            placeholder={t('placeholders.confirmPassword')}
            errors={errors}
          />
          <Button variant="solid" type="submit" loading={isSubmitting}>
            {t('common.signup')}
          </Button>
          <Text>
            {t('common.alreadyHaveAccount')}{" "}
            <RouterLink to="/login" className="main-link">
              {t('common.login')}
            </RouterLink>
          </Text>
        </Container>
      </Flex>
    </>
  )
}

export default SignUp
