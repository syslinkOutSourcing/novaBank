'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const translations = {
  en: {
    // Header
    pumpBurn: "Pump Burn",
    withdrawableDate: "Withdrawable Date",

    // Overview Cards
    investmentOverview: "Investment Overview",
    totalInvestors: "Total Investors",
    totalInvestment: "Total Investment",
    totalWithdrawn: "Total Withdrawn",

    capitalStatus: "Capital Status",
    capitalAdequacyRatio: "Capital Adequacy Ratio",
    contractBurn: "Contract BURN",
    contractUsdt: "Contract USDT",
    burnPrice: "Price of BURN",

    investmentLimits: "Investment Limits",
    minInvestment: "Min Investment",
    maxInvestment: "Max Investment",

    // User Information
    yourInformation: "Your Information",
    yourInvestment: "Your Investment",
    usdtAmount: "USDT Amount",
    burnAmount: "BURN Amount",
    status: "Status",
    active: "Active",
    inactive: "Inactive",

    yourReferrals: "Your Referrals Rewards",
    totalBurnRewards: "Total BURN Rewards",
    totalUsdtRewards: "Total USDT Rewards",

    yourRewards: "Your Team Rewards",
    extraRewards: "Total Team Rewards",
    withdrawedExtraRewards: "Withrawed Team Rewards",
    withdrawableRewards: "Current Withdrawable Rewards",

    // Additional Details
    additionalDetails: "Additional Details",
    investmentTimeline: "Investment Timeline",
    startTime: "Start Time",
    lastClaim: "Last Claim",
    endTime: "End Time",
    referralDetails: "Referral Details",
    yourReferrer: "Your Referrer",
    upperReferrer: "Upper Referrer",
    totalBurnToUsdt: "Total BURN to USDT Rewards",
    withdrawnExtraRewards: "Withdrawn Extra Rewards",

    // Referral Network
    yourReferralNetwork: "Your Referral Network",
    referrerAddress: "Referrer Address",
    investmentAmount: "Investment Amount",
    investmentPeriod: "Investment Period",
    months: "months",

    investUsdt: "Invest USDT",
    investBurn: "Invest BURN",
    enterAmount: "Enter amount",
    invest: "Invest",
    invalidAmount: "Invalid amount",
    amountBetween: "Amount must be between",
    investUSDT: "Invest with USDT",
    investBURN: "Invest with BURN",
    interest: "Withdrawn Interest",

    // Transaction States
    approving: "Approving...",
    investing: "Investing...",
    investmentSuccess: "Investment Successful",
    investmentFailed: "Investment Failed",
    approvalFailed: "Approval Failed",
    enterReferrer: "Enter referrer address (optional)",
    invalidReferrer: "Invalid Referrer",
    invalidAddressFormat: "Invalid address format",
    step1: "Step 1",
    step2: "Step 2",
    approve: "Approve",

    // Add these new translations before the last closing brace
    withdraw: "Withdraw Investment",
    withdrawing: "Withdrawing...",
    withdrawalSuccess: "Withdrawal Successful",
    withdrawalFailed: "Withdrawal Failed",

    // Add this new translation
    autoRewardsNote: "* All referral rewards are automatically sent to your connected wallet",

    // Add these new translations before the last closing brace
    claimRewards: "Claim Interest",
    claimingRewards: "Claiming...",
    claimRewardsSuccess: "Interest claimed successfully",
    claimRewardsSubmitted: "Claim transaction submitted",
    claimRewardsFailed: "Failed to claim interest",

    // Add new translations for extra rewards
    claimExtraRewards: "Claim Team Rewards",
    claimingExtraRewards: "Claiming Extra Rewards...",

    // Add these new translations before the last closing brace
    lastInvestors: "Last Five Investments",
    investorAddress: "Investor Address",
    investmentAmount: "Investment Amount",
    startTime: "Investment Time",

    // Add these new translations to both English and Chinese sections
    withdrawIncentive: 'Claim',
    withdrawingIncentive: 'Claiming...',
    withdrawIncentiveSuccess: 'BURN rewards claimed successfully',
    withdrawIncentiveSubmitted: 'Claiming BURN rewards',
    withdrawIncentiveFailed: 'Failed to claim BURN rewards',

    burnRewardPool: 'Incentive Pool',
    burnReward: 'Burn Reward',
    amount: 'Amount',
    announcements: 'Announcements',
    noAnnouncements: 'No announcements yet',

    // Add this new translation before the last closing brace
    claimExtraRewardsFailed: "Failed to claim extra rewards",

    // Add these new translations
    withdrawAll: "Withdraw All",
    pauseContractOrNot: "Pause/Unpause",
    withdrawAllSubmitted: "Withdraw all transaction submitted",
    withdrawAllSuccess: "All funds withdrawn successfully",
    withdrawAllFailed: "Failed to withdraw all funds",
    pauseContractSubmitted: "Contract pause status change submitted",
    pauseContractSuccess: "Contract pause status changed successfully",
    pauseContractFailed: "Failed to change contract pause status",

    // Add these new translations before the last closing brace
    copyReferralLink: "Copy Referral Link",
    referralLinkCopied: "Referral link copied!",
    yourReferralLink: "Your Referral Link",

    // Add this new translation
    claimExtraRewardsSubmitted: "Extra rewards claim submitted",

    // Add this new translation
    claimExtraRewardsSuccess: "Extra rewards claimed successfully",

    // Add this new translation
    totalInvestValue: "Total Reward Value",

    // Add this new translation
    failToCopy: "Failed to copy. Please copy manually.",

    // Add this new translation
    totalPerformance: "Total Performance",

    // Add this new translation
    claimLeftBurn: "Claim Leftover BURN",

    // Add this new translation
    managerOperations: "Manager Operations",

    // Add this new translation
    setWorkshop: "Set Workshop",

    // Add this new translation
    switchToBSC: "Please switch to BSC network",

    // Add these new translations
    workshopList: "Workshop List",
    requestDate: "Request Date",
    approveDate: "Approve Date",

    // Add this new translation
    workshopAddress: "Workshop Address",
    openWorkshop: 'Open Workshop',
    closeWorkshop: 'Close Workshop',

    // Add these new translations to both English and Chinese sections
    enterWorkshopAddress: 'Enter workshop address',
    workshopStatus: 'Workshop Status',
    valid: 'Valid',
    invalid: 'Invalid',
    setting: 'Setting...',
    confirm: 'Confirm',
    setWorkshopSuccess: 'Workshop setting updated successfully',
    setWorkshopFailed: 'Failed to set workshop',
    invalidAddress: 'Invalid address format',
    approvalStatus: 'Approval Status',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    revoked: 'Revoked',

    // Add this new translation
    supplementInterest: "Supplement Interest",

    // Add this new translation
    userType: "User Type",

    // Add this new translation
    firstLevelUser: "First Level User",

    // Add this new translation
    regularUser: "Regular User",
    workshopUser: "Workshop User",

    // Add these new translations before the last closing brace
    dailyMaxInvestment: "Daily Max Investment",
    dailyInvestedAmount: "Daily Invested Amount",
    exceedRemainingDailyQuota: "Exceed Remaining Daily Quota",

    curPeroidMaxInvestment: "Current Peroid(Six Hours) Max Investment",
    curPeroidInvestedAmount: "Current Peroid Invested Amount",
    noLimitationBurn: "No Limitation of BURN Investment",

    // New translations for Burn Invested Event Query
    burnInvestedEvents: "Burn Invested Event Query",
    fromBlock: "From Block",
    startBlock: "Start Block Number",
    toBlock: "To Block",
    endBlock: "End Block Number (default latest)",
    minBurnAmount: "Min BURN Amount",
    minBurn: "Min BURN (e.g., 1000)",
    maxBurnAmount: "Max BURN Amount",
    maxBurn: "Max BURN (optional)",
    fetchEvents: "Fetch Events",
    foundEvents: "Found {count} event records",
    txHash: "Transaction Hash",
    blockNumberApiKeyRequired: "Start block number and API Key are required",
    etherscanError: "Error fetching data from Etherscan",
    fetchError: "Network error while fetching events",
    noEventsFound: "No event records found",
    page: "Page",
    previous: "Previous",
    next: "Next",
    selectDate: "Select Date",
    calculatedBlockRange: "Calculated Block Range: {from} - {to}",
    dateApiKeyRequired: "Please select a date and ensure API Key is provided",
    blockCalculationError: "Error calculating block numbers",
    minUsdtAmount: "Min USDT Amount",
    minUsdt: "Min USDT (e.g., 500)",
    copyInvestorInfo: "Copy Investor Info",
    noDataToCopy: "No data to copy",
    copiedInvestorData: "Copied {count} investor records (Address: BURN Amount)",

    // BURN Lock System translations
    burnLockTitle: "BURN Lock System",
    totalRewardPool: "Current Reward Pool",
    totalLockedUsers: "Total Locked Users",
    totalContribteValue: "Total Contribte Value",
    totalAirdropValue: "Total Airdrop Value",
    lockedUnlocked: "Locked / Unlocked",
    totalLockedAmount: "Total Locked Amount",
    totalUnlockedAmount: "Total Unlocked Amount",
    totalDistributedRewards: "Total Distributed Rewards",
    yourLockInfo: "Your Lock Information",
    yourContributeValue: "Your Contribute Value",
    contributeValue: "Contribute Value",
    hasBeenAirdrop: "Airdrop",
    airdropAmount: 'Airdrop Amount',
    yourLockedAmount: "Your Locked Amount",
    yourWithdrawableAmount: "Your Withdrawable Amount",
    yourTotalRewards: "Your Total Rewards",
    lockBurn: "Lock BURN",
    unlockBurn: "Unlock BURN",
    lockAmount: "Lock Amount",
    unlockAmount: "Unlock Amount",
    lock: "Lock",
    unlock: "Unlock",
    locking: "Locking...",
    unlocking: "Unlocking...",
    lockSuccess: "Lock successful!",
    unlockSuccess: "Unlock successful!",
    lockFailed: "Lock failed",
    unlockFailed: "Unlock failed",
    insufficientBalance: "Insufficient withdrawable balance",
    maxAmount: "Max amount",
    compound: "Compound",
    compounding: "Compounding...",
    compoundType: "Compound Type",
    compoundPrincipal: "Principal Only",
    compoundPrincipalInterest: "Principal + Interest",
    compoundSubmitted: "Compound Submitted",
    compoundSuccess: "Compound Successful!",
    compoundFailed: "Compound Failed",
  },
  zh: {
    // Header
    pumpBurn: "燃烧泵",
    withdrawableDate: "本金可提取日期",

    // Overview Cards
    investmentOverview: "投资概览",
    totalInvestors: "总投资人数",
    totalInvestment: "总投资金额",
    totalWithdrawn: "已提取本金总额",

    capitalStatus: "资本状态",
    capitalAdequacyRatio: "资本充足率",
    contractBurn: "合约中的BURN",
    contractUsdt: "合约中的USDT",
    burnPrice: "当前BURN价格",

    investmentLimits: "投资限额",
    minInvestment: "最小可投资额",
    maxInvestment: "最大可投资额",

    // User Information
    yourInformation: "您的信息",
    yourInvestment: "您的投资",
    usdtAmount: "等值USDT数量",
    burnAmount: "等值BURN数量",
    interest: "当前可提取利息",
    status: "状态",
    active: "活跃",
    inactive: "不活跃",

    yourReferrals: "您的推荐奖励",
    totalBurnRewards: "BURN总奖励",
    totalUsdtRewards: "USDT总奖励",

    yourRewards: "您的团队奖励",
    extraRewards: "总的团队奖励",
    withdrawedExtraRewards: "已提取的团队奖励",
    withdrawableRewards: "当前可提取的团队奖励",

    // Additional Details
    additionalDetails: "附加详",
    investmentTimeline: "投资时间线",
    startTime: "开始时间",
    lastClaim: "最后提取",
    endTime: "结束时间",
    referralDetails: "推荐详情",
    yourReferrer: "您的推荐人",
    upperReferrer: "上级推荐人",
    totalBurnToUsdt: "BURN兑USDT总奖励",
    withdrawnExtraRewards: "已提取额外奖励",

    // Referral Network
    yourReferralNetwork: "您的推荐网络",
    referrerAddress: "推荐人地址",
    investmentAmount: "投资金额",
    investmentPeriod: "投资周期",
    months: "月",

    investUsdt: "投资USDT",
    investBurn: "投资BURN",
    enterAmount: "输入金额",
    invest: "投资",
    invalidAmount: "无效金额",
    amountBetween: "金额必须在范围内",
    investUSDT: "使用USDT投资",
    investBURN: "使用BURN投资",

    // Transaction States
    approving: "授权中...",
    investing: "投资中...",
    investmentSuccess: "投资成功",
    investmentFailed: "投资失败",
    approvalFailed: "授权失败",
    enterReferrer: "输入推荐人地址",
    invalidReferrer: "无效的推荐人",
    invalidAddressFormat: "地址格式无效",
    step1: "第一步",
    step2: "第二步",
    approve: "授权",

    // Add these new translations before the last closing brace
    withdraw: "提取投资",
    withdrawing: "提取中...",
    withdrawalSuccess: "提取成功",
    withdrawalFailed: "提取失败",

    // Add this new translation
    autoRewardsNote: "* 所有推荐奖励都已自动发送到您当前连接的钱包",

    // Add these new translations before the last closing brace
    claimRewards: "提取利息",
    claimingRewards: "提取中...",
    claimRewardsSuccess: "利息提取成功",
    claimRewardsSubmitted: "提取交易已提交",
    claimRewardsFailed: "利息提取失败",

    // Add new translations for extra rewards
    claimExtraRewards: "提取团队奖励",
    claimingExtraRewards: "提取团队奖励中...",

    // Add these new translations before the last closing brace
    lastInvestors: "最后五位投资者",
    investorAddress: "投资者地址",
    investmentAmount: "投资金额",
    startTime: "投资时间",

    // Add these new translations to both English and Chinese sections
    withdrawIncentive: '领取奖励',
    withdrawingIncentive: '领取中...',
    withdrawIncentiveSuccess: 'BURN奖励领取成功',
    withdrawIncentiveSubmitted: '正在领取BURN奖励',
    withdrawIncentiveFailed: 'BURN奖励领取失败',

    burnRewardPool: '激励池',
    burnReward: 'Burn奖励',
    amount: '数量',
    announcements: '公告',
    noAnnouncements: '暂无公告',

    // Add this new translation before the last closing brace
    claimExtraRewardsFailed: "额外奖励提取失败",

    // Add these new translations
    withdrawAll: "提取全部本金",
    pauseContractOrNot: "暂停/恢复",
    withdrawAllSubmitted: "提取全部资金交易已提交",
    withdrawAllSuccess: "全部资金提取成功",
    withdrawAllFailed: "提取全部资金失败",
    pauseContractSubmitted: "合约暂停状态更改已提交",
    pauseContractSuccess: "合约暂停状态更改成功",
    pauseContractFailed: "合约暂停状态更改失败",

    // Add these new translations before the last closing brace
    copyReferralLink: "复制推广链接",
    referralLinkCopied: "推广链接已复制！",
    yourReferralLink: "您的推广链接",

    // Add this new translation
    claimExtraRewardsSubmitted: "额外奖励提取申请已提交",

    // Add this new translation
    claimExtraRewardsSuccess: "额外奖励提取成功",

    // Add this new translation
    totalInvestValue: "您的总推荐奖励额",

    // Add this new translation
    failToCopy: "复制失败。请手动复制。",

    // Add this new translation
    totalPerformance: "总业绩",

    // Add this new translation
    claimLeftBurn: "领取剩余的BURN",

    // Add this new translation
    managerOperations: "管理员操作",

    // Add this new translation
    setWorkshop: "设置工作室",

    // Add this new translation
    switchToBSC: "请切换到BSC网络",

    // Add these new translations
    workshopList: "工作室列表",
    requestDate: "申请日期",
    approveDate: "批准日期",

    // Add this new translation
    workshopAddress: "工作室地址",
    openWorkshop: '开启工作室',
    closeWorkshop: '关闭工作室',

    // Add these new translations to both English and Chinese sections
    enterWorkshopAddress: '输入工作室地址',
    workshopStatus: '工作室状态',
    valid: '有效',
    invalid: '无效',
    setting: '设置中...',
    confirm: '确认',
    setWorkshopSuccess: '工作室设置更新成功',
    setWorkshopFailed: '设置工作室失败',
    invalidAddress: '无效的地址格式',
    approvalStatus: '审批状态',
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    revoked: '已撤销',

    // Add this new translation
    supplementInterest: "补充利息",

    // Add this new translation
    userType: "用户类型",

    // Add this new translation
    firstLevelUser: "首批用户",

    // Add this new translation
    regularUser: "普通用户",
    workshopUser: "工作室用户",

    // Add these new translations before the last closing brace
    dailyMaxInvestment: "当日最大可投资金额",
    dailyInvestedAmount: "当日已投资金额",
    exceedRemainingDailyQuota: "超过当日剩余额度",

    curPeroidMaxInvestment: "当前周期（六小时）最大可投资金额",
    curPeroidInvestedAmount: "当前周期已投资金额",
    noLimitationBurn: "BURN入金不受限",

    // New translations for Burn Invested Event Query
    burnInvestedEvents: "Burn Invested 事件查询",
    fromBlock: "起始区块",
    startBlock: "起始区块号",
    toBlock: "结束区块",
    endBlock: "结束区块号 (默认 latest)",
    minBurnAmount: "最小 BURN 数量",
    minBurn: "最小 BURN (例如 1000)",
    maxBurnAmount: "最大 BURN 数量",
    maxBurn: "最大 BURN (可选)",
    fetchEvents: "查询事件",
    foundEvents: "找到 {count} 条事件记录",
    txHash: "交易哈希",
    blockNumberApiKeyRequired: "需要起始区块号和API密钥",
    etherscanError: "从 Etherscan 获取数据时出错",
    fetchError: "获取事件时发生网络错误",
    noEventsFound: "未找到事件记录",
    page: "页",
    previous: "上一页",
    next: "下一页",
    selectDate: "选择日期",
    calculatedBlockRange: "计算出的区块范围: {from} - {to}",
    dateApiKeyRequired: "请选择日期并确保提供了API密钥",
    blockCalculationError: "计算区块号时出错",
    minUsdtAmount: "最小 USDT 数量",
    minUsdt: "最小 USDT (例如 500)",
    copyInvestorInfo: "复制投资者信息",
    noDataToCopy: "没有数据可复制",
    copiedInvestorData: "已复制 {count} 条投资者信息 (地址: BURN数量)",

    // BURN Lock System translations
    burnLockTitle: "BURN锁仓系统",
    totalRewardPool: "总奖励/已分发奖励",
    totalLockedUsers: "总锁仓用户数",
    totalContribteValue: "总贡献值",
    totalAirdropValue: "总空投",
    lockedUnlocked: "锁仓/解锁",
    totalLockedAmount: "总锁仓/解锁数量",
    totalUnlockedAmount: "总解锁数量",
    totalDistributedRewards: "已分发奖励/总奖励",
    yourLockInfo: "您的锁仓信息",
    yourContributeValue: "您的贡献值",
    hasBeenAirdrop: "是否已空投",
    airdropAmount: '空投数量',
    contributeValue: "贡献值",
    yourLockedAmount: "您的锁仓数量",
    yourWithdrawableAmount: "您的可解锁数量",
    yourTotalRewards: "您的总奖励",
    lockBurn: "锁仓BURN",
    unlockBurn: "解锁BURN",
    lockAmount: "锁仓数量",
    unlockAmount: "解锁数量",
    lock: "锁仓",
    unlock: "解锁",
    locking: "锁仓中...",
    unlocking: "解锁中...",
    lockSuccess: "锁仓成功！",
    unlockSuccess: "解锁成功！",
    lockFailed: "锁仓失败",
    unlockFailed: "解锁失败",
    insufficientBalance: "可解锁余额不足",
    maxAmount: "最大数量",
    compound: "复投",
    compounding: "复投中...",
    compoundType: "复投类型",
    compoundPrincipal: "仅本金",
    compoundPrincipalInterest: "本金+利息",
    compoundSubmitted: "复投申请已提交",
    compoundSuccess: "复投成功！",
    compoundFailed: "复投失败",
  }
}

export function LanguageProvider({ children }) {
  // Initialize state with value from localStorage, fallback to 'en'
  const [language, setLanguage] = useState(() => {
    // 在客户端才能访问 localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('preferredLanguage') || 'en'
    }
    return 'en'
  })

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', language)
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
