import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Package,
  RefreshCw,
  Send,
  Trash2,
  User,
  Users,
  Wallet,
  Gift,
  Clock,
} from 'lucide-react';
import {
  DashboardTab,
  LedgerEntry,
  PageRoute,
  PaymentTransaction,
  ReferralStatsResponse,
  SavedPayoutAccount,
  ServiceOrder,
  ServicePlan,
  SiteSettings,
  UnifiedTransaction,
  UnifiedTransactionType,
  UserAccount,
  UserNotification,
  WalletAccount,
  WithdrawalMethodConfig,
  WithdrawalRequest,
} from '../../types';
import { parseNumericPkr } from '../../server/ledgerUtilsClient';
import { apiRequest } from '../../utils/api';
import { ClientReferralsTab } from './ClientReferralsTab';

interface ClientDashboardProps {
  user: UserAccount;
  token: string;
  settings: SiteSettings;
  plans: ServicePlan[];
  selectedPlanId: string | null;
  onNavigate: (page: PageRoute) => void;
  onLogout: () => void;
}

const SIDEBAR_ITEMS: { id: DashboardTab; label: string; icon: React.FC<{ className?: string }> }[] =
  [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'wallet', label: 'Wallet & Ledger', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'plans', label: 'Plans / Services', icon: Package },
    { id: 'referrals', label: 'Referrals & Team', icon: Users },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  user: initialUser,
  token,
  settings,
  plans,
  selectedPlanId,
  onNavigate,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    selectedPlanId ? 'wallet' : 'overview'
  );
  const [user, setUser] = useState<UserAccount>(initialUser);
  const [wallet, setWallet] = useState<WalletAccount>({
    id: `wal-${initialUser.id}`,
    userId: initialUser.id,
    availableBalance: 0,
    pendingBalance: 0,
    reservedWithdrawalBalance: 0,
    totalBalance: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    pendingWithdrawalsAmount: 0,
    completedWithdrawalsAmount: 0,
    currency: 'PKR',
    updatedAt: new Date().toISOString(),
  });
  const [deposits, setDeposits] = useState<PaymentTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [unifiedTransactions, setUnifiedTransactions] = useState<UnifiedTransaction[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState<WithdrawalMethodConfig[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStatsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [copiedEasypaisa, setCopiedEasypaisa] = useState(false);

  // --- Deposit Form State ---
  const [depositPlanId, setDepositPlanId] = useState<string>(
    selectedPlanId || 'wallet-deposit'
  );
  const [depositTid, setDepositTid] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositSender, setDepositSender] = useState('');
  const [depositProofNote, setDepositProofNote] = useState('');
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);

  // --- Withdrawal Form State ---
  const [wdAmount, setWdAmount] = useState('');
  const [wdMethodId, setWdMethodId] = useState('');
  const [wdAccountTitle, setWdAccountTitle] = useState('');
  const [wdAccountNumber, setWdAccountNumber] = useState('');
  const [wdBankName, setWdBankName] = useState('');
  const [wdSaveAccount, setWdSaveAccount] = useState(true);
  const [wdReviewMode, setWdReviewMode] = useState(false);
  const [wdSubmitting, setWdSubmitting] = useState(false);
  const [wdError, setWdError] = useState<string | null>(null);
  const [wdCreatedReceipt, setWdCreatedReceipt] = useState<WithdrawalRequest | null>(null);

  // --- Transaction History Filter State ---
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | UnifiedTransactionType>('ALL');
  const [txSearch, setTxSearch] = useState('');

  // --- Plan Purchase Feedback ---
  const [planActionError, setPlanActionError] = useState<string | null>(null);
  const [planActionSuccess, setPlanActionSuccess] = useState<string | null>(null);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);

  // --- Profile Saved Account State ---
  const [newAccMethodId, setNewAccMethodId] = useState('');
  const [newAccTitle, setNewAccTitle] = useState('');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccBank, setNewAccBank] = useState('');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // --- Support Form State ---
  const [supSubject, setSupSubject] = useState('');
  const [supMessage, setSupMessage] = useState('');
  const [supStatusMsg, setSupStatusMsg] = useState<string | null>(null);
  const [supSubmitting, setSupSubmitting] = useState(false);

  const fetchDashboardSummary = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
      setFetchError(null);
    }
    try {
      const res = await apiRequest('/api/dashboard/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (!isSilent) setFetchError(res.error || 'Could not load dashboard records.');
      } else {
        const data = res.data;
        if (data.user) setUser(data.user);
        if (data.wallet) setWallet(data.wallet);
        setDeposits(data.deposits || []);
        setWithdrawals(data.withdrawals || []);
        setUnifiedTransactions(data.unifiedTransactions || []);
        setLedgerEntries(data.ledgerEntries || []);
        setOrders(data.orders || []);
        setNotifications(data.notifications || []);
        if (data.referrals) {
          setReferralStats(data.referrals);
        }
        const methods: WithdrawalMethodConfig[] = data.withdrawalMethods || [];
        setWithdrawalMethods(methods);
        if (methods.length > 0) {
          setWdMethodId((prev) => prev || methods[0].id);
          setNewAccMethodId((prev) => prev || methods[0].id);
        }
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [token]);

  const fetchReferralStats = useCallback(async () => {
    try {
      const res = await apiRequest<ReferralStatsResponse>('/api/user/referrals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.data) {
        setReferralStats(res.data);
      }
    } catch {
      // non-fatal
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardSummary(false);
    const interval = setInterval(() => {
      fetchDashboardSummary(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [fetchDashboardSummary]);

  useEffect(() => {
    if (selectedPlanId) {
      setDepositPlanId(selectedPlanId);
      const found = plans.find((p) => p.id === selectedPlanId);
      if (found) {
        setDepositAmount(String(parseNumericPkr(found.price)));
      }
      setActiveTab('wallet');
    }
  }, [selectedPlanId, plans]);

  const handleCopyEasypaisa = async () => {
    try {
      await navigator.clipboard.writeText(settings.easypaisaNumber);
      setCopiedEasypaisa(true);
      setTimeout(() => setCopiedEasypaisa(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = settings.easypaisaNumber;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedEasypaisa(true);
      setTimeout(() => setCopiedEasypaisa(false), 2500);
    }
  };

  // --- Deposit Submission Handler ---
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError(null);
    setDepositSuccess(null);

    const numericAmt = parseNumericPkr(depositAmount);
    if (numericAmt <= 0) {
      setDepositError('Please enter a valid deposit amount greater than zero.');
      return;
    }
    if (depositTid.trim().length < 5) {
      setDepositError('Please enter a valid Easypaisa Transaction ID (TID).');
      return;
    }
    if (depositSender.trim().length < 10) {
      setDepositError('Please enter your 11-digit sender mobile/Easypaisa number.');
      return;
    }

    setDepositSubmitting(true);
    try {
      const res = await apiRequest('/api/transactions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          planId: depositPlanId,
          transactionId: depositTid.trim(),
          amount: numericAmt,
          senderNumber: depositSender.trim(),
          paymentProofNote: depositProofNote.trim(),
          creditToWalletOnly: depositPlanId === 'wallet-deposit',
          idempotencyKey: `dep-${user.id}-${depositTid.trim()}`,
        }),
      });
      if (!res.ok) {
        setDepositError(res.error || 'Could not submit deposit reference.');
      } else {
        setDepositSuccess(
          res.data?.message ||
            'Deposit reference recorded with status: PENDING. Awaiting manual administrator verification.'
        );
        setDepositTid('');
        setDepositProofNote('');
        fetchDashboardSummary();
      }
    } finally {
      setDepositSubmitting(false);
    }
  };

  // --- Wallet Plan Purchase Handler ---
  const handlePurchaseWithWallet = async (plan: ServicePlan) => {
    setPlanActionError(null);
    setPlanActionSuccess(null);
    const price = parseNumericPkr(plan.price);

    if (wallet.availableBalance < price) {
      setPlanActionError(
        `Insufficient Available Balance (Rs. ${wallet.availableBalance.toLocaleString()}) to purchase ${plan.name} (Rs. ${price.toLocaleString()}). Please submit an Easypaisa deposit first.`
      );
      return;
    }

    setPurchasingPlanId(plan.id);
    try {
      const res = await apiRequest('/api/orders/purchase-wallet', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          planId: plan.id,
          idempotencyKey: `ord-${user.id}-${plan.id}-${Date.now()}`,
        }),
      });
      if (!res.ok) {
        setPlanActionError(res.error || 'Purchase could not be completed.');
      } else {
        setPlanActionSuccess(
          res.data?.message ||
            `Purchased and activated ${plan.name} using your Available Balance.`
        );
        fetchDashboardSummary();
      }
    } finally {
      setPurchasingPlanId(null);
    }
  };

  // --- Withdrawal Validation & Submission ---
  const selectedMethod = withdrawalMethods.find((m) => m.id === wdMethodId);
  const parsedWdAmount = Math.round(Number(wdAmount) || 0);
  const calculatedWdFee = selectedMethod
    ? Math.round((parsedWdAmount * selectedMethod.feePercent) / 100) + selectedMethod.feeFixed
    : 0;
  const calculatedWdNet = Math.max(0, parsedWdAmount - calculatedWdFee);

  const handleProceedToWithdrawReview = (e: React.FormEvent) => {
    e.preventDefault();
    setWdError(null);
    setWdCreatedReceipt(null);

    if (!selectedMethod) {
      setWdError('Please select a supported withdrawal method.');
      return;
    }
    if (parsedWdAmount <= 0) {
      setWdError('Withdrawal amount must be greater than zero.');
      return;
    }
    if (parsedWdAmount < selectedMethod.minAmount) {
      setWdError(
        `Minimum withdrawal for ${selectedMethod.name} is Rs. ${selectedMethod.minAmount.toLocaleString()}.`
      );
      return;
    }
    if (parsedWdAmount > wallet.availableBalance) {
      setWdError(
        `Requested amount (Rs. ${parsedWdAmount.toLocaleString()}) exceeds your Available Balance (Rs. ${wallet.availableBalance.toLocaleString()}).`
      );
      return;
    }
    if (wdAccountTitle.trim().length < 2) {
      setWdError('Please enter the destination account holder name / title.');
      return;
    }
    if (wdAccountNumber.trim().length < 7) {
      setWdError('Please enter a valid destination account number or IBAN.');
      return;
    }
    if (selectedMethod.requiresBankName && wdBankName.trim().length < 2) {
      setWdError('Please enter the destination bank name.');
      return;
    }

    setWdReviewMode(true);
  };

  const handleConfirmWithdrawal = async () => {
    setWdError(null);
    setWdSubmitting(true);
    try {
      const res = await apiRequest<{ withdrawal: WithdrawalRequest }>('/api/withdrawals', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: parsedWdAmount,
          methodId: wdMethodId,
          accountTitle: wdAccountTitle.trim(),
          accountNumber: wdAccountNumber.trim(),
          bankName: wdBankName.trim() || undefined,
          saveAccount: wdSaveAccount,
          idempotencyKey: `wd-${user.id}-${parsedWdAmount}-${Date.now()}`,
        }),
      });
      if (!res.ok) {
        setWdError(res.error || 'Withdrawal request failed validation.');
        setWdReviewMode(false);
      } else {
        setWdCreatedReceipt(res.data.withdrawal);
        setWdReviewMode(false);
        setWdAmount('');
        fetchDashboardSummary();
      }
    } finally {
      setWdSubmitting(false);
    }
  };

  const handleCancelWithdrawal = async (withdrawalId: string) => {
    setWdError(null);
    const res = await apiRequest(`/api/withdrawals/${withdrawalId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setWdError(res.error || 'Could not cancel withdrawal.');
    } else {
      fetchDashboardSummary();
    }
  };

  // --- Saved Payout Accounts ---
  const handleSelectSavedAccount = (acc: SavedPayoutAccount) => {
    setWdMethodId(acc.methodId);
    setWdAccountTitle(acc.accountTitle);
    setWdAccountNumber(acc.accountNumber);
    setWdBankName(acc.bankName || '');
  };

  const handleAddSavedAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!newAccMethodId || newAccTitle.trim().length < 2 || newAccNumber.trim().length < 7) {
      setProfileMsg('Please enter valid account title and account number.');
      return;
    }
    const res = await apiRequest('/api/profile/payout-accounts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        methodId: newAccMethodId,
        accountTitle: newAccTitle.trim(),
        accountNumber: newAccNumber.trim(),
        bankName: newAccBank.trim() || undefined,
      }),
    });
    if (res.ok) {
      setNewAccTitle('');
      setNewAccNumber('');
      setNewAccBank('');
      setProfileMsg('Saved withdrawal payout account added.');
      fetchDashboardSummary();
    } else {
      setProfileMsg(res.error || 'Could not save payout account.');
    }
  };

  const handleDeleteSavedAccount = async (id: string) => {
    const res = await apiRequest(`/api/profile/payout-accounts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      fetchDashboardSummary();
    }
  };

  const handleMarkNotificationsRead = async () => {
    await apiRequest('/api/notifications/read-all', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchDashboardSummary();
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupStatusMsg(null);
    if (supSubject.trim().length < 3 || supMessage.trim().length < 10) {
      setSupStatusMsg('Please provide a clear subject and message (min 10 characters).');
      return;
    }
    setSupSubmitting(true);
    try {
      const res = await apiRequest('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          name: user.name,
          contactInfo: user.identifier,
          subject: supSubject.trim(),
          message: supMessage.trim(),
        }),
      });
      if (res.ok) {
        setSupSubject('');
        setSupMessage('');
        setSupStatusMsg(res.data?.message || 'Support ticket submitted.');
      } else {
        setSupStatusMsg(res.error || 'Could not submit ticket.');
      }
    } finally {
      setSupSubmitting(false);
    }
  };

  const activePlan = plans.find((p) => p.id === user.activePlanId);
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const filteredTransactions = unifiedTransactions.filter((t) => {
    const matchesType = txTypeFilter === 'ALL' || t.type === txTypeFilter;
    const q = txSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.referenceId.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const getStatusTextClass = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'APPROVED' || s === 'COMPLETED' || s === 'ACTIVE') return 'text-emerald-700';
    if (s === 'REJECTED' || s === 'CANCELLED' || s === 'SUSPENDED') return 'text-red-700';
    if (s === 'PROCESSING') return 'text-sky-700';
    return 'text-amber-700';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Top Context Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-900">{settings.brandName}</span>
              <span aria-hidden="true">·</span>
              <span>Client Portal</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{user.identifier}</span>
              <span aria-hidden="true">·</span>
              <span className={`font-semibold ${getStatusTextClass(user.status || 'ACTIVE')}`}>
                Account {user.status || 'ACTIVE'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {user.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user.role === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer whitespace-nowrap"
              >
                Admin Console
              </button>
            )}
            <button
              type="button"
              onClick={() => fetchDashboardSummary(false)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Ledger</span>
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800">
            {fetchError}
          </div>
        )}

        {/* Workspace Layout: Sidebar + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Desktop Sidebar & Mobile Navigation Tabs */}
          <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-3">
            {/* Mobile Horizontal Tab Selector */}
            <div className="flex lg:hidden overflow-x-auto gap-1 pb-1">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

            {/* Desktop Vertical Sidebar */}
            <nav aria-label="Dashboard Sidebar" className="hidden lg:flex flex-col space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {item.id === 'overview' && unreadNotifCount > 0 && (
                      <span className="font-mono text-[11px] font-bold">
                        ({unreadNotifCount})
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-3 mt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Main Viewport (9 cols) */}
          <div className="lg:col-span-9 space-y-6">
            {/* ==================== TAB 1: DASHBOARD OVERVIEW ==================== */}
            {activeTab === 'overview' && (
              <>
                {/* 4 Primary Balance & Ledger Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Available Balance (Withdrawable)</div>
                      <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-emerald-700">
                        Rs. {wallet.availableBalance.toLocaleString()}
                      </div>
                      <div className="mt-1 text-[11px] text-emerald-700 font-medium">
                        {wallet.availableBalance > 0
                          ? 'Approved funds ready for withdrawal'
                          : 'Credited immediately upon admin payment approval'}
                      </div>
                    </div>
                    {wallet.availableBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setWdAmount(String(wallet.availableBalance));
                          setActiveTab('withdraw');
                        }}
                        className="mt-3 w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer transition-colors"
                      >
                        Withdraw Rs. {wallet.availableBalance.toLocaleString()} Now &rarr;
                      </button>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-slate-500">Pending Balance</div>
                    <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-amber-700">
                      Rs. {wallet.pendingBalance.toLocaleString()}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Pending verification / reserved payout
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-slate-500">Total Deposited</div>
                    <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-slate-900">
                      Rs. {wallet.totalDeposited.toLocaleString()}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Verified &amp; approved deposits
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-slate-500">Total Withdrawals</div>
                    <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-slate-900">
                      Rs. {wallet.completedWithdrawalsAmount.toLocaleString()}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
                      Pending: Rs. {wallet.pendingWithdrawalsAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Quick Actions Bar */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="text-xs font-semibold text-slate-700 mb-3">Quick Actions</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('plans')}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Buy Service Plan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('wallet')}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Deposit / Payment</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('withdraw')}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Withdraw Funds</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('support')}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Contact Support</span>
                    </button>
                  </div>
                </div>

                {/* Affiliate Referral Program Banner */}
                <div className="bg-gradient-to-r from-[#0d1424] via-[#162038] to-[#0d1424] border border-[#cba352]/40 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#cba352]/20 border border-[#cba352]/40 flex items-center justify-center shrink-0">
                      <Gift className="w-5 h-5 text-[#f8e7a1]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Affiliate Referral Program</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#cba352]/20 text-[#f8e7a1]">
                          13% + 2% Commission
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Your Code: <strong className="font-mono text-[#f8e7a1]">{user.referralCode || referralStats?.referralCode || `TZ-${user.id.slice(-6).toUpperCase()}`}</strong> &bull; Total Earned: <span className="font-mono text-emerald-400 font-bold">Rs. {(referralStats?.totalEarnings || user.totalReferralEarnings || 0).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('referrals')}
                    className="self-start sm:self-auto py-2 px-4 text-xs font-bold bg-[#cba352] hover:bg-[#dfb867] text-[#0b0f19] rounded-lg cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5"
                  >
                    <span>Open Referral Hub</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                {/* Active Service Plan & Recent Orders */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-500">Purchased Services / Plans</div>
                      <h2 className="text-base font-bold text-slate-900">
                        Active Service Status:{' '}
                        <span className="text-emerald-700">
                          {activePlan ? activePlan.name : 'No Active Verified Plan'}
                        </span>
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('plans')}
                      className="self-start sm:self-auto text-xs font-semibold text-slate-900 underline cursor-pointer"
                    >
                      Browse All 12 Plans &rarr;
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      You have no purchased service orders yet. Select a plan in the Plans / Services
                      tab or submit an Easypaisa deposit to activate a package.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {orders.slice(0, 4).map((ord) => (
                        <div
                          key={ord.id}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between gap-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-slate-500">{ord.id}</span>
                            <span className={`font-semibold ${getStatusTextClass(ord.status)}`}>
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-slate-900">{ord.planName}</div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono tabular-nums">
                            <span>Fee: Rs. {ord.amount.toLocaleString()}</span>
                            <span>·</span>
                            <span>Daily: Rs. {ord.dailyProfit.replace(/PKR|Rs\.?/gi, '').trim()}</span>
                            <span>·</span>
                            <span>{ord.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Transactions & Notifications Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Recent Transactions (7 cols) */}
                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">Ledger Activity</div>
                        <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('transactions')}
                        className="text-xs font-semibold text-slate-900 underline cursor-pointer"
                      >
                        View All ({unifiedTransactions.length})
                      </button>
                    </div>

                    {unifiedTransactions.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                        No transactions recorded yet. All deposits, withdrawals, and plan purchases
                        appear here in real time.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200 text-xs">
                        {unifiedTransactions.slice(0, 5).map((tx) => (
                          <div
                            key={tx.id}
                            className="py-3 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-slate-500 font-mono">
                                <span>{tx.id}</span>
                                <span>·</span>
                                <span className="font-semibold text-slate-800">{tx.type}</span>
                              </div>
                              <div className="text-slate-700 truncate mt-0.5">{tx.description}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {new Date(tx.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-mono tabular-nums font-bold text-slate-900">
                                Rs. {tx.amount.toLocaleString()}
                              </div>
                              <div className={`text-[11px] font-semibold ${getStatusTextClass(tx.status)}`}>
                                {tx.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notifications (5 cols) */}
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-slate-700" />
                        <h2 className="text-base font-bold text-slate-900">Notifications</h2>
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkNotificationsRead}
                          className="text-xs font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                        No account notifications.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {notifications.slice(0, 8).map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-lg border text-xs ${
                              n.read
                                ? 'bg-slate-50 border-slate-200 text-slate-600'
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          >
                            <div className="font-semibold text-slate-900">{n.title}</div>
                            <p className="mt-1 text-slate-600 leading-relaxed">{n.message}</p>
                            <div className="mt-1.5 text-[10px] font-mono text-slate-400">
                              {new Date(n.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ==================== TAB 2: WALLET & IMMUTABLE LEDGER ==================== */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                {/* Wallet Balance Breakdown */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="text-xs text-slate-500 mb-1">
                    Server-Side Authoritative Wallet
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Wallet Balance &amp; Easypaisa Deposit
                  </h2>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">Available Balance (Withdrawable)</div>
                      <div className="mt-1 font-mono tabular-nums text-xl font-bold text-emerald-700">
                        Rs. {wallet.availableBalance.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">
                        Pending Balance (Unverified / Reserved)
                      </div>
                      <div className="mt-1 font-mono tabular-nums text-xl font-bold text-amber-700">
                        Rs. {wallet.pendingBalance.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">Total Account Balance</div>
                      <div className="mt-1 font-mono tabular-nums text-xl font-bold text-slate-900">
                        Rs. {wallet.totalBalance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Manual Easypaisa Deposit / Plan Payment */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-5 space-y-4">
                      <div>
                        <div className="text-xs text-slate-500">Manual Verification Workflow</div>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">
                          Submit Easypaisa Deposit or Plan Payment
                        </h3>
                        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                          1. Send your transfer to the official {settings.brandName} Easypaisa
                          account below.
                          <br />
                          2. Submit your Easypaisa Transaction ID (TID) and sender number.
                          <br />
                          3. Status remains <strong>PENDING</strong> until verified by an
                          administrator.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs text-slate-500">Official Easypaisa Number</div>
                          <div className="font-mono tabular-nums text-base font-bold text-slate-900 tracking-wider">
                            {settings.easypaisaNumber}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyEasypaisa}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-md cursor-pointer whitespace-nowrap"
                        >
                          {copiedEasypaisa ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Number</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <form
                      onSubmit={handleSubmitDeposit}
                      className="lg:col-span-7 space-y-4"
                      noValidate
                    >
                      {depositError && (
                        <div
                          role="alert"
                          className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800"
                        >
                          {depositError}
                        </div>
                      )}
                      {depositSuccess && (
                        <div
                          role="status"
                          className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900"
                        >
                          {depositSuccess}
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="dep-purpose"
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          Deposit Purpose / Selected Service Plan
                        </label>
                        <select
                          id="dep-purpose"
                          value={depositPlanId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDepositPlanId(val);
                            if (val !== 'wallet-deposit') {
                              const found = plans.find((p) => p.id === val);
                              if (found) setDepositAmount(String(parseNumericPkr(found.price)));
                            }
                          }}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        >
                          <option value="wallet-deposit">
                            Wallet Balance Deposit (Add to Available Balance)
                          </option>
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {p.price} ({p.duration})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="dep-amount"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                          >
                            Amount Transferred (PKR)
                          </label>
                          <input
                            id="dep-amount"
                            type="number"
                            min={1}
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="e.g. 8000"
                            required
                            className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="dep-tid"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                          >
                            Easypaisa Transaction ID (TID)
                          </label>
                          <input
                            id="dep-tid"
                            type="text"
                            value={depositTid}
                            onChange={(e) => setDepositTid(e.target.value)}
                            placeholder="e.g. 260930849201"
                            required
                            className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="dep-sender"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                          >
                            Sender Mobile / Account Number
                          </label>
                          <input
                            id="dep-sender"
                            type="text"
                            value={depositSender}
                            onChange={(e) => setDepositSender(e.target.value)}
                            placeholder="03XX-XXXXXXX"
                            required
                            className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="dep-proof"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                          >
                            Payment Proof / Note (Optional)
                          </label>
                          <input
                            id="dep-proof"
                            type="text"
                            value={depositProofNote}
                            onChange={(e) => setDepositProofNote(e.target.value)}
                            placeholder="Sender account title or receipt note"
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={depositSubmitting}
                        className="w-full py-3 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                      >
                        {depositSubmitting
                          ? 'Recording Deposit Reference...'
                          : 'Submit Easypaisa Deposit (Status: PENDING)'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Submitted Deposit History (Pending & Verified) */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Live Deposit Queue</div>
                      <h3 className="text-base font-bold text-slate-900">
                        Your Submitted Deposits &amp; Verification Status ({deposits.length})
                      </h3>
                    </div>
                    {deposits.some((d) => d.status === 'Pending') && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Verification In Progress</span>
                      </span>
                    )}
                  </div>

                  {deposits.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      You have not submitted any deposit references yet. Transfer to Easypaisa ({settings.easypaisaNumber}) and fill out the form above to fund your account.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 text-xs">
                      {deposits.map((d) => (
                        <div key={d.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="font-bold text-slate-900">TID: {d.transactionId}</span>
                              <span>·</span>
                              <span className="text-slate-500">{d.planName}</span>
                            </div>
                            <div className="text-slate-600 mt-0.5">
                              From Number: <strong className="font-mono text-slate-800">{d.senderNumber}</strong>
                              {d.paymentProofNote && <span className="text-slate-500"> — {d.paymentProofNote}</span>}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              Submitted: {new Date(d.submittedAt).toLocaleString()}
                              {d.adminNotes && (
                                <span className="text-slate-600 ml-2 font-medium">· Admin Note: {d.adminNotes}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                            <div className="font-mono font-bold text-base text-slate-900">{d.amount}</div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                d.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : d.status === 'Rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {d.status === 'Approved' ? 'Approved & Credited' : d.status === 'Rejected' ? 'Rejected' : 'Pending Verification'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Immutable Wallet Ledger Table */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div>
                    <div className="text-xs text-slate-500">Immutable Accounting Record</div>
                    <h3 className="text-base font-bold text-slate-900">
                      Wallet Ledger Entries (Balance Before &rarr; Balance After)
                    </h3>
                  </div>

                  {ledgerEntries.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      No posted ledger entries yet. Ledger entries are created automatically when a
                      deposit is approved, a plan is purchased, or a withdrawal is reserved/completed.
                    </div>
                  ) : (
                    <>
                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3">
                        {ledgerEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between font-mono">
                              <span className="text-slate-500">{entry.id}</span>
                              <span
                                className={`font-bold ${
                                  entry.direction === 'CREDIT' ? 'text-emerald-700' : 'text-slate-900'
                                }`}
                              >
                                {entry.direction === 'CREDIT' ? '+' : '-'}Rs.{' '}
                                {entry.amount.toLocaleString()}
                              </span>
                            </div>
                            <div className="font-semibold text-slate-900">{entry.type}</div>
                            <div className="text-slate-600">{entry.description}</div>
                            <div className="pt-1 border-t border-slate-200/70 flex items-center justify-between font-mono text-[11px] text-slate-500">
                              <span>Before: Rs. {entry.balanceBefore.toLocaleString()}</span>
                              <span>After: Rs. {entry.balanceAfter.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs text-slate-500">
                              <th className="py-2.5 pr-3 font-semibold">Ledger ID / Date</th>
                              <th className="py-2.5 px-3 font-semibold">Entry Type</th>
                              <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                              <th className="py-2.5 px-3 font-semibold text-right">Bal. Before</th>
                              <th className="py-2.5 px-3 font-semibold text-right">Bal. After</th>
                              <th className="py-2.5 pl-3 font-semibold">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-xs">
                            {ledgerEntries.map((entry) => (
                              <tr key={entry.id} className="hover:bg-slate-50/80">
                                <td className="py-3 pr-3 font-mono whitespace-nowrap">
                                  <div className="font-semibold text-slate-900">{entry.id}</div>
                                  <div className="text-[11px] text-slate-400">
                                    {new Date(entry.createdAt).toLocaleString()}
                                  </div>
                                </td>
                                <td className="py-3 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                                  {entry.type}
                                </td>
                                <td
                                  className={`py-3 px-3 text-right font-mono tabular-nums font-bold whitespace-nowrap ${
                                    entry.direction === 'CREDIT'
                                      ? 'text-emerald-700'
                                      : 'text-slate-900'
                                  }`}
                                >
                                  {entry.direction === 'CREDIT' ? '+' : '-'}Rs.{' '}
                                  {entry.amount.toLocaleString()}
                                </td>
                                <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                                  Rs. {entry.balanceBefore.toLocaleString()}
                                </td>
                                <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                                  Rs. {entry.balanceAfter.toLocaleString()}
                                </td>
                                <td className="py-3 pl-3 text-slate-600 max-w-xs">
                                  {entry.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ==================== TAB 3: COMPLETE TRANSACTION HISTORY ==================== */}
            {activeTab === 'transactions' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-500">Complete Account Ledger History</div>
                    <h2 className="text-lg font-bold text-slate-900">Transaction History</h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="search"
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      placeholder="Search ID or description..."
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                {/* Type Filter Bar */}
                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
                  {(
                    [
                      'ALL',
                      'DEPOSIT',
                      'WITHDRAWAL',
                      'SERVICE_PURCHASE',
                      'REFUND',
                      'ADJUSTMENT',
                    ] as const
                  ).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTxTypeFilter(t)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                        txTypeFilter === t
                          ? 'bg-white text-slate-900 font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    No transactions match the selected filter ({txTypeFilter}).
                  </div>
                ) : (
                  <>
                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                      {filteredTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between font-mono">
                            <span className="font-semibold text-slate-900">{tx.id}</span>
                            <span className={`font-semibold ${getStatusTextClass(tx.status)}`}>
                              {tx.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700">{tx.type}</span>
                            <span className="font-mono tabular-nums font-bold text-slate-900">
                              Rs. {tx.amount.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-600">{tx.description}</p>
                          <div className="text-[11px] font-mono text-slate-400">
                            {new Date(tx.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs text-slate-500">
                            <th className="py-2.5 pr-4 font-semibold">Date</th>
                            <th className="py-2.5 px-4 font-semibold">Transaction ID</th>
                            <th className="py-2.5 px-4 font-semibold">Type</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                            <th className="py-2.5 px-4 font-semibold">Status</th>
                            <th className="py-2.5 pl-4 font-semibold">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                          {filteredTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50/80">
                              <td className="py-3 pr-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                                {new Date(tx.createdAt).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                                {tx.id}
                              </td>
                              <td className="py-3 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                                {tx.type}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                                Rs. {tx.amount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`font-semibold ${getStatusTextClass(tx.status)}`}>
                                  {tx.status}
                                </span>
                              </td>
                              <td className="py-3 pl-4 text-slate-600 max-w-sm">
                                {tx.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ==================== TAB 4: PLANS / SERVICES ==================== */}
            {activeTab === 'plans' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-slate-500">Service Activation</div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Purchase or Activate a {settings.brandName} Plan
                      </h2>
                      <p className="mt-1 text-xs text-slate-600">
                        You can activate a plan immediately using your{' '}
                        <strong>
                          Available Balance (Rs. {wallet.availableBalance.toLocaleString()})
                        </strong>{' '}
                        or submit a manual Easypaisa payment.
                      </p>
                    </div>
                  </div>

                  {planActionError && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800">
                      {planActionError}
                    </div>
                  )}
                  {planActionSuccess && (
                    <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900">
                      {planActionSuccess}
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans.map((p, idx) => {
                      const priceNum = parseNumericPkr(p.price);
                      const canAffordWallet = wallet.availableBalance >= priceNum;
                      return (
                        <div
                          key={p.id}
                          className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col justify-between"
                        >
                          <div>
                            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                              <span className="text-xs font-mono text-slate-300">
                                Plan {String(idx + 1).padStart(2, '0')}
                              </span>
                              <span className="font-mono tabular-nums text-sm font-bold text-emerald-300">
                                {p.price}
                              </span>
                            </div>
                            <div className="p-4 space-y-2 text-xs">
                              <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                              <div className="flex justify-between py-1 border-b border-slate-200/70">
                                <span className="text-slate-500">Daily Profit (روزانہ منافع)</span>
                                <span className="font-mono font-bold text-emerald-700">
                                  {p.dailyProfit || '—'}
                                </span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-200/70">
                                <span className="text-slate-500">Total Profit (منافع مکمل)</span>
                                <span className="font-mono font-bold text-slate-900">
                                  {p.totalProfit || '—'}
                                </span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-slate-500">Duration (پلان مدت)</span>
                                <span className="font-mono text-slate-700">{p.duration}</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 pt-0 space-y-2">
                            <button
                              type="button"
                              disabled={purchasingPlanId === p.id}
                              onClick={() => handlePurchaseWithWallet(p)}
                              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                                canAffordWallet
                                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                              }`}
                            >
                              {purchasingPlanId === p.id
                                ? 'Processing...'
                                : 'Buy with Wallet Balance'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDepositPlanId(p.id);
                                setDepositAmount(String(priceNum));
                                setActiveTab('wallet');
                              }}
                              className="w-full py-2 px-3 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              Pay via Easypaisa TID
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB: REFERRALS & AFFILIATE TEAM ==================== */}
            {activeTab === 'referrals' && (
              <ClientReferralsTab
                user={user}
                token={token}
                settings={settings}
                plans={plans}
                stats={referralStats}
                onRefresh={() => {
                  fetchDashboardSummary();
                  fetchReferralStats();
                }}
              />
            )}

            {/* ==================== TAB 5: DEDICATED WITHDRAWAL PAGE ==================== */}
            {activeTab === 'withdraw' && (
              <div className="space-y-6">
                {/* Balance Eligibility Banner */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">
                        Available Balance (Eligible for Withdrawal)
                      </div>
                      <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-emerald-700">
                        Rs. {wallet.availableBalance.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">
                        Pending / Reserved Withdrawals
                      </div>
                      <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-amber-700">
                        Rs. {wallet.pendingWithdrawalsAmount.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">Total Completed Withdrawals</div>
                      <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-slate-900">
                        Rs. {wallet.completedWithdrawalsAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Withdrawal Request Form / Review / Receipt */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <div>
                    <div className="text-xs text-slate-500">Server-Validated Payout Request</div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Request a Withdrawal
                    </h2>
                    <p className="mt-1 text-xs text-slate-600">
                      Submitting a withdrawal immediately reserves the requested amount from your
                      Available Balance (Status: <strong>PENDING</strong>) until reviewed and
                      processed by an administrator.
                    </p>
                  </div>

                  {wdError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800"
                    >
                      {wdError}
                    </div>
                  )}

                  {wdCreatedReceipt && (
                    <div
                      role="status"
                      className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-950"
                    >
                      <div className="font-mono font-bold text-sm text-emerald-900">
                        Withdrawal Request Submitted — ID: {wdCreatedReceipt.id}
                      </div>
                      <p>
                        Status: <strong>{wdCreatedReceipt.status}</strong> · Amount Reserved:{' '}
                        <span className="font-mono font-semibold">
                          Rs. {wdCreatedReceipt.amount.toLocaleString()}
                        </span>{' '}
                        · Net Payout:{' '}
                        <span className="font-mono font-semibold">
                          Rs. {wdCreatedReceipt.netAmount.toLocaleString()}
                        </span>{' '}
                        via {wdCreatedReceipt.methodName} ({wdCreatedReceipt.maskedAccountNumber}).
                      </p>
                    </div>
                  )}

                  {/* Saved Payout Accounts Quick Selector */}
                  {user.savedPayoutAccounts && user.savedPayoutAccounts.length > 0 && !wdReviewMode && (
                    <div>
                      <div className="text-xs font-semibold text-slate-700 mb-2">
                        Use a Saved Payout Account
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {user.savedPayoutAccounts.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => handleSelectSavedAccount(acc)}
                            className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-800 text-left cursor-pointer"
                          >
                            <div className="font-semibold">{acc.methodName}</div>
                            <div className="font-mono text-[11px] text-slate-600">
                              {acc.accountTitle} · {acc.accountNumber}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!wdReviewMode ? (
                    <form onSubmit={handleProceedToWithdrawReview} className="space-y-4" noValidate>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="wd-method"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                          >
                            1. Select Withdrawal Method
                          </label>
                          <select
                            id="wd-method"
                            value={wdMethodId}
                            onChange={(e) => setWdMethodId(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                          >
                            {withdrawalMethods.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} (Min: Rs. {m.minAmount.toLocaleString()})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="wd-amount"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                          >
                            2. Withdrawal Amount (PKR)
                          </label>
                          <input
                            id="wd-amount"
                            type="number"
                            min={selectedMethod?.minAmount || 1}
                            max={wallet.availableBalance}
                            value={wdAmount}
                            onChange={(e) => setWdAmount(e.target.value)}
                            placeholder={`Max available: ${wallet.availableBalance}`}
                            required
                            className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                        </div>
                      </div>

                      {selectedMethod && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                          <span>{selectedMethod.instructions}</span>
                          <span className="font-mono tabular-nums font-semibold text-slate-900">
                            Fee: Rs. {calculatedWdFee.toLocaleString()} · Net Payout: Rs.{' '}
                            {calculatedWdNet.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="wd-title"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                          >
                            3. Account Holder Name / Title
                          </label>
                          <input
                            id="wd-title"
                            type="text"
                            value={wdAccountTitle}
                            onChange={(e) => setWdAccountTitle(e.target.value)}
                            placeholder="Exact name on receiving account"
                            required
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="wd-number"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                          >
                            4. {selectedMethod?.accountLabel || 'Account Number / IBAN'}
                          </label>
                          <input
                            id="wd-number"
                            type="text"
                            value={wdAccountNumber}
                            onChange={(e) => setWdAccountNumber(e.target.value)}
                            placeholder="03XX-XXXXXXX or PKXX..."
                            required
                            className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                        </div>
                      </div>

                      {selectedMethod?.requiresBankName && (
                        <div>
                          <label
                            htmlFor="wd-bank"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                          >
                            Bank Name
                          </label>
                          <input
                            id="wd-bank"
                            type="text"
                            value={wdBankName}
                            onChange={(e) => setWdBankName(e.target.value)}
                            placeholder="e.g. Meezan Bank, HBL, UBL"
                            required
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                        </div>
                      )}

                      <label className="flex items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={wdSaveAccount}
                          onChange={(e) => setWdSaveAccount(e.target.checked)}
                        />
                        <span>Save these payout details to my profile for future withdrawals</span>
                      </label>

                      <button
                        type="submit"
                        className="w-full py-3 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        Review Withdrawal Request &rarr;
                      </button>
                    </form>
                  ) : (
                    /* Step 4 & 5: Review & Confirm Withdrawal */
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                      <div className="text-xs font-semibold text-slate-900">
                        4. Review &amp; Confirm Your Withdrawal Request
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-white border border-slate-200 rounded-lg">
                          <div className="text-slate-500">Withdrawal Method</div>
                          <div className="font-bold text-slate-900 mt-0.5">
                            {selectedMethod?.name}
                            {wdBankName ? ` (${wdBankName})` : ''}
                          </div>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-lg">
                          <div className="text-slate-500">Destination Account</div>
                          <div className="font-mono font-bold text-slate-900 mt-0.5">
                            {wdAccountTitle} · {wdAccountNumber}
                          </div>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-lg">
                          <div className="text-slate-500">Gross Amount (Reserved)</div>
                          <div className="font-mono tabular-nums font-bold text-slate-900 mt-0.5">
                            Rs. {parsedWdAmount.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-lg">
                          <div className="text-slate-500">
                            Processing Fee &amp; Net Payout Amount
                          </div>
                          <div className="font-mono tabular-nums font-bold text-emerald-700 mt-0.5">
                            Fee: Rs. {calculatedWdFee.toLocaleString()} · Net: Rs.{' '}
                            {calculatedWdNet.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                        <button
                          type="button"
                          disabled={wdSubmitting}
                          onClick={handleConfirmWithdrawal}
                          className="flex-1 py-3 px-4 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg cursor-pointer"
                        >
                          {wdSubmitting
                            ? 'Confirming & Reserving Funds...'
                            : '5. Confirm & Submit Withdrawal Request'}
                        </button>
                        <button
                          type="button"
                          disabled={wdSubmitting}
                          onClick={() => setWdReviewMode(false)}
                          className="py-3 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          Edit Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Withdrawal Requests History */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-slate-900">
                    My Withdrawal Requests ({withdrawals.length})
                  </h3>

                  {withdrawals.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      You have not submitted any withdrawal requests yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {withdrawals.map((w) => (
                        <div
                          key={w.id}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 font-mono">
                              <span className="font-bold text-slate-900">{w.id}</span>
                              <span>·</span>
                              <span className={`font-bold ${getStatusTextClass(w.status)}`}>
                                {w.status}
                              </span>
                              <span>·</span>
                              <span className="text-slate-500">
                                {new Date(w.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="font-semibold text-slate-900">
                              {w.methodName} — {w.accountTitle} ({w.maskedAccountNumber})
                            </div>
                            <div className="text-slate-600">{w.adminNotes}</div>
                            {w.payoutReference && (
                              <div className="font-mono text-emerald-800 font-semibold">
                                Payout Reference: {w.payoutReference}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col md:items-end justify-between gap-2 shrink-0">
                            <div className="font-mono tabular-nums text-sm font-bold text-slate-900">
                              Net: Rs. {w.netAmount.toLocaleString()}
                              <span className="block text-[11px] font-normal text-slate-500">
                                Gross: Rs. {w.amount.toLocaleString()} (Fee: Rs. {w.fee})
                              </span>
                            </div>
                            {w.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => handleCancelWithdrawal(w.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer"
                              >
                                Cancel &amp; Release Funds
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== TAB 6: PROFILE & SAVED ACCOUNTS ==================== */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-lg font-bold text-slate-900">Account Profile</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-slate-500">Full Name</div>
                      <div className="font-bold text-slate-900 text-sm mt-0.5">{user.name}</div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-slate-500">Login Identifier</div>
                      <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                        {user.identifier}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-slate-500">Account Status</div>
                      <div className={`font-bold text-sm mt-0.5 ${getStatusTextClass(user.status || 'ACTIVE')}`}>
                        {user.status || 'ACTIVE'}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-slate-500">Registered Since</div>
                      <div className="font-mono text-slate-900 text-sm mt-0.5">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Saved Withdrawal Payout Accounts */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <div>
                    <div className="text-xs text-slate-500">Payout Configuration</div>
                    <h3 className="text-base font-bold text-slate-900">
                      Saved Withdrawal Accounts
                    </h3>
                  </div>

                  {profileMsg && (
                    <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 text-xs font-medium text-slate-900">
                      {profileMsg}
                    </div>
                  )}

                  {user.savedPayoutAccounts && user.savedPayoutAccounts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {user.savedPayoutAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">
                              {acc.methodName} {acc.bankName ? `(${acc.bankName})` : ''}
                            </div>
                            <div className="text-slate-700 mt-0.5">{acc.accountTitle}</div>
                            <div className="font-mono text-slate-500 mt-0.5">
                              {acc.accountNumber}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSavedAccount(acc.id)}
                            className="p-2 text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                            aria-label="Remove saved account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      No saved withdrawal accounts yet. Add one below for faster withdrawals.
                    </div>
                  )}

                  <form
                    onSubmit={handleAddSavedAccount}
                    className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <select
                      value={newAccMethodId}
                      onChange={(e) => setNewAccMethodId(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      {withdrawalMethods.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newAccTitle}
                      onChange={(e) => setNewAccTitle(e.target.value)}
                      placeholder="Account Holder Title"
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAccNumber}
                        onChange={(e) => setNewAccNumber(e.target.value)}
                        placeholder="Account Number / IBAN"
                        className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer whitespace-nowrap"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ==================== TAB 7: SUPPORT ==================== */}
            {activeTab === 'support' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Direct Support Desk</div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">Telegram Support</h3>
                      <p className="mt-1.5 text-xs text-slate-600">
                        Message {settings.telegramHandle} for payment or withdrawal queries.
                      </p>
                    </div>
                    <a
                      href={settings.telegramSupportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                    >
                      <span>Open Telegram</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Official Broadcasts</div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">WhatsApp Channel</h3>
                      <p className="mt-1.5 text-xs text-slate-600">
                        Follow official REX TRADERS announcements and schedule notices.
                      </p>
                    </div>
                    <a
                      href={settings.whatsappChannelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                    >
                      <span>Join WhatsApp Channel</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Official Deposit Account</div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        Easypaisa: {settings.easypaisaNumber}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-600">
                        Copy the official number for manual service plan payments.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyEasypaisa}
                      className="mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{copiedEasypaisa ? 'Copied!' : 'Copy Easypaisa Number'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-slate-900">
                    Submit a Support Ticket to Administrator
                  </h3>
                  {supStatusMsg && (
                    <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 text-xs font-medium text-slate-900">
                      {supStatusMsg}
                    </div>
                  )}
                  <form onSubmit={handleSupportSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={supSubject}
                        onChange={(e) => setSupSubject(e.target.value)}
                        placeholder="e.g. Question about Withdrawal ID or Deposit Verification"
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Message
                      </label>
                      <textarea
                        rows={3}
                        value={supMessage}
                        onChange={(e) => setSupMessage(e.target.value)}
                        placeholder="Describe your request clearly..."
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={supSubmitting}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{supSubmitting ? 'Sending...' : 'Send Support Ticket'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
