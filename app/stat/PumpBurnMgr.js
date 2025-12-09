'use client'

import { Box, Button, Text, VStack, HStack, Input, useToast, SimpleGrid, Card, CardBody, Heading, Switch, FormControl, FormLabel, Textarea, Select } from '@chakra-ui/react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import novaBank from '../contracts/novaBank.json'
import pinkLock from '../contracts/pinkLock.json'
import { parseEther, parseUnits, isAddress } from 'viem'
import BigNumber from 'bignumber.js'
import '../web3.css'  // 确保导入 web3.css

// 辅助函数
const formatBigNumber = (value, decimals = 18, decimalPlaces = 6) => {
  if (value === undefined || value === null) return '0';
  return new BigNumber(value.toString())
    .dividedBy(new BigNumber(10).pow(decimals))
    .toFixed(decimalPlaces);
}

export default function PumpBurnMgr() {
  const { address } = useAccount()
  const toast = useToast()

  // 状态管理
  const [minInvestment, setMinInvestment] = useState('')
  const [maxInvestment, setMaxInvestment] = useState('')
  const [minCompoundInvestment, setMinCompoundInvestment] = useState('')
  const [maxCompoundInvestment, setMaxCompoundInvestment] = useState('')
  const [claimFee, setClaimFee] = useState('')
  const [manager, setManager] = useState('')
  const [pinkLocker, setPinkLocker] = useState('')
  const [workshopThreshold, setWorkshopThreshold] = useState('')
  const [workshopRate, setWorkshopRate] = useState('')
  const [teamAddresses, setTeamAddresses] = useState('')
  const [teamValid, setTeamValid] = useState(true)
  const [autherAddress, setAutherAddress] = useState('')
  const [autherApproved, setAutherApproved] = useState(true)
  const [interestMonths, setInterestMonths] = useState('3')
  const [interestRate, setInterestRate] = useState('')
  const [lpMonths, setLpMonths] = useState('3')
  const [lpRate, setLpRate] = useState('')
  const [referrerMonths, setReferrerMonths] = useState('3')
  const [referrerRate, setReferrerRate] = useState('')
  const [firstLevelRate, setFirstLevelRate] = useState('')
  const [autoSwap, setAutoSwap] = useState(true)
  const [pauseInterest, setPauseInterest] = useState(false)
  const [pausePrincipal, setPausePrincipal] = useState(false)
  const [pauseExtraRewards, setPauseExtraRewards] = useState(false)
  const [pauseUsdtInvest, setPauseUsdtInvest] = useState(false)
  const [pauseReinvest, setPauseReinvest] = useState(false)
  const [buyBurnAmount, setBuyBurnAmount] = useState('')
  const [settleFromIndex, setSettleFromIndex] = useState('')
  const [settleEndIndex, setSettleEndIndex] = useState('')
  const [settleBurnPrice, setSettleBurnPrice] = useState('')
  const [compoundCount, setCompoundCount] = useState('')
  const [compoundMinMonths, setCompoundMinMonthsValue] = useState('')
  const [withdrawRatio, setWithdrawRatio] = useState('')
  const [burnLockPaused, setBurnLockPaused] = useState(false)
  const [migrateOldContract, setMigrateOldContract] = useState('0x93fD192e1CD288F1f5eE0A019429B015016061F9')
  const [migrateFromIndex, setMigrateFromIndex] = useState('')
  const [migrateToIndex, setMigrateToIndex] = useState('')
  // 入金周期限额相关状态
  const [periodStartTime, setPeriodStartTime] = useState('')
  const [periodStartDateTime, setPeriodStartDateTime] = useState('') // 用于日期时间选择器
  const [periodTimeInterval, setPeriodTimeInterval] = useState('')
  const [periodLimitAmount, setPeriodLimitAmount] = useState('')

  // 合约读取
  const { data: contractInfo } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'owner',
  })

  const { data: managerInfo } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'manager',
  })

  const { data: pauseInfo } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'paused',
  })

  const { data: pauseInterestInfo } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'pauseInterestWithdraw',
  })

  const { data: pausePrincipalInfo } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'pausePrincipleWithdraw',
  })

  const { data: pauseExtraInfo } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'pauseExtraRewardWithdraw',
  })

  const { data: autoSwapInfo } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'autoSwapUsdt2Burn',
  })

  const { data: pauseUsdtInvestInfo } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'pauseUsdtInvest',
  })

  const { data: pauseReinvestInfo } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'pauseReinvest',
  })

  const { data: burnLockOwner } = useReadContract({
    address: pinkLock.address,
    abi: pinkLock.abi,
    functionName: 'owner',
  })

  const { data: burnLockPausedInfo } = useReadContract({
    address: pinkLock.address,
    abi: pinkLock.abi,
    functionName: 'paused',
  })

  const { data: currentWithdrawRatio } = useReadContract({
    address: pinkLock.address,
    abi: pinkLock.abi,
    functionName: 'withdrawRatio',
  })

  const { data: totalLockedAmount } = useReadContract({
    address: pinkLock.address,
    abi: pinkLock.abi,
    functionName: 'totalLockedAmount',
  })

  const { data: totalLockedUser } = useReadContract({
    address: pinkLock.address,
    abi: pinkLock.abi,
    functionName: 'totalLockedUser',
  })

  // 入金周期限额相关读取
  const { data: startTimeInfo } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'startTime',
  })

  const { data: timeIntervalInfo } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'timeInterval',
  })

  const { data: limitAmountInfo } = useReadContract({
    address: novaBank.address,
    abi: novaBank.abi,
    functionName: 'limitAmount',
  })

  // 添加useEffect来同步合约状态到本地状态（约第122行后添加）
  useEffect(() => {
    if (autoSwapInfo !== undefined) {
      setAutoSwap(autoSwapInfo)
    }
  }, [autoSwapInfo])

  useEffect(() => {
    if (pauseUsdtInvestInfo !== undefined) {
      setPauseUsdtInvest(pauseUsdtInvestInfo)
    }
  }, [pauseUsdtInvestInfo])

  useEffect(() => {
    if (pauseReinvestInfo !== undefined) {
      setPauseReinvest(pauseReinvestInfo)
    }
  }, [pauseReinvestInfo])

  // 同步入金周期限额相关状态
  useEffect(() => {
    if (startTimeInfo !== undefined) {
      // 将时间戳转换为可读格式，但保留原始值用于编辑
      const timestamp = Number(startTimeInfo)
      if (timestamp > 0) {
        setPeriodStartTime(timestamp.toString())
        // 转换为datetime-local格式 (YYYY-MM-DDTHH:mm)
        const date = new Date(timestamp * 1000)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        setPeriodStartDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
      }
    }
  }, [startTimeInfo])

  useEffect(() => {
    if (timeIntervalInfo !== undefined) {
      // timeInterval是秒数，转换为小时显示
      const seconds = Number(timeIntervalInfo)
      if (seconds > 0) {
        setPeriodTimeInterval((seconds / 3600).toString())
      }
    }
  }, [timeIntervalInfo])

  useEffect(() => {
    if (limitAmountInfo !== undefined) {
      // limitAmount是18位精度的USDT数量
      const amount = formatBigNumber(limitAmountInfo, 18, 0)
      setPeriodLimitAmount(amount)
    }
  }, [limitAmountInfo])

  // 合约写入
  const { writeContractAsync } = useWriteContract()
  const [txHash, setTxHash] = useState(null)

  const { isLoading: isTxPending, isSuccess: isTxSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: txHash,
    enabled: !!txHash,
  })

  useEffect(() => {
    if (isTxSuccess) {
      toast({
        title: '操作成功',
        status: 'success',
        duration: 3000,
      })
      setTxHash(null)
    } else if (isTxError) {
      toast({
        title: '操作失败',
        status: 'error',
        duration: 3000,
      })
      setTxHash(null)
    }
  }, [isTxSuccess, isTxError])

  // 检查是否是管理员
  const isManager = address && (address.toLowerCase() === contractInfo?.toLowerCase() || address.toLowerCase() === managerInfo?.toLowerCase())
  const isBurnLockManager = address && address.toLowerCase() === burnLockOwner?.toLowerCase()
  const isAnyManager = isManager || isBurnLockManager

  // 设置最小投资额
  const handleSetMinInvestment = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setMinInvestment',
        args: [parseUnits(minInvestment, 18)]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 设置最大投资额
  const handleSetMaxInvestment = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setMaxInvestment',
        args: [parseUnits(maxInvestment, 18)]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 设置复投限额
  const handleSetCompoundInvestment = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setCompoundInvestment',
        args: [parseUnits(minCompoundInvestment, 18), parseUnits(maxCompoundInvestment, 18)]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 设置手续费
  const handleSetClaimFee = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setClaimFee',
        args: [parseEther(claimFee)]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 设置管理员
  const handleSetManager = async () => {
    try {
      if (!isAddress(manager)) {
        toast({
          title: '无效地址',
          status: 'error',
          duration: 3000,
        })
        return
      }
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setManager',
        args: [manager]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 设置团队
  const handleSetTeams = async () => {
    try {
      const addresses = teamAddresses.split(',').map(addr => addr.trim())
      for (const addr of addresses) {
        if (!isAddress(addr)) {
          toast({
            title: '无效地址',
            description: `地址 ${addr} 格式不正确`,
            status: 'error',
            duration: 3000,
          })
          return
        }
      }
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setTeams',
        args: [addresses, teamValid]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 设置授权者
  const handleSetTrader = async () => {
    try {
      if (!isAddress(autherAddress)) {
        toast({
          title: '无效地址',
          status: 'error',
          duration: 3000,
        })
        return
      }
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setTrader',
        args: [autherAddress, autherApproved]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 更新利率
  const handleUpdateInterestRate = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'updateInterestRate',
        args: [parseInt(interestMonths), parseInt(interestRate)]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 更新LP利率
  const handleUpdateLpRate = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'updateLpRate',
        args: [parseInt(lpMonths), parseInt(lpRate)]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 更新推荐人利率
  const handleUpdateReferrerRate = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'updateReferrerRate',
        args: [parseInt(referrerMonths), parseInt(referrerRate)]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 设置暂停开关
  const handleSetPauseSwitch = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setPauseSwitch',
        args: [pauseInterest, pausePrincipal, pauseExtraRewards]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 设置投资和复投暂停开关
  const handleSetPauseInvest = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setPauseInvest',
        args: [pauseUsdtInvest, pauseReinvest]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 切换暂停状态
  const handleTogglePause = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'togglePause',
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '操作失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 购买BURN
  const handleBuyBurn = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'buyBurn',
        args: [parseUnits(buyBurnAmount, 18)]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '购买失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 批量结算
  const handleSettle = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'settle',
        args: [parseInt(settleFromIndex), parseInt(settleEndIndex), parseUnits(settleBurnPrice, 18)]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '结算失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 设置复投最小月数
  const handleSetMinMonths = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setMinMonths',
        args: [parseInt(compoundCount), parseInt(compoundMinMonths)]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 领取剩余BURN
  const handleClaimLeftBurn = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'claimLeftBurn',
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '领取失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleSetAutoSwap = async () => {
    try {
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setAutoSwap',
        args: [autoSwap]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleSetWithdrawRatio = async () => {
    try {
      const result = await writeContractAsync({
        address: pinkLock.address,
        abi: pinkLock.abi,
        functionName: 'setWithdrawRatio',
        args: [parseInt(withdrawRatio) * 100]
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '设置失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleToggleBurnLockPause = async () => {
    try {
      const functionName = burnLockPausedInfo ? 'unpause' : 'pause'
      const result = await writeContractAsync({
        address: pinkLock.address,
        abi: pinkLock.abi,
        functionName: functionName,
      })
      setTxHash(result)
    } catch (error) {
      toast({
        title: '操作失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleMigrate = async () => {
    try {
      if (!isAddress(migrateOldContract)) {
        toast({
          title: '无效地址',
          description: '请输入有效的合约地址',
          status: 'error',
          duration: 3000,
        })
        return
      }

      const fromIdx = parseInt(migrateFromIndex)
      const toIdx = parseInt(migrateToIndex)
      
      if (isNaN(fromIdx) || isNaN(toIdx) || fromIdx < 0 || toIdx <= fromIdx) {
        toast({
          title: '编号错误',
          description: '请输入有效的编号范围',
          status: 'error',
          duration: 3000,
        })
        return
      }

      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'migrate',
        args: [migrateOldContract, fromIdx, toIdx]
      })
      setTxHash(result)
      toast({
        title: '移植交易已提交',
        description: '请等待交易确认',
        status: 'info',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: '移植失败',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  // 设置周期起始时间
  const handleSetStartTime = async () => {
    try {
      const timestamp = parseInt(periodStartTime)
      if (isNaN(timestamp) || timestamp <= 0) {
        toast({
          title: '输入错误',
          description: '请输入有效的时间戳（秒）',
          status: 'error',
          duration: 3000,
        })
        return
      }
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setStartTime',
        args: [timestamp]
      })
      setTxHash(result)
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

  // 设置周期时长
  const handleSetTimeInterval = async () => {
    try {
      const hours = parseFloat(periodTimeInterval)
      if (isNaN(hours) || hours <= 0) {
        toast({
          title: '输入错误',
          description: '请输入有效的小时数',
          status: 'error',
          duration: 3000,
        })
        return
      }
      // 将小时转换为秒
      const seconds = Math.floor(hours * 3600)
      // 如果startTime未设置，使用当前时间戳
      const currentStartTime = startTimeInfo && Number(startTimeInfo) > 0 
        ? Number(startTimeInfo) 
        : Math.floor(Date.now() / 1000)
      
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setTimeInterval',
        args: [currentStartTime, seconds]
      })
      setTxHash(result)
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

  // 设置周期入金上限
  const handleSetLimitAmount = async () => {
    try {
      const amount = parseFloat(periodLimitAmount)
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: '输入错误',
          description: '请输入有效的USDT数量',
          status: 'error',
          duration: 3000,
        })
        return
      }
      const result = await writeContractAsync({
        address: novaBank.address,
        abi: novaBank.abi,
        functionName: 'setLimitAmount',
        args: [parseUnits(periodLimitAmount, 18)]
      })
      setTxHash(result)
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

  if (!isAnyManager) {
    return (
      <Box className="web3-card web3-bg-blur" p={6}>
        <Text className="web3-text-gradient" fontSize="xl" textAlign="center">
          您没有管理员权限
        </Text>
      </Box>
    )
  }

  return (
    <Box className="container" py={8} bg="gray.900" minH="100vh">
      <Heading className="web3-text-gradient" size="xl" mb={8} textAlign="center">
        PumpBurn 合约管理面板
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* 合约状态 */}
        <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
          <CardBody>
            <Heading size="md" className="web3-text-gradient" mb={4}>合约状态</Heading>
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <Text color="white">合约暂停状态:</Text>
                <Text className={pauseInfo ? "text-red-400" : "text-green-400"}>
                  {pauseInfo ? '已暂停' : '正常运行'}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="white">利息提取暂停:</Text>
                <Text className={pauseInterestInfo ? "text-red-400" : "text-green-400"}>
                  {pauseInterestInfo ? '已暂停' : '正常'}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="white">本金提取暂停:</Text>
                <Text className={pausePrincipalInfo ? "text-red-400" : "text-green-400"}>
                  {pausePrincipalInfo ? '已暂停' : '正常'}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="white">额外奖励暂停:</Text>
                <Text className={pauseExtraInfo ? "text-red-400" : "text-green-400"}>
                  {pauseExtraInfo ? '已暂停' : '正常'}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="white">自动兑换:</Text>
                <Text className={autoSwapInfo ? "text-green-400" : "text-yellow-400"}>
                  {autoSwapInfo ? '开启' : '关闭'}
                </Text>
              </HStack>
              <Button
                className="web3-btn"
                onClick={handleTogglePause}
                isLoading={isTxPending}
                colorScheme={pauseInfo ? "green" : "red"}
              >
                {pauseInfo ? '恢复合约' : '暂停合约'}
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* 投资限额设置 */}
        <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
          <CardBody>
            <Heading size="md" className="web3-text-gradient" mb={4}>投资限额设置</Heading>
            <VStack spacing={4}>
              <HStack width="100%">
                <Text width="120px" color="white">最小投资:</Text>
                <Input
                  value={minInvestment}
                  onChange={(e) => setMinInvestment(e.target.value)}
                  placeholder="USDT数量"
                  className="web3-input"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
                <Button className="web3-btn" onClick={handleSetMinInvestment}>设置</Button>
              </HStack>
              <HStack width="100%">
                <Text width="120px" color="white">最大投资:</Text>
                <Input
                  value={maxInvestment}
                  onChange={(e) => setMaxInvestment(e.target.value)}
                  placeholder="USDT数量"
                  className="web3-input"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
                <Button className="web3-btn" onClick={handleSetMaxInvestment}>设置</Button>
              </HStack>
              <HStack width="100%">
                <Text width="120px" color="white">复投限额:</Text>
                <Input
                  value={minCompoundInvestment}
                  onChange={(e) => setMinCompoundInvestment(e.target.value)}
                  placeholder="最小复投"
                  className="web3-input"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
                <Input
                  value={maxCompoundInvestment}
                  onChange={(e) => setMaxCompoundInvestment(e.target.value)}
                  placeholder="最大复投"
                  className="web3-input"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
                <Button className="web3-btn" onClick={handleSetCompoundInvestment}>设置</Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* 入金周期限额设置 */}
        <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
          <CardBody>
            <Heading size="md" className="web3-text-gradient" mb={4}>入金周期限额设置</Heading>
            <VStack spacing={4}>
              {/* 当前状态显示 */}
              <Box width="100%" p={4} borderRadius="md" bg="rgba(255,255,255,0.05)">
                <Heading size="sm" mb={3} color="white">当前状态</Heading>
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text color="white">周期起始时间:</Text>
                    <Text className="web3-text-glow">
                      {startTimeInfo ? new Date(Number(startTimeInfo) * 1000).toLocaleString() : '未设置'}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="white">周期时长:</Text>
                    <Text className="web3-text-glow">
                      {timeIntervalInfo ? `${Number(timeIntervalInfo) / 3600} 小时` : '未设置'}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="white">周期入金上限:</Text>
                    <Text className="web3-text-glow">
                      {limitAmountInfo ? `${formatBigNumber(limitAmountInfo, 18, 0)} USDT` : '未设置'}
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              {/* 设置周期起始时间 */}
              <VStack width="100%" spacing={3} align="stretch">
                <HStack width="100%">
                  <Text width="120px" color="white">起始时间:</Text>
                  <Input
                    value={periodStartDateTime}
                    onChange={(e) => {
                      setPeriodStartDateTime(e.target.value)
                      if (e.target.value) {
                        const timestamp = Math.floor(new Date(e.target.value).getTime() / 1000)
                        setPeriodStartTime(timestamp.toString())
                      }
                    }}
                    placeholder="选择日期时间"
                    className="web3-input"
                    type="datetime-local"
                    color="white"
                    _placeholder={{ color: 'gray.400' }}
                  />
                  <Button 
                    className="web3-btn" 
                    onClick={() => {
                      const now = new Date()
                      const year = now.getFullYear()
                      const month = String(now.getMonth() + 1).padStart(2, '0')
                      const day = String(now.getDate()).padStart(2, '0')
                      const hours = String(now.getHours()).padStart(2, '0')
                      const minutes = String(now.getMinutes()).padStart(2, '0')
                      const datetimeStr = `${year}-${month}-${day}T${hours}:${minutes}`
                      setPeriodStartDateTime(datetimeStr)
                      setPeriodStartTime(Math.floor(now.getTime() / 1000).toString())
                    }}
                    size="sm"
                    colorScheme="blue"
                  >
                    当前时间
                  </Button>
                  <Button 
                    className="web3-btn" 
                    onClick={handleSetStartTime}
                    isLoading={isTxPending}
                  >
                    设置
                  </Button>
                </HStack>
                <HStack width="100%" ml="120px">
                  <Text fontSize="xs" color="gray.400">或直接输入Unix时间戳:</Text>
                  <Input
                    value={periodStartTime}
                    onChange={(e) => {
                      setPeriodStartTime(e.target.value)
                      if (e.target.value) {
                        const timestamp = parseInt(e.target.value)
                        if (timestamp > 0) {
                          const date = new Date(timestamp * 1000)
                          const year = date.getFullYear()
                          const month = String(date.getMonth() + 1).padStart(2, '0')
                          const day = String(date.getDate()).padStart(2, '0')
                          const hours = String(date.getHours()).padStart(2, '0')
                          const minutes = String(date.getMinutes()).padStart(2, '0')
                          setPeriodStartDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
                        }
                      }
                    }}
                    placeholder="Unix时间戳（秒）"
                    className="web3-input"
                    type="number"
                    width="200px"
                    color="white"
                    _placeholder={{ color: 'gray.400' }}
                  />
                </HStack>
              </VStack>

              {/* 设置周期时长 */}
              <HStack width="100%">
                <Text width="120px" color="white">周期时长:</Text>
                <Input
                  value={periodTimeInterval}
                  onChange={(e) => setPeriodTimeInterval(e.target.value)}
                  placeholder="小时数"
                  className="web3-input"
                  type="number"
                  step="0.1"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
                <Text width="60px" color="white">小时</Text>
                <Button 
                  className="web3-btn" 
                  onClick={handleSetTimeInterval}
                  isLoading={isTxPending}
                >
                  设置
                </Button>
              </HStack>

              {/* 设置周期入金上限 */}
              <HStack width="100%">
                <Text width="120px" color="white">入金上限:</Text>
                <Input
                  value={periodLimitAmount}
                  onChange={(e) => setPeriodLimitAmount(e.target.value)}
                  placeholder="USDT数量"
                  className="web3-input"
                  type="number"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
                <Text width="60px" color="white">USDT</Text>
                <Button 
                  className="web3-btn" 
                  onClick={handleSetLimitAmount}
                  isLoading={isTxPending}
                >
                  设置
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* 费用和管理员设置 */}
        <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
          <CardBody>
            <Heading size="md" className="web3-text-gradient" mb={4}>费用和管理员</Heading>
            <VStack spacing={4}>
              <HStack width="100%">
                <Text width="120px" color="white">提取手续费:</Text>
                <Input
                  value={claimFee}
                  onChange={(e) => setClaimFee(e.target.value)}
                  placeholder="BNB数量"
                  className="web3-input"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
                <Button className="web33-btn" onClick={handleSetClaimFee}>设置</Button>
              </HStack>
              <HStack width="100%">
                <Text width="120px" color="white">管理员地址:</Text>
                <Input
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  placeholder="0x..."
                  className="web3-input"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
                <Button className="web3-btn" onClick={handleSetManager}>设置</Button>
              </HStack>
              
              {/* 交易员管理 */}
              <Box width="100%" p={4} borderRadius="md" bg="rgba(255,255,255,0.05)">
                <Text className="web3-text-gradient" fontSize="md" mb={3}>交易员管理</Text>
                <VStack spacing={3}>
                  <HStack width="100%">
                    <Text width="120px" color="white">交易员地址:</Text>
                    <Input
                      value={autherAddress}
                      onChange={(e) => setAutherAddress(e.target.value)}
                      placeholder="0x..."
                      className="web3-input"
                      color="white"
                      _placeholder={{ color: 'gray.400' }}
                    />
                  </HStack>
                  
                  <HStack width="100%" justify="space-between">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0" color="white">操作类型:</FormLabel>
                      <Switch
                        isChecked={autherApproved}
                        onChange={(e) => setAutherApproved(e.target.checked)}
                        colorScheme="blue"
                      />
                      <Text ml={2} fontSize="sm" color={autherApproved ? "green.400" : "red.400"}>
                        {autherApproved ? '添加交易员' : '删除交易员'}
                      </Text>
                    </FormControl>
                    
                    <Button 
                      className="web3-btn" 
                      onClick={handleSetTrader}
                      colorScheme={autherApproved ? "green" : "red"}
                      isLoading={isTxPending}
                      isDisabled={!autherAddress}
                    >
                      {autherApproved ? '添加交易员' : '删除交易员'}
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* 暂停开关设置 */}
        <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
          <CardBody>
            <Heading size="md" className="web3-text-gradient" mb={4}>功能开关</Heading>
            <VStack spacing={4}>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0" color="white">暂停利息提取:</FormLabel>
                <Switch
                  isChecked={pauseInterest}
                  onChange={(e) => setPauseInterest(e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0" color="white">暂停本金提取:</FormLabel>
                <Switch
                  isChecked={pausePrincipal}
                  onChange={(e) => setPausePrincipal(e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0" color="white">暂停额外奖励:</FormLabel>
                <Switch
                  isChecked={pauseExtraRewards}
                  onChange={(e) => setPauseExtraRewards(e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>
              <Button className="web3-btn" onClick={handleSetPauseSwitch}>应用设置</Button>
            </VStack>
          </CardBody>
        </Card>

        {/* 投资和复投开关设置 */}
        <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
          <CardBody>
            <Heading size="md" className="web3-text-gradient" mb={4}>投资和复投管理</Heading>
            <VStack spacing={4}>
              {/* 当前状态显示 */}
              <Box width="100%" p={4} borderRadius="md" bg="rgba(255,255,255,0.05)">
                <Heading size="sm" mb={3} color="white">当前状态</Heading>
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text color="white">USDT投资状态:</Text>
                    <Text className={pauseUsdtInvestInfo ? "text-red-400" : "text-green-400"}>
                      {pauseUsdtInvestInfo ? '已暂停' : '正常'}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="white">复投状态:</Text>
                    <Text className={pauseReinvestInfo ? "text-red-400" : "text-green-400"}>
                      {pauseReinvestInfo ? '已暂停' : '正常'}
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              {/* 开关控制 */}
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0" color="white">暂停USDT投资:</FormLabel>
                <Switch
                  isChecked={pauseUsdtInvest}
                  onChange={(e) => setPauseUsdtInvest(e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0" color="white">暂停复投:</FormLabel>
                <Switch
                  isChecked={pauseReinvest}
                  onChange={(e) => setPauseReinvest(e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>
              <Button 
                className="web3-btn" 
                onClick={handleSetPauseInvest}
                isLoading={isTxPending}
                width="100%"
              >
                应用设置
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* 利率设置 */}
        <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
          <CardBody>
            <Heading size="md" className="web3-text-gradient" mb={4}>利率设置</Heading>
            <VStack spacing={4}>
              {/* 投资利率设置 */}
              <Box width="100%" p={4} borderRadius="md" bg="rgba(255,255,255,0.05)">
                <Text className="web3-text-gradient" fontSize="md" mb={3}>投资利率</Text>
                <HStack width="100%">
                  <Text width="80px" color="white">投资期限:</Text>
                  <Select
                    value={interestMonths}
                    onChange={(e) => setInterestMonths(e.target.value)}
                    className="web3-input"
                    color="white"
                  >
                    <option value="3">3个月</option>
                    <option value="6">6个月</option>
                    <option value="9">9个月</option>
                  </Select>
                  <Text width="80px" color="white">日利率:</Text>
                  <Input
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="基点(1%=100)"
                    className="web3-input"
                    color="white"
                    _placeholder={{ color: 'gray.400' }}
                  />
                  <Button className="web3-btn" onClick={handleUpdateInterestRate}>设置</Button>
                </HStack>
              </Box>

              {/* LP利率设置 */}
              <Box width="100%" p={4} borderRadius="md" bg="rgba(255,255,255,0.05)">
                <Text className="web3-text-gradient" fontSize="md" mb={3}>LP利率</Text>
                <HStack width="100%">
                  <Text width="80px" color="white">投资期限:</Text>
                  <Select
                    value={lpMonths}
                    onChange={(e) => setLpMonths(e.target.value)}
                    className="web3-input"
                    color="white"
                  >
                    <option value="3">3个月</option>
                    <option value="6">6个月</option>
                    <option value="9">9个月</option>
                  </Select>
                  <Text width="80px" color="white">LP利率:</Text>
                  <Input
                    value={lpRate}
                    onChange={(e) => setLpRate(e.target.value)}
                    placeholder="基点(1%=100)"
                    className="web3-input"
                    color="white"
                    _placeholder={{ color: 'gray.400' }}
                  />
                  <Button className="web3-btn" onClick={handleUpdateLpRate}>设置</Button>
                </HStack>
              </Box>

              {/* 推荐人利率设置 */}
              <Box width="100%" p={4} borderRadius="md" bg="rgba(255,255,255,0.05)">
                <Text className="web3-text-gradient" fontSize="md" mb={3}>推荐人利率</Text>
                <HStack width="100%">
                  <Text width="80px" color="white">投资期限:</Text>
                  <Select
                    value={referrerMonths}
                    onChange={(e) => setReferrerMonths(e.target.value)}
                    className="web3-input"
                    color="white"
                  >
                    <option value="3">3个月</option>
                    <option value="6">6个月</option>
                    <option value="9">9个月</option>
                  </Select>
                  <Text width="80px" color="white">推荐利率:</Text>
                  <Input
                    value={referrerRate}
                    onChange={(e) => setReferrerRate(e.target.value)}
                    placeholder="基点(1%=100)"
                    className="web3-input"
                    color="white"
                    _placeholder={{ color: 'gray.400' }}
                  />
                  <Button className="web3-btn" onClick={handleUpdateReferrerRate}>设置</Button>
                </HStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* 团队管理 */}
        <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
          <CardBody>
            <Heading size="md" className="web3-text-gradient" mb={4}>团队管理</Heading>
            <VStack spacing={4}>
              <HStack width="100%">
                <Text width="100px" color="white">团队地址:</Text>
                <Textarea
                  value={teamAddresses}
                  onChange={(e) => setTeamAddresses(e.target.value)}
                  placeholder="多个地址用逗号分隔"
                  className="web3-input"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
              </HStack>
              <HStack width="100%">
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0" color="white">启用团队:</FormLabel>
                  <Switch
                    isChecked={teamValid}
                    onChange={(e) => setTeamValid(e.target.checked)}
                    colorScheme="blue"
                  />
                </FormControl>
                <Button className="web3-btn" onClick={handleSetTeams}>设置团队</Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* 操作功能 */}
        <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
          <CardBody>
            <Heading size="md" className="web3-text-gradient" mb={4}>操作功能</Heading>
            <VStack spacing={4}>
              {/* 自动购买BURN开关 */}
              <HStack width="100%" justify="space-between">
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0" width="200px" color="white">USDT入金自动购买BURN:</FormLabel>
                  <Switch
                    isChecked={autoSwap}
                    onChange={(e) => setAutoSwap(e.target.checked)}
                    colorScheme="blue"
                  />
                </FormControl>
                <Button className="web3-btn" onClick={handleSetAutoSwap}>
                  {autoSwap ? '开启自动购买' : '关闭自动购买'}
                </Button>
              </HStack>
              
              {/* 现有的购买BURN功能 */}
              <HStack width="100%">
                <Text width="100px" color="white">购买BURN:</Text>
                <Input
                  value={buyBurnAmount}
                  onChange={(e) => setBuyBurnAmount(e.target.value)}
                  placeholder="USDT数量"
                  className="web3-input"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
                <Button className="web3-btn" onClick={handleBuyBurn}>购买</Button>
              </HStack>
              
              {/* 其他现有功能保持不变 */}
              <HStack width="100%">
                <Text width="100px" color="white">复投次数:</Text>
                <Input
                  value={compoundCount}
                  onChange={(e) => setCompoundCount(e.target.value)}
                  placeholder="次数"
                  className="web3-input"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
                <Text width="100px" color="white">最小月数:</Text>
                <Input
                  value={compoundMinMonths}
                  onChange={(e) => setCompoundMinMonthsValue(e.target.value)}
                  placeholder="月数"
                  className="web3-input"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
                <Button className="web3-btn" onClick={handleSetMinMonths}>设置</Button>
              </HStack>
              <Button className="web3-btn" onClick={handleClaimLeftBurn} colorScheme="orange">
                领取剩余BURN
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* 批量结算 */}
        <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
          <CardBody>
            <Heading size="md" className="web3-text-gradient" mb={4}>批量结算</Heading>
            <VStack spacing={4}>
              <HStack width="100%">
                <Text width="100px" color="white">起始索引:</Text>
                <Input
                  value={settleFromIndex}
                  onChange={(e) => setSettleFromIndex(e.target.value)}
                  placeholder="从"
                  className="web3-input"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
                <Text width="100px" color="white">结束索引:</Text>
                <Input
                  value={settleEndIndex}
                  onChange={(e) => setSettleEndIndex(e.target.value)}
                  placeholder="到"
                  className="web3-input"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
              </HStack>
              <HStack width="100%">
                <Text width="100px" color="white">BURN价格:</Text>
                <Input
                  value={settleBurnPrice}
                  onChange={(e) => setSettleBurnPrice(e.target.value)}
                  placeholder="USDT价格"
                  className="web3-input"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
                <Button className="web3-btn" onClick={handleSettle} colorScheme="red">
                  批量结算
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* BURN锁管理面板 */}
        {isBurnLockManager && (
          <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
            <CardBody>
              <Heading size="md" className="web3-text-gradient" mb={4}>BURN锁管理面板</Heading>
              <VStack spacing={4}>
                {/* BURN锁状态信息 */}
                <Box width="100%" p={4} borderRadius="md" bg="rgba(255,255,255,0.05)">
                  <Heading size="sm" mb={3} color="white">合约状态</Heading>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text color="white">合约状态:</Text>
                      <Text className={burnLockPausedInfo ? "text-red-400" : "text-green-400"}>
                        {burnLockPausedInfo ? '已暂停' : '正常运行'}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="white">总锁仓用户:</Text>
                      <Text className="web3-text-glow">
                        {totalLockedUser?.toString() || '0'}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="white">总锁仓数量:</Text>
                      <Text className="web3-text-glow">
                        {formatBigNumber(totalLockedAmount, 18, 2)} BURN
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="white">当前提取比例:</Text>
                      <Text className="web3-text-glow">
                        {currentWithdrawRatio?.toString() || '0'}%
                      </Text>
                    </HStack>
                  </VStack>
                </Box>

                {/* 设置提取比例 */}
                <HStack width="100%">
                  <Text width="120px" color="white">提取比例:</Text>
                  <Input
                    value={withdrawRatio}
                    onChange={(e) => setWithdrawRatio(e.target.value)}
                    placeholder="百分比 (0-100)"
                    className="web3-input"
                    type="number"
                    min="0"
                    max="100"
                    color="white"
                    _placeholder={{ color: 'gray.400' }}
                  />
                  <Button 
                    className="web3-btn" 
                    onClick={handleSetWithdrawRatio}
                    isLoading={isTxPending}
                  >
                    设置
                  </Button>
                </HStack>

                {/* 暂停/恢复合约 */}
                <Button
                  className="web3-btn"
                  onClick={handleToggleBurnLockPause}
                  isLoading={isTxPending}
                  colorScheme={burnLockPausedInfo ? "green" : "red"}
                  width="100%"
                >
                  {burnLockPausedInfo ? '恢复BURN锁合约' : '暂停BURN锁合约'}
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* 数据移植面板 */}
        {isManager && (
          <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
            <CardBody>
              <Heading size="md" className="web3-text-gradient" mb={4}>数据移植</Heading>
              <VStack spacing={4}>
                {/* 旧合约地址 */}
                <HStack width="100%">
                  <Text width="120px" color="white">旧合约地址:</Text>
                  <Input
                    value={migrateOldContract}
                    onChange={(e) => setMigrateOldContract(e.target.value)}
                    placeholder="0x93fD192e1CD288F1f5eE0A019429B015016061F9"
                    className="web3-input"
                    color="white"
                    _placeholder={{ color: 'gray.400' }}
                  />
                </HStack>

                {/* 编号范围 */}
                <HStack width="100%">
                  <Text width="120px" color="white">起始编号:</Text>
                  <Input
                    value={migrateFromIndex}
                    onChange={(e) => setMigrateFromIndex(e.target.value)}
                    placeholder="从"
                    className="web3-input"
                    type="number"
                    min="0"
                    color="white"
                    _placeholder={{ color: 'gray.400' }}
                  />
                  <Text width="120px" color="white">结束编号:</Text>
                  <Input
                    value={migrateToIndex}
                    onChange={(e) => setMigrateToIndex(e.target.value)}
                    placeholder="到"
                    className="web3-input"
                    type="number"
                    min="0"
                    color="white"
                    _placeholder={{ color: 'gray.400' }}
                  />
                </HStack>

                {/* 操作说明 */}
                <Box width="100%" p={4} borderRadius="md" bg="rgba(255,255,255,0.05)">
                  <Text className="web3-text-gradient" fontSize="sm" mb={2}>操作说明：</Text>
                  <VStack spacing={1} align="start">
                    <Text fontSize="xs" color="gray.300">
                      • 输入需要移植数据的旧合约地址
                    </Text>
                    <Text fontSize="xs" color="gray.300">
                      • 指定要移植的投资者编号范围
                    </Text>
                    <Text fontSize="xs" color="gray.300">
                      • 系统将把指定范围内的投资者数据从旧合约移植到新合约
                    </Text>
                    <Text fontSize="xs" color="red.300">
                      • 此操作不可逆，请确认编号范围正确
                    </Text>
                  </VStack>
                </Box>

                {/* 移植按钮 */}
                <Button
                  className="web3-btn"
                  onClick={handleMigrate}
                  isLoading={isTxPending}
                  colorScheme="purple"
                  width="100%"
                  isDisabled={!migrateOldContract || !migrateFromIndex || !migrateToIndex}
                >
                  {isTxPending ? '移植中...' : '执行移植'}
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}
      </SimpleGrid>
    </Box>
  )
}
