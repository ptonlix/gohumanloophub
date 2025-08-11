import { Button, Flex, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FiGlobe } from "react-icons/fi";

import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu";

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'zh' ? '中文' : 'English';
  };

  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <Button variant="ghost" size="sm" gap={2}>
          <FiGlobe />
          <Text fontSize="sm">{getCurrentLanguageLabel()}</Text>
        </Button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem
          value="en"
          onClick={() => changeLanguage('en')}
          style={{ cursor: "pointer" }}
          bg={i18n.language === 'en' ? 'gray.100' : 'transparent'}
        >
          English
        </MenuItem>
        <MenuItem
          value="zh"
          onClick={() => changeLanguage('zh')}
          style={{ cursor: "pointer" }}
          bg={i18n.language === 'zh' ? 'gray.100' : 'transparent'}
        >
          中文
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
};

export default LanguageSwitcher;
