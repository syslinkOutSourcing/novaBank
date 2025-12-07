'use client'

import { Box, Tooltip, Button, Input, VStack, HStack, Text, useToast, Select, FormControl, FormLabel, Textarea, useDisclosure, Collapse } from '@chakra-ui/react'
import Link from 'next/link'
import { 
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId
} from 'wagmi'
import { writeContract, waitForTransactionReceipt, readContract } from '@wagmi/core';
import novaBank from '../contracts/novaBank.json'
import novaBankTool from '../contracts/novaBankTool.json'
import BigNumber from 'bignumber.js'
import { useEffect, useState, useMemo, memo } from 'react'
import '../web3.css'  // 确保导入 web3.css
import { useLanguage } from '../context/LanguageContext'
import { translations } from '../context/LanguageContext'
import { parseUnits, isAddress, zeroAddress, parseEther } from 'viem'
import CopyableAddress from '../tools/CopyableAddress'
import copy from 'copy-to-clipboard';
import workshopInfos from '../workshops.json'
import InvestmentStatistics from './InvestmentStatistics'
//import InvestorsFilter from './InvestorsFilter';
import PumpBurnMgr from './PumpBurnMgr'
import ReferralTracker from './ReferralTracker'

// Add this near the top of the file, after the imports
const REFERRER_STORAGE_KEY = 'lastReferrer';

// 辅助函数
const formatBigNumber = (value, decimals = 18, decimalPlaces = 6) => {
  if (value === undefined) return 'N/A';
  return new BigNumber(value.toString())
    .dividedBy(new BigNumber(10).pow(decimals))
    .toFixed(decimalPlaces); // 显示6位小数但是计算使用18位精度
}

export default function Home() {
  const { address } = useAccount()

  const { language } = useLanguage()
  const t = translations[language]

  const toast = useToast()
  const days90 = 90 * 24 * 3600;
  const days180 = 180 * 24 * 3600;
  const days270 = 270 * 24 * 3600;

  const fromBlock = 48176836;
  const [latestBlockNumber, setLatestBlockNumber] = useState(null);

  const { isOpen: isStatOpen, onToggle: onStatToggle } = useDisclosure()

  // 添加管理面板的折叠状态
  const { isOpen: isMgrOpen, onToggle: onMgrToggle } = useDisclosure()

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

  const apikey = "JGTNS21KSVBMR117KVMVSRJNTDD1TST11Z"
  useEffect(() => {
    const fetchLatestBlockNumber = async () => {
      try {
        const response = await fetch(`https://api.etherscan.io/v2/api?chainid=56&module=proxy&action=eth_blockNumber&apikey=${apikey}`);
        const data = await response.json();
        if (data.result) {
          setLatestBlockNumber(parseInt(data.result, 16));
        }
      } catch (error) {
        console.error('Error fetching latest block number:', error);
      }
    };

    fetchLatestBlockNumber();
  }, []);

  const pumpBurnConfig = {
    address: novaBank.address,
    abi: novaBank.abi,
  }

  const pumpBurnToolConfig = {
    address: novaBankTool.address,
    abi: novaBankTool.abi,
  }


  // Basic contract reads
  const { data: basicData } = useReadContracts({
    contracts: [
      {
        ...pumpBurnConfig,
        functionName: 'usdtToken',
      },
      {
        ...pumpBurnConfig,
        functionName: 'burnToken',
      },
      {
        ...pumpBurnConfig,
        functionName: 'minInvestment',
      },
      {
        ...pumpBurnConfig,
        functionName: 'maxInvestment',
      },
      {
        ...pumpBurnConfig,
        functionName: 'maxIdleDurationOfInvest',
      },
      {
        ...pumpBurnConfig,
        functionName: 'incentiveRatePerTime',
      },
      {
        ...pumpBurnConfig,
        functionName: 'incentiveBurnDistributable',
      },
      {
        ...pumpBurnConfig,
        functionName: 'calculateBurnAmountByInvestor',
      },
      {
        ...pumpBurnConfig,
        functionName: 'manager',
      },
      {
        ...pumpBurnConfig,
        functionName: 'totalInvestorNumber',
      },
    ],
  })

  // Destructure basicData with proper types
  const [
    usdtTokenAddress,      // address
    burnTokenAddress,      // address
    minInvestmentAmount,   // uint256
    maxInvestmentAmount,   // uint256
    maxIdleDuration,       // uint250
    incentiveRate,         // uint256
    distributableBurn,     // uint256
    burnByInvestor,        // uint256
    manager,               // address
    totalInvestorNumber,        // uint256
  ] = basicData || []
  
  const tmpMaxInvestment = 7000;
  // Format the values
  const formattedData = {
    usdtToken: usdtTokenAddress?.result?.toString() || 'N/A',
    burnToken: burnTokenAddress?.result?.toString() || 'N/A',
    minInvestment: formatBigNumber(minInvestmentAmount?.result, 18, 0) || 'N/A',
    maxInvestment: tmpMaxInvestment || formatBigNumber(maxInvestmentAmount?.result, 18, 0) || 'N/A',
    maxIdleDuration: maxIdleDuration?.result?.toString() || 'N/A',
    incentiveRate: incentiveRate?.result ? 
      new BigNumber(incentiveRate.result.toString()).dividedBy(10).toString() : 'N/A',
    distributableBurn: formatBigNumber(distributableBurn?.result) || 'N/A',
    burnByInvestor: formatBigNumber(burnByInvestor?.result) || 'N/A',
    manager: manager?.result?.toString() || 'N/A',
    totalInvestorNumber: Number(totalInvestorNumber?.result)
  }

  // Get last 5 investors
  const { data: fullInvestmentInfo } = useReadContract({
    ...pumpBurnConfig,
    functionName: 'getFullInvestmentInfo',
  })

  const [
    mergedInvestorNum,
    totalInvestAmount,
    investAmountWithdrawed,
    interestAmountWithdrawed,
    burnAmountInContract
  ] = fullInvestmentInfo || []

  useEffect(() => {
    if (fullInvestmentInfo === undefined) return;
    
    console.log('fullInvestmentInfo', fullInvestmentInfo)
  }, [fullInvestmentInfo])

  const { data: investorInfo } = useReadContract({
    ...pumpBurnConfig,
    functionName: 'getInvestorInfo',
    args: [address],
    enabled: !!address,
  })


  const [investorsQueries, setInvestorsQueries] = useState([])
  const pageSize = 100;
  //const [lastUserIndex, setLastUserIndex] = useState(Number(totalInvestorNumber));

  // 修改状态变量
  const [investorStartIndex, setInvestorStartIndex] = useState(0);
  const [investorEndIndex, setInvestorEndIndex] = useState(1000);
  const [tempInvestorStartIndex, setTempInvestorStartIndex] = useState("0");
  const [tempInvestorEndIndex, setTempInvestorEndIndex] = useState("1000");

  // 删除原来的这些状态变量：
  // const [investorCount, setInvestorCount] = useState(2266);
  // const [tempInvestorCount, setTempInvestorCount] = useState("2266");

  // 修改处理函数
  const handleInvestorStartIndexChange = (e) => {
    setTempInvestorStartIndex(e.target.value);
  }

  const handleInvestorEndIndexChange = (e) => {
    setTempInvestorEndIndex(e.target.value);
  }

  const applyInvestorRange = () => {
    const startIndex = parseInt(tempInvestorStartIndex);
    const endIndex = parseInt(tempInvestorEndIndex);
    
    if (isNaN(startIndex) || isNaN(endIndex)) {
      toast({
        title: "请输入有效的数字",
        status: "error",
        duration: 2000,
      });
      return;
    }
    
    if (startIndex < 0 || endIndex < 0) {
      toast({
        title: "序号不能为负数",
        status: "error",
        duration: 2000,
      });
      return;
    }
    
    if (startIndex > endIndex) {
      toast({
        title: "起始序号不能大于结束序号",
        status: "error",
        duration: 2000,
      });
      return;
    }
    
    const maxIndex = formattedData.totalInvestorNumber - 1;
    if (endIndex > maxIndex) {
      toast({
        title: `结束序号不能超过最大投资者序号 (${maxIndex})`,
        status: "error",
        duration: 2000,
      });
      return;
    }
    
    setInvestorStartIndex(startIndex);
    setInvestorEndIndex(endIndex);
    
    toast({
      title: `已更新投资者范围: ${startIndex} - ${endIndex} (共 ${endIndex - startIndex + 1} 位投资者)`,
      status: "success",
      duration: 3000,
    });
  }

  // 修改 useEffect 中的查询逻辑
  useEffect(() => {
    console.log('allInvestors totalInvestorNumber', formattedData.totalInvestorNumber)
    const investorQueries = []
    if (formattedData.totalInvestorNumber) {
      const totalInvestors = formattedData.totalInvestorNumber;
      setInvestorEndIndex(totalInvestors - 1);
      setTempInvestorEndIndex(totalInvestors - 1);
      // 使用用户指定的范围
      const startIdx = Math.max(0, Math.min(investorStartIndex, totalInvestors - 1));
      const endIdx = totalInvestors - 1 // Math.max(startIdx, Math.min(investorEndIndex, totalInvestors - 1));
      
      for (let i = endIdx - 1; i >= startIdx; i--) {
        if (i >= 0) {
          investorQueries.push({
            ...pumpBurnConfig,
            functionName: 'investors',
            args: [i],
          })
        }
      }
      setInvestorsQueries(investorQueries);
    }
  }, [formattedData.totalInvestorNumber, investorStartIndex, investorEndIndex]) // 更新依赖项

  const { data: allInvestors } = useReadContracts({
    contracts: investorsQueries,
    enabled: !!investorsQueries?.length
  })

  useEffect(() => {
    if (!allInvestors) return;
    
    console.log('allInvestors data:', allInvestors);
  }, [allInvestors]);


  const compoundCountsQueries = [] || allInvestors?.map(investor => ({
    ...pumpBurnConfig,
    functionName: 'compoundStat',
    args: [investor.result], // Use investor's address
  }))

  const { data: compoundCounts } = useReadContracts({
    contracts: compoundCountsQueries,
    enabled: !!compoundCountsQueries?.length,
  })

  useEffect(() => {
    if (!compoundCounts) return;
    
    //console.log('allInvestors compoundCounts', compoundCounts)
  }, [compoundCounts])

  // Add these new state variables near the top of the component
  const [currentPage, setCurrentPage] = useState(1);
  const investorsPerPage = 50;

  // Add these new state variables for the date picker
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateTimestamp, setDateTimestamp] = useState(Math.floor(new Date().setHours(0, 0, 0, 0) / 1000));

  // Update the queries to get investment info for last investors
  const allInvestorInvestmentQueries = allInvestors?.map(investor => ({
    ...pumpBurnToolConfig,
    functionName: 'getInvestorInfo',
    args: [investor.result], // Use investor's address
  })) || []

  const { data: allInvestorInvestments } = useReadContracts({
    contracts: allInvestorInvestmentQueries,
    enabled: !!allInvestorInvestmentQueries?.length && !!compoundCounts?.length,
  })

  useEffect(() => {
    if (!allInvestorInvestments) return;
    
    console.log('allWorkshopQueries allInvestors Investments', allInvestorInvestments)
  }, [allInvestorInvestments])

  const [allWorkshopQueries, setAllWorkshopQueries] = useState([])
  const [investorsInOneDay, setInvestorsInOneDay] = useState([])
  // Add state for workshop time offset (hours)
  const [timeOffsetHours, setTimeOffsetHours] = useState(144);
  const [tempTimeOffsetHours, setTempTimeOffsetHours] = useState("144");
  
  useEffect(() => {
    const tmpInvestors = []
    const fromTime = dateTimestamp;
    const endTime = fromTime + 24 * 3600;
    const adjustedFromTime = fromTime - timeOffsetHours * 3600;   // 使用可配置的时间偏移量
    //console.log('allWorkshopQueries', allInvestorInvestments.length, timeOffsetHours, adjustedFromTime, endTime);
    setAllWorkshopQueries(allInvestorInvestments?.map((investmentInfo, index) => {
      if (index == 0) console.log('investmentInfo', investmentInfo)
      
      const investor = allInvestors?.[index].result;
      const interestRate = Number(investmentInfo?.result[2]);
      const investTime = Number(investmentInfo?.result[4]) - (interestRate == 50 ? days90 : (interestRate == 65 ? days180 : days270)); 
      // if (investor === '0x41DE17eef12719E7661C84c75F0F33fbEf33e389') {
      //   console.log('0x41DE17eef12719E7661C84c75F0F33fbEf33e389', investTime, interestRate, new Date(investTime * 1000).toLocaleString())
      // }
      if (investTime >= adjustedFromTime && investTime < endTime) {
        tmpInvestors.push(investor);
        return {
          ...pumpBurnToolConfig,
          functionName: 'getWorkshops',
          args: [investor], // Use investor's address
        }
      }
    }).filter(v => v != null))
    setInvestorsInOneDay(tmpInvestors);
  }, [dateTimestamp, allInvestorInvestments, timeOffsetHours])

  console.log('allWorkshopQueries', allWorkshopQueries?.length)

  const { data: allWorkshops } = useReadContracts({
    contracts: allWorkshopQueries,
    enabled: !!allWorkshopQueries?.length,
  })

  const [workshopStat, setWorkshopStat] = useState({})
  useEffect(() => {
    if (!allWorkshops) return;
    
    console.log('allWorkshopQueries allWorkshops', allWorkshops)
    const tmpWorkshopStat = {}
    allWorkshops.map((workshopInfo, index) => {
      const investor = investorsInOneDay[index]
      const investAmount = new BigNumber(workshopInfo.result[0])
      workshopInfo.result[1].map(workshopAddr => {
        if (workshopAddr == zeroAddress) return;        

        // workshopAddr = workshopAddr.toLowerCase();
        if (tmpWorkshopStat[workshopAddr] === undefined) {
          tmpWorkshopStat[workshopAddr] = {totalAmount: investAmount, investors: [{investor, investAmount}]};          
        } else {
          tmpWorkshopStat[workshopAddr].totalAmount = tmpWorkshopStat[workshopAddr].totalAmount.plus(investAmount);
          tmpWorkshopStat[workshopAddr].investors.push({investor, investAmount});
        }
      })
    })
    setWorkshopStat(tmpWorkshopStat)
  }, [allWorkshops])

  // Add this function to handle date changes
  const handleDateChange = (e) => {
    const date = e.target.value
    setSelectedDate(date)
    
    // Convert selected date to timestamp (UTC midnight)
    const timestamp = Math.floor(new Date(date).setHours(0, 0, 0, 0) / 1000)
    setDateTimestamp(timestamp)
  }

  // Add function to handle investor count change
  // const handleInvestorCountChange = (e) => {
  //   setTempInvestorCount(e.target.value);
  // }
  
  // const applyInvestorCount = () => {
  //   const count = parseInt(tempInvestorCount);
  //   if (!isNaN(count) && count > 0) {
  //     setInvestorCount(count);
  //     toast({
  //       title: "已更新投资者数量",
  //       status: "success",
  //       duration: 2000,
  //     });
  //   } else {
  //     toast({
  //       title: "请输入有效数字",
  //       status: "error",
  //       duration: 2000,
  //     });
  //   }
  // }

  // Add state for minimum value threshold
  const [minThreshold, setMinThreshold] = useState(2000);
  const [tempMinThreshold, setTempMinThreshold] = useState("2000");
  
  // Add function to handle minimum threshold change
  const handleMinThresholdChange = (e) => {
    setTempMinThreshold(e.target.value);
  }
  
  const applyMinThreshold = () => {
    const threshold = parseInt(tempMinThreshold);
    if (!isNaN(threshold) && threshold >= 0) {
      setMinThreshold(threshold);
      toast({
        title: "已更新最小阈值",
        status: "success",
        duration: 2000,
      });
    } else {
      toast({
        title: "请输入有效数字",
        status: "error",
        duration: 2000,
      });
    }
  }

  // Add state for investor address filter
  const [addressFilter, setAddressFilter] = useState("");
  const [tempAddressFilter, setTempAddressFilter] = useState("");
  
  // Add function to handle address filter change
  const handleAddressFilterChange = (e) => {
    setTempAddressFilter(e.target.value);
  }
  
  const applyAddressFilter = () => {
    setAddressFilter(tempAddressFilter.toLowerCase().trim());
    toast({
      title: "已更新地址过滤器",
      status: "success",
      duration: 2000,
    });
  }
  
  // Filter investors based on address
  const filteredInvestments = useMemo(() => {
    if (!allInvestorInvestments || !allInvestors) return [];
    
    if (!addressFilter) {
      return allInvestorInvestments;
    }
    
    return allInvestorInvestments.filter((investment, index) => {
      const investor = allInvestors[index]?.result?.toString().toLowerCase();
      return investor && investor.includes(addressFilter);
    });
  }, [allInvestorInvestments, allInvestors, addressFilter]);

  // Add state for workshop investor filter
  const [workshopInvestorFilter, setWorkshopInvestorFilter] = useState([]);
  const [tempWorkshopInvestorFilter, setTempWorkshopInvestorFilter] = useState("");
  
  // Add function to handle workshop investor filter change
  const handleWorkshopInvestorFilterChange = (e) => {
    setTempWorkshopInvestorFilter(e.target.value);
  }
  
  const applyWorkshopInvestorFilter = () => {
    // Split by lines and filter out empty lines, then convert to lowercase and trim
    const addresses = tempWorkshopInvestorFilter
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);
    
    setWorkshopInvestorFilter(addresses);
    toast({
      title: `已更新工作室投资者过滤器 (${addresses.length} 个地址)`,
      status: "success",
      duration: 2000,
    });
  }

  // Add function to import all approved workshops
  const importAllWorkshops = () => {
    // Create a Set to store unique addresses
    const addressSet = new Set();
    
    // Iterate through workshopInfos from the last element to the first
    for (let i = workshopInfos.length - 1; i >= 0; i--) {
      const workshop = workshopInfos[i];
      const address = workshop.address;
      
      if (workshop.approvalStatus === "revoked") {
        // Remove address from set if status is revoked
        addressSet.delete(address);
      } else if (workshop.approvalStatus === "approved") {
        // Add address to set if status is approved
        addressSet.add(address);
      }
    }
    
    // Convert Set to array and join with newlines
    const addresses = Array.from(addressSet);
    const addressText = addresses.join('\n');
    
    // Update the input field
    setTempWorkshopInvestorFilter(addressText);
    
    toast({
      title: `已导入 ${addresses.length} 个已批准的工作室地址`,
      status: "success",
      duration: 2000,
    });
  }

  // Add state for salon workshop filter
  const [salonWorkshopFilter, setSalonWorkshopFilter] = useState([]);
  const [tempSalonWorkshopFilter, setTempSalonWorkshopFilter] = useState("");
  
  // Add function to handle salon workshop filter change
  const handleSalonWorkshopFilterChange = (e) => {
    setTempSalonWorkshopFilter(e.target.value);
  }
  
  const applySalonWorkshopFilter = () => {
    // Split by lines and filter out empty lines, then convert to lowercase and trim
    const addresses = tempSalonWorkshopFilter
      .split('\n')
      .map(addr => addr.trim().toLowerCase())
      .filter(addr => addr.length > 0);
    
    setSalonWorkshopFilter(addresses);
    toast({
      title: `已更新沙龙会工作室过滤器 (${addresses.length} 个地址)`,
      status: "success",
      duration: 2000,
    });
  }

  // Add function to export salon workshops
  const exportSalonWorkshops = () => {
    if (salonWorkshopFilter.length === 0) {
      toast({
        title: "没有沙龙会工作室地址可导出",
        status: "warning",
        duration: 2000,
      });
      return;
    }
    
    // Format addresses as [address1, address2, ..., addressn]
    const formattedAddresses = `[${salonWorkshopFilter.map(addr => `"${addr}"`).join(', ')}]`;
    
    // Copy to clipboard
    copy(formattedAddresses);
    
    toast({
      title: `已导出 ${salonWorkshopFilter.length} 个沙龙会工作室地址`,
      status: "success",
      duration: 2000,
    });
  }

  // Add function to handle time offset change
  const handleTimeOffsetChange = (e) => {
    setTempTimeOffsetHours(e.target.value);
  }
  
  const applyTimeOffset = () => {
    const hours = parseInt(tempTimeOffsetHours);
    if (!isNaN(hours) && hours >= 0) {
      setTimeOffsetHours(hours);
      toast({
        title: "已更新时间偏移量",
        status: "success",
        duration: 2000,
      });
    } else {
      toast({
        title: "请输入有效的小时数",
        status: "error",
        duration: 2000,
      });
    }
  }
  
  // Filter workshops based on investor address
  const filteredWorkshops = useMemo(() => {
    if (!workshopStat || Object.keys(workshopStat).length === 0) return [];
    
    if (!workshopInvestorFilter || workshopInvestorFilter.length === 0) {
      return workshopInfos;
    }
    
    return workshopInfos.filter(workshop => {
      // Check if workshop address matches any of the filter addresses
      return workshopInvestorFilter.some(filterAddr => {
        return workshop.address.includes(filterAddr)
      }
      );
    });
  }, [workshopStat, workshopInfos, workshopInvestorFilter]);

  // Calculate earliest investment time
  const earliestInvestmentTime = useMemo(() => {
    if (!allInvestorInvestments || allInvestorInvestments.length === 0) return null;
    
    // Find the last element (earliest investor) and get their investment start time
    const lastInvestment = allInvestorInvestments[allInvestorInvestments.length - 1];
    if (!lastInvestment?.result?.[4]) return null;
    
    // Investment start time is overTime - 90 days
    const investStartTime = Number(lastInvestment.result[4]) - 90 * 24 * 3600;
    return new Date(investStartTime * 1000);
  }, [allInvestorInvestments]);

  // Add address validation function
  const validateWorkshopAddresses = () => {
    const invalidAddresses = [];
    
    workshopInfos.forEach((workshop, index) => {
      const address = workshop.address;
      
      // Check if address exists and is valid using strict mode
      if (!address || !isAddress(address, { strict: true }) || address.toLowerCase() === address) {
        invalidAddresses.push({
          index: index,
          address: address || 'undefined',
          requestDate: workshop.requestDate,
          approvalStatus: workshop.approvalStatus
        });
      }
    });
    
    if (invalidAddresses.length > 0) {
      // Create detailed error message
      const errorMessage = `发现 ${invalidAddresses.length} 个无效地址：\n` +
        invalidAddresses.map(item => 
          `索引 ${item.index}: ${item.address} (${item.requestDate}, ${item.approvalStatus})`
        ).join('\n');
      
      // Show warning toast
      toast({
        title: "工作室地址验证失败",
        description: errorMessage,
        status: "warning",
        duration: 10000,
        isClosable: true,
      });
      
      // Also log to console for debugging
      console.warn('Invalid workshop addresses found:', invalidAddresses);
    } else {
      console.log('All workshop addresses are valid');
    }
  };

  // Validate addresses when component mounts
  useEffect(() => {
    validateWorkshopAddresses();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <Box className="container" py={8}>
      {/* Update Query Parameters Card */}
      <div className="web3-card web3-bg-blur" style={{marginBottom: '25px'}}>
        <div className="web3-card-title">
          <Text className="web3-text-gradient" fontSize="xl" fontWeight="bold">
            设置查询参数
          </Text>          
        </div>
        <div className="web3-card-content">
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel className="web3-text-gradient">需获取的投资者范围</FormLabel>
                <HStack spacing={4}>
                  <VStack spacing={1} align="stretch" flex={1}>
                    <Text fontSize="sm" color="gray.400">起始序号</Text>
                    <Input
                      className="web3-input"
                      type="number"
                      value={tempInvestorStartIndex}
                      onChange={handleInvestorStartIndexChange}
                      placeholder="输入起始序号"
                      min="0"
                    />
                  </VStack>
                  <VStack spacing={1} align="stretch" flex={1}>
                    <Text fontSize="sm" color="gray.400">结束序号</Text>
                    <Input
                      className="web3-input"
                      type="number"
                      value={tempInvestorEndIndex}
                      onChange={handleInvestorEndIndexChange}
                      placeholder="输入结束序号"
                      min="0"
                    />
                  </VStack>
                  <Button 
                    className="web3-button"
                    onClick={applyInvestorRange}
                    alignSelf="flex-end"
                  >
                    应用
                  </Button>
                </HStack>
                
                {/* 显示当前范围和总投资者数信息 */}
                <VStack spacing={1} align="stretch">
                  <Text fontSize="sm" color="gray.500">
                    当前范围: {investorStartIndex} - {investorEndIndex} 
                    (共 {investorEndIndex - investorStartIndex + 1} 位投资者)
                  </Text>
                  {formattedData.totalInvestorNumber > 0 && (
                    <Text fontSize="sm" color="gray.500">
                      总投资者数: {formattedData.totalInvestorNumber} 
                      (序号范围: 0 - {formattedData.totalInvestorNumber - 1})
                    </Text>
                  )}
                  {earliestInvestmentTime && (
                    <Text fontSize="sm" color="gray.500">
                      最早投资时间: {earliestInvestmentTime.toLocaleString()}
                    </Text>
                  )}
                </VStack>
            </FormControl>
            
            <FormControl>
              <FormLabel className="web3-text-gradient">工作室最低业绩</FormLabel>
              <HStack>
                <Input
                  className="web3-input"
                  type="number"
                  value={tempMinThreshold}
                  onChange={handleMinThresholdChange}
                  placeholder="输入工作室最低业绩"
                  width="200px"
                />
                <Button 
                  className="web3-button"
                  onClick={applyMinThreshold}
                >
                  应用
                </Button>
              </HStack>
            </FormControl>
            
            <FormControl>
              <FormLabel className="web3-text-gradient">投资者地址过滤</FormLabel>
              <HStack>
                <Input
                  className="web3-input"
                  value={tempAddressFilter}
                  onChange={handleAddressFilterChange}
                  placeholder="输入投资者地址（全部或部分）"
                  width="300px"
                />
                <Button 
                  className="web3-button"
                  onClick={applyAddressFilter}
                >
                  应用
                </Button>
              </HStack>
            </FormControl>
            
            <FormControl>
              <FormLabel className="web3-text-gradient">工作室投资者过滤</FormLabel>
              <VStack align="stretch" spacing={2}>
                <Textarea
                  className="web3-input"
                  value={tempWorkshopInvestorFilter}
                  onChange={handleWorkshopInvestorFilterChange}
                  placeholder="输入工作室地址，每行一个地址&#10;例如：&#10;0x1234...&#10;0x5678...&#10;0xabcd..."
                  rows={4}
                  resize="vertical"
                />
                <HStack>
                  <Button 
                    className="web3-button"
                    onClick={applyWorkshopInvestorFilter}
                  >
                    应用
                  </Button>
                  <Button 
                    className="web3-button"
                    onClick={importAllWorkshops}
                  >
                    导入所有工作室
                  </Button>
                  <Text fontSize="sm" color="gray.500">
                    {workshopInvestorFilter.length > 0 && `已过滤 ${workshopInvestorFilter.length} 个地址`}
                  </Text>
                </HStack>
              </VStack>
            </FormControl>
            
            <FormControl>
              <FormLabel className="web3-text-gradient">沙龙会工作室列表</FormLabel>
              <VStack align="stretch" spacing={2}>
                <Textarea
                  className="web3-input"
                  value={tempSalonWorkshopFilter}
                  onChange={handleSalonWorkshopFilterChange}
                  placeholder="输入沙龙会工作室地址，每行一个地址&#10;例如：&#10;0x1234...&#10;0x5678...&#10;0xabcd..."
                  rows={4}
                  resize="vertical"
                />
                <HStack>
                  <Button 
                    className="web3-button"
                    onClick={applySalonWorkshopFilter}
                  >
                    应用
                  </Button>
                  <Button 
                    className="web3-button"
                    onClick={exportSalonWorkshops}
                  >
                    导出沙龙会工作室
                  </Button>
                  <Text fontSize="sm" color="gray.500">
                    {salonWorkshopFilter.length > 0 && `已保存 ${salonWorkshopFilter.length} 个沙龙会工作室地址`}
                  </Text>
                </HStack>
              </VStack>
            </FormControl>
            
            <FormControl>
              <FormLabel className="web3-text-gradient">工作室查询时间偏移（小时）</FormLabel>
              <HStack>
                <Input
                  className="web3-input"
                  type="number"
                  value={tempTimeOffsetHours}
                  onChange={handleTimeOffsetChange}
                  placeholder="输入时间偏移小时数（默认48小时）"
                  width="250px"
                />
                <Button 
                  className="web3-button"
                  onClick={applyTimeOffset}
                >
                  应用
                </Button>
              </HStack>
              <Text fontSize="sm" color="gray.500" mt={1}>
                将起始时间提前指定小时数来查询工作室业绩（当前: {timeOffsetHours}小时）
              </Text>
            </FormControl>
          </VStack>
        </div>
      </div>
      
      {allInvestorInvestments && allInvestorInvestments.length > 0 && (
        <InvestmentStatistics 
          allInvestorInvestments={allInvestorInvestments}
          t={t}
        />
      )}

      {/* Last Investors Card - Update to use filteredInvestments */}
      {false && filteredInvestments && filteredInvestments.length > 0 && (
        <div className="web3-card web3-bg-blur" style={{marginTop: '25px'}}>
          <div className="web3-card-title">
            <Text className="web3-text-gradient" fontSize="xl" fontWeight="bold">
              投资者列表 (显示 {filteredInvestments.length} 位投资者
              {addressFilter && ` - 过滤: "${addressFilter}"`})
            </Text>
          </div>          
          <div className="web3-card-content">
            {/* Desktop view */}
            <div className="web3-table desktop-only">
              <div className="web3-table-header">
                <div style={{ width: '200px' }}>{t.investorAddress}</div>
                <div style={{ width: '150px' }}>USDT {t.amount}</div>
                <div style={{ width: '200px' }}>{t.startTime}</div>
                <div style={{ width: '250px' }}>{"投资状态"}</div>               
              </div>
              {filteredInvestments.length > 0 && filteredInvestments
                .slice((currentPage - 1) * investorsPerPage, currentPage * investorsPerPage)
                .map((investment, index) => {
                  // Find the original index in allInvestors array
                  const originalIndex = allInvestorInvestments.findIndex(inv => inv === investment);
                  const investmentInfo = investment.result;
                  const investor = allInvestors[originalIndex]?.result;
                  const compoundCount = Number(compoundCounts?.[originalIndex]?.result);
                  const overTime = investmentInfo?.[4];
                  const now = Math.floor(new Date().getTime() / 1000);
                  const investing = overTime > now;
                  const ptWithdrawed = investmentInfo?.[0];
                  const investmentStatus = `第${compoundCount + 1}次${investing ? '投资中' : '投资结束'}${ptWithdrawed ? ", 已提取本金" : ", 未提取本金"}`
                  
                  return (
                    <div className="web3-table-row" key={`${investor}-${originalIndex}`}>
                      <div style={{ width: '200px' }}>
                        <CopyableAddress address={investor} />                      
                      </div>
                      <div style={{ width: '150px' }}>{formatBigNumber(investmentInfo?.[2], 18, 2)} USDT</div>
                      <div style={{ width: '200px' }}>{investmentInfo?.[4] ? new Date((Number(investmentInfo[4]) - 90 * 24 * 3600) * 1000).toLocaleString() : '-'}</div>
                      <div style={{ width: '250px' }}>{investmentStatus}</div>
                    </div>
                  )
                })}
            </div>
            
            {/* Pagination controls */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginTop: '20px',
              gap: '10px'
            }}>
              <Button 
                className="web3-button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                isDisabled={currentPage === 1}
              >
                {t.previous || 'Previous'}
              </Button>
              <Text className="web3-text-gradient" alignSelf="center">
                {currentPage} / {Math.ceil(filteredInvestments.length / investorsPerPage)}
              </Text>
              <Button 
                className="web3-button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredInvestments.length / investorsPerPage)))}
                isDisabled={currentPage >= Math.ceil(filteredInvestments.length / investorsPerPage)}
              >
                {t.next || 'Next'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* <InvestorsFilter 
        allInvestorInvestments={allInvestorInvestments}
        allInvestors={allInvestors}
        salonWorkshopFilter={salonWorkshopFilter}
        compoundCounts={compoundCounts}
        totalInvestorNumber={investorEndIndex}
        t={t}
      /> */}

      {/* Workshop Info Table - Update to use filteredWorkshops */}
      {(
        <div className="web3-card web3-bg-blur" style={{marginTop: '25px', maxHeight: '600px', overflowY: 'auto'}}>
          <div className="web3-card-title" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div style={{ flex: '1' }}>
              <Text className="web3-text-gradient" fontSize="xl" fontWeight="bold">
                {t.workshopList}
                {workshopInvestorFilter.length > 0 && ` - 工作室过滤: ${workshopInvestorFilter.length} 个地址`}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Input
                className="web3-input"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                width="auto"
              />
              <Button 
                className="web3-button" 
                size="sm"
                onClick={() => {
                  let workshopInfo = '['
                  filteredWorkshops.forEach(workshop => {
                    const workshopData = workshopStat[workshop.address];
                    if (workshopData && workshopData.totalAmount.shiftedBy(-18).gte(minThreshold)) {
                      workshopInfo += `{"${workshop.address}": ${workshopData.totalAmount.shiftedBy(-18).toFixed(0)}},`
                    }
                  });
                  workshopInfo += ']'
                  copy(workshopInfo);
                  toast({
                    title: t.copied || 'Copied!',
                    status: 'success',
                    duration: 2000,
                  });
                }}
              >
                {t.copy || 'Copy'}
              </Button>
              <Button 
                className="web3-button" 
                size="sm"
                onClick={() => {
                  let totalAmount = 0;
                  let salonTotalReward = 0;
                  let regularTotalReward = 0;
                  let regularWorkshops = '';
                  let salonWorkshops = '';
                  // Convert salon workshop addresses to Set for efficient lookup
                  const salonWorkshopSet = new Set(salonWorkshopFilter.map(addr => addr.toLowerCase()));
                  const duplicateWorkshopSet = new Set();

                  filteredWorkshops.forEach(workshop => {
                    if (duplicateWorkshopSet.has(workshop.address)) {
                      return;
                    }
                    duplicateWorkshopSet.add(workshop.address);
                    
                    const workshopData = workshopStat[workshop.address];
                    if (workshopData && workshopData.totalAmount.shiftedBy(-18).gte(minThreshold)) {
                      const amount = Math.floor(workshopData.totalAmount.shiftedBy(-18).toNumber());
                      totalAmount += amount;
                      
                      const isSalonWorkshop = salonWorkshopSet.has(workshop.address.toLowerCase());
                      const workshopLine = `${workshop.address}: ${amount}${isSalonWorkshop ? '（沙龙会）' : ''}\n`;
                      if (isSalonWorkshop) {
                        salonWorkshops += workshopLine;
                        salonTotalReward += amount * 0.03;
                      } else {
                        regularWorkshops += workshopLine;
                        regularTotalReward += amount * 0.02;
                      }
                    }
                  });
                  
                  const summary = `总业绩: ${totalAmount} 普通工作室2%奖励: ${regularTotalReward} 沙龙会工作室3%奖励: ${salonTotalReward}\n\n${regularWorkshops}${salonWorkshops}`;
                  copy(summary);
                  toast({
                    title: t.copied || 'Copied!',
                    status: 'success',
                    duration: 2000,
                  });
                }}
              >
                {t.simpleCopy || 'Copy(沙龙)'}
              </Button>

              <Button 
                className="web3-button" 
                size="sm"
                onClick={() => {
                  const duplicateWorkshopSet = new Set();
                  let allAddresses = '[';
                  filteredWorkshops.forEach(workshop => {
                    if (duplicateWorkshopSet.has(workshop.address)) {
                      return;
                    }
                    duplicateWorkshopSet.add(workshop.address);
                    const workshopData = workshopStat[workshop.address];
                    if (workshopData && workshopData.totalAmount.shiftedBy(-18).gte(minThreshold)) {
                      allAddresses += `"${workshop.address}",`
                    }
                  });
                  allAddresses += ']';
                  
                  copy(allAddresses);
                }}
              >
                {t.simpleCopy || 'Copy Address'}
              </Button>
              <Button 
                className="web3-button" 
                size="sm"
                onClick={() => {
                  const duplicateWorkshopSet = new Set();
                  let allAmounts = '[';
                  filteredWorkshops.forEach(workshop => {
                    if (duplicateWorkshopSet.has(workshop.address)) {
                      return;
                    }
                    duplicateWorkshopSet.add(workshop.address);
                    
                    const workshopData = workshopStat[workshop.address];
                    if (workshopData && workshopData.totalAmount.shiftedBy(-18).gte(minThreshold)) {
                      allAmounts += `${workshopData.totalAmount.shiftedBy(-18).toFixed(0)},`
                    }
                  });
                  allAmounts += ']';
                  
                  copy(allAmounts);
                }}
              >
                {t.simpleCopy || 'Copy Amounts'}
              </Button>
            </div>
          </div>
          <div className="web3-card-content">
            {/* Desktop view */}
            <div className="web3-table desktop-only">
              <div className="web3-table-header">
                <div style={{ width: '200px' }}>{t.workshopAddress}</div>
                <div style={{ width: '100px' }}>{"当天业绩"}</div>
                <div style={{ width: '400px' }}>{"投资者"}</div>
              </div>
              {filteredWorkshops.map((workshop, index) => {
                //console.log('filteredWorkshops', workshop.address, workshopStat[workshop.address])
                if (workshopStat[workshop.address] === undefined) return null;
                let investorsInfo = ""
                workshopStat[workshop.address].investors.map(investorInfo => {
                  investorsInfo += `${investorInfo.investor}:${investorInfo.investAmount.shiftedBy(-18).toFixed(2)}; `
                })
                return (
                  <div className="web3-table-row" key={`${workshop.address}-${index}`}>
                    <div style={{ width: '200px' }}>
                      <CopyableAddress address={workshop.address} />                            
                    </div>
                    <div style={{ width: '100px' }}>{workshopStat[workshop.address] ? workshopStat[workshop.address].totalAmount.shiftedBy(-18).toFixed(2) : '0'}</div>
                    <Tooltip label={investorsInfo} placement="top" hasArrow>
                      <div 
                        style={{ width: '400px', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} 
                        onClick={() => {
                          copy(investorsInfo);
                          toast({
                            title: t.copied || 'Copied!',
                            status: 'success',
                            duration: 2000,
                          });
                        }}
                      >
                        {investorsInfo}
                      </div>
                    </Tooltip>
                  </div>
                )
              }).filter(v => v != null)}
            </div>
          </div>
        </div>
      )}

      {/* Add the new WorkshopRewardDistribution component */}
      {/* <WorkshopRewardDistribution /> */}

      {/* 在现有的统计组件后添加管理面板 */}
      <Box mt={8}>
        <Button
          onClick={onMgrToggle}
          className="web3-btn"
          width="100%"
          mb={4}
          rightIcon={isMgrOpen ? '▼' : '▶'}
        >
          合约管理面板
        </Button>
        <Collapse in={isMgrOpen} animateOpacity>
          <Box className="web3-card web3-bg-blur" p={4}>
            <PumpBurnMgr />
          </Box>
        </Collapse>
      </Box>

      {/* Add V1 investor list */}
      {/* <BurnInvestedListV1 t={t} /> */}
      <ReferralTracker />
    </Box>
  )
}
