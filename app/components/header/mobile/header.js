'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link'
import Image from 'next/image'
import styles from './page.module.css'
import globalStyles from '../../../globals.css'
import { usePathname } from 'next/navigation';
import { connect, disconnect } from '@wagmi/core'
import { injected } from '@wagmi/connectors'
import { config } from '@/wagmiConfig';
import { useChainId, useAccount } from 'wagmi';
import navItems from '../navItems.json';
import {
  HStack,
  Box,
  VStack,
  Divider,
  Button,
  Text
} from '@chakra-ui/react';
import { useLanguage } from '../../../context/LanguageContext'
import { translations } from '../../../context/LanguageContext'
import { BellIcon } from '@chakra-ui/icons'
import { announcements, AnnouncementModal } from '../header.js'
import logo from '../nova_logo.png'

export default function Header() {
  let pathname = usePathname();
  const [openMenu, setOpenMenu] = useState(false)
  const chainId = useChainId({ config })
  const { address, connector, isConnected } = useAccount({ config });
  const { language, setLanguage } = useLanguage()
  const t = translations[language]

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

  const disconnectWallet = async () => {
    await disconnect(config, {
      connector,
    })
  }

  const connectWallet = async () => {
    const result = await connect(config, { connector: injected() })
    console.log(result)
  }

  const getEllipsisTxt = (str, n = 6) => {
    if (str) {
      return `${str.slice(0, n)}...${str.slice(str.length - n)}`;
    }
    return '';
  };

  return (
    <div className={`${styles['section_1']} flex-col align-center`}>
      <div className={`${styles['block_9']}`}>
        <HStack>
          <Image src={logo} style={{ height: '40px', width: '40px' }} />
          <Box className={styles.creepsterRegular}>NovaBank</Box>
        </HStack>
        {/* Add Language and Announcement buttons here */}
        <HStack spacing={2}>
          <Box position="relative">
            <Button
              onClick={handleAnnouncementClick}
              variant="ghost"
              size="sm"
              px={2}
              leftIcon={<BellIcon color="black" />}
              className={styles.mobile}
              color="black"
            />
            {hasNewAnnouncement && (
              <Box
                position="absolute"
                top="2px"
                right="2px"
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
            size="sm"
            px={2}
            mr={5}
            className={styles.mobile}
            color="black"
          >
            {language === 'en' ? '中文' : 'EN'}
          </Button>
          {
            openMenu ?
              <Image
                className={`${styles['menu_close']}`}
                src={
                  require('./menu_close.png')
                }
                onClick={() => setOpenMenu(false)}
              />
              :
              <Image
                className={`${styles['menu_open']}`}
                src={
                  require('./menu_open.png')
                }
                onClick={() => setOpenMenu(true)}
              />
          }
        </HStack>

      </div>
      {
        openMenu &&
        <div className={`${styles['menu_mobile']} flex-col align-start`}>
          {
            navItems.map(navItem =>
              <VStack className={`align-start`} key={navItem.path}>
                <Box className={`${styles[pathname.includes(navItem.name) ? ('selected_mobile') : ('mobile')]}`} onClick={() => setOpenMenu(false)}>
                  <Link href={`${navItem.path}`} rel="noopener noreferrer">
                    {navItem.name}
                  </Link>
                </Box>
                <Divider />
              </VStack>
            )
          }

          {
            isConnected ?
              <VStack>
                <HStack>
                  <Box className={`${styles['address_btn_text']}`}>{getEllipsisTxt(address)}</Box>
                  <Image
                    className={`${styles['image_wallet']}`}
                    src={
                      require('./exit.png')
                    }
                    onClick={() => disconnectWallet()}
                  />
                </HStack>
              </VStack>
              :
              <VStack>
                <Button className={`${styles['web3-btn-semi-transparent']}`} onClick={() => connectWallet()}>
                  Connect Wallet
                </Button>
              </VStack>
          }
        </div>
      }

      {/* Add AnnouncementModal */}
      <AnnouncementModal
        isOpen={isAnnouncementOpen}
        onClose={() => setIsAnnouncementOpen(false)}
        t={t}
      />
    </div>
  )
}
