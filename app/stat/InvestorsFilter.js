import { useState, useRef, useEffect } from 'react';
import {
  Box, Table, Thead, Tbody, Tr, Th, Td, Button, Text, Flex, HStack, VStack,
  RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb,
  Input, Select, FormControl, FormLabel, Badge, useToast, Icon,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  Divider, ButtonGroup, ModalFooter, Progress
} from '@chakra-ui/react';
import { FaFilter, FaCopy, FaDownload, FaCalendar, FaSearch, FaChevronLeft, FaChevronRight, FaGift } from 'react-icons/fa';
import { format } from 'date-fns';
import BigNumber from 'bignumber.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi';
import { parseUnits } from 'viem';
import { readContract } from '@wagmi/core';
import { config } from '../wagmiConfig'; // 假设你有wagmi配置文件

// 修改时间范围选择组件，增加小时选择
const DateRangePicker = ({ startDate, endDate, startHour, endHour, onStartDateChange, onEndDateChange, onStartHourChange, onEndHourChange, t }) => {
  return (
    <VStack spacing={2} width="100%">
      <HStack spacing={2} alignItems="center" width="100%">
        <FormLabel minWidth="60px" mb="0">{t?.from || '从'}</FormLabel>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          size="sm"
        />
        <Select
          value={startHour}
          onChange={(e) => onStartHourChange(e.target.value)}
          size="sm"
          width="100px"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
          ))}
        </Select>
      </HStack>
      
      <HStack spacing={2} alignItems="center" width="100%">
        <FormLabel minWidth="60px" mb="0">{t?.to || '至'}</FormLabel>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          size="sm"
        />
        <Select
          value={endHour}
          onChange={(e) => onEndHourChange(e.target.value)}
          size="sm"
          width="100px"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
          ))}
        </Select>
      </HStack>
    </VStack>
  );
};

const formatBigNumber = (value, decimals = 18, decimalPlaces = 2) => {
  if (!value) return '0';
  return new BigNumber(value.toString())
    .dividedBy(new BigNumber(10).pow(decimals))
    .toFixed(decimalPlaces);
};

const InvestorsFilter = ({ allInvestors, allInvestorInvestments, salonWorkshopFilter, compoundCounts, totalInvestorNumber, t }) => {
  const toast = useToast();
  const [investorData, setInvestorData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 添加发送奖励相关的状态
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [fromIndex, setFromIndex] = useState('');
  const [toIndex, setToIndex] = useState('');
  const [burnPrice, setBurnPrice] = useState('');
  
  // 合约写入和交易状态
  const { writeContractAsync: distributeReward } = useWriteContract();
  const [rewardTxHash, setRewardTxHash] = useState(null);
  const { isLoading: isRewardPending, isSuccess: isRewardSuccess, isError: isRewardError } = useWaitForTransactionReceipt({
    hash: rewardTxHash,
    enabled: !!rewardTxHash,
  });
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // 每页固定20条数据
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedData, setPaginatedData] = useState([]);
  
  // 筛选条件状态
  const [amountRange, setAmountRange] = useState([0, 100000]);
  const [maxAmount, setMaxAmount] = useState(100000);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('all'); // all, active, completed
  const [searchQuery, setSearchQuery] = useState('');
  
  // 导出数据
  const [exportText, setExportText] = useState('');
  
  // 添加小时选择的状态
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(23);
  
  // 添加投资轮次筛选的状态
  const [roundRange, setRoundRange] = useState([1, 10]);
  const [maxRound, setMaxRound] = useState(10);
  
  // 在现有的状态管理部分添加新的状态
  const [referralData, setReferralData] = useState({}); // 存储推荐信息
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [referralFromIndex, setReferralFromIndex] = useState('');
  const [referralToIndex, setReferralToIndex] = useState('');
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);
  const [referralProgress, setReferralProgress] = useState({ current: 0, total: 0 });
  
  // 每日到期投资图表相关状态
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [chartData, setChartData] = useState([]);

  // 移除之前的 referralQueries 相关代码，使用新的方法
  // 删除这些行：
  // const [referralQueries, setReferralQueries] = useState([]);
  // const { data: referralResults } = useReadContracts({...});

  // 添加新的导入
  // import { readContract } from '@wagmi/core';
  // import { config } from '../wagmiConfig'; // 假设你有wagmi配置文件

  // 修改 fetchReferralInfo 函数
  const fetchReferralInfo = async (startIndex, endIndex) => {
    setIsLoadingReferrals(true);
    const total = endIndex - startIndex + 1;
    setReferralProgress({ current: 0, total });
    
    const batchSize = 50;
    const newReferralData = { ...referralData };
    let processed = 0;
    
    try {
      for (let i = startIndex; i <= endIndex; i += batchSize) {
        const batchEnd = Math.min(i + batchSize - 1, endIndex);
        const batchPromises = [];
        
        // 为当前批次创建查询
        for (let j = i; j <= batchEnd; j++) {
          const investorIndex = totalInvestorNumber - 1 - j; // 修正索引计算
          if (allInvestors[investorIndex]?.result) {
            const investorAddress = allInvestors[investorIndex].result;
            
            // 创建异步查询
            const promise = readContract(config, {
              address: '0x93fD192e1CD288F1f5eE0A019429B015016061F9', // pumpBurnNew合约地址
              abi: [
                {
                  "inputs": [
                    {
                      "internalType": "address",
                      "name": "",
                      "type": "address"
                    }
                  ],
                  "name": "referrals",
                  "outputs": [
                    {
                      "internalType": "address",
                      "name": "referrer",
                      "type": "address"
                    },
                    {
                      "internalType": "uint256",
                      "name": "totalBurnRewards",
                      "type": "uint256"
                    },
                    {
                      "internalType": "uint256",
                      "name": "totalBurn2UsdtRewards",
                      "type": "uint256"
                    },
                    {
                      "internalType": "uint256",
                      "name": "totalUsdtRewards",
                      "type": "uint256"
                    },
                    {
                      "internalType": "uint256",
                      "name": "totalPerformance",
                      "type": "uint256"
                    },
                    {
                      "internalType": "uint256",
                      "name": "totalExtraRewards",
                      "type": "uint256"
                    },
                    {
                      "internalType": "uint256",
                      "name": "withdrawnExtraRewards",
                      "type": "uint256"
                    }
                  ],
                  "stateMutability": "view",
                  "type": "function"
                }
              ],
              functionName: 'referrals',
              args: [investorAddress],
            }).then(result => ({
              address: investorAddress,
              index: j,
              data: result
            })).catch(error => {
              console.error(`Error fetching referral for ${investorAddress}:`, error);
              return {
                address: investorAddress,
                index: j,
                data: null,
                error: error.message
              };
            });
            
            batchPromises.push(promise);
          }
        }
        
        // 等待当前批次完成
        const batchResults = await Promise.all(batchPromises);
        
        // 处理结果
        batchResults.forEach(result => {
          if (result.data) {
            newReferralData[result.address] = {
              referrer: result.data[0],
              totalBurnRewards: result.data[1],
              totalBurn2UsdtRewards: result.data[2],
              totalUsdtRewards: result.data[3],
              totalPerformance: result.data[4],
              totalExtraRewards: result.data[5],
              withdrawnExtraRewards: result.data[6],
            };
          }
          processed++;
        });
        
        // 更新进度
        setReferralProgress({ current: processed, total });
        
        // 添加延迟避免过快请求
        if (i + batchSize <= endIndex) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setReferralData(newReferralData);
      
      toast({
        title: t?.success || '成功',
        description: `${t?.referralDataLoaded || '推荐信息获取完成'} (${processed}/${total})`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Fetch referrals error:', error);
      toast({
        title: t?.error || '错误',
        description: error.message || t?.fetchFailed || '获取推荐信息失败',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoadingReferrals(false);
      setIsReferralModalOpen(false);
      setReferralFromIndex('');
      setReferralToIndex('');
    }
  };

  // 修改验证逻辑，允许从0开始
  const handleFetchReferrals = async () => {
    const fromIndex = parseInt(referralFromIndex);
    const toIndex = parseInt(referralToIndex);
    
    // 修改验证逻辑，允许从0开始
    if (isNaN(fromIndex) || isNaN(toIndex) || fromIndex > toIndex || fromIndex < 0) {
      toast({
        title: t?.error || '错误',
        description: t?.invalidIndexRange || '序号范围无效（序号应从0开始）',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    // 检查序号范围是否超出总投资者数量
    if (toIndex >= totalInvestorNumber) {
      toast({
        title: t?.error || '错误',
        description: `序号范围超出总投资者数量 (0-${totalInvestorNumber - 1})`,
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    await fetchReferralInfo(fromIndex, toIndex);
  };

  // 格式化地址显示（简写且可复制）
  const AddressCell = ({ address }) => {
    const handleCopy = () => {
      navigator.clipboard.writeText(address);
      toast({
        title: t?.copied || '已复制',
        status: 'success',
        duration: 1000,
      });
    };
    
    return (
      <Text 
        fontSize="xs" 
        fontFamily="monospace" 
        cursor="pointer" 
        onClick={handleCopy}
        _hover={{ color: 'blue.400' }}
        title={address}
      >
        {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '-'}
      </Text>
    );
  };

  // 修改投资者数据处理，添加推荐信息
  useEffect(() => {
    if (!allInvestorInvestments || !allInvestorInvestments.length) return;
    
    console.log('allInvestorInvestments in filter', allInvestorInvestments)

    const processed = allInvestorInvestments
      //.filter(inv => inv && inv.result)
      .map((investment, index) => {
        const info = investment.result;
        if (info === undefined) {
          console.log('allInvestorInvestments null', investment)
          return;
        };
        const address = allInvestors[index].result;
        const amount = info[1] ? formatBigNumber(info[1]) : '0';
        const interestRate = info[2] ? Number(info[2]) : 50;
        const timestamp = info[4] ? Number(info[4]) * 1000 : 0;
        const isActive = info[5] === true || info[5] === 1;
        const compoundCount = Number(compoundCounts?.[index]?.result) + 1;
        
        let date = timestamp - 90 * 24 * 3600 * 1000 * (interestRate == 50 ? 1 : (interestRate == 65 ? 2 : 3));
        
        // 获取推荐信息
        const referralInfo = {
          totalPerformance: formatBigNumber(info[8]),
          totalExtraRewards: formatBigNumber(info[9]),
          withdrawnExtraRewards: formatBigNumber(info[10]),
        };
        
        return {
          index: totalInvestorNumber - index,
          address,
          amount,
          rawAmount: info[2] || '0',
          date,
          timestamp,
          compoundCount,
          status: isActive ? 'active' : 'completed',
          dateStr: format(date, 'yyyy-MM-dd'),
          // 添加时间显示
          dateTimeStr: format(date, 'yyyy-MM-dd HH:mm'),
          endTimeStr: format(timestamp, 'yyyy-MM-dd HH:mm'),
          totalPerformance: referralInfo.totalPerformance || '0',
          totalExtraRewards: referralInfo.totalExtraRewards || '0',
          withdrawnExtraRewards: referralInfo.withdrawnExtraRewards || '0',
          remainingRewards: referralInfo.totalExtraRewards && referralInfo.withdrawnExtraRewards 
            ? (parseFloat(referralInfo.totalExtraRewards) - 
               parseFloat(referralInfo.withdrawnExtraRewards)).toFixed(2)
            : '0'
        };
      });
    
    setInvestorData(processed);
    
    // 找出最大投资额，设置为滑块上限
    if (processed.length) {
      const max = Math.max(...processed.map(item => item?.amount));
      setMaxAmount(Math.ceil(max * 1.2)); // 增加20%余量
      setAmountRange([0, Math.ceil(max * 1.2)]);
    }
    
    // 找出最大轮次，设置为滑块上限
    if (processed.length) {
      const maxRoundValue = Math.max(...processed.map(item => item?.compoundCount));
      setMaxRound(Math.max(maxRoundValue, 10)); // 至少为10
      setRoundRange([1, Math.max(maxRoundValue, 10)]);
    }
    
    // 默认应用全部数据
    setFilteredData(processed);
  }, [allInvestorInvestments, referralData]); // 添加 referralData 依赖
  
  // 当筛选后的数据变化时，更新分页信息
  useEffect(() => {
    if (!filteredData || !filteredData.length) {
      setTotalPages(1);
      setPaginatedData([]);
      return;
    }
    
    // 计算总页数
    const totalPagesCount = Math.ceil(filteredData.length / pageSize);
    setTotalPages(totalPagesCount);
    
    // 如果当前页超出总页数，重置为第一页
    if (currentPage > totalPagesCount) {
      setCurrentPage(1);
    }
    
    // 计算当前页数据
    updatePaginatedData();
  }, [filteredData]);
  
  // 当页码变化时，更新分页数据
  useEffect(() => {
    updatePaginatedData();
  }, [currentPage]);
  
  // 更新分页数据的函数
  const updatePaginatedData = () => {
    if (!filteredData.length) return;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredData.length);
    const currentPageData = filteredData.slice(startIndex, endIndex);
    
    setPaginatedData(currentPageData);
  };
  
  // 页码处理函数
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  const [totalAmount, setTotalAmount] = useState(0);
  // 修改应用筛选的逻辑
  const applyFilters = () => {
    let results = [...investorData];
    
    // 按金额范围筛选
    results = results.filter(
      item => item.amount >= amountRange[0] && item.amount <= amountRange[1]
    );
    //console.log('results 1', results)
    
    // 按日期范围筛选，精确到小时
    if (startDate) {
      const [year, month, day] = startDate.split('-').map(Number);
      const startDateTime = new Date(year, month - 1, day, startHour, 0, 0).getTime();
      results = results.filter(item => item.date >= startDateTime);
    }
    //console.log('results 2', results)
    
    if (endDate) {
      const [year, month, day] = endDate.split('-').map(Number);
      const endDateTime = new Date(year, month - 1, day, endHour, 59, 59).getTime();
      results = results.filter(item => item.date <= endDateTime);
    }
    //console.log('results 3', results)
    
    // 按轮次范围筛选
    // results = results.filter(
    //   item => item.compoundCount >= roundRange[0] && item.compoundCount <= roundRange[1]
    // );
    //console.log('results 4', results)
    
    // 按状态筛选
    // if (status !== 'all') {
    //   results = results.filter(item => item.status === status);
    // }
    
    // 按地址搜索
    if (searchQuery.trim()) {
      results = results.filter(item => 
        item.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    console.log('results 5', results)
    setFilteredData(results);
    
    // 更新导出文本
    setTotalAmount(results.reduce((sum, item) => sum + Number(item.amount), 0));
    const exportData = results.map(item => {
      return `${item.address} ${item.amount}`; 
    }).join('\n');
    
    setExportText(exportData);
    
    // 重置为第一页
    setCurrentPage(1);
  };
  
  // 复制到剪贴板
  const copyToClipboard = () => {
    if (!exportText) {
      toast({
        title: "没有数据可复制",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    
    navigator.clipboard.writeText(exportText).then(
      () => {
        toast({
          title: "数据已复制到剪贴板",
          status: "success",
          duration: 3000,
        });
      },
      (err) => {
        toast({
          title: "复制失败",
          description: err.message,
          status: "error",
          duration: 3000,
        });
      }
    );
  };
  
  // 修改重置筛选器
  const resetFilters = () => {
    setAmountRange([0, maxAmount]);
    setStartDate('');
    setEndDate('');
    setStartHour(0);
    setEndHour(23);
    setStatus('all');
    setSearchQuery('');
    setRoundRange([1, maxRound]);
    setFilteredData(investorData);
    
    // 重置为第一页
    setCurrentPage(1);
  };
  
  // 生成页码按钮
  const renderPagination = () => {
    // 如果只有一页，不显示分页
    if (totalPages <= 1) return null;
    
    const pageButtons = [];
    
    // 添加上一页按钮
    pageButtons.push(
      <Button 
        key="prev" 
        size="sm" 
        onClick={() => handlePageChange(currentPage - 1)}
        isDisabled={currentPage === 1}
        className="web3-btn-sm"
      >
        <Icon as={FaChevronLeft} />
      </Button>
    );
    
    // 确定要显示的页码范围（最多显示5个页码按钮）
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    // 添加第一页按钮
    if (startPage > 1) {
      pageButtons.push(
        <Button 
          key={1} 
          size="sm" 
          onClick={() => handlePageChange(1)}
          variant={currentPage === 1 ? "solid" : "outline"}
          className={currentPage === 1 ? "web3-btn-active" : "web3-btn-sm"}
        >
          1
        </Button>
      );
      
      // 添加省略号
      if (startPage > 2) {
        pageButtons.push(<Text key="ellipsis1">...</Text>);
      }
    }
    
    // 添加页码按钮
    for (let i = startPage; i <= endPage; i++) {
      if (i === 1 || i === totalPages) continue; // 第一页和最后一页单独处理
      
      pageButtons.push(
        <Button 
          key={i} 
          size="sm" 
          onClick={() => handlePageChange(i)}
          variant={currentPage === i ? "solid" : "outline"}
          className={currentPage === i ? "web3-btn-active" : "web3-btn-sm"}
        >
          {i}
        </Button>
      );
    }
    
    // 添加最后一页按钮
    if (endPage < totalPages) {
      // 添加省略号
      if (endPage < totalPages - 1) {
        pageButtons.push(<Text key="ellipsis2">...</Text>);
      }
      
      pageButtons.push(
        <Button 
          key={totalPages} 
          size="sm" 
          onClick={() => handlePageChange(totalPages)}
          variant={currentPage === totalPages ? "solid" : "outline"}
          className={currentPage === totalPages ? "web3-btn-active" : "web3-btn-sm"}
        >
          {totalPages}
        </Button>
      );
    }
    
    // 添加下一页按钮
    pageButtons.push(
      <Button 
        key="next" 
        size="sm" 
        onClick={() => handlePageChange(currentPage + 1)}
        isDisabled={currentPage === totalPages}
        className="web3-btn-sm"
      >
        <Icon as={FaChevronRight} />
      </Button>
    );
    
    return (
      <Flex justify="center" mt={4}>
        <ButtonGroup spacing={2}>
          {pageButtons}
        </ButtonGroup>
      </Flex>
    );
  };
  
  // 监听奖励交易状态
  useEffect(() => {
    if (isRewardSuccess) {
      toast({
        title: t?.success || '成功',
        description: t?.rewardDistributed || '奖励分发成功',
        status: 'success',
        duration: 3000,
      });
      setRewardTxHash(null);
      setIsRewardModalOpen(false);
      // 清空输入框
      setFromIndex('');
      setToIndex('');
      setBurnPrice('');
    } else if (isRewardError) {
      toast({
        title: t?.error || '错误',
        description: t?.rewardFailed || '奖励分发失败',
        status: 'error',
        duration: 3000,
      });
      setRewardTxHash(null);
    }
  }, [isRewardSuccess, isRewardError, t, toast]);

  // 添加复制团队数据的函数
  const copyTeamData = () => {
    if (!filteredData || filteredData.length === 0) {
      toast({
        title: t?.noData || "没有数据",
        description: t?.noDataToCopy || "没有数据可复制",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    // 筛选出剩余奖励大于0的投资者
    const teamMembers = filteredData.filter(investor => {
      const remainingRewards = parseFloat(investor.remainingRewards || '0');
      return remainingRewards > 0;
    });

    if (teamMembers.length === 0) {
      toast({
        title: t?.noTeamData || "没有团队数据",
        description: t?.noTeamDataToCopy || "没有剩余奖励大于0的投资者",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    // 格式化团队数据
    const teamData = teamMembers.map(member => {
      return `${member.address} ${member.remainingRewards}`;
    }).join('\n');

    // 添加汇总信息
    const totalRemainingRewards = teamMembers.reduce((sum, member) => {
      return sum + parseFloat(member.remainingRewards || '0');
    }, 0);

    const summary = `团队成员数量: ${teamMembers.length}\n总剩余奖励: ${totalRemainingRewards.toFixed(2)} USDT\n\n地址 剩余奖励(USDT)\n${teamData}`;

    // 复制到剪贴板
    navigator.clipboard.writeText(summary).then(
      () => {
        toast({
          title: t?.success || "成功",
          description: `${t?.teamDataCopied || '团队数据已复制'} (${teamMembers.length}位成员, ${totalRemainingRewards.toFixed(2)} USDT)`,
          status: "success",
          duration: 3000,
        });
      },
      (err) => {
        toast({
          title: t?.error || "复制失败",
          description: err.message,
          status: "error",
          duration: 3000,
        });
      }
    );
  };

  // 统计每天到期投资总额的函数
  const copyDailyExpiringInvestments = () => {
    if (!investorData || investorData.length === 0) {
      toast({
        title: t?.noData || "没有数据",
        description: t?.noDataToCopy || "没有数据可复制",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    // 获取明天的日期（从第二天开始）
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowTimestamp = tomorrow.getTime();

    // 按日期分组统计
    const dailyStats = {};
    
    investorData.forEach(investor => {
      if (!investor.timestamp || !investor.amount) return;
      
      // 只统计从明天开始的到期投资
      if (investor.timestamp < tomorrowTimestamp) return;
      
      // 将时间戳转换为日期（只取日期部分，忽略时间）
      const expiryDate = new Date(investor.timestamp);
      expiryDate.setHours(0, 0, 0, 0);
      const dateKey = format(expiryDate, 'yyyy-MM-dd');
      
      // 累加投资额
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = 0;
      }
      dailyStats[dateKey] += parseFloat(investor.amount || '0');
    });

    // 如果没有数据
    if (Object.keys(dailyStats).length === 0) {
      toast({
        title: t?.noData || "没有数据",
        description: "从明天开始没有到期的投资",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    // 按日期排序
    const sortedDates = Object.keys(dailyStats).sort();
    
    // 准备图表数据
    const chartDataArray = sortedDates.map(date => ({
      date: date,
      amount: parseFloat(dailyStats[date].toFixed(2))
    }));
    setChartData(chartDataArray);
    
    // 格式化输出
    const lines = sortedDates.map(date => {
      return `${date} ${dailyStats[date].toFixed(2)}`;
    });

    // 计算总计
    const totalAmount = sortedDates.reduce((sum, date) => sum + dailyStats[date], 0);
    
    // 添加汇总信息
    const summary = `每日到期投资统计（从${format(tomorrow, 'yyyy-MM-dd')}开始）\n总天数: ${sortedDates.length}\n总金额: ${totalAmount.toFixed(2)} USDT\n\n日期 到期总额(USDT)\n${lines.join('\n')}`;

    // 复制到剪贴板
    navigator.clipboard.writeText(summary).then(
      () => {
        toast({
          title: t?.success || "成功",
          description: `每日到期投资统计已复制 (${sortedDates.length}天, ${totalAmount.toFixed(2)} USDT)`,
          status: "success",
          duration: 3000,
        });
        // 打开图表模态框
        setIsChartModalOpen(true);
      },
      (err) => {
        toast({
          title: t?.error || "复制失败",
          description: err.message,
          status: "error",
          duration: 3000,
        });
      }
    );
  };

  return (
    <Box className="web3-card web3-bg-blur" mt={8}>
      <div className="web3-card-title">
        <Flex justify="space-between" align="center" width="100%">
          <Text className="web3-text-gradient" fontSize="xl" fontWeight="bold">
            {t?.investorsList || '投资者列表'} {totalAmount}
          </Text>
          <HStack>
            <Button size="sm" className="web3-btn" onClick={() => setIsModalOpen(true)}>
              <Icon as={FaFilter} mr={1} /> {t?.filter || '筛选'}
            </Button>
            <Button size="sm" className="web3-btn" onClick={copyToClipboard}>
              <Icon as={FaCopy} mr={1} /> {t?.copy || '复制数据'}
            </Button>
            <Button size="sm" className="web3-btn" onClick={() => setIsReferralModalOpen(true)}>
              <Icon as={FaSearch} mr={1} /> {t?.getReferralInfo || '获取推荐信息'}
            </Button>
            <Button size="sm" className="web3-btn" onClick={copyTeamData}>
              <Icon as={FaCopy} mr={1} /> {t?.copyTeam || '复制团队'}
            </Button>
            <Button size="sm" className="web3-btn" onClick={copyDailyExpiringInvestments}>
              <Icon as={FaCalendar} mr={1} /> {t?.dailyExpiring || '每日到期统计'}
            </Button>
          </HStack>
        </Flex>
      </div>
      
      <Box p={4}>
        {/* 快速搜索 */}
        <Flex mb={4}>
          <Input
            placeholder={t?.searchAddress || '搜索地址...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="sm"
            mr={2}
          />
          <Button size="sm" className="web3-btn" onClick={applyFilters}>
            <Icon as={FaSearch} />
          </Button>
        </Flex>
        
        {/* 修改投资者表格，展示时间 */}
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>{t?.investor || '序号'}</Th>
                <Th>{t?.investor || '投资者'}</Th>
                <Th isNumeric>{'投资金额 (USDT)'}</Th>
                <Th>{t?.dateTime || '日期时间'}</Th>
                <Th isNumeric>{t?.totalPerformance || '总业绩'}</Th>
                <Th isNumeric>{t?.totalExtraRewards || '总额外奖励'}</Th>
                <Th isNumeric>{t?.withdrawnRewards || '已提取奖励'}</Th>
                <Th isNumeric>{t?.remainingRewards || '剩余奖励'}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((investor, index) => (
                  <Tr key={`${investor.address}-${index}`}>
                    <Td fontSize="xs" fontFamily="monospace">
                      {investor.index}
                    </Td>
                    <Td>
                      <AddressCell address={investor.address} />
                    </Td>
                    <Td isNumeric>{investor.amount}</Td>
                    <Td>{investor.dateTimeStr} ~ {investor.endTimeStr}</Td>
                    <Td isNumeric>{investor.totalPerformance}</Td>
                    <Td isNumeric>{investor.totalExtraRewards}</Td>
                    <Td isNumeric>{investor.withdrawnExtraRewards}</Td>
                    <Td isNumeric>{investor.remainingRewards}</Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={11} textAlign="center">{t?.noData || '没有找到匹配的数据'}</Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
        
        {/* 分页控件 */}
        {renderPagination()}
        
        {/* 分页信息显示 */}
        {filteredData.length > 0 && (
          <Text textAlign="center" fontSize="sm" mt={2} color="gray.500">
            {t?.showing || '显示'} {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}-
            {Math.min(currentPage * pageSize, filteredData.length)} {t?.of || '/'} {filteredData.length} {t?.entries || '条数据'}
          </Text>
        )}
      </Box>      
      
      {/* 修改筛选器模态窗口，支持小时选择和轮次筛选 */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent className="web3-modal">
          <ModalHeader className="web3-text-gradient">{t?.filterInvestors || '筛选投资者'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} pb={4}>
              {/* 金额范围 */}
              <FormControl>
                <FormLabel className="web3-text-gradient">{t?.amountRange || '金额范围'}: {amountRange[0]} - {amountRange[1]} USDT</FormLabel>
                <RangeSlider
                  value={amountRange}
                  min={0}
                  max={maxAmount}
                  step={100}
                  onChange={setAmountRange}
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                  <RangeSliderThumb index={1} />
                </RangeSlider>
              </FormControl>
              
              {/* 时间范围 */}
              <FormControl>
                <FormLabel className="web3-text-gradient">{t?.dateTimeRange || '时间范围（精确到小时）'}</FormLabel>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  startHour={startHour}
                  endHour={endHour}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onStartHourChange={setStartHour}
                  onEndHourChange={setEndHour}
                  t={t}
                />
              </FormControl>
              
              {/* 添加轮次范围筛选 */}
              <FormControl>
                <FormLabel className="web3-text-gradient">
                  {t?.investmentRounds || '投资轮次'}: {roundRange[0]} - {roundRange[1]}
                </FormLabel>
                <RangeSlider
                  value={roundRange}
                  min={1}
                  max={maxRound}
                  step={1}
                  onChange={setRoundRange}
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                  <RangeSliderThumb index={1} />
                </RangeSlider>
                
                {/* 添加精确的轮次输入框 */}
                <HStack mt={2} spacing={4}>
                  <NumberInput 
                    size="sm" 
                    min={1} 
                    max={roundRange[1]} 
                    value={roundRange[0]}
                    onChange={(valueString) => {
                      const value = parseInt(valueString);
                      if (!isNaN(value)) {
                        setRoundRange([value, roundRange[1]]);
                      }
                    }}
                  >
                    <NumberInputField placeholder={t?.minRound || "最小轮次"} />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  
                  <Text>-</Text>
                  
                  <NumberInput 
                    size="sm" 
                    min={roundRange[0]} 
                    max={maxRound} 
                    value={roundRange[1]}
                    onChange={(valueString) => {
                      const value = parseInt(valueString);
                      if (!isNaN(value)) {
                        setRoundRange([roundRange[0], value]);
                      }
                    }}
                  >
                    <NumberInputField placeholder={t?.maxRound || "最大轮次"} />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </HStack>
              </FormControl>
              
              {/* 状态 */}
              <FormControl>
                <FormLabel className="web3-text-gradient">{t?.status || '状态'}</FormLabel>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  size="sm"
                >
                  <option value="all">{t?.allStatus || '全部状态'}</option>
                  <option value="active">{t?.active || '活跃'}</option>
                  <option value="completed">{t?.completed || '已完成'}</option>
                </Select>
              </FormControl>
              
              {/* 按钮区 */}
              <HStack justify="space-between" width="100%" pt={2}>
                <Button size="sm" onClick={resetFilters}>
                  {t?.reset || '重置'}
                </Button>
                <Button 
                  size="sm" 
                  className="web3-btn"
                  onClick={() => {
                    applyFilters();
                    setIsModalOpen(false);
                  }}
                >
                  {t?.applyFilter || '应用筛选'}
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 添加获取推荐信息的模态框 */}
      <Modal isOpen={isReferralModalOpen} onClose={() => setIsReferralModalOpen(false)}>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent className="web3-modal">
          <ModalHeader className="web3-text-gradient">{t?.getReferralInfo || '获取推荐信息'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} pb={4}>
              <FormControl>
                <FormLabel className="web3-text-gradient">{t?.startIndex || '开始序号'}</FormLabel>
                <NumberInput 
                  value={referralFromIndex}
                  onChange={(value) => setReferralFromIndex(value)}
                  min={0} // 改为从0开始
                >
                  <NumberInputField 
                    placeholder={t?.enterStartIndex || '请输入开始序号'}
                    className="web3-input"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel className="web3-text-gradient">{t?.endIndex || '结束序号'}</FormLabel>
                <NumberInput 
                  value={referralToIndex}
                  onChange={(value) => setReferralToIndex(value)}
                  min={0} // 改为从0开始
                >
                  <NumberInputField 
                    placeholder={t?.enterEndIndex || '请输入结束序号'}
                    className="web3-input"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              {isLoadingReferrals && (
                <Box width="100%">
                  <Text mb={2}>
                    {t?.progress || '进度'}: {referralProgress.current} / {referralProgress.total}
                  </Text>
                  <Progress 
                    value={(referralProgress.current / referralProgress.total) * 100} 
                    colorScheme="blue" 
                  />
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={() => setIsReferralModalOpen(false)}
              isDisabled={isLoadingReferrals}
            >
              {t?.cancel || '取消'}
            </Button>
            <Button 
              className="web3-btn"
              onClick={handleFetchReferrals}
              isLoading={isLoadingReferrals}
              loadingText={t?.loading || '获取中...'}
            >
              {t?.confirm || '开始获取'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 每日到期投资统计图表模态框 */}
      <Modal isOpen={isChartModalOpen} onClose={() => setIsChartModalOpen(false)} size="xl">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent className="web3-modal">
          <ModalHeader className="web3-text-gradient">
            {t?.dailyExpiringChart || '每日到期投资统计图表'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {chartData.length > 0 ? (
              <Box height="400px">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      label={{ value: '到期总额 (USDT)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(2)} USDT`, '到期总额']}
                      labelStyle={{ color: '#8884d8' }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid #8884d8',
                        borderRadius: '4px'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="amount" 
                      name="到期总额 (USDT)" 
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Text textAlign="center" py={8}>
                {t?.noData || '没有数据'}
              </Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default InvestorsFilter;