import { Container, Heading, Stack } from "@chakra-ui/react"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"

import { Radio, RadioGroup } from "@/components/ui/radio"

const Appearance = () => {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <>
      <Container maxW="full">
        <Heading size="sm" py={4}>
          {t("userSettings.appearance")}
        </Heading>

        <RadioGroup
          onValueChange={(e) => setTheme(e.value)}
          value={theme}
          colorPalette="teal"
        >
          <Stack>
            <Radio value="system">{t("userSettings.system")}</Radio>
            <Radio value="light">{t("userSettings.lightMode")}</Radio>
            <Radio value="dark">{t("userSettings.darkMode")}</Radio>
          </Stack>
        </RadioGroup>
      </Container>
    </>
  )
}
export default Appearance
