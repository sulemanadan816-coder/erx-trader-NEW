export type PageRoute =
  | 'home'
  | 'about'
  | 'services'
  | 'plans'
  | 'how-it-works'
  | 'faq'
  | 'contact'
  | 'terms'
  | 'privacy'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'admin'
  | 'not-found';

export type DashboardTab =
  | 'overview'
  | 'wallet'
  | 'transactions'
  | 'plans'
  | 'referrals'
  | 'withdraw'
  | 'profile'
  | 'support';

export interface ServicePlan {
  id: string;
  name: string;
  targetAudience: string;
  price: string;
  dailyProfit?: string;
  totalProfit?: string;
  currency: string;
  duration: string;
  description: string;
  features: string[];
  ctaText: string;
  isPopular?: boolean;
  active: boolean;
}

export interface ReferralLevel {
  level: string;
  commission: string;
  description: string;
}

export interface FeatureItem {
  id: string;
  number: string;
  title: string;
  description: string;
  outcome: string;
}

export interface HowItWorksStep {
  stepNumber: string;
  title: string;
  description: string;
  actionLabel: string;
}

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface SavedPayoutAccount {
  id: string;
  methodId: string;
  methodName: string;
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  identifier: string;
  role: 'user' | 'admin';
  status: 'ACTIVE' | 'SUSPENDED';
  activePlanId?: string | null;
  savedPayoutAccounts?: SavedPayoutAccount[];
  createdAt: string;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  loginCount?: number;
  totalInvested?: number;
  referralCode?: string;
  referredBy?: string | null;
  referralCount?: number;
  totalReferralEarnings?: number;
}

export interface LoginLogEntry {
  id: string;
  userId: string;
  userName: string;
  userIdentifier: string;
  role: 'user' | 'admin';
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  totalInvested: number;
  activePlanName?: string | null;
}

export interface WalletAccount {
  id: string;
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  reservedWithdrawalBalance: number;
  totalBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  pendingWithdrawalsAmount: number;
  completedWithdrawalsAmount: number;
  currency: string;
  updatedAt: string;
}

export type LedgerEntryType =
  | 'DEPOSIT_APPROVED'
  | 'WITHDRAWAL_RESERVED'
  | 'WITHDRAWAL_COMPLETED'
  | 'WITHDRAWAL_RELEASED'
  | 'SERVICE_PURCHASE'
  | 'REFUND'
  | 'ADMIN_ADJUSTMENT'
  | 'REFERRAL_COMMISSION';

export interface LedgerEntry {
  id: string;
  userId: string;
  transactionId: string;
  type: LedgerEntryType;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  pendingBefore: number;
  pendingAfter: number;
  status: 'POSTED';
  description: string;
  createdAt: string;
}

export type UnifiedTransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'SERVICE_PURCHASE'
  | 'REFUND'
  | 'ADJUSTMENT'
  | 'COMMISSION';

export type UnifiedTransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface UnifiedTransaction {
  id: string;
  userId: string;
  type: UnifiedTransactionType;
  amount: number;
  fee: number;
  netAmount: number;
  status: UnifiedTransactionStatus;
  referenceId: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type DepositStatus = 'Pending' | 'Approved' | 'Rejected';

export interface PaymentTransaction {
  id: string;
  userId: string;
  userName: string;
  userIdentifier: string;
  planId: string;
  planName: string;
  transactionId: string;
  amount: string;
  numericAmount: number;
  paymentMethod: string;
  senderNumber: string;
  paymentProofNote?: string;
  creditToWalletOnly?: boolean;
  submittedAt: string;
  status: DepositStatus;
  adminNotes: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

export interface ServiceOrder {
  id: string;
  userId: string;
  userName: string;
  planId: string;
  planName: string;
  amount: number;
  duration: string;
  dailyProfit: string;
  totalProfit: string;
  paymentSource: 'WALLET' | 'EASYPAISA_DEPOSIT';
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  referenceDepositId?: string | null;
  createdAt: string;
  activatedAt?: string | null;
}

export interface WithdrawalMethodConfig {
  id: string;
  name: string;
  code: string;
  minAmount: number;
  maxAmount: number;
  feePercent: number;
  feeFixed: number;
  accountLabel: string;
  requiresBankName: boolean;
  instructions: string;
  active: boolean;
}

export type WithdrawalStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface WithdrawalHistoryItem {
  fromStatus: WithdrawalStatus | 'CREATED';
  toStatus: WithdrawalStatus;
  actorId: string;
  actorName: string;
  actorRole: 'user' | 'admin';
  note: string;
  timestamp: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userIdentifier: string;
  amount: number;
  fee: number;
  netAmount: number;
  methodId: string;
  methodName: string;
  accountTitle: string;
  accountNumber: string;
  maskedAccountNumber: string;
  bankName?: string;
  status: WithdrawalStatus;
  adminNotes: string;
  payoutReference?: string;
  adminConfirmedRealPayout: boolean;
  history: WithdrawalHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetUserId: string;
  targetUserName: string;
  entityType: 'DEPOSIT' | 'WITHDRAWAL' | 'WALLET' | 'PLAN' | 'METHOD' | 'USER' | 'SETTINGS';
  entityId: string;
  amount: number | null;
  previousState: string;
  newState: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export type InquiryStatus = 'Open' | 'In Progress' | 'Resolved';

export interface SupportInquiry {
  id: string;
  userId?: string | null;
  name: string;
  contactInfo: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  adminReply: string;
  createdAt: string;
}

export interface SiteSettings {
  brandName: string;
  logoUrl: string | null;
  logoAlt: string;
  whatsappChannelUrl: string;
  telegramSupportUrl: string;
  telegramHandle: string;
  easypaisaNumber: string;
  easypaisaAccountLabel: string;
  heroHeadline: string;
  heroSubheadline: string;
  announcementText: string;
}

export interface ReferralMember {
  id: string;
  userId: string;
  name: string;
  identifier: string;
  joinedAt: string;
  level: 1 | 2;
  activePlanName?: string | null;
  totalInvested: number;
  commissionEarned: number;
}

export interface ReferralCommissionLog {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserName: string;
  level: 1 | 2;
  commissionPercent: number;
  sourceAmount: number;
  commissionAmount: number;
  planName: string;
  createdAt: string;
}

export interface ReferralStatsResponse {
  referralCode: string;
  referralLink: string;
  referredBy: string | null;
  totalEarnings: number;
  totalReferrals: number;
  level1Count: number;
  level2Count: number;
  level1Earnings: number;
  level2Earnings: number;
  teamMembers: ReferralMember[];
  commissionLogs: ReferralCommissionLog[];
}

