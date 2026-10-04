import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  Filter,
  Globe,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  Users,
  Share2,
  Gift,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  AuditLogEntry,
  DepositStatus,
  InquiryStatus,
  LedgerEntry,
  LoginLogEntry,
  PageRoute,
  PaymentTransaction,
  ReferralCommissionLog,
  ServicePlan,
  SiteSettings,
  SupportInquiry,
  UserAccount,
  WalletAccount,
  WithdrawalMethodConfig,
  WithdrawalRequest,
  WithdrawalStatus,
} from '../../types';
import { apiRequest } from '../../utils/api';

interface AdminDashboardProps {
  token: string;
  settings: SiteSettings;
  onSettingsUpdated: (newSettings: SiteSettings) => void;
  onPlansUpdated: () => void;
  onNavigate: (page: PageRoute) => void;
}

type AdminTab =
  | 'withdrawals'
  | 'deposits'
  | 'wallets'
  | 'methods'
  | 'audit'
  | 'plans'
  | 'users'
  | 'referrals'
  | 'inquiries'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  settings,
  onSettingsUpdated,
  onPlansUpdated,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('deposits');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [deposits, setDeposits] = useState<PaymentTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState<WithdrawalMethodConfig[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [auditLogs, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [inquiries, setInquiries] = useState<SupportInquiry[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLogEntry[]>([]);
  const [referralLogs, setReferralLogs] = useState<ReferralCommissionLog[]>([]);
  const [refLogSearch, setRefLogSearch] = useState('');
  const [refTierFilter, setRefTierFilter] = useState<'ALL' | 1 | 2>('ALL');

  // --- Users & Login Surveillance State ---
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<'ALL' | 'INVESTED' | 'NON_INVESTED' | 'SUSPENDED'>('ALL');
  const [loginLogSearchQuery, setLoginLogSearchQuery] = useState('');
  const [loginLogRoleFilter, setLoginLogRoleFilter] = useState<'ALL' | 'user' | 'admin'>('ALL');
  const [activeUserSubView, setActiveUserSubView] = useState<'investments' | 'logins'>('investments');

  // --- Withdrawal Management State ---
  const [wdFilter, setWdFilter] = useState<'ALL' | WithdrawalStatus>('ALL');
  const [wdNotesDraft, setWdNotesDraft] = useState<Record<string, string>>({});
  const [wdPayoutRefDraft, setWdPayoutRefDraft] = useState<Record<string, string>>({});
  const [wdConfirmRealPayout, setWdConfirmRealPayout] = useState<Record<string, boolean>>({});
  const [unmaskedWdIds, setUnmaskedWdIds] = useState<Record<string, boolean>>({});

  // --- Deposit Filter & Notes ---
  const [depFilter, setDepFilter] = useState<'All' | DepositStatus>('All');
  const [depNotesDraft, setDepNotesDraft] = useState<Record<string, string>>({});

  // --- Controlled Balance Adjustment Form ---
  const [adjUserId, setAdjUserId] = useState('');
  const [adjDirection, setAdjDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjCategory, setAdjCategory] = useState<'ADJUSTMENT' | 'REFUND'>('ADJUSTMENT');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');

  // --- Configurable Withdrawal Method Form ---
  const [wmName, setWmName] = useState('');
  const [wmCode, setWmCode] = useState('');
  const [wmMin, setWmMin] = useState('500');
  const [wmMax, setWmMax] = useState('500000');
  const [wmFeePercent, setWmFeePercent] = useState('0');
  const [wmFeeFixed, setWmFeeFixed] = useState('0');
  const [wmLabel, setWmLabel] = useState('Account Number (11 Digits)');
  const [wmRequiresBank, setWmRequiresBank] = useState(false);
  const [wmInstructions, setWmInstructions] = useState('');

  // --- New Plan Form State ---
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [newPlanDaily, setNewPlanDaily] = useState('');
  const [newPlanTotal, setNewPlanTotal] = useState('');
  const [newPlanDuration, setNewPlanDuration] = useState('30 Days (30 دن)');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPlanFeaturesText, setNewPlanFeaturesText] = useState('');
  const [newPlanPopular, setNewPlanPopular] = useState(false);

  // --- Settings Form State ---
  const [logoUrlInput, setLogoUrlInput] = useState<string>(settings.logoUrl || '');
  const [heroHeadlineInput, setHeroHeadlineInput] = useState<string>(settings.heroHeadline);
  const [heroSubheadlineInput, setHeroSubheadlineInput] = useState<string>(
    settings.heroSubheadline
  );
  const [currentOwnerPassword, setCurrentOwnerPassword] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const prevDepositsCountRef = React.useRef<number | null>(null);
  const prevLoginLogsCountRef = React.useRef<number | null>(null);
  const [liveAlert, setLiveAlert] = useState<{ id: string; message: string; type: 'deposit' | 'login' } | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.31);
    } catch {
      // AudioContext blocked or not supported, ignore silently
    }
  }, []);

  useEffect(() => {
    if (liveAlert) {
      const t = setTimeout(() => setLiveAlert(null), 7000);
      return () => clearTimeout(t);
    }
  }, [liveAlert]);

  const fetchAdminOverview = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
      setError(null);
    } else {
      setIsSyncing(true);
    }
    try {
      const res = await apiRequest('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (!isSilent) {
          setError(res.error || 'Failed to load administrator data.');
        }
      } else {
        const data = res.data;
        const userList: UserAccount[] = data.users || [];
        setUsers(userList);
        if (userList.length > 0 && !adjUserId) {
          setAdjUserId(userList[0].id);
        }
        setWallets(data.wallets || []);
        setPlans(data.plans || []);

        const newDeposits: PaymentTransaction[] = data.transactions || [];
        const newLogins: LoginLogEntry[] = data.loginLogs || [];

        // Trigger real-time alert on new incoming deposits
        if (prevDepositsCountRef.current !== null && newDeposits.length > prevDepositsCountRef.current) {
          const newest = newDeposits[0];
          setLiveAlert({
            id: `dep-${Date.now()}`,
            message: `💳 New Deposit Received! ${newest?.amount || ''} from ${newest?.userName || 'User'} (TID: ${newest?.transactionId || ''})`,
            type: 'deposit',
          });
          playNotificationSound();
        }

        // Trigger real-time alert on new user sign-in
        if (prevLoginLogsCountRef.current !== null && newLogins.length > prevLoginLogsCountRef.current) {
          const newestLog = newLogins[0];
          setLiveAlert({
            id: `log-${Date.now()}`,
            message: `👤 New User Login: ${newestLog?.userName || 'User'} (${newestLog?.userIdentifier || ''}) from IP ${newestLog?.ipAddress || ''}`,
            type: 'login',
          });
          playNotificationSound();
        }

        prevDepositsCountRef.current = newDeposits.length;
        prevLoginLogsCountRef.current = newLogins.length;
        setLastSyncTime(new Date());

        setDeposits(newDeposits);
        setWithdrawals(data.withdrawals || []);
        setWithdrawalMethods(data.withdrawalMethods || []);
        setLedgerEntries(data.ledgerEntries || []);
        setAuditLog(data.auditLogs || []);
        setInquiries(data.inquiries || []);
        setLoginLogs(newLogins);
        setReferralLogs(data.referralLogs || []);
        if (data.settings) {
          setLogoUrlInput(data.settings.logoUrl || '');
          setHeroHeadlineInput(data.settings.heroHeadline || '');
          setHeroSubheadlineInput(data.settings.heroSubheadline || '');
        }
      }
    } finally {
      if (!isSilent) setLoading(false);
      setIsSyncing(false);
    }
  }, [token, adjUserId, playNotificationSound]);

  useEffect(() => {
    fetchAdminOverview(false);
    const interval = setInterval(() => {
      fetchAdminOverview(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [fetchAdminOverview]);

  const showFlash = (msg: string) => {
    setError(null);
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // --- Admin Withdrawal Update ---
  const handleUpdateWithdrawal = async (wd: WithdrawalRequest, targetStatus: WithdrawalStatus) => {
    setError(null);
    const adminNotes = wdNotesDraft[wd.id] ?? wd.adminNotes;
    const payoutReference = wdPayoutRefDraft[wd.id] ?? wd.payoutReference ?? '';
    const confirmRealPayoutSent = Boolean(wdConfirmRealPayout[wd.id]);

    if (targetStatus === 'COMPLETED') {
      if (!confirmRealPayoutSent) {
        setError(
          `Cannot mark ${wd.id} COMPLETED: You must explicitly check the box confirming that the real payout of Rs. ${wd.netAmount.toLocaleString()} was sent.`
        );
        return;
      }
      if (payoutReference.trim().length < 3) {
        setError(
          `Cannot mark ${wd.id} COMPLETED: Please enter the actual transfer receipt / reference ID.`
        );
        return;
      }
    }

    const res = await apiRequest(`/api/admin/withdrawals/${wd.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        status: targetStatus,
        adminNotes,
        confirmRealPayoutSent,
        payoutReference: payoutReference.trim(),
      }),
    });
    if (!res.ok) {
      setError(res.error || 'Could not update withdrawal status.');
    } else {
      showFlash(`Withdrawal ${wd.id} updated to ${targetStatus} (Audit log recorded).`);
      fetchAdminOverview();
    }
  };

  // --- Admin Deposit Review ---
  const handleReviewDeposit = async (id: string, status: DepositStatus) => {
    setError(null);
    const adminNotes =
      depNotesDraft[id] ??
      (status === 'Approved'
        ? 'Easypaisa transfer verified by administrator. Wallet credited.'
        : status === 'Rejected'
        ? 'Transaction ID could not be verified against Easypaisa records.'
        : 'Pending manual verification.');

    const res = await apiRequest(`/api/admin/transactions/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, adminNotes }),
    });
    if (!res.ok) {
      setError(res.error || 'Could not update deposit status.');
    } else {
      showFlash(`Deposit ${id} marked as ${status} (Ledger & Audit log updated).`);
      fetchAdminOverview();
    }
  };

  // --- Admin Controlled Balance Adjustment ---
  const handleBalanceAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numAmt = Math.round(Number(adjAmount) || 0);
    if (!adjUserId || numAmt <= 0 || adjReason.trim().length < 5) {
      setError('Select a user, enter a positive amount, and provide an audit reason (min 5 chars).');
      return;
    }

    const res = await apiRequest('/api/admin/wallets/adjust', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        targetUserId: adjUserId,
        direction: adjDirection,
        category: adjCategory,
        amount: numAmt,
        reason: adjReason.trim(),
      }),
    });
    if (!res.ok) {
      setError(res.error || 'Balance adjustment failed.');
    } else {
      setAdjAmount('');
      setAdjReason('');
      showFlash(
        `Posted immutable ${adjDirection} ledger adjustment of Rs. ${numAmt.toLocaleString()}.`
      );
      fetchAdminOverview();
    }
  };

  // --- Admin Save Withdrawal Method ---
  const handleCreateWithdrawalMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!wmName.trim() || !wmCode.trim()) {
      setError('Method name and code are required.');
      return;
    }

    const res = await apiRequest('/api/admin/withdrawal-methods', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: wmName.trim(),
        code: wmCode.trim().toUpperCase(),
        minAmount: Number(wmMin) || 500,
        maxAmount: Number(wmMax) || 500000,
        feePercent: Number(wmFeePercent) || 0,
        feeFixed: Number(wmFeeFixed) || 0,
        accountLabel: wmLabel.trim() || 'Account Number',
        requiresBankName: wmRequiresBank,
        instructions:
          wmInstructions.trim() || `Enter your registered ${wmName.trim()} account details.`,
        active: true,
      }),
    });
    if (!res.ok) {
      setError(res.error || 'Could not save withdrawal method.');
    } else {
      setWmName('');
      setWmCode('');
      setWmInstructions('');
      showFlash('Withdrawal method configuration saved.');
      fetchAdminOverview();
    }
  };

  const handleToggleMethodActive = async (m: WithdrawalMethodConfig) => {
    const res = await apiRequest('/api/admin/withdrawal-methods', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...m,
        active: !m.active,
      }),
    });
    if (res.ok) {
      showFlash(`Updated ${m.name} status.`);
      fetchAdminOverview();
    } else {
      setError(res.error || 'Could not toggle method status.');
    }
  };

  // --- Admin Create / Delete Plan ---
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const features = newPlanFeaturesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!newPlanName.trim() || !newPlanPrice.trim() || features.length === 0) {
      setError('Please fill in Plan Name, Price, and at least one feature line.');
      return;
    }

    const res = await apiRequest('/api/admin/plans', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: newPlanName.trim(),
        targetAudience: 'Structured 30-Day Package',
        price: newPlanPrice.trim(),
        dailyProfit: newPlanDaily.trim() || undefined,
        totalProfit: newPlanTotal.trim() || undefined,
        currency: 'PKR',
        duration: newPlanDuration.trim(),
        description:
          newPlanDesc.trim() ||
          'Structured trading service package with support and portal access.',
        features,
        ctaText: 'Invest Now',
        isPopular: newPlanPopular,
        active: true,
      }),
    });
    if (!res.ok) {
      setError(res.error || 'Could not create plan.');
    } else {
      setNewPlanName('');
      setNewPlanPrice('');
      setNewPlanDaily('');
      setNewPlanTotal('');
      setNewPlanDesc('');
      setNewPlanFeaturesText('');
      setNewPlanPopular(false);
      showFlash('New service plan created.');
      fetchAdminOverview();
      onPlansUpdated();
    }
  };

  const handleDeletePlan = async (id: string) => {
    const res = await apiRequest(`/api/admin/plans/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      showFlash('Service plan removed.');
      fetchAdminOverview();
      onPlansUpdated();
    } else {
      setError(res.error || 'Could not delete plan.');
    }
  };

  const handleUpdateInquiry = async (id: string, status: InquiryStatus, adminReply: string) => {
    const res = await apiRequest(`/api/admin/inquiries/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, adminReply }),
    });
    if (res.ok) {
      showFlash(`Inquiry marked as ${status}.`);
      fetchAdminOverview();
    } else {
      setError(res.error || 'Could not update support inquiry.');
    }
  };

  const handleToggleUserStatus = async (u: UserAccount) => {
    const nextStatus = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const res = await apiRequest(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      showFlash(`User ${u.name} status set to ${nextStatus}.`);
      fetchAdminOverview();
    } else {
      setError(res.error || 'Could not update user status.');
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrlInput(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest<{ settings: SiteSettings }>('/api/admin/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        logoUrl: logoUrlInput.trim() ? logoUrlInput.trim() : null,
        heroHeadline: heroHeadlineInput.trim(),
        heroSubheadline: heroSubheadlineInput.trim(),
      }),
    });
    if (res.ok && res.data?.settings) {
      onSettingsUpdated(res.data.settings);
      showFlash('Website & Logo settings updated across REX TRADERS.');
    } else {
      setError(res.error || 'Could not save settings.');
    }
  };

  const handleUpdateOwnerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!currentOwnerPassword || newOwnerPassword.length < 8) {
      setError('Enter your current password and a new password of at least 8 characters.');
      return;
    }
    const res = await apiRequest('/api/admin/owner-password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        currentPassword: currentOwnerPassword,
        newPassword: newOwnerPassword,
      }),
    });
    if (!res.ok) {
      setError(res.error || 'Failed to update owner password.');
    } else {
      setCurrentOwnerPassword('');
      setNewOwnerPassword('');
      showFlash('Owner administrator password updated and logged in audit trail.');
      fetchAdminOverview();
    }
  };

  const filteredWithdrawals =
    wdFilter === 'ALL' ? withdrawals : withdrawals.filter((w) => w.status === wdFilter);

  const filteredDeposits =
    depFilter === 'All' ? deposits : deposits.filter((t) => t.status === depFilter);

  const totalPlatformInvested = useMemo(() => {
    return users
      .filter((u) => u.role !== 'admin')
      .reduce((sum, u) => sum + (u.totalInvested || 0), 0);
  }, [users]);

  const activeInvestorsCount = useMemo(() => {
    return users.filter((u) => u.role !== 'admin' && (u.totalInvested || 0) > 0).length;
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userFilter === 'INVESTED' && (!u.totalInvested || u.totalInvested <= 0)) return false;
      if (userFilter === 'NON_INVESTED' && (u.totalInvested || 0) > 0) return false;
      if (userFilter === 'SUSPENDED' && u.status !== 'SUSPENDED') return false;
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.trim().toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.identifier.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, userFilter, userSearchQuery]);

  const filteredLoginLogs = useMemo(() => {
    return loginLogs.filter((log) => {
      if (loginLogRoleFilter !== 'ALL' && log.role !== loginLogRoleFilter) return false;
      if (loginLogSearchQuery.trim()) {
        const q = loginLogSearchQuery.trim().toLowerCase();
        return (
          log.userName.toLowerCase().includes(q) ||
          log.userIdentifier.toLowerCase().includes(q) ||
          log.ipAddress.toLowerCase().includes(q) ||
          log.id.toLowerCase().includes(q) ||
          (log.activePlanName && log.activePlanName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [loginLogs, loginLogRoleFilter, loginLogSearchQuery]);

  return (
    <section className="py-8 sm:py-10 bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-slate-700">{settings.brandName}</span>
              <span aria-hidden="true"> · </span>
              <span>Authorized Administrator Console</span>
              <span aria-hidden="true"> · </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Sync Active (3.5s)</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Client Payment Approvals, Withdrawals, Ledger &amp; Audit Management
            </h1>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Auto-updating real-time records. Last synced: {lastSyncTime.toLocaleTimeString()}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer whitespace-nowrap"
            >
              Switch to Client Dashboard
            </button>
            <button
              type="button"
              onClick={() => fetchAdminOverview(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading || isSyncing ? 'animate-spin' : ''}`} />
              <span>Refresh Now</span>
            </button>
          </div>
        </div>

        {/* Live Audio/Visual Toast Alert */}
        {liveAlert && (
          <div
            role="status"
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 shadow-lg transition-all animate-bounce ${
              liveAlert.type === 'deposit'
                ? 'bg-amber-900/90 border-amber-400 text-amber-100'
                : 'bg-indigo-900/90 border-indigo-400 text-indigo-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{liveAlert.type === 'deposit' ? '💳' : '👤'}</span>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  {liveAlert.type === 'deposit' ? 'Incoming Payment Detected' : 'Live User Login Event'}
                </div>
                <div className="text-sm font-semibold">{liveAlert.message}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLiveAlert(null)}
              className="px-2.5 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-lg cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Summary Metrics Row (Tabular Numerals) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5">
            <div className="text-xs text-slate-500">Pending Deposits</div>
            <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-amber-700">
              {deposits.filter((t) => t.status === 'Pending').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Payment approvals</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5">
            <div className="text-xs text-slate-500">Pending Withdrawals</div>
            <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-amber-700">
              {withdrawals.filter((w) => w.status === 'PENDING' || w.status === 'PROCESSING').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">In payout queue</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Total Invested</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 font-mono tabular-nums text-lg sm:text-xl font-bold text-emerald-700 truncate" title={`Rs. ${totalPlatformInvested.toLocaleString()} PKR`}>
              Rs. {totalPlatformInvested.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {activeInvestorsCount} active {activeInvestorsCount === 1 ? 'client' : 'clients'}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Logins Tracked</span>
              <LogIn className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-indigo-700">
              {loginLogs.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across {users.length} users
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5">
            <div className="text-xs text-slate-500">Completed Payouts</div>
            <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-emerald-700">
              {withdrawals.filter((w) => w.status === 'COMPLETED').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Verified transfers</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5">
            <div className="text-xs text-slate-500">Ledger &amp; Audit</div>
            <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-slate-900">
              {ledgerEntries.length + auditLogs.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {auditLogs.length} audit events
            </div>
          </div>
        </div>

        {actionMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
            {actionMessage}
          </div>
        )}
        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-900">
            {error}
          </div>
        )}

        {/* Navigation Tabs (Mobile-Friendly Horizontal Swipe) */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/90 rounded-xl overflow-x-auto shadow-inner">
          {(
            [
              {
                id: 'deposits',
                label: 'Payment Approvals',
                badge: `${deposits.filter((t) => t.status === 'Pending').length} Pending`,
                badgeColor: deposits.some((t) => t.status === 'Pending') ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-300 text-slate-700',
              },
              {
                id: 'users',
                label: 'Live Logins & Users',
                badge: `${loginLogs.length} Logins`,
                badgeColor: 'bg-indigo-600 text-white font-bold',
              },
              {
                id: 'withdrawals',
                label: 'Withdrawals Queue',
                badge: `${withdrawals.filter((w) => w.status === 'PENDING' || w.status === 'PROCESSING').length} Active`,
                badgeColor: withdrawals.some((w) => w.status === 'PENDING' || w.status === 'PROCESSING') ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-300 text-slate-700',
              },
              { id: 'wallets', label: 'Wallets & Ledger' },
              { id: 'methods', label: 'Withdrawal Methods' },
              { id: 'audit', label: 'Audit Log' },
              { id: 'plans', label: 'Plans' },
              {
                id: 'referrals',
                label: 'Referrals & Affiliates',
                badge: `${referralLogs.length} Logs`,
              },
              { id: 'inquiries', label: 'Support Inquiries' },
              { id: 'settings', label: 'Site Settings' },
            ] as { id: AdminTab; label: string; badge?: string; badgeColor?: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 font-bold shadow-sm'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${tab.badgeColor || 'bg-slate-300 text-slate-800'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ==================== TAB 1: ADMIN WITHDRAWAL MANAGEMENT ==================== */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Customer Withdrawal Management
                </h2>
                <p className="text-xs text-slate-600">
                  Workflow: <strong>PENDING</strong> &rarr; <strong>PROCESSING</strong> (Approved)
                  &rarr; <strong>COMPLETED</strong> (Requires explicit confirmation that real payout
                  was executed). Rejecting a request automatically releases reserved funds back to
                  the user&apos;s Available Balance.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
                {(['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setWdFilter(st)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                        wdFilter === st
                          ? 'bg-white text-slate-900 font-semibold shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            {filteredWithdrawals.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                No withdrawal requests match filter ({wdFilter}).
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWithdrawals.map((wd) => {
                  const isUnmasked = Boolean(unmaskedWdIds[wd.id]);
                  const isTerminal =
                    wd.status === 'COMPLETED' ||
                    wd.status === 'REJECTED' ||
                    wd.status === 'CANCELLED';

                  return (
                    <div
                      key={wd.id}
                      className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 font-mono">
                            <span className="font-bold text-sm text-slate-900">{wd.id}</span>
                            <span>·</span>
                            <span
                              className={`font-bold ${
                                wd.status === 'COMPLETED'
                                  ? 'text-emerald-700'
                                  : wd.status === 'REJECTED' || wd.status === 'CANCELLED'
                                  ? 'text-red-700'
                                  : wd.status === 'PROCESSING'
                                  ? 'text-sky-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              Status: {wd.status}
                            </span>
                            <span>·</span>
                            <span className="text-slate-500">
                              Requested: {new Date(wd.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-slate-800">
                            Customer: <strong>{wd.userName}</strong> (
                            <span className="font-mono">{wd.userIdentifier}</span>)
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 font-mono tabular-nums">
                          <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                            <span className="text-slate-500 block text-[10px]">Gross Amount</span>
                            <span className="font-bold text-slate-900 text-sm">
                              Rs. {wd.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                            <span className="text-slate-500 block text-[10px]">Processing Fee</span>
                            <span className="font-bold text-slate-700 text-sm">
                              Rs. {wd.fee.toLocaleString()}
                            </span>
                          </div>
                          <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                            <span className="text-slate-500 block text-[10px]">
                              Net Payout Due
                            </span>
                            <span className="font-bold text-emerald-700 text-sm">
                              Rs. {wd.netAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Destination Details & Controls */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                        <div className="lg:col-span-5 space-y-2">
                          <div className="font-semibold text-slate-900">
                            Method: {wd.methodName} {wd.bankName ? `(${wd.bankName})` : ''}
                          </div>
                          <div className="text-slate-700">
                            Account Title: <strong>{wd.accountTitle}</strong>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span>
                              Destination:{' '}
                              <strong>
                                {isUnmasked ? wd.accountNumber : wd.maskedAccountNumber}
                              </strong>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setUnmaskedWdIds((prev) => ({
                                  ...prev,
                                  [wd.id]: !prev[wd.id],
                                }))
                              }
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              {isUnmasked ? (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Mask</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Reveal Full Account</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Approval / Rejection History */}
                          <div className="pt-2">
                            <div className="text-[11px] font-semibold text-slate-500 mb-1">
                              Status History
                            </div>
                            <div className="space-y-1 border-l-2 border-slate-300 pl-2.5 text-[11px] text-slate-600">
                              {wd.history.map((h, i) => (
                                <div key={i}>
                                  <span className="font-mono font-semibold text-slate-800">
                                    {h.fromStatus} &rarr; {h.toStatus}
                                  </span>{' '}
                                  by {h.actorName}: {h.note}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Controls */}
                        <div className="lg:col-span-7 space-y-3 bg-white border border-slate-200 rounded-lg p-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Admin / Internal Note
                            </label>
                            <input
                              type="text"
                              value={wdNotesDraft[wd.id] ?? wd.adminNotes}
                              onChange={(e) =>
                                setWdNotesDraft((prev) => ({
                                  ...prev,
                                  [wd.id]: e.target.value,
                                }))
                              }
                              placeholder="Enter verification or payout note..."
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded"
                            />
                          </div>

                          {!isTerminal && (
                            <>
                              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                                <div className="font-semibold text-slate-900">
                                  Manual Payout Execution Confirmation (Required for COMPLETED)
                                </div>
                                <input
                                  type="text"
                                  value={wdPayoutRefDraft[wd.id] ?? wd.payoutReference ?? ''}
                                  onChange={(e) =>
                                    setWdPayoutRefDraft((prev) => ({
                                      ...prev,
                                      [wd.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Enter real bank/Easypaisa payout transfer ID (e.g. TX-994120)"
                                  className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                                />
                                <label className="flex items-start gap-2 text-xs text-slate-800 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(wdConfirmRealPayout[wd.id])}
                                    onChange={(e) =>
                                      setWdConfirmRealPayout((prev) => ({
                                        ...prev,
                                        [wd.id]: e.target.checked,
                                      }))
                                    }
                                    className="mt-0.5"
                                  />
                                  <span>
                                    I confirm that the actual payment of{' '}
                                    <strong className="font-mono">
                                      Rs. {wd.netAmount.toLocaleString()}
                                    </strong>{' '}
                                    has been sent to {wd.accountTitle} ({wd.accountNumber}).
                                  </span>
                                </label>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {wd.status === 'PENDING' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateWithdrawal(wd, 'PROCESSING')}
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded cursor-pointer"
                                  >
                                    Approve &amp; Mark PROCESSING
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateWithdrawal(wd, 'COMPLETED')}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded cursor-pointer"
                                >
                                  Mark COMPLETED (After Real Payout)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateWithdrawal(wd, 'REJECTED')}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded cursor-pointer"
                                >
                                  Reject &amp; Release Reserved Funds
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateWithdrawal(wd, wd.status)}
                                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                                >
                                  Save Note Only
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: EASYPAISA DEPOSITS (APPROVE / DISAPPROVE PAYMENTS) ==================== */}
        {activeTab === 'deposits' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Client Payment Verification — Approve or Disapprove ({settings.easypaisaNumber})
                </h2>
                <p className="text-xs text-slate-600">
                  When you click <strong>Approve Payment</strong>, the payment amount is immediately
                  credited to the client&apos;s <strong>Available Balance</strong> on their
                  dashboard and becomes eligible for withdrawal. Clicking{' '}
                  <strong>Disapprove Payment</strong> rejects or reverses the payment.
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
                {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setDepFilter(status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                      depFilter === status
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {status === 'Rejected' ? 'Disapproved' : status}
                  </button>
                ))}
              </div>
            </div>

            {filteredDeposits.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                No client payment submissions match filter ({depFilter}).
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mobile Cards View (Visible on Android & Mobile Screens) */}
                <div className="grid grid-cols-1 gap-3.5 lg:hidden">
                  {filteredDeposits.map((tx) => {
                    const clientWallet = wallets.find((w) => w.userId === tx.userId);
                    return (
                      <div
                        key={`m-${tx.id}`}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{tx.userName}</div>
                            <div className="font-mono text-xs text-slate-500">{tx.userIdentifier}</div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              tx.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tx.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {tx.status === 'Rejected' ? 'Disapproved' : tx.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Amount</div>
                            <div className="font-mono font-bold text-emerald-700 text-sm mt-0.5">{tx.amount}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Purpose / Plan</div>
                            <div className="font-medium text-slate-800 truncate mt-0.5">{tx.planName}</div>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-100">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Easypaisa TID</div>
                            <div className="font-mono font-bold text-slate-900 flex items-center justify-between">
                              <span>{tx.transactionId}</span>
                              <span className="text-[11px] font-normal text-slate-500">From: {tx.senderNumber}</span>
                            </div>
                            {tx.paymentProofNote && (
                              <div className="text-[11px] text-slate-600 mt-1 italic">&ldquo;{tx.paymentProofNote}&rdquo;</div>
                            )}
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>Wallet Balance: <strong className="font-mono text-emerald-700">Rs. {(clientWallet?.availableBalance || 0).toLocaleString()}</strong></span>
                          <span>{new Date(tx.submittedAt).toLocaleTimeString()}</span>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-200">
                          <input
                            type="text"
                            value={depNotesDraft[tx.id] ?? tx.adminNotes}
                            onChange={(e) =>
                              setDepNotesDraft((prev) => ({
                                ...prev,
                                [tx.id]: e.target.value,
                              }))
                            }
                            placeholder="Add verification note..."
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            {tx.status !== 'Approved' && (
                              <button
                                type="button"
                                onClick={() => handleReviewDeposit(tx.id, 'Approved')}
                                className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer text-center"
                              >
                                Approve (+Credit)
                              </button>
                            )}
                            {tx.status !== 'Rejected' && (
                              <button
                                type="button"
                                onClick={() => handleReviewDeposit(tx.id, 'Rejected')}
                                className="w-full py-2 px-3 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg cursor-pointer text-center"
                              >
                                Disapprove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View (Hidden on Mobile) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="py-2.5 pr-4 font-semibold">Client &amp; Wallet Balance</th>
                        <th className="py-2.5 px-4 font-semibold">Purpose / Plan</th>
                        <th className="py-2.5 px-4 font-semibold">Easypaisa TID &amp; Sender</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Payment Amount</th>
                        <th className="py-2.5 px-4 font-semibold">Status</th>
                        <th className="py-2.5 pl-4 font-semibold">Approve / Disapprove Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {filteredDeposits.map((tx) => {
                        const clientWallet = wallets.find((w) => w.userId === tx.userId);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 pr-4">
                              <div className="font-semibold text-slate-900">{tx.userName}</div>
                              <div className="font-mono text-[11px] text-slate-500">
                                {tx.userIdentifier}
                              </div>
                              <div className="mt-1 font-mono tabular-nums text-[11px] font-semibold text-emerald-700">
                                Dashboard Balance: Rs.{' '}
                                {(clientWallet?.availableBalance || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-800">{tx.planName}</td>
                            <td className="py-3.5 px-4 font-mono tabular-nums">
                              <div className="font-bold text-slate-900">TID: {tx.transactionId}</div>
                              <div className="text-[11px] text-slate-500">
                                From: {tx.senderNumber}
                              </div>
                              {tx.paymentProofNote && (
                                <div className="text-[11px] text-slate-600">
                                  Note: {tx.paymentProofNote}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                              {tx.amount}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`font-semibold ${
                                  tx.status === 'Approved'
                                    ? 'text-emerald-700'
                                    : tx.status === 'Rejected'
                                    ? 'text-red-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {tx.status === 'Rejected' ? 'Disapproved (Rejected)' : tx.status}
                              </span>
                            </td>
                            <td className="py-3.5 pl-4 min-w-[270px]">
                              <div className="flex flex-col gap-2">
                                <input
                                  type="text"
                                  value={depNotesDraft[tx.id] ?? tx.adminNotes}
                                  onChange={(e) =>
                                    setDepNotesDraft((prev) => ({
                                      ...prev,
                                      [tx.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Add verification note..."
                                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                  {tx.status !== 'Approved' && (
                                    <button
                                      type="button"
                                      onClick={() => handleReviewDeposit(tx.id, 'Approved')}
                                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded cursor-pointer"
                                    >
                                      Approve Payment (+Credit Dashboard)
                                    </button>
                                  )}
                                  {tx.status !== 'Rejected' && (
                                    <button
                                      type="button"
                                      onClick={() => handleReviewDeposit(tx.id, 'Rejected')}
                                      className="px-3 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded cursor-pointer"
                                    >
                                      Disapprove Payment
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: WALLETS, ADJUSTMENTS & IMMUTABLE LEDGER ==================== */}
        {activeTab === 'wallets' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Controlled Balance Adjustment Form */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div>
                  <div className="text-xs text-slate-500">Audited Accounting Action</div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Controlled Wallet Balance Adjustment
                  </h2>
                  <p className="mt-1 text-xs text-slate-600">
                    Historical ledger entries cannot be edited. Use this form to post a new
                    immutable <strong>ADJUSTMENT</strong> or <strong>REFUND</strong> entry.
                  </p>
                </div>

                <form onSubmit={handleBalanceAdjustment} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Customer Account
                    </label>
                    <select
                      value={adjUserId}
                      onChange={(e) => setAdjUserId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      {users.map((u) => {
                        const w = wallets.find((wal) => wal.userId === u.id);
                        return (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.identifier}) — Avail: Rs.{' '}
                            {(w?.availableBalance || 0).toLocaleString()}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Direction
                      </label>
                      <select
                        value={adjDirection}
                        onChange={(e) => setAdjDirection(e.target.value as 'CREDIT' | 'DEBIT')}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="CREDIT">CREDIT (+ Add Funds)</option>
                        <option value="DEBIT">DEBIT (- Deduct Funds)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Category
                      </label>
                      <select
                        value={adjCategory}
                        onChange={(e) =>
                          setAdjCategory(e.target.value as 'ADJUSTMENT' | 'REFUND')
                        }
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="ADJUSTMENT">ADJUSTMENT</option>
                        <option value="REFUND">REFUND</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Amount (PKR)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={adjAmount}
                      onChange={(e) => setAdjAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mandatory Audit Reason
                    </label>
                    <input
                      type="text"
                      value={adjReason}
                      onChange={(e) => setAdjReason(e.target.value)}
                      placeholder="e.g. Verified referral commission or plan payout credit"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Post Immutable Adjustment Entry
                  </button>
                </form>
              </div>

              {/* Customer Wallets Table */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Customer Wallet Balances</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="py-2 pr-3 font-semibold">User</th>
                        <th className="py-2 px-3 font-semibold text-right">Available</th>
                        <th className="py-2 px-3 font-semibold text-right">Pending / Reserved</th>
                        <th className="py-2 px-3 font-semibold text-right">Deposited</th>
                        <th className="py-2 pl-3 font-semibold text-right">Withdrawn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs font-mono tabular-nums">
                      {users.map((u) => {
                        const w = wallets.find((wal) => wal.userId === u.id);
                        return (
                          <tr key={u.id}>
                            <td className="py-2.5 pr-3 font-sans">
                              <div className="font-semibold text-slate-900">{u.name}</div>
                              <div className="font-mono text-[11px] text-slate-500">
                                {u.identifier}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                              Rs. {(w?.availableBalance || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-amber-700">
                              Rs. {(w?.pendingBalance || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-800">
                              Rs. {(w?.totalDeposited || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 pl-3 text-right text-slate-800">
                              Rs. {(w?.completedWithdrawalsAmount || 0).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Global Immutable Ledger Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                Global Immutable Wallet Ledger ({ledgerEntries.length} Entries)
              </h2>
              {ledgerEntries.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  No ledger entries posted yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="py-2.5 pr-3 font-semibold">Ledger ID / Timestamp</th>
                        <th className="py-2.5 px-3 font-semibold">User ID</th>
                        <th className="py-2.5 px-3 font-semibold">Type</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Before &rarr; After</th>
                        <th className="py-2.5 pl-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {ledgerEntries.slice(0, 50).map((entry) => (
                        <tr key={entry.id}>
                          <td className="py-2.5 pr-3 font-mono whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{entry.id}</div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(entry.createdAt).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{entry.userId}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                            {entry.type}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono tabular-nums font-bold ${
                              entry.direction === 'CREDIT' ? 'text-emerald-700' : 'text-slate-900'
                            }`}
                          >
                            {entry.direction === 'CREDIT' ? '+' : '-'}Rs.{' '}
                            {entry.amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                            Rs. {entry.balanceBefore.toLocaleString()} &rarr; Rs.{' '}
                            {entry.balanceAfter.toLocaleString()}
                          </td>
                          <td className="py-2.5 pl-3 text-slate-600">{entry.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: CONFIGURABLE WITHDRAWAL METHODS ==================== */}
        {activeTab === 'methods' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                Add Configurable Withdrawal Method
              </h2>
              <form onSubmit={handleCreateWithdrawalMethod} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Method Name
                    </label>
                    <input
                      type="text"
                      value={wmName}
                      onChange={(e) => setWmName(e.target.value)}
                      placeholder="e.g. SadaPay / Bank"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Method Code
                    </label>
                    <input
                      type="text"
                      value={wmCode}
                      onChange={(e) => setWmCode(e.target.value)}
                      placeholder="e.g. SADAPAY"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Min Withdrawal (PKR)
                    </label>
                    <input
                      type="number"
                      value={wmMin}
                      onChange={(e) => setWmMin(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Max Withdrawal (PKR)
                    </label>
                    <input
                      type="number"
                      value={wmMax}
                      onChange={(e) => setWmMax(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fee Percent (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={wmFeePercent}
                      onChange={(e) => setWmFeePercent(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fixed Fee (PKR)
                    </label>
                    <input
                      type="number"
                      value={wmFeeFixed}
                      onChange={(e) => setWmFeeFixed(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Field Label
                  </label>
                  <input
                    type="text"
                    value={wmLabel}
                    onChange={(e) => setWmLabel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={wmRequiresBank}
                    onChange={(e) => setWmRequiresBank(e.target.checked)}
                  />
                  <span>Requires Bank Name Input</span>
                </label>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Save Withdrawal Method
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                Configured Withdrawal Methods
              </h2>
              <div className="space-y-3">
                {withdrawalMethods.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {m.name} ({m.code}) —{' '}
                        <span className={m.active ? 'text-emerald-700' : 'text-red-700'}>
                          {m.active ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                      <div className="font-mono text-slate-600 mt-1">
                        Min: Rs. {m.minAmount.toLocaleString()} · Max: Rs.{' '}
                        {m.maxAmount.toLocaleString()} · Fee: {m.feePercent}% + Rs. {m.feeFixed}
                      </div>
                      <div className="text-slate-500 mt-0.5">{m.instructions}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleMethodActive(m)}
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer shrink-0"
                    >
                      {m.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: IMMUTABLE AUDIT LOG ==================== */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-slate-800" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Immutable Administrator Audit Log ({auditLogs.length})
                </h2>
                <p className="text-xs text-slate-600">
                  Records every sensitive administrative action with previous/new state and
                  metadata. Audit records cannot be edited or deleted.
                </p>
              </div>
            </div>

            {auditLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                No administrative actions logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="py-2.5 pr-3 font-semibold">Timestamp / ID</th>
                      <th className="py-2.5 px-3 font-semibold">Admin</th>
                      <th className="py-2.5 px-3 font-semibold">Action</th>
                      <th className="py-2.5 px-3 font-semibold">Target User</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                      <th className="py-2.5 pl-3 font-semibold">State Transition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-3 pr-3 font-mono whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{log.id}</div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900">{log.adminName}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="py-3 px-3 text-slate-700">{log.targetUserName}</td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                          {log.amount !== null ? `Rs. ${log.amount.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3 pl-3 font-mono text-[11px] text-slate-600 max-w-md">
                          <div>Prev: {log.previousState}</div>
                          <div className="text-slate-900">New: {log.newState}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 6: PLANS & PACKAGES MANAGER ==================== */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Add New Service Plan</h2>
              <form onSubmit={handleCreatePlan} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="e.g. Plan 13 — 500,000 Investment"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Investment
                    </label>
                    <input
                      type="text"
                      value={newPlanPrice}
                      onChange={(e) => setNewPlanPrice(e.target.value)}
                      placeholder="500,000 PKR"
                      className="w-full px-2.5 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Daily Profit
                    </label>
                    <input
                      type="text"
                      value={newPlanDaily}
                      onChange={(e) => setNewPlanDaily(e.target.value)}
                      placeholder="250,000 PKR"
                      className="w-full px-2.5 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Total Profit
                    </label>
                    <input
                      type="text"
                      value={newPlanTotal}
                      onChange={(e) => setNewPlanTotal(e.target.value)}
                      placeholder="7,500,000 PKR"
                      className="w-full px-2.5 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={newPlanDuration}
                    onChange={(e) => setNewPlanDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Included Features (One per line)
                  </label>
                  <textarea
                    rows={3}
                    value={newPlanFeaturesText}
                    onChange={(e) => setNewPlanFeaturesText(e.target.value)}
                    placeholder="Investment: Rs. 500,000&#10;Daily Profit: Rs. 250,000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Service Plan</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                Active Service Plans ({plans.length})
              </h2>
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="font-mono text-slate-600 mt-0.5">
                        Price: {p.price} · Daily: {p.dailyProfit || '—'} · Total:{' '}
                        {p.totalProfit || '—'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(p.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 7: USERS & LOGIN SURVEILLANCE ==================== */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Header & Access Notice */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Confidential Surveillance · Administrator Eyes Only</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Client Logins &amp; Total Investments Tracking
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                    Exclusively accessible by authorized administrators. Inspect exactly who has
                    logged into the website, their device IP address and login timestamps, and how
                    much money each client has invested on REX TRADERS.
                  </p>
                </div>

                {/* Sub-view switcher tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveUserSubView('investments')}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                      activeUserSubView === 'investments'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Client Directory ({users.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveUserSubView('logins')}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                      activeUserSubView === 'logins'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Login History ({loginLogs.length})</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100">
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>Total Client Investments</span>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="mt-1 font-mono tabular-nums text-lg sm:text-xl font-bold text-emerald-700">
                    Rs. {totalPlatformInvested.toLocaleString()} PKR
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {activeInvestorsCount} clients with active capital
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>Total Registered Clients</span>
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="mt-1 font-mono tabular-nums text-lg sm:text-xl font-bold text-slate-900">
                    {users.filter((u) => u.role !== 'admin').length} Clients
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {users.filter((u) => u.role === 'admin').length} platform admins
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>Total Logins Tracked</span>
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="mt-1 font-mono tabular-nums text-lg sm:text-xl font-bold text-blue-700">
                    {loginLogs.length} Sessions
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    With timestamps &amp; IP records
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>Latest Login Activity</span>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="mt-1 font-semibold text-slate-900 text-sm truncate">
                    {loginLogs[0]?.userName || 'No login yet'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {loginLogs[0]
                      ? new Date(loginLogs[0].timestamp).toLocaleString()
                      : 'Awaiting activity'}
                  </div>
                </div>
              </div>

              {/* Real-Time Login Surveillance Feed Card (Always Visible) */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Live Sign-In Surveillance Feed ({loginLogs.length} Events Logged)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Auto-refreshed: {lastSyncTime.toLocaleTimeString()}
                  </span>
                </div>

                {loginLogs.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
                    No sign-ins recorded yet. When a user logs in from any device, it appears here instantly.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {loginLogs.slice(0, 4).map((log, idx) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-lg border text-xs transition-all ${
                          idx === 0
                            ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-slate-900 truncate">{log.userName}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              log.role === 'admin'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {log.role === 'admin' ? 'Admin' : 'Client'}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-600 truncate">{log.userIdentifier}</div>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                          <span className="font-mono">{log.ipAddress}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ================= SUB-VIEW 1: CLIENT ACCOUNTS & INVESTMENTS DIRECTORY ================= */}
            {activeUserSubView === 'investments' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Client Accounts &amp; Investment Summary ({filteredUsers.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Inspect each client&apos;s invested capital (انویسٹمنٹ), current plan, wallet
                      balance, and recent login history.
                    </p>
                  </div>

                  {/* Filters & Search */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search client by name or email..."
                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      {(
                        [
                          { id: 'ALL', label: 'All Users' },
                          { id: 'INVESTED', label: 'Active Investors' },
                          { id: 'NON_INVESTED', label: 'Zero Investment' },
                          { id: 'SUSPENDED', label: 'Suspended' },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setUserFilter(f.id)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                            userFilter === f.id
                              ? 'bg-white text-slate-900 font-semibold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    No users match your search and filter criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs text-slate-500">
                          <th className="py-2.5 pr-4 font-semibold">Client / Account</th>
                          <th className="py-2.5 px-4 font-semibold">Total Invested (انویسٹمنٹ)</th>
                          <th className="py-2.5 px-4 font-semibold">Active Plan</th>
                          <th className="py-2.5 px-4 font-semibold">Wallet Balances</th>
                          <th className="py-2.5 px-4 font-semibold">Last Login &amp; IP</th>
                          <th className="py-2.5 px-4 font-semibold">Account Status</th>
                          <th className="py-2.5 pl-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {filteredUsers.map((u) => {
                          const userPlan = plans.find((p) => p.id === u.activePlanId);
                          const userWallet = wallets.find((w) => w.userId === u.id);
                          const isInvested = (u.totalInvested || 0) > 0;

                          return (
                            <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Client Account */}
                              <td className="py-3.5 pr-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                    {u.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                      <span>{u.name}</span>
                                      {u.role === 'admin' && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded">
                                          Admin
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-mono text-[11px] text-slate-500">
                                      {u.identifier}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                      Joined: {new Date(u.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Total Invested */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <div
                                    className={`font-mono text-sm font-bold tabular-nums ${
                                      isInvested ? 'text-emerald-700' : 'text-slate-500'
                                    }`}
                                  >
                                    Rs. {(u.totalInvested || 0).toLocaleString()} PKR
                                  </div>
                                  {isInvested ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Active Capital</span>
                                    </span>
                                  ) : (
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-100">
                                      No investment yet
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Active Plan */}
                              <td className="py-3.5 px-4">
                                {userPlan ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-block px-2 py-0.5 font-semibold text-[11px] bg-blue-50 text-blue-800 border border-blue-200 rounded">
                                      {userPlan.name}
                                    </span>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      Profit: {userPlan.dailyProfit || '—'} daily
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">None</span>
                                )}
                              </td>

                              {/* Wallet Balance */}
                              <td className="py-3.5 px-4 font-mono text-[11px]">
                                {userWallet ? (
                                  <div className="space-y-0.5">
                                    <div className="text-slate-900 font-semibold">
                                      Avail: Rs. {userWallet.availableBalance.toLocaleString()}
                                    </div>
                                    <div className="text-slate-500">
                                      Pending: Rs. {userWallet.pendingBalance.toLocaleString()}
                                    </div>
                                    <div className="text-slate-400 text-[10px]">
                                      Total In: Rs. {userWallet.totalDeposited.toLocaleString()}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>

                              {/* Last Login & IP */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-0.5">
                                  <div className="font-medium text-slate-900">
                                    {u.lastLoginAt ? (
                                      new Date(u.lastLoginAt).toLocaleString()
                                    ) : (
                                      <span className="text-slate-400 italic">Never logged in</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                                    <Globe className="w-3 h-3 text-slate-400" />
                                    <span>{u.lastLoginIp || '127.0.0.1'}</span>
                                    <span aria-hidden="true">·</span>
                                    <span>{u.loginCount || 1} logins</span>
                                  </div>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                    u.status === 'SUSPENDED'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {u.status || 'ACTIVE'}
                                </span>
                              </td>

                              {/* Action */}
                              <td className="py-3.5 pl-4 text-right">
                                {u.role !== 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserStatus(u)}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                                      u.status === 'SUSPENDED'
                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                  >
                                    {u.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ================= SUB-VIEW 2: LIVE WEBSITE LOGIN AUDIT LOG ================= */}
            {activeUserSubView === 'logins' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Live Website Login Audit Trail ({filteredLoginLogs.length} Events)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Timestamped session history recording every user and administrator sign-in,
                      IP address, device, and total capital invested at the moment of login.
                    </p>
                  </div>

                  {/* Filters & Search */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={loginLogSearchQuery}
                        onChange={(e) => setLoginLogSearchQuery(e.target.value)}
                        placeholder="Search by user, email, or IP..."
                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      {(
                        [
                          { id: 'ALL', label: 'All Logins' },
                          { id: 'user', label: 'Clients Only' },
                          { id: 'admin', label: 'Admins Only' },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setLoginLogRoleFilter(f.id)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                            loginLogRoleFilter === f.id
                              ? 'bg-white text-slate-900 font-semibold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredLoginLogs.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    No login events match your search query.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs text-slate-500">
                          <th className="py-2.5 pr-4 font-semibold">Timestamp</th>
                          <th className="py-2.5 px-4 font-semibold">User Account</th>
                          <th className="py-2.5 px-4 font-semibold">Invested (At Login)</th>
                          <th className="py-2.5 px-4 font-semibold">Active Plan</th>
                          <th className="py-2.5 px-4 font-semibold">IP Address</th>
                          <th className="py-2.5 pl-4 font-semibold">Device / Browser</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {filteredLoginLogs.map((log) => {
                          const isInvested = log.totalInvested > 0;
                          return (
                            <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Timestamp */}
                              <td className="py-3.5 pr-4 whitespace-nowrap">
                                <div className="font-semibold text-slate-900">
                                  {new Date(log.timestamp).toLocaleDateString()}
                                </div>
                                <div className="font-mono text-[11px] text-slate-500">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {log.id}
                                </div>
                              </td>

                              {/* User */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                                    {log.userName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                      <span>{log.userName}</span>
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                          log.role === 'admin'
                                            ? 'bg-amber-100 text-amber-900'
                                            : 'bg-blue-100 text-blue-900'
                                        }`}
                                      >
                                        {log.role === 'admin' ? 'Admin' : 'Client'}
                                      </span>
                                    </div>
                                    <div className="font-mono text-[11px] text-slate-500">
                                      {log.userIdentifier}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Invested */}
                              <td className="py-3.5 px-4 font-mono">
                                <div
                                  className={`text-sm font-bold tabular-nums ${
                                    isInvested ? 'text-emerald-700' : 'text-slate-500'
                                  }`}
                                >
                                  Rs. {log.totalInvested.toLocaleString()} PKR
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {isInvested ? 'Verified Capital' : '0 PKR Invested'}
                                </div>
                              </td>

                              {/* Active Plan */}
                              <td className="py-3.5 px-4">
                                {log.activePlanName ? (
                                  <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 rounded">
                                    {log.activePlanName}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs italic">
                                    No Active Plan
                                  </span>
                                )}
                              </td>

                              {/* IP Address */}
                              <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{log.ipAddress}</span>
                                </div>
                              </td>

                              {/* User Agent */}
                              <td className="py-3.5 pl-4 text-slate-600 text-[11px] max-w-xs truncate" title={log.userAgent}>
                                {log.userAgent}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 8: REFERRALS & AFFILIATE NETWORK ==================== */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            {/* Header & KPI Summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-600" />
                    <span>Affiliate &amp; Multi-Tier Referral Network</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Complete surveillance of Level 1 (13%) and Level 2 (2%) commissions distributed across client accounts
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fetchAdminOverview(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Total Commissions Distributed</div>
                  <div className="mt-1 font-mono text-2xl font-bold text-emerald-700">
                    Rs.{' '}
                    {referralLogs
                      .reduce((sum, l) => sum + l.commissionAmount, 0)
                      .toLocaleString()}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {referralLogs.length} total payout transactions
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Level 1 Direct Payouts (13%)</div>
                  <div className="mt-1 font-mono text-2xl font-bold text-amber-700">
                    Rs.{' '}
                    {referralLogs
                      .filter((l) => l.level === 1)
                      .reduce((sum, l) => sum + l.commissionAmount, 0)
                      .toLocaleString()}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {referralLogs.filter((l) => l.level === 1).length} direct activations
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Level 2 Team Payouts (2%)</div>
                  <div className="mt-1 font-mono text-2xl font-bold text-sky-700">
                    Rs.{' '}
                    {referralLogs
                      .filter((l) => l.level === 2)
                      .reduce((sum, l) => sum + l.commissionAmount, 0)
                      .toLocaleString()}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {referralLogs.filter((l) => l.level === 2).length} secondary activations
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Active Affiliates</div>
                  <div className="mt-1 font-mono text-2xl font-bold text-slate-900">
                    {
                      users.filter(
                        (u) =>
                          (u.referralCount && u.referralCount > 0) ||
                          (u.totalReferralEarnings && u.totalReferralEarnings > 0)
                      ).length
                    }{' '}
                    <span className="text-sm font-normal text-slate-500">users</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Clients with active referrals
                  </div>
                </div>
              </div>
            </div>

            {/* Top Affiliates Leaderboard */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Top Affiliates &amp; Promoters</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clients bringing the highest referral volume to the platform
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Referral Code</th>
                      <th className="py-3 px-4 text-center">Invited Team</th>
                      <th className="py-3 px-4 text-right">Commissions Earned</th>
                      <th className="py-3 px-4 text-right">Wallet Available</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[...users]
                      .sort(
                        (a, b) =>
                          (b.totalReferralEarnings || 0) - (a.totalReferralEarnings || 0) ||
                          (b.referralCount || 0) - (a.referralCount || 0)
                      )
                      .slice(0, 10)
                      .map((u) => {
                        const uWal = wallets.find((w) => w.userId === u.id);
                        return (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium text-slate-900">
                              <div>{u.name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {u.identifier}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  u.role === 'admin'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-amber-700">
                              {u.referralCode || `TZ-${u.id.slice(-6).toUpperCase()}`}
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              {u.referralCount || 0} members
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                              Rs. {(u.totalReferralEarnings || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              Rs. {(uWal?.availableBalance || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setAdjUserId(u.id);
                                  setActiveTab('wallets');
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer transition-colors"
                              >
                                Adjust Balance
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Complete Referral Logs Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Referral Commission Audit Log ({referralLogs.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Immutable history of auto-credited referral commissions
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setRefTierFilter('ALL')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                        refTierFilter === 'ALL'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefTierFilter(1)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                        refTierFilter === 1
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Level 1 (13%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefTierFilter(2)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                        refTierFilter === 2
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Level 2 (2%)
                    </button>
                  </div>

                  <input
                    type="text"
                    value={refLogSearch}
                    onChange={(e) => setRefLogSearch(e.target.value)}
                    placeholder="Search logs..."
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              {referralLogs.length === 0 ? (
                <div className="py-12 px-4 text-center text-xs text-slate-500">
                  No referral commission transactions recorded yet. They will appear automatically when approved deposits or plan purchases occur from referred customers.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Date &amp; Time</th>
                        <th className="py-3 px-4">Beneficiary Referrer</th>
                        <th className="py-3 px-4">From Member</th>
                        <th className="py-3 px-4">Tier</th>
                        <th className="py-3 px-4">Package</th>
                        <th className="py-3 px-4 text-right">Plan Amount</th>
                        <th className="py-3 px-4 text-right">Commission Credited</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {referralLogs
                        .filter((log) => {
                          if (refTierFilter !== 'ALL' && log.level !== refTierFilter) {
                            return false;
                          }
                          if (!refLogSearch.trim()) return true;
                          const q = refLogSearch.toLowerCase();
                          return (
                            log.referredUserName.toLowerCase().includes(q) ||
                            log.planName.toLowerCase().includes(q) ||
                            log.referrerId.toLowerCase().includes(q)
                          );
                        })
                        .map((log) => {
                          const referrerUser = users.find((u) => u.id === log.referrerId);
                          return (
                            <tr key={log.id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-900">
                                <div>{referrerUser ? referrerUser.name : log.referrerId}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {referrerUser?.identifier || log.referrerId}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-800">
                                <div>{log.referredUserName}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  ID: {log.referredUserId}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {log.level === 1 ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    L1 · 13%
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                                    L2 · 2%
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-800">
                                {log.planName}
                              </td>
                              <td className="py-3 px-4 text-right font-mono">
                                Rs. {log.sourceAmount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                                +Rs. {log.commissionAmount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Credited
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 8: SUPPORT INQUIRIES ==================== */}
        {activeTab === 'inquiries' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Client Support Inquiries</h2>
            {inquiries.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                No support inquiries submitted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-900">{inq.name}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono">{inq.contactInfo}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{new Date(inq.createdAt).toLocaleString()}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{inq.subject}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{inq.message}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(['Open', 'In Progress', 'Resolved'] as InquiryStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleUpdateInquiry(inq.id, st, inq.adminReply)}
                          className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${
                            inq.status === st
                              ? 'bg-slate-900 text-white font-semibold'
                              : 'bg-white border border-slate-300 text-slate-700'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 9: LOGO & WEBSITE SETTINGS ==================== */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Official {settings.brandName} Logo &amp; Hero Configuration
                </h2>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Upload Official Logo Image
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Logo File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setLogoUrlInput('/rex-traders-logo.svg')}
                      className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      Use Default Official Logo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Logo URL
                  </label>
                  <input
                    type="text"
                    value={logoUrlInput}
                    onChange={(e) => setLogoUrlInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Hero Headline
                  </label>
                  <input
                    type="text"
                    value={heroHeadlineInput}
                    onChange={(e) => setHeroHeadlineInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Hero Subheadline
                  </label>
                  <textarea
                    rows={3}
                    value={heroSubheadlineInput}
                    onChange={(e) => setHeroSubheadlineInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Save Website Settings
                </button>
              </form>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Exclusive Owner Access &amp; Password
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Administrator Console access is strictly locked to{' '}
                  <strong className="font-mono text-slate-900">sulemanadan816@gmail.com</strong> and{' '}
                  <strong className="font-mono text-slate-900">abubakararain104@gmail.com</strong>.
                  No other account can access or be promoted to administrator.
                </p>
              </div>

              <form onSubmit={handleUpdateOwnerPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Owner Password
                  </label>
                  <input
                    type="password"
                    value={currentOwnerPassword}
                    onChange={(e) => setCurrentOwnerPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Owner Password (min 8 characters)
                  </label>
                  <input
                    type="password"
                    value={newOwnerPassword}
                    onChange={(e) => setNewOwnerPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Update Owner Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
