import { Flex, Image, useBreakpointValue } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"

import Logo from "/assets/images/gohumanloop-logo.svg"
import UserMenu from "./UserMenu"
import LanguageSwitcher from "./LanguageSwitcher"

function Navbar() {
  const display = useBreakpointValue({ base: "none", md: "flex" })

  return (
    <Flex
      display={display}
      justify="space-between"
      position="sticky"
      color="ui.main"
      align="center"
      bg="ui.surface"
      borderBottom="1px solid"
      borderColor="ui.border"
      boxShadow="sm"
      w="100%"
      top={0}
      p={4}
    >
      <Link to="/">
        <Flex align="center" gap={2}>
          <Image src="/assets/images/favicon.png" alt="Favicon" h={10} w={10} alignSelf="center" />
          <Image src={Logo} alt="Logo" maxW="3xs" p={2} alignSelf="center" />
        </Flex>
      </Link>
      <Flex gap={2} alignItems="center">
        <LanguageSwitcher />
        <UserMenu />
      </Flex>
    </Flex>
  )
}

export default Navbar
