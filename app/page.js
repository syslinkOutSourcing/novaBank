'use client'

import { Box, Heading, Button, Input, VStack, HStack, Collapse, useDisclosure, SimpleGrid, Container, Divider, CardBody, Text, Stat, StatLabel, StatNumber, StatGroup, useColorModeValue, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter, useToast, Select, Radio, RadioGroup } from '@chakra-ui/react'
import Link from 'next/link'
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
  useBlock
} from 'wagmi'
import { writeContract, waitForTransactionReceipt, readContract } from '@wagmi/core';
import novaBank from './contracts/novaBank.json'
import erc20 from './contracts/erc20.json'
import novaBankTool from './contracts/novaBankTool.json'
import pinkLock from './contracts/pinkLock.json'
import BigNumber from 'bignumber.js'
import { useEffect, useState, useMemo, memo } from 'react'
import './web3.css'  // 确保导入 web3.css
import { useLanguage } from './context/LanguageContext'
import { translations } from './context/LanguageContext'
import { parseUnits, isAddress, zeroAddress, parseEther } from 'viem'
import CopyableAddress from './tools/CopyableAddress'
import copy from 'copy-to-clipboard';
import workshopInfos from './workshops.json'
import { config } from './wagmiConfig'
import { motion, AnimatePresence } from 'framer-motion'
import { FaWallet, FaFire, FaChartLine, FaUserFriends, FaHistory, FaCog, FaDollarSign, FaExchangeAlt, FaArrowRight, FaLock, FaGift, FaMoneyCheck } from 'react-icons/fa'
import { RiGovernmentLine } from 'react-icons/ri'
import { BsLightningChargeFill } from 'react-icons/bs'
import { BiStats } from 'react-icons/bi'


// Add this near the top of the file, after the imports
const REFERRER_STORAGE_KEY = 'lastReferrer';
const USER_ADDRESSES_STORAGE_KEY = 'userAddresses';
const cz_address = "0xdEa5d72a7a739399f2AeD296A6dF5417f95D0456";

// Helper function to get stored user addresses
const getStoredUserAddresses = () => {
  try {
    const addresses = localStorage.getItem(USER_ADDRESSES_STORAGE_KEY);
    return addresses ? JSON.parse(addresses) : [];
  } catch (error) {
    console.error('Error getting stored user addresses:', error);
    return [];
  }
};

// Helper function to add user address to storage
const addUserAddressToStorage = (address) => {
  try {
    const existingAddresses = getStoredUserAddresses();

    // Check if address already exists (case insensitive)
    const addressExists = existingAddresses.some(
      addr => addr.toLowerCase() === address.toLowerCase()
    );

    if (!addressExists) {
      const updatedAddresses = [...existingAddresses, address];
      localStorage.setItem(USER_ADDRESSES_STORAGE_KEY, JSON.stringify(updatedAddresses));
    }
  } catch (error) {
    console.error('Error adding user address to storage:', error);
  }
};

// 辅助函数
const formatBigNumber = (value, decimals = 18, decimalPlaces = 6) => {
  if (value === undefined) return 'N/A';
  return new BigNumber(value.toString())
    .dividedBy(new BigNumber(10).pow(decimals))
    .toFixed(decimalPlaces); // 显示6位小数但是计算使用18位精度
}

// Tech UI Constants
const TECH_COLORS = {
  primary: "#F0B90B",
  secondary: "#000000",
  bg: "#FFFFFF",
  cardBg: "rgba(255, 255, 255, 0.9)",
  text: "#000000",
  textDim: "rgba(0, 0, 0, 0.6)",
  border: "rgba(240, 185, 11, 0.3)",
  glow: "0 0 20px rgba(240, 185, 11, 0.3)"
}

const TechCard = ({ children, className, ...props }) => (
  <Box
    as={motion.div}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    bg={TECH_COLORS.cardBg}
    backdropFilter="blur(20px)"
    border={`1px solid ${TECH_COLORS.border}`}
    borderRadius="2xl"
    p={6}
    position="relative"
    overflow="hidden"
    _before={{
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(120deg, transparent, rgba(240,185,11,0.28), transparent)`,
      opacity: 0.5,
      pointerEvents: "none",
      zIndex: 0
    }}
    _hover={{
      boxShadow: TECH_COLORS.glow,
      border: `1px solid ${TECH_COLORS.primary}`,
      transform: "translateY(-2px)"
    }}
    {...props}
  >
    <Box position="relative" zIndex={1}>
      {children}
    </Box>
  </Box>
)

const TechButton = ({ children, ...props }) => (
  <Button
    bg="transparent"
    border={`1px solid ${TECH_COLORS.primary}`}
    color={TECH_COLORS.primary}
    borderRadius="xl"
    position="relative"
    overflow="hidden"
    _hover={{
      bg: "rgba(240, 185, 11, 0.1)",
      boxShadow: TECH_COLORS.glow,
      transform: "scale(1.02)"
    }}
    _active={{
      transform: "scale(0.98)"
    }}
    transition="all 0.2s"
    {...props}
  >
    {children}
  </Button>
)

const TechStat = ({ label, value, subValue, icon }) => (
  <VStack align="start" spacing={1}>
    <HStack color={TECH_COLORS.textDim} fontSize="sm" spacing={2}>
      {icon && <Box as={icon} color={TECH_COLORS.primary} />}
      <Box>{label}</Box>
    </HStack>
    <Box
      fontSize="2xl"
      fontWeight="bold"
      bgGradient={`linear(to-r, ${TECH_COLORS.primary}, #FF8C00)`}
      bgClip="text"
      fontFamily="'Orbitron', sans-serif"
    >
      {value}
    </Box>
    {subValue && <Box fontSize="xs" color={TECH_COLORS.textDim}>{subValue}</Box>}
  </VStack>
)

// Move InvestmentModal outside the main component and memoize it
const InvestmentModal = memo(({
  isOpen,
  onClose,
  type,
  investAmount,
  setInvestAmount,
  referrer,
  isReferrerDisabled,
  setReferrer,
  investmentMonths,
  setInvestmentMonths,
  handleInvestSubmit,
  txPending,
  isApproveUsdtPending,
  isApproveBurnPending,
  isInvestPending,
  minAmount,
  maxAmount,
  t,
  resetTransactionState,
  needsApproval
}) => {
  const handleClose = () => {
    resetTransactionState()
    onClose()
  }

  // Determine button text based on approval state and type
  const getButtonText = () => {
    if (isApproveUsdtPending || isApproveBurnPending) return t.approving
    if (isInvestPending) return t.investing
    if (needsApproval) return `${t.approve} ${type}`
    return `${t.invest}`
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
      <ModalOverlay backdropFilter='blur(10px)' bg="rgba(0,0,0,0.8)" />
      <ModalContent
        bg={TECH_COLORS.bg}
        borderColor={TECH_COLORS.primary}
        borderWidth="1px"
        boxShadow={`0 0 30px ${TECH_COLORS.border}`}
        borderRadius="2xl"
        color="black"
      >
        <ModalHeader
          bgGradient={`linear(to-r, ${TECH_COLORS.primary}, ${TECH_COLORS.secondary})`}
          bgClip="text"
          fontSize="2xl"
          fontWeight="bold"
          textAlign="center"
          borderBottom={`1px solid ${TECH_COLORS.border}`}
          pb={4}
        >
          {t[`invest${type}`]}
        </ModalHeader>
        <ModalCloseButton color={TECH_COLORS.primary} />
        <ModalBody py={8}>
          <VStack spacing={8}>
            <Box w="100%">
              <Box color={TECH_COLORS.textDim} mb={2} fontSize="sm">{t.investmentAmount}</Box>
              <Input
                bg="rgba(0,0,0,0.05)"
                border={`1px solid ${TECH_COLORS.border}`}
                _focus={{ borderColor: TECH_COLORS.primary, boxShadow: TECH_COLORS.glow }}
                placeholder={`${t.enterAmount} (${minAmount} - ${maxAmount})`}
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                type="number"
                height="50px"
                fontSize="lg"
                color="black"
              />
            </Box>

            <Box w="100%">
              <Box color={TECH_COLORS.textDim} mb={2} fontSize="sm">{t.investmentPeriod}</Box>
              <SimpleGrid columns={3} spacing={4}>
                {['1', '3', '9', '12'].map((month) => (
                  <Box
                    key={month}
                    as="button"
                    onClick={() => setInvestmentMonths(month)}
                    bg={investmentMonths === month ? `rgba(240, 185, 11, 0.1)` : 'transparent'}
                    border={`1px solid ${investmentMonths === month ? TECH_COLORS.primary : TECH_COLORS.border}`}
                    borderRadius="xl"
                    p={3}
                    transition="all 0.2s"
                    _hover={{ borderColor: TECH_COLORS.primary }}
                  >
                    <VStack spacing={0}>
                      <Box fontWeight="bold" fontSize="lg" color={investmentMonths === month ? TECH_COLORS.primary : 'black'}>
                        {month} {t.months}
                      </Box>
                      <Box fontSize="xs" color={TECH_COLORS.textDim}>
                        {month === '1' ? '0.6%' : month === '3' ? '0.8%' : month === '9' ? '1%' : '1.5%'}
                      </Box>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            <Box w="100%">
              <Box color={TECH_COLORS.textDim} mb={2} fontSize="sm">{t.referrerAddress}</Box>
              <Input
                bg="rgba(0,0,0,0.05)"
                border={`1px solid ${TECH_COLORS.border}`}
                _focus={{ borderColor: TECH_COLORS.primary, boxShadow: TECH_COLORS.glow }}
                placeholder={t.enterReferrer}
                value={referrer}
                disabled={isReferrerDisabled}
                onChange={(e) => {
                  let referInfo = e.target.value;
                  if (referInfo.includes('?ref=')) {
                    try {
                      const match = referInfo.match(/\?ref=(0x[a-fA-F0-9]{40})/);
                      if (match && match[1]) {
                        referInfo = match[1];
                      }
                    } catch (error) {
                      console.log('Error extracting referrer address:', error);
                    }
                  }
                  setReferrer(referInfo)
                }
                }
                height="50px"
                fontSize="sm"
                color="black"
              />
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter borderTop={`1px solid ${TECH_COLORS.border}`} pt={6}>
          <Button
            w="100%"
            height="56px"
            bg={`linear-gradient(135deg, ${TECH_COLORS.primary} 0%, #FFA500 100%)`}
            _hover={{
              bg: `linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)`,
              boxShadow: TECH_COLORS.glow
            }}
            color="black"
            fontWeight="bold"
            fontSize="lg"
            onClick={() => handleInvestSubmit(type, referrer, investmentMonths)}
            isLoading={txPending || isApproveUsdtPending || isApproveBurnPending || isInvestPending}
            borderRadius="xl"
          >
            {getButtonText()}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
})

const incentiveRates = [50, 20, 20, 5, 5]

const managers = {
  "0x2D60Bf275a97A4B3aF7223664fd48fA349fF8301": true,
  "0xf45b0d4daf13cdd7d4bddc44b64fcc4b779e5d54": true,
  "0x5A355463773d9939EA467a8DB92C0aF6f47f1EbB": true,
  "0x9B49bb22A069181cA819F2c3209ea03407a8A2EA": true
}

const devAddrs = ['0x239bC8be834a360AB4e676648598bE88781b53dD',
  '0xCcc22e414317d6D0c4e2aB1061dd93C4a08a2bD7',
  "0x2D60Bf275a97A4B3aF7223664fd48fA349fF8301",
  "0x5259AE06b911eD4d3f384bc31bF3753675FC4368",
  "0xf45b0d4daf13cdd7d4bddc44b64fcc4b779e5d54",
  '0x789DF54c084b67775F68019957730f75A89D0cDd']

const blackList = {
}
export default function Home() {
  const { address } = useAccount()
  // const [address, setAddress] = useState(cz_address)//('0x4fe3D61a8DDEde94AA7cDac47065975BEecD7766');//('0x1747bd57cfFB27D728CC28124530b7854a50dDC3')//('0x6BE4feAfB5DaE052edBE898d2B95A51E75BC50B7')//0x4fe3D61a8DDEde94AA7cDac47065975BEecD7766

  const disableBurnOut = false;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 800);
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getCurrentPageUrl = () => {
    if (typeof window !== 'undefined') {
      // Remove any existing ref parameter from current URL
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      return url.toString();
    }
    return 'https://pumpburn.vercel.app'; // fallback
  };

  const novaBankConfig = {
    address: novaBank.address,
    abi: novaBank.abi,
  }

  const novaBankToolConfig = {
    address: novaBankTool.address,
    abi: novaBankTool.abi,
  }

  const disableAllOp = false;

  const { data: block } = useBlock();

  // 获取最新区块的时间戳
  const getLatestBlockTimestamp = () => {
    if (block) {
      return block.timestamp;
    }
    return null;
  };

  useEffect(() => {
    if (block) {
      console.log('Latest block timestamp:', new Date(Number(block.timestamp) * 1000).toLocaleString());
    }
  }, [block]);

  // Basic contract reads
  const { data: basicData } = useReadContracts({
    contracts: [
      {
        ...novaBankConfig,
        functionName: 'usdtToken',
      },
      {
        ...novaBankConfig,
        functionName: 'burnToken',
      },
      {
        ...novaBankConfig,
        functionName: 'minInvestment',
      },
      {
        ...novaBankConfig,
        functionName: 'minCompoundInvestment',
      },
      {
        ...novaBankConfig,
        functionName: 'maxInvestment',
      },
      {
        ...novaBankConfig,
        functionName: 'maxCompoundInvestment',
      },
      {
        ...novaBankConfig,
        functionName: 'maxIdleDurationOfInvest',
      },
      {
        ...novaBankConfig,
        functionName: 'incentiveRatePerTime',
      },
      {
        ...novaBankConfig,
        functionName: 'incentiveBurnDistributable',
      },
      {
        ...novaBankConfig,
        functionName: 'calculateBurnAmountByInvestor',
      },
      {
        ...novaBankConfig,
        functionName: 'manager',
      },
      {
        ...novaBankConfig,
        functionName: 'owner',
      },
      {
        ...novaBankConfig,
        functionName: 'totalInvestorNumber',
      },
      {
        ...novaBankConfig,
        functionName: 'CLAIM_FEE',
      },
      {
        ...novaBankConfig,
        functionName: 'isInvestorNotFinishCompound',
        args: [address],
      },
      {
        ...novaBankConfig,
        functionName: 'authers',
        args: [address],
      },
      {
        ...novaBankConfig,
        functionName: 'traders',
        args: [address],
      },
      {
        ...novaBankConfig,
        functionName: 'totalContribute',
        args: [],
      },
      {
        ...novaBankConfig,
        functionName: 'burnLimitPrice',
      },
      {
        ...novaBankConfig,
        functionName: 'currentPeriodTotalInvestmentAmount',
      },
    ],
  })

  // Destructure basicData with proper types
  const [
    usdtTokenAddress,      // address
    burnTokenAddress,      // address
    minInvestmentAmount,   // uint256
    minCompoundInvestment,   // uint256
    maxInvestmentAmount,   // uint256
    maxCompoundInvestment,   // uint256
    maxIdleDuration,       // uint250
    incentiveRate,         // uint256
    distributableBurn,     // uint256
    burnByInvestor,        // uint256
    manager,               // address
    owner,               // address
    totalInvestorNumber,        // uint256
    claimFee,                  // uint256
    isInvestorNotFinishCompound, // bool
    bAuther,                  // bool
    bTrader,                  // bool
    totalContribute,          // uint256
    burnLimitPriceValue,      // uint256
    currentPeriodTotalInvestmentAmount, // uint256
  ] = basicData || []

  const [tmpMaxInvestment, setTmpMaxInvestment] = useState(10000);
  // Format the values
  const formattedData = {
    usdtToken: usdtTokenAddress?.result?.toString() || 'N/A',
    burnToken: burnTokenAddress?.result?.toString() || 'N/A',
    minInvestment: formatBigNumber(minInvestmentAmount?.result, 18, 0) || 'N/A',
    minCompoundInvestment: formatBigNumber(minCompoundInvestment?.result, 18, 0) || 'N/A',
    maxInvestment: formatBigNumber(maxInvestmentAmount?.result, 18, 0) || 'N/A',
    maxCompoundInvestment: formatBigNumber(maxCompoundInvestment?.result, 18, 0) || 'N/A',
    maxIdleDuration: maxIdleDuration?.result?.toString() || 'N/A',
    incentiveRate: incentiveRate?.result ?
      new BigNumber(incentiveRate.result.toString()).dividedBy(100).toString() : 'N/A',
    distributableBurn: formatBigNumber(distributableBurn?.result) || 'N/A',
    burnByInvestor: formatBigNumber(burnByInvestor?.result) || 'N/A',
    manager: manager?.result?.toString() || 'N/A',
    owner: owner?.result?.toString() || 'N/A',
    totalInvestorNumber: Number(totalInvestorNumber?.result),
    claimFee: formatBigNumber(claimFee?.result) || 'N/A',
    isInvestorNotFinishCompound: isInvestorNotFinishCompound?.result,
    bAuther: bAuther?.result,
    bTrader: bTrader?.result,
    totalContribute: formatBigNumber(totalContribute?.result, 18, 2) || 'N/A',
    burnLimitPrice: formatBigNumber(burnLimitPriceValue?.result, 18, 6) || 'N/A',
    currentPeriodTotalInvestmentAmount: formatBigNumber(currentPeriodTotalInvestmentAmount?.result, 18, 2) || 'N/A',
  }

  // Get last 5 investors
  const { data: fullInvestmentInfo } = useReadContract({
    ...novaBankToolConfig,
    functionName: 'getFullInvestmentInfo',
  })
  console.log('fullInvestmentInfo', fullInvestmentInfo)
  const [
    mergedInvestorNum,
    totalInvestAmount,
    investAmountWithdrawed,
    interestAmountWithdrawed,
    burnAmountInContract
  ] = fullInvestmentInfo || []


  const { data: investorInfo } = useReadContract({
    ...novaBankToolConfig,
    functionName: 'getInvestorInfo',
    args: [address],
    enabled: !!address,
  })
  // console.log('investorInfo', investorInfo)

  const maxInvestmentPerPeroid = 30000;
  const defaultHoursPerPeroid = 6;
  const dailyMaxInvestment = {
    '2025-12-09': {
      investmentLimit: 30000,
      hoursPerPeroid: 6
    },
    '2025-12-10': {
      investmentLimit: 30000,
      hoursPerPeroid: 6
    },
    '2025-12-11': {
      investmentLimit: 30000,
      hoursPerPeroid: 6
    },
    '2025-12-12': {
      investmentLimit: 30000,
      hoursPerPeroid: 6
    },
    '2025-12-13': {
      investmentLimit: 30000,
      hoursPerPeroid: 6
    }
  };
  // Get today's start and end time in seconds
  const getTodayTimeRange = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startTime = Math.floor(startOfDay.getTime() / 1000);
    const endTime = Math.floor(endOfDay.getTime() / 1000);
    // Calculate current 2-hour period of the day (0-11)
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const hoursPerPeroid = dailyMaxInvestment[dateStr] ? dailyMaxInvestment[dateStr].hoursPerPeroid : defaultHoursPerPeroid;
    const currentPeriod = Math.floor((now.getHours() * 60 + now.getMinutes()) / (hoursPerPeroid * 60));
    const currentPeriodStartTime = startTime + currentPeriod * hoursPerPeroid * 3600;
    const currentPeriodEndTime = currentPeriodStartTime + hoursPerPeroid * 3600;
    // Get today's date string in YYYY-MM-DD format

    return {
      startTime,
      endTime,
      dateStr: `${dateStr}`,
      currentPeriodStartTime,
      currentPeriodEndTime
    };
  };

  const { startTime: todayStartTime, endTime: todayEndTime, dateStr: today, currentPeriodStartTime, currentPeriodEndTime } = getTodayTimeRange();

  const oneDaySeconds = 24 * 3600;
  const { data: investAmountDaily } = useReadContract({
    ...novaBankToolConfig,
    functionName: 'calculateTotalInvestAmount',
    args: [currentPeriodStartTime, currentPeriodEndTime],
    enabled: mergedInvestorNum > 0
  })
  const getMaxInvestmentInPeriod = (date) => {
    return dailyMaxInvestment[date] ? dailyMaxInvestment[date].investmentLimit : maxInvestmentPerPeroid;
  }

  //const [toCompoundUser, setToCompoundUser] = useState(formattedData.isInvestorNotFinishCompound) 
  const [acutalMinInvestAmount, setAcutalMinInvestAmount] = useState(0)
  const [acutalMaxInvestAmount, setAcutalMaxInvestAmount] = useState(0)
  useEffect(() => {
    if (minInvestmentAmount === undefined) return;

    setAcutalMinInvestAmount(minInvestmentAmount.result)
    setAcutalMaxInvestAmount(maxInvestmentAmount.result)
    if (formattedData.isInvestorNotFinishCompound) {
      setAcutalMinInvestAmount(minCompoundInvestment.result);
      setAcutalMaxInvestAmount(maxCompoundInvestment.result);
    }
  }, [minInvestmentAmount, maxInvestmentAmount, minCompoundInvestment, maxCompoundInvestment])

  const [leftInvestmentToday, setLeftInvestmentToday] = useState(new BigNumber(0))
  const [bExceedInvestmentToday, setBExceedInvestmentToday] = useState(false)

  useEffect(() => {
    let leftAmount = getMaxInvestmentInPeriod(today);
    if (mergedInvestorNum > 0) {
      if (investAmountDaily === undefined || acutalMinInvestAmount === undefined || acutalMaxInvestAmount === undefined) return;
      leftAmount = getMaxInvestmentInPeriod(today) - new BigNumber(investAmountDaily).shiftedBy(-18).toNumber();
    }

    setLeftInvestmentToday(leftAmount);
    setBExceedInvestmentToday(leftAmount < new BigNumber(acutalMinInvestAmount).shiftedBy(-18).toNumber());
    console.log('left investment amount:', leftAmount.toString(), new BigNumber(acutalMinInvestAmount).shiftedBy(-18).toNumber())
  }, [investAmountDaily, acutalMinInvestAmount, acutalMaxInvestAmount])

  const [
    bInvestable,                // 是否可投资
    yourInvestAmount,           // 你的投资额
    interestRateDaliy,          // 利率
    withdrawableInterestAmount, // 可提取的利息
    withdrawPricipalTime,       // 本金可提取时间 
    yourReferTotalAmount,       // 你推荐的投资总额（包含二级）
    yourReferBurnAmount,        // 你推荐的Burn总奖励（包含一二级）
    yourReferUsdtAmount,        // 你推荐的Usdt总奖励（包含一二级）
    yourTotalPerformance,       // 你的总业绩
    yourTotalExtraRewards,      // 你的总推荐奖励
  ] = investorInfo || []

  const [lastInvestorsQueries, setLastInvestorsQueries] = useState([])
  useEffect(() => {
    const investorQueries = []
    if (formattedData.totalInvestorNumber) {
      const investorNumber = formattedData.totalInvestorNumber;
      const numToFetch = Math.min(5, investorNumber)
      for (let i = investorNumber - 1; i >= investorNumber - numToFetch; i--) {
        investorQueries.push({
          ...novaBankConfig,
          functionName: 'investors',
          args: [i],
        })
      }
      setLastInvestorsQueries(investorQueries);
    }
  }, [formattedData.totalInvestorNumber])

  // 统计某时间范围内的投资者
  const [tempInvestorQueries, setTempInvestorQueries] = useState([])
  useEffect(() => {
    const fromIndex = 0;  // 注释 
    const toIndex = 460;
    const investorQueries = []
    for (let i = fromIndex; i < toIndex; i++) {
      investorQueries.push({
        ...novaBankConfig,
        functionName: 'investors',
        args: [i],
      })
    }
    // setTempInvestorQueries(investorQueries);  // 注释 1
  }, [])

  const { data: tempInvestors } = useReadContracts({
    contracts: tempInvestorQueries,
    enabled: !!tempInvestorQueries?.length
  })

  useEffect(() => {
    if (tempInvestors === undefined) return;

    let result = ""
    tempInvestors.map(investor => result += investor.result + ',')
    //console.log('tempInvestors', result);
  }, [tempInvestors])

  // 统计某时间范围内的投资者
  const [tempInvestorReferrersQueries, setTempInvestorReferrersQueries] = useState([])
  useEffect(() => {
    const fromIndex = 1460;
    const toIndex = 1904;
    const queries = []
    for (let i = fromIndex; i < toIndex; i++) {
      queries.push({
        ...novaBankConfig,
        functionName: 'investors',
        args: [i],
      })
    }
    //setTempInvestorReferrersQueries(queries);
  }, [])

  const { data: tempInvestorReferrers } = useReadContracts({
    contracts: tempInvestorReferrersQueries,
    enabled: !!tempInvestorReferrersQueries?.length
  })

  useEffect(() => {
    if (tempInvestorReferrers === undefined) return;
    console.log('referrer', tempInvestorReferrers)
    const queries = []
    tempInvestorReferrers.forEach(investor => {
      queries.push({
        ...novaBankConfig,
        functionName: 'referrals',
        args: [investor.result],
      })
    })
    //setTempReferralQueries(queries);
  }, [tempInvestorReferrers])

  const [tempReferralQueries, setTempReferralQueries] = useState([])
  const { data: tempReferralInfos } = useReadContracts({
    contracts: tempReferralQueries,
    enabled: !!tempReferralQueries?.length
  })

  useEffect(() => {
    if (tempReferralInfos === undefined) return;

    const referralStat = {}
    tempReferralInfos.map(referralInfo => {
      console.log('referrer', referralInfo.result[0])
      const referralAddr = referralInfo.result[0];
      if (referralStat[referralAddr]) {
        referralStat[referralAddr] += 1;
      } else {
        referralStat[referralAddr] = 1;
      }
    })
    console.log('Referrers with 10+ referrals:')
    const goodAddr = []
    Object.entries(referralStat).forEach(([address, count]) => {
      if (count >= 10) {
        console.log(`${address}: ${count} referrals`)
        goodAddr.push(address);
      }
    })
    console.log(goodAddr);
  }, [tempReferralInfos])

  const { data: lastInvestors } = useReadContracts({
    contracts: lastInvestorsQueries,
    enabled: !!lastInvestorsQueries?.length
  })

  // First, add this new contract read for referrers
  const { data: referrersData } = useReadContract({
    ...novaBankConfig,
    functionName: 'getReferrers',
    args: [address],
    enabled: !!address,
  })

  const { data: withdrawableExtraRewards } = useReadContract({
    ...novaBankConfig,
    functionName: 'calculateWithdrawableExtraRewards',
    args: [address],
    enabled: !!address,
  })

  const [yourWithrawnExtraRewards, setYourWithrawnExtraRewards] = useState(new BigNumber(0));
  useEffect(() => {
    if (yourTotalExtraRewards === undefined || withdrawableExtraRewards === undefined) return;

    setYourWithrawnExtraRewards(new BigNumber(yourTotalExtraRewards).minus(new BigNumber(withdrawableExtraRewards)));
  }, [yourTotalExtraRewards, withdrawableExtraRewards])

  const [
    investmentInfos,
    performances,
  ] = referrersData || []

  const [isExpanded, setIsExpanded] = useState(false)

  // Add a new component for the referral table
  const ReferralRow = ({ investment, level = 0 }) => {
    if (level > 1) return;

    const { data: subReferrers } = useReadContract({
      ...novaBankConfig,
      functionName: 'getReferrers',
      args: [investment.user],
      enabled: isExpanded,
    })

    const [
      investmentInfos,
      performances,
    ] = subReferrers || []

    return (
      <>
        <div
          className="web3-table-row-grid"
          onClick={() => level == 0 ? setIsExpanded(!isExpanded) : ''}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px',
            cursor: 'pointer',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            backgroundColor: isExpanded && level === 0 ? 'rgba(0, 242, 234, 0.05)' : 'transparent',
            alignItems: 'center'
          }}
        >
          <HStack style={{ paddingLeft: `${level * 20}px`, flex: 1 }}>
            {level == 0 ? <span style={{ color: TECH_COLORS.primary, marginRight: '8px' }}>{isExpanded ? '▼' : '▶'}</span> : ''}
            <CopyableAddress address={investment.user} />
          </HStack>
          <div style={{ flex: 1 }}>{formatBigNumber(investment.performance, 18, 2)}</div>
          <div className="desktop-only" style={{ flex: 1 }}>{formatBigNumber(investment.usdtAmount, 18, 2)}</div>
          <div className="desktop-only" style={{ flex: 1 }}>{new Date(Number(investment.startTime) * 1000).toLocaleString()}</div>
        </div>

        {isExpanded && investmentInfos?.length > 0 && (
          <div className="web3-subtable">
            {investmentInfos.map((investmentInfo, index) => ({ ...investmentInfo, performance: performances[index] })).map((subInvestment, index) => (
              <ReferralRow
                key={`${subInvestment.user}-${index}`}
                investment={subInvestment}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </>
    )
  }

  const { language } = useLanguage()
  const t = translations[language]

  // Add state for BURN/USDT price
  const [burnPrice, setBurnPrice] = useState(null)

  // Get BURN price (price of 1 BURN in USDT)
  const { data: burnPriceData, refetch: refetchBurnPrice } = useReadContract({
    ...novaBankConfig,
    functionName: 'getExpectedUsdtAmount',
    args: [BigInt(1e18)], // 1 BURN = 1e18 (18 decimals)
    enabled: true,
  })

  // Effect for periodic price updates
  useEffect(() => {
    // Update price immediately
    if (burnPriceData) {
      setBurnPrice(formatBigNumber(burnPriceData, 18, 2))
    }

    // Set up periodic updates
    const intervalId = setInterval(() => {
      refetchBurnPrice()
    }, 3000) // 3 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId)
  }, [burnPriceData, refetchBurnPrice])

  // Optional: Add effect for logging price updates
  useEffect(() => {
    if (burnPrice) {
      console.log('Current BURN price in USDT:', burnPrice)
    }
  }, [burnPrice])

  const calculateBurnValue = (burnAmount) => {
    return new BigNumber(burnAmount)
      .multipliedBy(new BigNumber(burnPrice))
      .toFixed(2);
  }
  // Calculate total USDT value of BURN
  const burnTotalValue = useMemo(() => {
    if (!burnAmountInContract || !burnPrice) return 'N/A';

    return new BigNumber(burnAmountInContract.toString())
      .multipliedBy(new BigNumber(burnPrice))
      .dividedBy(new BigNumber(10).pow(18)) // Adjust for both BURN and price decimals (18 + 18)
      .toFixed(2);
  }, [burnAmountInContract, burnPrice])

  const minBurnInvestAmount = useMemo(() => {
    if (!acutalMinInvestAmount || !burnPrice) return 'N/A';

    return new BigNumber(acutalMinInvestAmount.toString())
      .shiftedBy(-18)
      .dividedBy(burnPrice)
      .toFixed(2);
  }, [acutalMinInvestAmount, burnPrice])

  const maxBurnInvestAmount = useMemo(() => {
    if (!acutalMaxInvestAmount || !burnPrice) return 'N/A';

    return new BigNumber(acutalMaxInvestAmount.toString())
      .shiftedBy(-18)
      .dividedBy(burnPrice)
      .toFixed(2);
  }, [acutalMaxInvestAmount, burnPrice])

  // Add these new state variables and handlers
  const [isUsdtModalOpen, setIsUsdtModalOpen] = useState(false)
  const [isBurnModalOpen, setIsBurnModalOpen] = useState(false)
  const [investAmount, setInvestAmount] = useState('')
  const toast = useToast()

  // Add these new states
  const [txPending, setTxPending] = useState(false)
  const [referrer, setReferrer] = useState('')  // Move referrer state here

  // Add separate states for transaction hashes
  const [approvalUsdtHash, setApprovalUsdtHash] = useState(null)
  const [approvalBurnHash, setApprovalBurnHash] = useState(null)
  const [investmentHash, setInvestmentHash] = useState(null)

  // 修改交易等待逻辑
  const { isLoading: isApproveUsdtPending, isSuccess: isApproveUsdtSuccess } = useWaitForTransactionReceipt({
    hash: approvalUsdtHash,
    enabled: !!approvalUsdtHash,
  })


  // useEffect(() => {
  //   if (chainId !== 56) {
  //     toast.error(t.switchToBSC)
  //   }
  // }, [chainId])

  // 使用 useEffect 来监听交易状态
  useEffect(() => {
    if (isApproveUsdtSuccess) {
      console.log('Approval transaction succeeded')
      setNeedsApproval(false)
      handleInvest('USDT', referrer, investmentMonths)
      setApprovalUsdtHash(null)
    }
  }, [isApproveUsdtSuccess])

  // 同样的方式修改其他交易等待
  const { isLoading: isApproveBurnPending, isSuccess: isApproveBurnSuccess } = useWaitForTransactionReceipt({
    hash: approvalBurnHash,
    enabled: !!approvalBurnHash,
  })

  useEffect(() => {
    if (isApproveBurnSuccess) {
      setNeedsApproval(false)
      handleInvest('BURN', referrer, investmentMonths)
      setApprovalBurnHash(null)
    }
  }, [isApproveBurnSuccess])

  // 投资交易等待
  const { isLoading: isInvestPending, isSuccess: isInvestSuccess, isError: isInvestError } = useWaitForTransactionReceipt({
    hash: investmentHash,
    enabled: !!investmentHash,
  })

  useEffect(() => {
    if (isInvestSuccess) {
      setTxPending(false)
      setIsUsdtModalOpen(false)
      setIsBurnModalOpen(false)
      resetTransactionState()
      toast({
        title: t.investmentSuccess,
        status: 'success',
        duration: 3000,
      })
      setInvestmentHash(null)
    } else if (isInvestError) {
      setTxPending(false)
      setInvestmentHash(null)
      toast({
        title: t.investmentFailed,
        status: 'error',
        duration: 3000,
      })
    }
  }, [isInvestSuccess, isInvestError])

  const { writeContractAsync: withdraw } = useWriteContract()
  const [withdrawHash, setWithdrawHash] = useState(null)
  // 提现交易等待
  const { isLoading: isWithdrawPending, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
    enabled: !!withdrawHash,
  })

  // Update withdraw handler
  const handleWithdraw = async () => {
    if (blackList[address]) {
      toast({
        title: t.withdrawalFailed,
        status: 'error',
        duration: 3000,
      })
      return;
    }
    try {
      const originContract = novaBankConfig;
      const result = await withdraw({
        ...originContract,
        functionName: 'withdraw',
        args: [address],
        value: parseEther(formattedData.claimFee)
      })
      setWithdrawHash(result)
      toast({
        title: t.withdrawalSubmitted,
        description: t.pleaseWait,
        status: 'info',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: t.withdrawalFailed,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const { writeContractAsync: claimLeftBurn } = useWriteContract()
  const claimLeftBurnOp = async () => {
    try {
      await claimLeftBurn({
        ...novaBankConfig,
        functionName: 'claimLeftBurn'
      })
    } catch (error) {
      toast({
        title: 'Error',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const { writeContractAsync: claimBurnEmergency } = useWriteContract()
  const claimBurnEmergencyOp = async () => {
    try {
      await claimBurnEmergency({
        ...burnLock2Config,
        functionName: 'claimBurnEmergency'
      })
    } catch (error) {
      toast({
        title: 'Error',
        status: 'error',
        duration: 3000,
      })
    }
  }


  useEffect(() => {
    if (isWithdrawSuccess) {
      toast({
        title: t.withdrawalSuccess,
        status: 'success',
        duration: 3000,
      })
      setWithdrawHash(null)
    }
  }, [isWithdrawSuccess])

  const [isManager, setIsManager] = useState(false)

  useEffect(() => {
    setIsManager(formattedData.manager
      && isAddress(formattedData.manager)
      && address?.toUpperCase() == formattedData.manager.toUpperCase())
  }, [formattedData.manager, address])

  const [isOwner, setIsOwner] = useState(false)
  useEffect(() => {
    setIsOwner(formattedData.owner
      && isAddress(formattedData.owner)
      && address?.toUpperCase() == formattedData.owner.toUpperCase())
  }, [formattedData.owner, address])

  const [isAuther, setIsAuther] = useState(false)
  useEffect(() => {
    setIsAuther(formattedData.bAuther || isOwner || isManager)
  }, [formattedData.bAuther, isOwner, isManager, address])

  const [isTrader, setIsTrader] = useState(false)
  useEffect(() => {
    setIsTrader(formattedData.bTrader || isOwner || isManager)
  }, [formattedData.bTrader, isOwner, isManager, address])

  const { data: usdtInContract } = useReadContract({
    address: formattedData.usdtToken,
    abi: erc20.abi,
    functionName: 'balanceOf',
    args: [novaBank.address],
    enabled: !!formattedData.usdtToken && formattedData.usdtToken !== 'N/A',
  })
  console.log('usdtInContract', usdtInContract)

  // Add allowance reads
  const { data: usdtAllowance } = useReadContract({
    address: formattedData.usdtToken,
    abi: erc20.abi,
    functionName: 'allowance',
    args: [address, novaBank.address],
    enabled: !!address && !!formattedData.usdtToken && formattedData.usdtToken !== 'N/A',
  })

  const { data: burnAllowance } = useReadContract({
    address: formattedData.burnToken,
    abi: erc20.abi,
    functionName: 'allowance',
    args: [address, novaBank.address],
    enabled: !!address && !!formattedData.burnToken && formattedData.burnToken !== 'N/A',
  })

  const burnLock2Config = {
    address: pinkLock.address,
    abi: pinkLock.abi,
  }

  const { data: bl2UserLockedAmount } = useReadContract({
    ...burnLock2Config,
    functionName: 'getLockedAmount',
    args: [address],
    enabled: !!address,
  })

  const { data: bl2UserWithdrawableAmount } = useReadContract({
    ...burnLock2Config,
    functionName: 'getWithdrawableAmount',
    args: [address],
    enabled: !!address,
  })

  const { data: bl2UserLockInfo } = useReadContract({
    ...burnLock2Config,
    functionName: 'userLockInfo',
    args: [address],
    enabled: !!address,
  })

  // Unlock Logic
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false)
  const [unlockAmount, setUnlockAmount] = useState('')
  const { writeContractAsync: unlockBurn } = useWriteContract()
  const [unlockHash, setUnlockHash] = useState(null)

  const { isLoading: isUnlockPending, isSuccess: isUnlockSuccess } = useWaitForTransactionReceipt({
    hash: unlockHash,
    enabled: !!unlockHash,
  })

  useEffect(() => {
    if (isUnlockSuccess) {
      setIsUnlockModalOpen(false)
      setUnlockAmount('')
      toast({
        title: t.unlockSuccess || 'Unlock successful!',
        status: 'success',
        duration: 3000,
      })
      setUnlockHash(null)
    }
  }, [isUnlockSuccess])

  const handleUnlockSubmit = async () => {
    const amount = Number(unlockAmount)
    const maxAmount = Number(formatBigNumber(bl2UserWithdrawableAmount, 18, 6))

    if (isNaN(amount) || amount <= 0) {
      toast({ title: t.invalidAmount || 'Invalid amount', status: 'error' })
      return
    }
    if (amount > maxAmount) {
      toast({ title: t.insufficientBalance || 'Insufficient balance', status: 'error' })
      return
    }

    try {
      const result = await unlockBurn({
        ...burnLock2Config,
        functionName: 'unlock',
        args: [parseUnits(amount.toString(), 18)],
      })
      setUnlockHash(result)
    } catch (error) {
      toast({ title: 'Unlock failed', description: error.message, status: 'error' })
    }
  }

  // Update contract writes
  const { writeContractAsync: approveUsdt, data: approveTxUsdt } = useWriteContract()
  const { writeContractAsync: approveBurn, data: approveTxBurn } = useWriteContract()
  const { writeContractAsync: investUsdt, data: investUsdtTx } = useWriteContract()
  const { writeContractAsync: investBurn, data: investBurnTx } = useWriteContract()

  // Update handleInvestSubmit to use BigInt comparison
  const handleInvestSubmit = async (type, referrer, months = '3') => {
    const amount = Number(investAmount)
    const min = type === 'BURN' ? Number(minBurnInvestAmount) : Number(formatBigNumber(acutalMinInvestAmount, 18, 0))
    const max = type === 'BURN' ? Number(maxBurnInvestAmount) : Number(formatBigNumber(acutalMaxInvestAmount, 18, 0))

    // Validate amount
    if (isNaN(amount) || amount < min || amount > max) {
      toast({
        title: t.invalidAmount,
        description: `${t.amountBetween} ${min} - ${max}`,
        status: 'error',
        duration: 3000,
      })
      return
    }

    const usdtAmount = type === 'BURN' ? calculateBurnValue(amount) : amount;
    if (usdtAmount > leftInvestmentToday && type === 'USDT') {
      toast({
        title: t.invalidAmount,
        description: `${t.exceedRemainingDailyQuota} ${leftInvestmentToday}`,
        status: 'error',
        duration: 3000,
      })
      return
    }

    // Validate referrer address if provided
    if (referrer && !isAddress(referrer)) {
      toast({
        title: t.invalidReferrer,
        description: t.invalidAddressFormat,
        status: 'error',
        duration: 3000,
      })
      return
    }

    const parsedAmount = '0x' + new BigNumber(amount).shiftedBy(18).toString(16);
    const currentAllowance = type === 'BURN' ? burnAllowance : usdtAllowance

    console.log('approve', type, currentAllowance, parsedAmount);
    if (!currentAllowance || currentAllowance < parsedAmount) {
      // Need approval first
      try {
        const result = await (type === 'BURN' ?
          approveBurn({
            address: formattedData.burnToken,
            abi: erc20.abi,
            functionName: 'approve',
            args: [novaBank.address, parsedAmount],
          }) :
          approveUsdt({
            address: formattedData.usdtToken,
            abi: erc20.abi,
            functionName: 'approve',
            args: [novaBank.address, parsedAmount],
          })
        )
        type === 'BURN' ? setApprovalBurnHash(result) : setApprovalUsdtHash(result)
      } catch (error) {
        console.log(error.message)
        toast({
          title: t.approvalFailed,
          status: 'error',
          duration: 3000,
        })
      }
    } else {
      // Already approved, invest directly
      handleInvest(type, referrer, months)
    }
  }

  // Update handleInvest to include months parameter
  const handleInvest = async (type, referrer, months = '3') => {
    setTxPending(true)
    const parsedAmount = parseUnits(investAmount.toString(), 18)
    const referrerAddress = referrer || zeroAddress
    const investmentMonths = parseInt(months) || 3

    try {
      const result = await (type === 'BURN' ?
        investBurn({
          ...novaBankConfig,
          functionName: 'investBurn',
          args: [parsedAmount, referrerAddress, investmentMonths],
        }) :
        investUsdt({
          ...novaBankConfig,
          functionName: 'investUsdt',
          args: [parsedAmount, referrerAddress, investmentMonths],
        })
      )
      setInvestmentHash(result)
    } catch (error) {
      setTxPending(false)
      console.log(error.message)
      toast({
        title: t.investmentFailed,
        description: t.approvalFailed,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // Add state reset function
  const resetTransactionState = () => {
    setTxPending(false)
    setInvestAmount('')
    setReferrer('')
    setInvestmentMonths('3') // Reset investment months
  }

  const [needsApproval, setNeedsApproval] = useState(false)

  // Effect to check allowance when amount changes
  useEffect(() => {
    if (!investAmount || !address) return

    const checkAllowance = async () => {
      const parsedAmount = parseUnits(investAmount.toString(), 18)
      const usdtNeeds = !usdtAllowance || usdtAllowance < parsedAmount
      const burnNeeds = !burnAllowance || burnAllowance < parsedAmount
      setNeedsApproval(isUsdtModalOpen ? usdtNeeds : burnNeeds)
    }

    checkAllowance()
  }, [investAmount, usdtAllowance, burnAllowance, address, isUsdtModalOpen])

  // Inside the Home component, add these new states and contract write
  const { writeContractAsync: claimRewards } = useWriteContract()
  const [claimPreRewardsHash, setClaimPreRewardsHash] = useState(null)

  // Add transaction receipt watcher
  const { isLoading: isClaimRewardsPending, isSuccess: claimPreRewardsSuccess } = useWaitForTransactionReceipt({
    hash: claimPreRewardsHash,
    enabled: !!claimPreRewardsHash
  })

  const [claimNewRewardsHash, setClaimNewRewardsHash] = useState(null)
  const { isLoading: isClaimNewRewardsPending } = useWaitForTransactionReceipt({
    hash: claimNewRewardsHash,
    enabled: !!claimNewRewardsHash
  })

  // Add claim rewards handler
  const handleClaimRewards = async () => {
    if (blackList[address]) {
      toast({
        title: t.claimRewardsFailed,
        status: 'error',
        duration: 3000,
      })
      return;
    }
    try {
      if (Number(withdrawableInterestAmount) > 0) {
        const result = await claimRewards({
          ...novaBankConfig,
          functionName: 'claimRewards',
          args: [address],
          value: parseEther(formattedData.claimFee)
        })
        setClaimNewRewardsHash(result);
      } else {
        toast({
          title: "提示",
          description: `info: ${withdrawableInterestAmount}`,
          status: 'info',
          duration: 3000,
        })
      }

      addUserAddressToStorage(address);
    } catch (error) {
      toast({
        title: t.claimRewardsFailed,
        description: `error info: ${error.message}`,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // claim interest from new contract after claim preContract successfully
  useEffect(() => {
    if (claimPreRewardsSuccess) {
      claimRewards({
        ...novaBankConfig,
        functionName: 'claimRewards',
        args: [address],
        value: parseEther(formattedData.claimFee)
      }).then(result => {
        setClaimNewRewardsHash(result);
      })
    }
  }, [claimPreRewardsSuccess])

  // Add these new states and contract write
  const { writeContractAsync: claimExtraRewards } = useWriteContract()
  const [claimExtraRewardsHash, setClaimExtraRewardsHash] = useState(null)

  // Add transaction receipt watcher
  const { isLoading: isClaimExtraRewardsPending, isSuccess: claimExtraRewardSuccess } = useWaitForTransactionReceipt({
    hash: claimExtraRewardsHash,
    enabled: !!claimExtraRewardsHash
  })

  // 使用 useEffect 来监听交易状态
  useEffect(() => {
    if (claimExtraRewardSuccess) {
      setClaimExtraRewardsHash(null);
    }
  }, [claimExtraRewardSuccess])

  // Add claim extra rewards handler
  const handleClaimExtraRewards = async () => {
    try {
      if (new BigNumber(withdrawableExtraRewards).gt(0)) {
        const result = await claimExtraRewards({
          ...novaBankConfig,
          functionName: 'claimExtraRewards',
          value: parseEther(formattedData.claimFee),
          args: [address, '0x' + new BigNumber(withdrawableExtraRewards).toString(16)]
        })
        setClaimExtraRewardsHash(result)
      }
    } catch (error) {
      toast({
        title: t.claimExtraRewardsFailed,
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const { writeContractAsync: setTeams } = useWriteContract()
  const setWorkShop = async () => {
    try {
      await setTeams({
        ...novaBankConfig,
        functionName: 'setTeams',
        args: [teamAddresses, bValidTeam]
      })
    } catch (error) {
      toast({
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // Update the queries to get investment info for last investors
  const lastInvestorInvestmentQueries = lastInvestors?.map(investor => ({
    ...novaBankToolConfig,
    functionName: 'getInvestorInfo',
    args: [investor.result], // Use investor's address
  })) || []

  const { data: lastInvestorInvestments } = useReadContracts({
    contracts: lastInvestorInvestmentQueries,
    enabled: !!lastInvestorInvestmentQueries?.length,
  })

  useEffect(() => {
    if (!lastInvestors) return;

    console.log('lastInvestors', lastInvestors)
  }, [lastInvestors])

  useEffect(() => {
    if (!lastInvestorInvestments) return;

    console.log('lastInvestors Investments', lastInvestorInvestments)
  }, [lastInvestorInvestments])

  // Add these new states and contract write
  const { writeContractAsync: withdrawIncentive } = useWriteContract()
  const [withdrawIncentiveHash, setWithdrawIncentiveHash] = useState(null)

  // Add transaction receipt watcher
  const { isLoading: isWithdrawIncentivePending } = useWaitForTransactionReceipt({
    hash: withdrawIncentiveHash,
    onSuccess: () => {
      toast({
        title: t.withdrawIncentiveSuccess,
        status: 'success',
        duration: 3000,
      })
      setWithdrawIncentiveHash(null)
    },
    enabled: !!withdrawIncentiveHash
  })

  // Add withdraw incentive handler
  const handleWithdrawIncentive = async () => {
    try {
      const result = await withdrawIncentive({
        ...novaBankConfig,
        functionName: 'withdrawIncentiveForInvestors',
      })
      setWithdrawIncentiveHash(result)
      toast({
        title: t.withdrawIncentiveSubmitted,
        description: t.pleaseWait,
        status: 'info',
        duration: 3000,
      })
    } catch (error) {
      toast({
        description: t.withdrawIncentiveFailed,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const calculateTimeLeft = (startTime, maxIdleDuration) => {
    if (!startTime || !maxIdleDuration) return null;

    const deadline = Number(startTime) + Number(maxIdleDuration);
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = deadline - now;

    if (timeLeft <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const days = Math.floor(timeLeft / (24 * 60 * 60));
    const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((timeLeft % (60 * 60)) / 60);
    const seconds = timeLeft % 60;

    return { days, hours, minutes, seconds };
  }

  // Add this new state
  const [timeLeft, setTimeLeft] = useState(null);
  const threeMonthTime = 90 * 24 * 3600;
  // Add this effect to update the countdown
  useEffect(() => {
    if (!lastInvestorInvestments?.length || !maxIdleDuration?.result) return;

    const lastInvestment = lastInvestorInvestments[0].result;
    const startTime = Number(lastInvestment?.[4]) - threeMonthTime; // Get start time from the investment

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(startTime, parseInt(formattedData.maxIdleDuration));
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [lastInvestorInvestments, maxIdleDuration]);

  const isTimeExpired = () => {
    if (!timeLeft) return false;
    return timeLeft.days === 0 &&
      timeLeft.hours === 0 &&
      timeLeft.minutes === 0 &&
      timeLeft.seconds === 0;
  }

  const demo = async () => {
    setIsClaiming(true);
    await executeTx({
      address: burnBuildContract.address,
      abi: burnBuildContract.abi,
      functionName: 'receiveRewards',
      args: [address],
    }, "Claim rewards successfully", "Fail to claim rewards");
    setIsClaiming(false);
  }

  const executeTx = async (parameters, successInfo, failInfo) => {
    try {
      //parameters.connector = connector;
      const hash = await writeContract(config, parameters);
      const receipt = await waitForTransactionReceipt(config, { hash });
      if (receipt.status != 'success') {
        return false;
      }
      toast({
        title: 'Success',
        description: successInfo,
        status: 'success',
        position: 'bottom-right',
        isClosable: true,
      });
      return true;
    } catch (error) {
      console.log(error)
      toast({
        title: 'Failed',
        description: failInfo + ":" + error.message,
        status: 'error',
        position: 'bottom-right',
        isClosable: true,
      });
      return false;
    }
  }

  // Update the useEffect that handles URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && isAddress(ref)) {
      setReferrer(ref);
      // Store the referrer in localStorage
      localStorage.setItem(REFERRER_STORAGE_KEY, ref);
    } else {
      // If no URL param, try to get from localStorage
      const storedReferrer = localStorage.getItem(REFERRER_STORAGE_KEY);
      if (storedReferrer && isAddress(storedReferrer)) {
        setReferrer(storedReferrer);
      }
    }
  }, []);

  // Update the modal open handlers
  const handleOpenUsdtModal = () => {
    const storedReferrer = localStorage.getItem(REFERRER_STORAGE_KEY);
    if (storedReferrer && isAddress(storedReferrer) && !referrer) {
      setReferrer(storedReferrer);
    }
    setIsUsdtModalOpen(true);
  };

  const handleOpenBurnModal = () => {
    const storedReferrer = localStorage.getItem(REFERRER_STORAGE_KEY);
    if (storedReferrer && isAddress(storedReferrer) && !referrer) {
      setReferrer(storedReferrer);
    }
    setIsBurnModalOpen(true);
  };

  // Add this new function near the top of the component
  const copyReferralLink = () => {
    try {
      const baseUrl = getCurrentPageUrl();
      const separator = baseUrl.includes('?') ? '&' : '?';
      const referralLink = `${baseUrl}${separator}ref=${address}`;
      copy(referralLink);
      toast({
        title: t.referralLinkCopied || 'Referral link copied!',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: t.failToCopy,
        description: err,
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Add these new state variables near the top of the component
  const [isWorkshopModalOpen, setIsWorkshopModalOpen] = useState(false)
  const [teamAddresses, setTeamAddresses] = useState('')

  const handleWorkshopClose = () => {
    setTeamAddresses('')
    setIsWorkshopModalOpen(false)
  }

  // Add these new states for transaction handling
  const [setWorkshopHash, setSetWorkshopHash] = useState(null)
  const { isLoading: isSettingWorkshop } = useWaitForTransactionReceipt({
    hash: setWorkshopHash,
    onSuccess: () => {
      toast({
        title: t.setWorkshopSuccess,
        status: 'success',
        duration: 3000,
      })
      setSetWorkshopHash(null)
      setIsWorkshopModalOpen(false)
      setTeamAddresses('')
    },
    enabled: !!setWorkshopHash
  })

  // Add this handler function
  const handleSetWorkshop = async (bValidTeam) => {
    const teamAddressList = teamAddresses.split(',')
    for (const teamAddress of teamAddressList) {
      if (!isAddress(teamAddress)) {
        toast({
          title: t.invalidAddress,
          status: 'error',
          duration: 3000,
        })
        return
      }
    }

    try {
      const result = await setTeams({
        ...novaBankConfig,
        functionName: 'setTeams',
        args: [teamAddressList, bValidTeam]
      })
      setSetWorkshopHash(result)
    } catch (error) {
      toast({
        title: t.setWorkshopFailed,
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // Add new state for investment months
  const [investmentMonths, setInvestmentMonths] = useState('3')

  // 获取用户的推荐人地址
  const { data: referralData } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'referrals',
    args: [address],
    enabled: !!address,
  });

  const referrerAddress = referralData ? referralData[0] : zeroAddress;

  // 在UI中禁用推荐人输入框
  const isReferrerDisabled = referrerAddress !== zeroAddress;

  // Add this hook for the collapsible component
  const { isOpen: isBurnLockOpen, onToggle: onBurnLockToggle } = useDisclosure()
  const { isOpen: isBurnLock2Open, onToggle: onBurnLock2Toggle } = useDisclosure()

  // 添加复投相关状态
  const [isCompoundModalOpen, setIsCompoundModalOpen] = useState(false)
  const [compoundType, setCompoundType] = useState('principal') // 'principal' or 'principalInterest'
  const [compoundMonths, setCompoundMonths] = useState('3')

  // 添加复投合约写入和交易状态
  const { writeContractAsync: reinvestBurn } = useWriteContract()
  const [compoundHash, setCompoundHash] = useState(null)

  const { isLoading: isCompoundPending, isSuccess: isCompoundSuccess, isError: isCompoundError } = useWaitForTransactionReceipt({
    hash: compoundHash,
    enabled: !!compoundHash,
  })

  // 复投交易状态处理
  useEffect(() => {
    if (isCompoundSuccess) {
      setIsCompoundModalOpen(false)
      setCompoundType('principal')
      setCompoundMonths('3')
      toast({
        title: t.compoundSuccess,
        status: 'success',
        duration: 3000,
      })
      setCompoundHash(null)
    } else if (isCompoundError) {
      setCompoundHash(null)
      toast({
        title: t.compoundFailed,
        status: 'error',
        duration: 3000,
      })
    }
  }, [isCompoundSuccess, isCompoundError])

  // 复投处理函数
  const handleCompound = async () => {
    try {
      const includeInterest = compoundType === 'principalInterest'
      const months = parseInt(compoundMonths)

      const result = await reinvestBurn({
        ...novaBankConfig,
        functionName: 'reinvestBurn',
        args: [includeInterest, months],
        value: parseEther(formattedData.claimFee)
      })

      setCompoundHash(result)
      toast({
        title: t.compoundSubmitted,
        status: 'info',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: t.compoundFailed,
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 在现有的合约读取中添加检查用户是否为团队成员
  const { data: isTeamMember } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'teams',
    args: [address],
    enabled: !!address,
  })

  // 在现有的状态管理部分添加新的状态（约第1546行附近）
  const [isMarketMakingModalOpen, setIsMarketMakingModalOpen] = useState(false)
  const [buyBurnAmount, setBuyBurnAmount] = useState('1000')
  
  // 设置BURN上限价格的状态
  const [isBurnLimitPriceModalOpen, setIsBurnLimitPriceModalOpen] = useState(false)
  const [burnLimitPriceInput, setBurnLimitPriceInput] = useState('')

  // 获取当前自动交易状态
  const { data: autoSwapStatus } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'autoSwapUsdt2Burn',
    enabled: !!address,
  })

  // 添加合约写入功能
  const { writeContractAsync: setAutoSwap } = useWriteContract()
  const { writeContractAsync: buyBurnWithUsdt } = useWriteContract()
  const [marketMakingHash, setMarketMakingHash] = useState(null)

  const { isLoading: isMarketMakingPending } = useWaitForTransactionReceipt({
    hash: marketMakingHash,
    onSuccess: () => {
      toast({
        title: '操作成功',
        status: 'success',
        duration: 3000,
      })
      setMarketMakingHash(null)
    },
    enabled: !!marketMakingHash
  })

  // 处理自动交易开关
  const handleToggleAutoSwap = async () => {
    try {
      const result = await setAutoSwap({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setAutoSwap',
        args: [!autoSwapStatus]
      })
      setMarketMakingHash(result)
      toast({
        title: '交易已提交',
        description: '请等待交易确认',
        status: 'info',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: '操作失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 处理手动购买BURN
  const handleBuyBurn = async () => {
    if (!buyBurnAmount || isNaN(buyBurnAmount) || Number(buyBurnAmount) <= 0) {
      toast({
        title: '输入错误',
        description: '请输入有效的USDT数量',
        status: 'error',
        duration: 3000,
      })
      return
    }
    if (Number(buyBurnAmount) >= 10000) {
      toast({
        title: '输入错误',
        description: 'USDT数量必须小于10000',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      const result = await buyBurnWithUsdt({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'buyBurn',
        args: [parseUnits(buyBurnAmount.toString(), 18)]
      })
      setMarketMakingHash(result)
      toast({
        title: '购买交易已提交',
        description: '请等待交易确认',
        status: 'info',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: '购买失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 关闭对话框时重置状态
  const handleMarketMakingClose = () => {
    setBuyBurnAmount('')
    setIsMarketMakingModalOpen(false)
  }

  // 设置BURN上限价格的合约写入功能
  const { writeContractAsync: setBurnLimitPrice } = useWriteContract()
  const [burnLimitPriceHash, setBurnLimitPriceHash] = useState(null)

  const { isLoading: isBurnLimitPricePending } = useWaitForTransactionReceipt({
    hash: burnLimitPriceHash,
    onSuccess: () => {
      toast({
        title: '设置成功',
        status: 'success',
        duration: 3000,
      })
      setBurnLimitPriceHash(null)
      setIsBurnLimitPriceModalOpen(false)
      setBurnLimitPriceInput('')
    },
    enabled: !!burnLimitPriceHash
  })

  // 处理设置BURN上限价格
  const handleSetBurnLimitPrice = async () => {
    if (!burnLimitPriceInput || isNaN(burnLimitPriceInput) || Number(burnLimitPriceInput) <= 0) {
      toast({
        title: '输入错误',
        description: '请输入有效的价格',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      const result = await setBurnLimitPrice({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setBurnLimitPrice',
        args: [parseUnits(burnLimitPriceInput.toString(), 18)]
      })
      setBurnLimitPriceHash(result)
      toast({
        title: '交易已提交',
        description: '请等待交易确认',
        status: 'info',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 打开设置BURN上限价格对话框时设置初始值
  const handleOpenBurnLimitPriceModal = () => {
    if (formattedData.burnLimitPrice && formattedData.burnLimitPrice !== 'N/A') {
      setBurnLimitPriceInput(formattedData.burnLimitPrice)
    }
    setIsBurnLimitPriceModalOpen(true)
  }

  // 关闭设置BURN上限价格对话框时重置状态
  const handleBurnLimitPriceClose = () => {
    setBurnLimitPriceInput('')
    setIsBurnLimitPriceModalOpen(false)
  }

  // 在现有的状态管理部分添加新的状态（约第1687行附近）
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
  const [refundAddress, setRefundAddress] = useState('')
  const [refundUserIndex, setRefundUserIndex] = useState('') // 改为单个用户编号
  const [refundBurnPrice, setRefundBurnPrice] = useState('')

  // 添加合约写入功能（约第1699行附近）
  const { writeContractAsync: withdrawAllForRefund } = useWriteContract()
  const [refundHash, setRefundHash] = useState(null)

  const { isLoading: isRefundPending } = useWaitForTransactionReceipt({
    hash: refundHash,
    onSuccess: () => {
      toast({
        title: '退还操作成功',
        status: 'success',
        duration: 3000,
      })
      setRefundHash(null)
      handleRefundClose()
    },
    enabled: !!refundHash
  })

  // 修改处理退还本金操作的函数
  const handleRefund = async () => {
    if (!refundAddress || !refundUserIndex || !refundBurnPrice) {
      toast({
        title: '输入错误',
        description: '请填写所有必要信息',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (!isAddress(refundAddress)) {
      toast({
        title: '地址格式错误',
        description: '请输入有效的以太坊地址',
        status: 'error',
        duration: 3000,
      })
      return
    }

    const userIdx = parseInt(refundUserIndex)

    if (isNaN(userIdx) || userIdx < 0) {
      toast({
        title: '编号错误',
        description: '请输入有效的用户编号',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      // 验证用户地址是否匹配
      const userAddressAtIndex = await readContract(config, {
        ...novaBankConfig,
        functionName: 'investors',
        args: [userIdx]
      })

      if (userAddressAtIndex.toLowerCase() !== refundAddress.toLowerCase()) {
        toast({
          title: '账号不匹配',
          description: `编号 ${userIdx} 对应的用户地址与输入地址不符`,
          status: 'error',
          duration: 3000,
        })
        return
      }

      // 使用 fromIndex 和 toIndex = fromIndex + 1
      const result = await withdrawAllForRefund({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'settle',
        args: [userIdx, userIdx + 1, parseInt(refundBurnPrice.toString())]
      })

      setRefundHash(result)
      toast({
        title: '退还交易已提交',
        description: '请等待交易确认',
        status: 'info',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: '操作失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 修改关闭对话框时重置状态的函数
  const handleRefundClose = () => {
    setRefundAddress('')
    setRefundUserIndex('')
    setRefundBurnPrice('')
    setIsRefundModalOpen(false)
  }

  return (
    <Box minH="100vh" bg={TECH_COLORS.bg} color={TECH_COLORS.text} fontFamily="sans-serif" py={10} px={4} className="web3-container">
      <Container maxW="container.xl">
        <VStack spacing={10} align="stretch">

          {/* Main Stats Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <TechCard>
              <TechStat
                label={t.totalInvestors}
                value={formattedData.totalInvestorNumber}
                icon={FaUserFriends}
              />
            </TechCard>

            <TechCard>
              <VStack align="start" spacing={4} width="100%">
                <TechStat
                  label={t.contractBurn}
                  value={formatBigNumber(burnAmountInContract, 18, 2)}
                  subValue={`≈ ${burnTotalValue} USDT`}
                  icon={FaFire}
                />
                <Divider borderColor={TECH_COLORS.border} />
                <TechStat
                  label={t.burnPrice}
                  value={`${burnPrice} USDT`}
                  subValue="/ BURN"
                  icon={FaChartLine}
                />
              </VStack>
            </TechCard>

            <TechCard>
              <VStack align="start" spacing={4} width="100%">
                <TechStat
                  label={t.contractUsdt}
                  value={formatBigNumber(usdtInContract, 18, 2)}
                  icon={FaDollarSign}
                />
                {isTrader && (
                  <>
                    <TechButton
                      size="sm"
                      width="100%"
                      onClick={() => setIsMarketMakingModalOpen(true)}
                      fontSize="xs"
                    >
                      作市设置
                    </TechButton>
                    <TechButton
                      size="sm"
                      width="100%"
                      onClick={handleOpenBurnLimitPriceModal}
                      fontSize="xs"
                    >
                      设置BURN上限价格
                    </TechButton>
                  </>
                )}
              </VStack>
            </TechCard>

            {/* Burn Lock Stats (Merged) */}
            <TechCard>
              <VStack align="start" spacing={4} width="100%">
                <TechStat
                  label={t.totalContribteValue || 'Total Contribute Value'}
                  value={formattedData.totalContribute}
                  icon={FaGift}
                />
                <Divider borderColor={TECH_COLORS.border} />
                <TechStat
                  label={t.totalLockedAmount || "Total Locked / Unlocked"}
                  value={0}
                  icon={FaLock}
                />
              </VStack>
            </TechCard>
          </SimpleGrid>

          {/* Investment & Limits Section */}
          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
            {/* Investment Limits */}
            <TechCard gridColumn={{ lg: "span 1" }}>
              <VStack align="stretch" spacing={6}>
                <HStack justify="space-between">
                  <Text fontSize="xl" fontWeight="bold" color="black">{t.investmentLimits}</Text>
                  <Box as={BiStats} color={TECH_COLORS.primary} size="24px" />
                </HStack>

                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <Text color={TECH_COLORS.textDim}>{t.minInvestment}</Text>
                    <Text fontWeight="bold">{formatBigNumber(acutalMinInvestAmount, 18, 0)} USDT</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color={TECH_COLORS.textDim}>{t.maxInvestment}</Text>
                    <Text fontWeight="bold">{formatBigNumber(acutalMaxInvestAmount, 18, 0)} USDT</Text>
                  </HStack>
                  <Divider borderColor={TECH_COLORS.border} />
                  <HStack justify="space-between">
                    <Text color={TECH_COLORS.textDim}>{t.curPeroidMaxInvestment}</Text>
                    <Text fontWeight="bold" color={TECH_COLORS.secondary}>{getMaxInvestmentInPeriod(today)} USDT</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color={TECH_COLORS.textDim}>{t.curPeroidInvestedAmount}</Text>
                    <Text fontWeight="bold" color={TECH_COLORS.primary}>{formattedData.currentPeriodTotalInvestmentAmount} USDT</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color={TECH_COLORS.textDim}>{t.periodInterval}</Text>
                    <Text fontWeight="bold" color={TECH_COLORS.secondary}>6 {t.hours}</Text>
                  </HStack>
                </VStack>

                <TechButton
                  height="56px"
                  fontSize="lg"
                  onClick={handleOpenUsdtModal}
                  isDisabled={disableAllOp || !bInvestable || bExceedInvestmentToday}
                >
                  {t.investUsdt}
                </TechButton>
                <TechButton
                  height="56px"
                  fontSize="lg"
                  onClick={handleOpenBurnModal}
                  isDisabled={disableAllOp || !bInvestable || bExceedInvestmentToday}
                >
                  {t.investBurn || 'Invest BURN'}
                </TechButton>
              </VStack>
            </TechCard>

            {/* User Dashboard */}
            {address && (
              <Box gridColumn={{ lg: "span 2" }}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {/* Your Investment */}
                  <TechCard>
                    <VStack align="stretch" spacing={6}>
                      <HStack justify="space-between">
                        <Text fontSize="xl" fontWeight="bold" color="black">{t.yourInvestment}</Text>
                        <Box as={FaMoneyCheck} color={TECH_COLORS.primary} size="24px" />
                      </HStack>

                      <SimpleGrid columns={2} spacing={4}>
                        <VStack align="start">
                          <Text color={TECH_COLORS.textDim} fontSize="sm">{t.userType}</Text>
                          <Text fontWeight="bold">{isTeamMember ? t.workshopUser : t.regularUser}</Text>
                        </VStack>
                        <VStack align="start">
                          <Text color={TECH_COLORS.textDim} fontSize="sm">{t.usdtAmount}</Text>
                          <Text fontWeight="bold" color={TECH_COLORS.primary}>{formatBigNumber(yourInvestAmount, 18, 2)} USDT</Text>
                        </VStack>
                        <VStack align="start">
                          <Text color={TECH_COLORS.textDim} fontSize="sm">{t.interest} ({Number(interestRateDaliy) / 100}%)</Text>
                          <Text fontWeight="bold" color={TECH_COLORS.secondary}>{formatBigNumber(withdrawableInterestAmount, 18, 2)} USDT</Text>
                        </VStack>
                        <VStack align="start">
                          <Text color={TECH_COLORS.textDim} fontSize="sm">{t.withdrawableDate}</Text>
                          <Text fontWeight="bold" fontSize="xs">{withdrawPricipalTime ? new Date(Number(withdrawPricipalTime) * 1000).toLocaleString() : '-'}</Text>
                        </VStack>
                      </SimpleGrid>

                      <HStack spacing={4}>
                        <TechButton
                          flex={1}
                          onClick={handleWithdraw}
                          isLoading={isWithdrawPending}
                          isDisabled={disableBurnOut || bInvestable || isWithdrawPending || !withdrawPricipalTime || block?.timestamp < withdrawPricipalTime}
                        >
                          {isWithdrawPending ? t.withdrawing : t.withdraw}
                        </TechButton>
                        <TechButton
                          flex={1}
                          onClick={handleClaimRewards}
                          isLoading={isClaimRewardsPending || isClaimNewRewardsPending}
                          isDisabled={disableBurnOut || disableAllOp || isClaimRewardsPending || isClaimNewRewardsPending || !withdrawableInterestAmount || withdrawableInterestAmount === 0}
                          bg={TECH_COLORS.primary}
                          color="black"
                          _hover={{ bg: "#00fff7" }}
                        >
                          {isClaimRewardsPending ? t.claimingRewards : t.claimRewards}
                        </TechButton>
                      </HStack>
                    </VStack>
                  </TechCard>

                  {/* Your Contribute Value */}
                  <TechCard>
                    <VStack align="stretch" spacing={6}>
                      <HStack justify="space-between">
                        <Text fontSize="xl" fontWeight="bold" color="black">{t.yourLockInfo || 'Your Lock Info'}</Text>
                        <Box as={FaLock} color={TECH_COLORS.primary} size="24px" />
                      </HStack>

                      <SimpleGrid columns={1} spacing={4}>
                        <VStack align="start">
                          <Text color={TECH_COLORS.textDim} fontSize="sm">{t.yourLockedAmount || 'Your Locked Amount'}</Text>
                          <Text fontWeight="bold">{formatBigNumber(bl2UserLockedAmount, 18, 2)} BURN</Text>
                        </VStack>
                        <VStack align="start">
                          <Text color={TECH_COLORS.textDim} fontSize="sm">{t.yourWithdrawableAmount || 'Your Withdrawable Amount'}</Text>
                          <Text fontWeight="bold" color={TECH_COLORS.secondary}>{formatBigNumber(bl2UserWithdrawableAmount, 18, 2)} BURN</Text>
                        </VStack>
                      </SimpleGrid>

                      <TechButton
                        onClick={() => setIsUnlockModalOpen(true)}
                        isDisabled={!bl2UserWithdrawableAmount || Number(formatBigNumber(bl2UserWithdrawableAmount, 18, 6)) === 0}
                      >
                        {t.unlockBurn || 'Unlock BURN'}
                      </TechButton>
                      {
                        isManager 
                        && 
                        <TechButton
                          onClick={() => claimBurnEmergencyOp()}                          
                        >
                          {'紧急提取所有BURN'}
                        </TechButton>
                      }
                    </VStack>
                  </TechCard>

                  {/* Your Referrals */}
                  <TechCard>
                    <VStack align="stretch" spacing={6}>
                      <HStack justify="space-between">
                        <Text fontSize="xl" fontWeight="bold" color="black">{t.yourReferrals}</Text>
                        <Box as={FaUserFriends} color={TECH_COLORS.primary} size="24px" />
                      </HStack>

                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <Text color={TECH_COLORS.textDim}>{t.totalInvestValue}</Text>
                          <Text fontWeight="bold">{formatBigNumber(yourReferTotalAmount, 18, 2)} USDT</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text color={TECH_COLORS.textDim}>{t.totalBurnRewards}</Text>
                          <Text fontWeight="bold" color={TECH_COLORS.secondary}>{formatBigNumber(yourReferBurnAmount, 18, 2)} BURN</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text color={TECH_COLORS.textDim}>{t.totalUsdtRewards}</Text>
                          <Text fontWeight="bold" color={TECH_COLORS.primary}>{formatBigNumber(yourReferUsdtAmount, 18, 2)} USDT</Text>
                        </HStack>
                      </VStack>

                      <Box bg="rgba(0,0,0,0.2)" p={3} borderRadius="lg">
                        <Text color={TECH_COLORS.textDim} fontSize="xs" mb={1}>{t.yourReferralLink}</Text>
                        <HStack>
                          <Text fontSize="xs" isTruncated flex={1} color="black">
                            {address ? `${getCurrentPageUrl()}?ref=${address}` : '-'}
                          </Text>
                          <Button size="xs" onClick={copyReferralLink} isDisabled={!address}>Copy</Button>
                        </HStack>
                      </Box>
                    </VStack>
                  </TechCard>

                  {/* Your Contribute Value */}
                  <TechCard>
                    <VStack align="stretch" spacing={6}>
                      <HStack justify="space-between">
                        <Text fontSize="xl" fontWeight="bold" color="black">{t.yourContributeValue || 'Your Contribute Value'}</Text>
                        <Box as={FaGift} color={TECH_COLORS.primary} size="24px" />
                      </HStack>

                      <SimpleGrid columns={2} spacing={4}>
                        <VStack align="start">
                          <Text color={TECH_COLORS.textDim} fontSize="sm">{t.contributeValue || 'Contribute Value'}</Text>
                          <Text fontWeight="bold">{formatBigNumber(bl2UserLockedAmount, 18, 2)}</Text>
                        </VStack>
                        <VStack align="start">
                          <Text color={TECH_COLORS.textDim} fontSize="sm">{t.hasBeenAirdrop || 'Airdrop'}</Text>
                          <Text fontWeight="bold" color={TECH_COLORS.secondary}>NO</Text>
                        </VStack>
                        <VStack align="start">
                          <Text color={TECH_COLORS.textDim} fontSize="sm">{t.airdropAmount || 'Airdrop Amount'}</Text>
                          <Text fontWeight="bold" color={TECH_COLORS.primary}>{0} TOKEN</Text>
                        </VStack>
                      </SimpleGrid>
                    </VStack>
                  </TechCard>
                </SimpleGrid>
              </Box>
            )}
          </SimpleGrid>

          {/* Rewards Section */}
          {address && address != cz_address && (
            <TechCard>
              <HStack justify="space-between" mb={6}>
                <Text fontSize="xl" fontWeight="bold" color="black">{t.yourRewards}</Text>
                <Box as={BsLightningChargeFill} color={TECH_COLORS.secondary} size="24px" />
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
                <TechStat label={t.totalPerformance} value={`${formatBigNumber(yourTotalPerformance, 18, 2)} USDT`} />
                <TechStat label={t.extraRewards} value={`${formatBigNumber(yourTotalExtraRewards, 18, 2)} USDT`} />
                <TechStat label={t.withdrawedExtraRewards} value={`${formatBigNumber(yourWithrawnExtraRewards, 18, 2)} USDT`} />
                <VStack align="stretch">
                  <TechStat
                    label={t.withdrawableRewards}
                    value={`${formatBigNumber(withdrawableExtraRewards, 18, 2)} USDT`}
                    subValue={`≈ ${new BigNumber(withdrawableExtraRewards).dividedBy(burnPrice).shiftedBy(-18).toFixed(2)} BURN`}
                  />
                  <TechButton
                    size="sm"
                    mt={2}
                    onClick={handleClaimExtraRewards}
                    isLoading={isClaimExtraRewardsPending}
                    isDisabled={disableBurnOut || disableAllOp || isClaimExtraRewardsPending || !yourTotalExtraRewards || Number(yourTotalExtraRewards) === 0}
                  >
                    {t.claimExtraRewards}
                  </TechButton>
                </VStack>
              </SimpleGrid>
            </TechCard>
          )}

          {/* Manager & Lock Systems */}
          {/* <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {(isManager || isOwner || isAuther || isTrader) && (
              <TechCard>
                <Text fontSize="lg" fontWeight="bold" mb={4} color="white">Manager Controls</Text>
                <VStack spacing={4}>

                  {isManager && (
                    <TechButton width="100%" onClick={() => setIsWorkshopModalOpen(true)}>
                      {t.setWorkshop}
                    </TechButton>
                  )}
                </VStack>
              </TechCard>
            )}
          </SimpleGrid> */}

          {/* Referral Network Table */}
          {address && address != cz_address && investmentInfos?.length > 0 && (
            <TechCard>
              <Text fontSize="xl" fontWeight="bold" mb={6} color="black">{t.yourReferralNetwork}</Text>
              <Box overflowX="auto">
                <div className="web3-table">
                  <div className="web3-table-header" style={{ color: TECH_COLORS.textDim, borderBottom: `1px solid ${TECH_COLORS.border}` }}>
                    <div>{t.referrerAddress}</div>
                    <div>{t.totalPerformance}(USDT)</div>
                    <div className="desktop-only">{t.investmentAmount}(USDT)</div>
                    <div className="desktop-only">{t.startTime}</div>
                  </div>
                  {investmentInfos.map((investmentInfo, index) => ({ ...investmentInfo, performance: performances[index] }))
                    .map((investment, index) => (
                      <ReferralRow
                        key={`${investment.user}-${index}`}
                        investment={investment}
                      />
                    ))}
                </div>
              </Box>
            </TechCard>
          )}

          {/* Workshop List */}
          <TechCard maxHeight="600px" overflowY="auto">
            <HStack justify="space-between" mb={6}>
              <Text fontSize="xl" fontWeight="bold" color="black">{t.workshopList}</Text>
              {isTrader && 
                <Button
                  className="web3-btn"
                  onClick={() => setIsWorkshopModalOpen(true)}
                >
                  {t.setWorkshop}
                </Button>}
            </HStack>
            <div className="web3-table">
              <div className="web3-table-header" style={{ color: TECH_COLORS.textDim, borderBottom: `1px solid ${TECH_COLORS.border}` }}>
                <div>{t.workshopAddress}</div>
                <div>{t.requestDate}</div>
                <div>{t.approvalStatus}</div>
              </div>
              {workshopInfos.map((workshop, index) => (
                <div className="web3-table-row" key={`${workshop.address}-${index}`} style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                  <div>{`${workshop.address.slice(0, 6)}...${workshop.address.slice(-4)}`}</div>
                  <div>{workshop.requestDate}</div>
                  <div>{t[workshop.approvalStatus]}</div>
                </div>
              ))}
            </div>
          </TechCard>

        </VStack>
      </Container>

      {/* Modals */}
      <InvestmentModal
        isOpen={isUsdtModalOpen}
        onClose={() => setIsUsdtModalOpen(false)}
        type="USDT"
        investAmount={investAmount}
        setInvestAmount={setInvestAmount}
        referrer={referrerAddress !== zeroAddress ? referrerAddress : referrer}
        isReferrerDisabled={isReferrerDisabled}
        setReferrer={setReferrer}
        investmentMonths={investmentMonths}
        setInvestmentMonths={setInvestmentMonths}
        handleInvestSubmit={handleInvestSubmit}
        txPending={txPending}
        isApproveUsdtPending={isApproveUsdtPending}
        isApproveBurnPending={isApproveBurnPending}
        isInvestPending={isInvestPending}
        minAmount={formattedData.minInvestment}
        maxAmount={formattedData.maxInvestment}
        t={t}
        resetTransactionState={resetTransactionState}
        needsApproval={needsApproval}
      />

      <InvestmentModal
        isOpen={isBurnModalOpen}
        onClose={() => setIsBurnModalOpen(false)}
        type="BURN"
        investAmount={investAmount}
        setInvestAmount={setInvestAmount}
        referrer={referrerAddress !== zeroAddress ? referrerAddress : referrer}
        isReferrerDisabled={isReferrerDisabled}
        setReferrer={setReferrer}
        investmentMonths={investmentMonths}
        setInvestmentMonths={setInvestmentMonths}
        handleInvestSubmit={handleInvestSubmit}
        txPending={txPending}
        isApproveUsdtPending={isApproveUsdtPending}
        isApproveBurnPending={isApproveBurnPending}
        isInvestPending={isInvestPending}
        minAmount={minBurnInvestAmount}
        maxAmount={maxBurnInvestAmount}
        t={t}
        resetTransactionState={resetTransactionState}
        needsApproval={needsApproval}
      />

      <Modal isOpen={isWorkshopModalOpen} onClose={handleWorkshopClose} isCentered>
        <ModalOverlay backdropFilter='blur(10px)' bg="rgba(0,0,0,0.8)" />
        <ModalContent bg={TECH_COLORS.cardBg} borderColor={TECH_COLORS.primary} borderWidth="1px" color="black">
          <ModalHeader>{t.setWorkshop}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>{t.enterWorkshopAddress}</Text>
              <Input
                bg="rgba(0,0,0,0.05)"
                border={`1px solid ${TECH_COLORS.border}`}
                value={teamAddresses}
                onChange={(e) => setTeamAddresses(e.target.value)}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleWorkshopClose}>Cancel</Button>
            <TechButton onClick={() => handleSetWorkshop(true)} isLoading={isSettingWorkshop}>
              {t.openWorkshop}
            </TechButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isCompoundModalOpen} onClose={() => setIsCompoundModalOpen(false)} isCentered>
        <ModalOverlay backdropFilter='blur(10px)' bg="rgba(0,0,0,0.8)" />
        <ModalContent bg={TECH_COLORS.cardBg} borderColor={TECH_COLORS.primary} borderWidth="1px" color="black">
          <ModalHeader>{t.compound}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6}>
              <RadioGroup value={compoundType} onChange={setCompoundType}>
                <VStack align="start">
                  <Radio value="principal" colorScheme="cyan"><Text color="black">{t.compoundPrincipal}</Text></Radio>
                  <Radio value="principalInterest" colorScheme="cyan"><Text color="black">{t.compoundPrincipalInterest}</Text></Radio>
                </VStack>
              </RadioGroup>
              <RadioGroup value={compoundMonths} onChange={setCompoundMonths}>
                <HStack>
                  <Radio value="3" colorScheme="cyan"><Text color="black">3 {t.months}</Text></Radio>
                  <Radio value="6" colorScheme="cyan"><Text color="black">6 {t.months}</Text></Radio>
                  <Radio value="9" colorScheme="cyan"><Text color="black">9 {t.months}</Text></Radio>
                </HStack>
              </RadioGroup>
              <TechButton onClick={handleCompound} isLoading={isCompoundPending} width="100%">
                {t.compound}
              </TechButton>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isMarketMakingModalOpen} onClose={handleMarketMakingClose} isCentered>
        <ModalOverlay backdropFilter='blur(10px)' bg="rgba(0,0,0,0.8)" />
        <ModalContent bg={TECH_COLORS.cardBg} borderColor={TECH_COLORS.primary} borderWidth="1px" color="black">
          <ModalHeader>Market Making</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6}>
              <Box w="100%" p={4} border={`1px solid ${TECH_COLORS.border}`} borderRadius="xl">
                <HStack justify="space-between" mb={4}>
                  <Text>Auto Swap (USDT→BURN)</Text>
                  <Text color={autoSwapStatus ? "green.400" : "red.400"}>{autoSwapStatus ? "ON" : "OFF"}</Text>
                </HStack>
                <TechButton onClick={handleToggleAutoSwap} isLoading={isMarketMakingPending} width="100%">
                  {autoSwapStatus ? "Turn Off" : "Turn On"}
                </TechButton>
              </Box>

              <Box w="100%" p={4} border={`1px solid ${TECH_COLORS.border}`} borderRadius="xl">
                <Text mb={2}>Manual Buy BURN</Text>
                <Input
                  mb={4}
                  bg="rgba(0,0,0,0.05)"
                  border={`1px solid ${TECH_COLORS.border}`}
                  placeholder="USDT Amount"
                  value={buyBurnAmount}
                  onChange={(e) => setBuyBurnAmount(e.target.value)}
                />
                <TechButton onClick={handleBuyBurn} isLoading={isMarketMakingPending} width="100%">
                  Buy
                </TechButton>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isBurnLimitPriceModalOpen} onClose={handleBurnLimitPriceClose} isCentered>
        <ModalOverlay backdropFilter='blur(10px)' bg="rgba(0,0,0,0.8)" />
        <ModalContent bg={TECH_COLORS.cardBg} borderColor={TECH_COLORS.primary} borderWidth="1px" color="black">
          <ModalHeader>设置BURN上限价格</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6}>
              <Box w="100%" p={4} border={`1px solid ${TECH_COLORS.border}`} borderRadius="xl">
                <HStack justify="space-between" mb={4}>
                  <Text>当前BURN上限价格</Text>
                  <Text color={TECH_COLORS.primary} fontWeight="bold">{formattedData.burnLimitPrice} USDT/BURN</Text>
                </HStack>
              </Box>

              <Box w="100%" p={4} border={`1px solid ${TECH_COLORS.border}`} borderRadius="xl">
                <Text mb={2}>设置新的BURN上限价格 (USDT/BURN)</Text>
                <Input
                  mb={4}
                  bg="rgba(0,0,0,0.05)"
                  border={`1px solid ${TECH_COLORS.border}`}
                  placeholder="输入价格"
                  value={burnLimitPriceInput}
                  onChange={(e) => setBurnLimitPriceInput(e.target.value)}
                  type="number"
                />
                <TechButton onClick={handleSetBurnLimitPrice} isLoading={isBurnLimitPricePending} width="100%">
                  设置
                </TechButton>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isRefundModalOpen} onClose={handleRefundClose} isCentered>
        <ModalOverlay backdropFilter='blur(10px)' bg="rgba(0,0,0,0.8)" />
        <ModalContent bg={TECH_COLORS.cardBg} borderColor={TECH_COLORS.primary} borderWidth="1px" color="black">
          <ModalHeader>Refund Principal</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input
                placeholder="User Address"
                value={refundAddress}
                onChange={(e) => setRefundAddress(e.target.value)}
                bg="rgba(0,0,0,0.05)"
                border={`1px solid ${TECH_COLORS.border}`}
              />
              <Input
                placeholder="User Index"
                value={refundUserIndex}
                onChange={(e) => setRefundUserIndex(e.target.value)}
                bg="rgba(255,255,255,0.05)"
                border={`1px solid ${TECH_COLORS.border}`}
              />
              <Input
                placeholder="BURN Price"
                value={refundBurnPrice}
                onChange={(e) => setRefundBurnPrice(e.target.value)}
                bg="rgba(0,0,0,0.05)"
                border={`1px solid ${TECH_COLORS.border}`}
              />
              <TechButton onClick={handleRefund} isLoading={isRefundPending} width="100%">
                Refund
              </TechButton>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Unlock Modal */}
      <Modal isOpen={isUnlockModalOpen} onClose={() => setIsUnlockModalOpen(false)} isCentered>
        <ModalOverlay backdropFilter='blur(10px)' bg="rgba(0,0,0,0.8)" />
        <ModalContent bg={TECH_COLORS.cardBg} borderColor={TECH_COLORS.primary} borderWidth="1px" color="black">
          <ModalHeader className="web3-text-gradient">{t.unlockBurn || 'Unlock BURN'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} align="center" width="100%">
                <Text className="web3-text-gradient" width="150px">{t.unlockAmount || 'Unlock Amount'}</Text>
                <Input
                  className="web3-input"
                  bg="rgba(0,0,0,0.05)"
                  border={`1px solid ${TECH_COLORS.border}`}
                  placeholder={`${t.enterAmount || 'Enter amount'} (Max: ${bl2UserWithdrawableAmount ? formatBigNumber(bl2UserWithdrawableAmount, 18, 2) : '0'})`}
                  value={unlockAmount}
                  onChange={(e) => setUnlockAmount(e.target.value)}
                  type="number"
                />
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <TechButton
              onClick={handleUnlockSubmit}
              isLoading={isUnlockPending}
              width="100%"
            >
              {isUnlockPending ? (t.unlocking || 'Unlocking...') : (t.unlock || 'Unlock')}
            </TechButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box >
  )
}
