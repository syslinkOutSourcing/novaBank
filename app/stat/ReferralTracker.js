'use client'
import { useState } from 'react'
import { 
  VStack, 
  HStack, 
  Input, 
  Select, 
  Button, 
  Text, 
  List, 
  ListItem,
  useToast,
  Tag,
  Progress
} from '@chakra-ui/react'
import { useReadContract, useChainId } from 'wagmi'
import { readContract } from '@wagmi/core';
import { isAddress } from 'viem'
import novaBank from '../contracts/novaBank.json'
import { config } from '../wagmiConfig';

const CONTRACTS = {
  'v2': {
    address: '0x0b3aF08B72d21BcF23ae78826553B0952669E5BA',
    abi: novaBank.abi
  }
}

export default function ReferralTracker() {
  const [address, setAddress] = useState('')
  const [contractVersion, setContractVersion] = useState('v2')
  const [referralChain, setReferralChain] = useState([])
  const toast = useToast()
  const chainId = useChainId() // 获取当前链ID

  // 修复1：从useReadContract获取加载状态
  const { 
    data: referrer, 
    refetch: fetchReferrer,
    isLoading: isLoadingReferrer  // 添加加载状态
  } = useReadContract({
    address: CONTRACTS[contractVersion].address,
    abi: CONTRACTS[contractVersion].abi,
    functionName: 'referrals',
    args: [address],
    enabled: false
  })

  const { 
    data: isTeam, 
    refetch: fetchIsTeam,
    isLoading: isLoadingTeam  // 添加加载状态
  } = useReadContract({
    address: CONTRACTS[contractVersion].address,
    abi: CONTRACTS[contractVersion].abi,
    functionName: 'teams',
    args: [address],
    enabled: false
  })

  // 修复2：创建综合加载状态
  const isTracking = isLoadingReferrer || isLoadingTeam;

  // 修改readContract调用，添加chainId参数
  const trackReferral = async () => {
    if (!isAddress(address)) {
      toast({ title: '无效地址', status: 'error', duration: 3000 })
      return
    }

    const chain = []
    let currentAddress = address.toLowerCase()
    const visited = new Set()
    const zeroAddress = '0x0000000000000000000000000000000000000000'
    
    try {
      let depth = 1
      while (depth <= 10) {
        if (visited.has(currentAddress)) {
          toast({ title: '检测到循环推荐关系', status: 'warning' })
          break
        }
        visited.add(currentAddress)

        // 获取推荐信息结构体
        const referralData = await readContract(config, {
          address: CONTRACTS[contractVersion].address,
          abi: CONTRACTS[contractVersion].abi,
          functionName: 'referrals',
          args: [currentAddress],
          chainId: chainId || 56 // 默认BNB链ID
        })

        console.log('referralData', referralData)

        // 解析推荐人地址
        const referrer = referralData.referrer?.toLowerCase() || referralData[0]?.toLowerCase()
        if (!referrer || referrer === zeroAddress.toLowerCase()) {
          chain.push({
            address: currentAddress,
            referrer: zeroAddress,
            isTeam: false,
            depth,
            isTerminal: true
          })
          break
        }

        // 获取团队状态
        const isTeam = await readContract(config, {
          address: CONTRACTS[contractVersion].address,
          abi: CONTRACTS[contractVersion].abi,
          functionName: 'teams',
          args: [currentAddress],
          chainId: chainId || 56
        })

        chain.push({
          address: currentAddress,
          referrer,
          isTeam,
          depth
        })

        currentAddress = referrer
        depth++
      }
      
      setReferralChain(chain)
    } catch (error) {
      toast({ 
        title: '查询失败', 
        description: error.message.includes("execution reverted") 
          ? "合约接口不兼容，请检查合约版本" 
          : error.message,
        status: 'error' 
      })
    }
  }

  return (
    <VStack spacing={4} align="stretch" className="web3-card web3-bg-blur" p={6}>
      <Text fontSize="xl" className="web3-text-gradient">推荐关系追踪器</Text>
      
      <HStack>
        <Input
          placeholder="输入用户地址"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="web3-input"
        />
        <Select
          value={contractVersion}
          onChange={(e) => setContractVersion(e.target.value)}
          className="web3-input"
          width="200px"
        >
          <option value="v2">V2 合约</option>
          <option value="v1">V1 合约</option>
        </Select>
        <Button 
          className="web3-btn"
          onClick={trackReferral}
          isLoading={isTracking}  // 使用合并后的加载状态
        >
          开始追踪
        </Button>
      </HStack>

      {referralChain.length > 0 && (
        <List spacing={3}>
          {referralChain.map((item, index) => (
            <ListItem key={index} p={3} className="web3-card">
              <HStack justify="space-between">
                <VStack align="start">
                  <Text>层级 #{item.depth}</Text>
                  <Text fontSize="sm" opacity={0.8}>
                    {item.address}
                    {item.isTeam && <Tag colorScheme="green" ml={2} size="sm">工作室</Tag>}
                    {item.isTerminal && <Tag colorScheme="red" ml={2} size="sm">终止节点</Tag>}
                  </Text>
                </VStack>
                {!item.isTerminal && (
                  <>
                    <Text>→</Text>
                    <VStack align="end">
                      <Text fontSize="sm">推荐人</Text>
                      <Text fontSize="sm" opacity={0.8}>
                        {item.referrer}
                      </Text>
                    </VStack>
                  </>
                )}
              </HStack>
              {!item.isTerminal && <Progress value={item.depth * 10} size="xs" mt={2} colorScheme="purple"/>}
            </ListItem>
          ))}
        </List>
      )}
    </VStack>
  )
}