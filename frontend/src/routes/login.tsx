import { Container, Image, Input, Text, Box } from "@chakra-ui/react"
import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock, FiMail } from "react-icons/fi"
import { useTranslation } from "react-i18next"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import AnimatedBackground from "@/components/AnimatedBackground"
import Logo from "/assets/images/gohumanloop-logo.svg"
import { getEmailPattern, passwordRules } from "../utils"

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function Login() {
  const { t } = useTranslation()
  const { loginMutation, error, resetError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccessToken>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit: SubmitHandler<AccessToken> = async (data) => {
    if (isSubmitting) return

    resetError()

    try {
      await loginMutation.mutateAsync(data)
    } catch {
      // error is handled by useAuth hook
    }
  }

  return (
    <>
      <AnimatedBackground />
      <Container
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        h="auto"
        maxW="xs"
        alignItems="stretch"
        justifyContent="center"
        gap={4}
        centerContent
        bg="rgba(255, 255, 255, 0.95)"
        backdropFilter="blur(10px)"
        borderRadius="xl"
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.1)"
        border="1px solid rgba(255, 255, 255, 0.2)"
        p={6}
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        zIndex={10}
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
          invalid={!!errors.username}
          errorText={errors.username?.message || !!error}
        >
          <InputGroup w="100%" startElement={<FiMail />}>
            <Input
              id="username"
              {...register("username", {
                required: t('validation.usernameRequired'),
                pattern: getEmailPattern(t),
              })}
              placeholder={t('placeholders.email')}
              type="email"
            />
          </InputGroup>
        </Field>
        <PasswordInput
          type="password"
          startElement={<FiLock />}
          {...register("password", passwordRules(true, t))}
          placeholder={t('placeholders.password')}
          errors={errors}
        />
        <RouterLink to="/recover-password" className="main-link">
          {t('common.forgotPassword')}
        </RouterLink>
        <Button variant="solid" type="submit" loading={isSubmitting} size="md">
          {t('common.login')}
        </Button>
        <Text>
          {t('common.dontHaveAccount')}{" "}
          <RouterLink to="/signup" className="main-link">
            {t('common.signup')}
          </RouterLink>
        </Text>
      </Container>
    </>
  )
}
