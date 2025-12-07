import { useState, useEffect } from 'react';
import { Box, Table, Thead, Tbody, Tr, Th, Td, Text, Heading, VStack, HStack, Stat, StatLabel, StatNumber, StatGroup } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import BigNumber from 'bignumber.js';

const formatBigNumber = (value, decimals = 18, decimalPlaces = 2) => {
  if (value === undefined) return '0';
  return new BigNumber(value.toString())
    .dividedBy(new BigNumber(10).pow(decimals))
    .toFixed(decimalPlaces);
};

const InvestmentStatistics = ({ allInvestorInvestments, t }) => {
  const [todayStats, setTodayStats] = useState([]);
  const [yesterdayStats, setYesterdayStats] = useState([]);
  const [todayTotal, setTodayTotal] = useState('0');
  const [yesterdayTotal, setYesterdayTotal] = useState('0');
  
  const days90 = 90 * 24 * 3600 * 1000;

  useEffect(() => {
    if (!allInvestorInvestments || allInvestorInvestments.length === 0) return;
    
    // 获取当前日期和前一天
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 今天和昨天的开始时间戳和结束时间戳
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 3600 * 1000 - 1;
    const yesterdayStart = yesterday.getTime();
    const yesterdayEnd = yesterdayStart + 24 * 3600 * 1000 - 1;
    
    // 初始化时间段数据
    const timeSlots = Array(12).fill(0).map((_, i) => {
      const start = i * 2;
      const end = start + 2;
      return {
        slot: `${String(start).padStart(2, '0')}:00 - ${String(end).padStart(2, '0')}:00`,
        startHour: start,
        endHour: end,
        amount: new BigNumber(0)
      };
    });
    
    // 初始化今天和昨天的统计数据
    const todayData = JSON.parse(JSON.stringify(timeSlots)).map(slot => ({
      ...slot, 
      amount: new BigNumber(0)
    }));
    
    const yesterdayData = JSON.parse(JSON.stringify(timeSlots)).map(slot => ({
      ...slot, 
      amount: new BigNumber(0)
    }));
    
    // 初始化总额
    let todayTotalAmount = new BigNumber(0);
    let yesterdayTotalAmount = new BigNumber(0);
    
    // 处理投资数据
    allInvestorInvestments.forEach(investment => {
      const investInfo = investment.result;
      if (!investInfo || !investInfo[4]) return; // 确保有投资时间
      
      const interestRate = investInfo[2] ? Number(investInfo[2]) : 50;

      // 投资时间（第5个字段）和金额（第2个字段）
      const investmentTimeMs = Number(investInfo[4]) * 1000 - days90 * (interestRate == 50 ? 1 : interestRate == 65 ? 2 : 3);
      const investmentAmount = investInfo[1] || '0';
      const amountBN = new BigNumber(investmentAmount);
      
      // 计算时间段
      const investmentDate = new Date(investmentTimeMs);
      const hour = investmentDate.getHours();
      const slotIndex = Math.floor(hour / 2);
      
      // 将金额添加到相应的时间段和总额
      if (investmentTimeMs >= todayStart && investmentTimeMs <= todayEnd) {
        todayData[slotIndex].amount = todayData[slotIndex].amount.plus(amountBN);
        todayTotalAmount = todayTotalAmount.plus(amountBN);
      } else if (investmentTimeMs >= yesterdayStart && investmentTimeMs <= yesterdayEnd) {
        yesterdayData[slotIndex].amount = yesterdayData[slotIndex].amount.plus(amountBN);
        yesterdayTotalAmount = yesterdayTotalAmount.plus(amountBN);
      }
    });
    
    // 格式化金额为可读字符串
    const formatData = (data) => data.map(item => ({
      ...item,
      displayAmount: formatBigNumber(item.amount),
      amount: parseFloat(formatBigNumber(item.amount))
    }));
    
    setTodayStats(formatData(todayData));
    setYesterdayStats(formatData(yesterdayData));
    setTodayTotal(formatBigNumber(todayTotalAmount));
    setYesterdayTotal(formatBigNumber(yesterdayTotalAmount));
    
  }, [allInvestorInvestments]);
  
  // useEffect(() => {    
  //   console.log('statistic 2', todayStats, yesterdayStats)
  // }, [todayStats, yesterdayStats])

  // 准备图表数据
  const chartData = todayStats.map((item, index) => ({
    timeSlot: item.slot,
    today: item.amount,
    yesterday: yesterdayStats[index] ? yesterdayStats[index].amount : 0
  }));
  
  return (
    <Box className="web3-card web3-bg-blur" mt={8}>
      <div className="web3-card-title">
        <Text className="web3-text-gradient" fontSize="xl" fontWeight="bold">
          {t.investmentStatistics || 'Investment Statistics'}
        </Text>
      </div>
      
      <VStack spacing={6} p={4}>
        {/* 投资总额统计 */}
        <StatGroup width="100%">
          <Stat>
            <StatLabel>{t.todayTotal || '今日总投资'}</StatLabel>
            <StatNumber className="web3-text-glow" color="green.400">
              {todayTotal} USDT
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>{t.yesterdayTotal || '昨日总投资'}</StatLabel>
            <StatNumber color="blue.400">
              {yesterdayTotal} USDT
            </StatNumber>
          </Stat>
        </StatGroup>
        
        {/* 表格视图 */}
        <Box overflowX="auto" width="100%">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>{t.timeSlot || '时间段'}</Th>
                <Th isNumeric>{t.todayInvestment || '今日 (USDT)'}</Th>
                <Th isNumeric>{t.yesterdayInvestment || '昨日 (USDT)'}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {todayStats.map((slot, index) => (
                <Tr key={slot.slot}>
                  <Td>{slot.slot}</Td>
                  <Td isNumeric className="web3-text-glow">{slot.displayAmount}</Td>
                  <Td isNumeric>{yesterdayStats[index]?.displayAmount || '0'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        
        {/* 柱状图 */}
        <Box width="100%" height="400px">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timeSlot" 
                angle={-45} 
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} USDT`]} />
              <Legend />
              <Bar dataKey="yesterday" name={t.yesterday || 'Yesterday'} fill="#8884d8" />
              <Bar dataKey="today" name={t.today || 'Today'} fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </VStack>
    </Box>
  );
};

export default InvestmentStatistics; 