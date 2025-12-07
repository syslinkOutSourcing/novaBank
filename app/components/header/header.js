'use client';

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import styles from './page.module.css'
import {
  HStack,
  Box,
  Button,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  Text
} from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import navItems from './navItems.json';
import { useLanguage } from '../../context/LanguageContext'
import { BellIcon } from '@chakra-ui/icons'
import { useState, memo, useEffect } from 'react'
import { translations } from '../../context/LanguageContext'
import { toast } from 'react-hot-toast'
import logo from './nova_logo.png'

export const announcements = [
]

// Update AnnouncementModal component
export const AnnouncementModal = memo(({ isOpen, onClose, t }) => {
  const { language } = useLanguage()

  // If no announcements, show message
  if (!announcements.length) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay backdropFilter='blur(10px)' />
        <ModalContent className="web3-modal">
          <ModalHeader className="web3-text-gradient">{t.announcements}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text textAlign="center" py={8}>{t.noAnnouncements}</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay backdropFilter='blur(10px)' />
      <ModalContent className="web3-modal">
        <ModalHeader className="web3-text-gradient">{t.announcements}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {announcements.sort((a, b) => new Date(b.date) - new Date(a.date)).map((announcement, index) => (
              <Box
                key={index}
                p={4}
                borderRadius="md"
                bg="whiteAlpha.100"
                backdropFilter="blur(10px)"
              >
                <Text fontSize="sm" color="gray.400" mb={2}>
                  {new Date(announcement.date).toLocaleDateString()}
                </Text>
                {
                  (announcement.content[language] || announcement.content['en']).split('\n').map(subgraph =>
                    <Text>
                      {subgraph}
                    </Text>
                  )
                }
              </Box>
            ))}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
})

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage } = useLanguage()

  const t = translations[language]
  const isActive = (path) => pathname === path;

  // Add navigation styles
  const activeBg = '#F0B90B';
  const inactiveBg = 'transparent';
  const activeColor = 'black';
  const inactiveColor = 'gray.600';
  const hoverBg = 'orange.100';

  // Add state for announcement modal
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false)
  const [hasNewAnnouncement, setHasNewAnnouncement] = useState(false)

  // Check for new announcements
  useEffect(() => {
    const checkNewAnnouncements = () => {
      if (!announcements.length) return

      const lastReadTime = localStorage.getItem('lastReadAnnouncementTime')
      const latestAnnouncement = new Date(announcements.sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      )[0].date).getTime()

      setHasNewAnnouncement(!lastReadTime || latestAnnouncement > parseInt(lastReadTime))
    }

    checkNewAnnouncements()
  }, [])

  // Handle announcement button click
  const handleAnnouncementClick = () => {
    if (!announcements.length) {
      setIsAnnouncementOpen(true)
      return
    }

    // Update last read time
    const latestAnnouncement = new Date(announcements.sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    )[0].date).getTime()
    localStorage.setItem('lastReadAnnouncementTime', latestAnnouncement.toString())
    setHasNewAnnouncement(false)
    setIsAnnouncementOpen(true)
  }

  return (
    <Box
      className={styles.description}
    >
      <Link href="/" className={styles.card} rel="noopener noreferrer">
        <HStack>
          <Image src={logo} style={{ height: '60px', width: '60px' }} />
          <Box className={styles.creepsterRegular}>NovaBank</Box>
        </HStack>
      </Link>

      <HStack spacing={4} flex={1} justify="center" mx={8}>
        {navItems.map((item) => (
          <Button
            key={item.path}
            onClick={() => router.push(item.path)}
            bg={isActive(item.path) ? activeBg : inactiveBg}
            color={isActive(item.path) ? activeColor : inactiveColor}
            _hover={{
              bg: isActive(item.path) ? activeBg : hoverBg,
              color: isActive(item.path) ? activeColor : inactiveColor,
            }}
            variant="ghost"
            size="md"
            px={6}
            fontWeight={isActive(item.path) ? "bold" : "normal"}
            borderRadius="full"
          >
            {item.name}
          </Button>
        ))}
      </HStack>

      {/* Right side buttons group */}
      <HStack spacing={2} style={{ fontSize: '15px' }}>
        <Box position="relative">
          <Button
            onClick={handleAnnouncementClick}
            variant="ghost"
            size="md"
            px={4}
            borderRadius="full"
            color={inactiveColor}
            _hover={{ bg: hoverBg }}
            leftIcon={<BellIcon />}
          />
          {hasNewAnnouncement && (
            <Box
              position="absolute"
              top="10px"
              right="20px"
              width="8px"
              height="8px"
              borderRadius="full"
              bg="red.500"
            />
          )}
        </Box>
        <Button
          onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
          variant="ghost"
          size="md"
          px={4}
          borderRadius="full"
          color={inactiveColor}
          _hover={{ bg: hoverBg }}
          fontSize="15px"
        >
          {language === 'en' ? '中文' : 'EN'}
        </Button>
        <ConnectButton />
      </HStack>

      {/* Add AnnouncementModal */}
      <AnnouncementModal
        isOpen={isAnnouncementOpen}
        onClose={() => setIsAnnouncementOpen(false)}
        t={t}
      />
    </Box>
  )
}
