import { DEFAULT_PLANS, SITE_CONFIG } from '../config/siteConfig';
import { parseNumericPkr } from '../server/ledgerUtilsClient';
import type {
  AuditLogEntry,
  DepositStatus,
  InquiryStatus,
  LedgerEntry,
  LoginLogEntry,
  PaymentTransaction,
  ReferralCommissionLog,
  SavedPayoutAccount,
  ServiceOrder,
  ServicePlan,
  SiteSettings,
  SupportInquiry,
  UnifiedTransaction,
  UserAccount,
  UserNotification,
  WalletAccount,
  WithdrawalMethodConfig,
  WithdrawalRequest,
  WithdrawalStatus,
} from '../types';
import type { ApiResponse } from './api';

interface LocalUserRecord extends UserAccount {
  passwordPlain: string;
  savedPayoutAccounts: SavedPayoutAccount[];
}

interface LocalDatabaseSchema {
  settings: SiteSettings;
  users: LocalUserRecord[];
  wallets: WalletAccount[];
  ledgerEntries: LedgerEntry[];
  unifiedTransactions: UnifiedTransaction[];
  transactions: PaymentTransaction[];
  orders: ServiceOrder[];
  withdrawalMethods: WithdrawalMethodConfig[];
  withdrawals: WithdrawalRequest[];
  notifications: UserNotification[];
  auditLogs: AuditLogEntry[];
  loginLogs: LoginLogEntry[];
  inquiries: SupportInquiry[];
  plans: ServicePlan[];
  referralLogs: ReferralCommissionLog[];
  sessions: Record<string, string>; // token -> userId
}

const DB_STORAGE_KEY = 'rex_traders_authoritative_ledger_v2';
export const OWNER_ADMIN_EMAIL = 'sulemanadan816@gmail.com';
export const SECONDARY_ADMIN_EMAIL = 'abubakararain104@gmail.com';
export const TERTIARY_ADMIN_EMAIL = 'adangujjar3321@gmail.com';
export const AUTHORIZED_ADMIN_EMAILS = [
  OWNER_ADMIN_EMAIL,
  SECONDARY_ADMIN_EMAIL,
  TERTIARY_ADMIN_EMAIL,
];

export function isAuthorizedAdminEmail(identifier: string): boolean {
  return AUTHORIZED_ADMIN_EMAILS.includes(identifier.trim().toLowerCase());
}

const DEFAULT_WITHDRAWAL_METHODS: WithdrawalMethodConfig[] = [
  {
    id: 'wm-easypaisa',
    name: 'Easypaisa',
    code: 'EASYPAISA',
    minAmount: 500,
    maxAmount: 500000,
    feePercent: 0,
    feeFixed: 0,
    accountLabel: 'Easypaisa Mobile Account Number (11 Digits)',
    requiresBankName: false,
    instructions: 'Enter your registered 11-digit Easypaisa mobile number and matching account title.',
    active: true,
  },
  {
    id: 'wm-jazzcash',
    name: 'JazzCash',
    code: 'JAZZCASH',
    minAmount: 500,
    maxAmount: 500000,
    feePercent: 0,
    feeFixed: 0,
    accountLabel: 'JazzCash Mobile Account Number (11 Digits)',
    requiresBankName: false,
    instructions: 'Enter your registered 11-digit JazzCash mobile number and matching account title.',
    active: true,
  },
  {
    id: 'wm-bank',
    name: 'Bank Transfer (IBAN / Account)',
    code: 'BANK_TRANSFER',
    minAmount: 1000,
    maxAmount: 2000000,
    feePercent: 0,
    feeFixed: 0,
    accountLabel: '24-Character PK IBAN or Bank Account Number',
    requiresBankName: true,
    instructions: 'Provide your full bank name, account title, and IBAN / account number.',
    active: true,
  },
];

function maskAccountNumber(accountNumber: string): string {
  const clean = accountNumber.trim();
  if (clean.length <= 4) return clean;
  const visibleEnd = clean.slice(-4);
  const visibleStart = clean.slice(0, 2);
  return `${visibleStart}${'*'.repeat(Math.max(3, clean.length - 6))}${visibleEnd}`;
}

function createInitialLocalDb(): LocalDatabaseSchema {
  const now = new Date().toISOString();
  return {
    settings: { ...SITE_CONFIG },
    users: [
      {
        id: 'usr-admin-owner',
        name: 'Suleman Adan (REX TRADERS Admin)',
        identifier: OWNER_ADMIN_EMAIL,
        passwordPlain: 'Suleman@Rex2026!',
        role: 'admin',
        status: 'ACTIVE',
        activePlanId: null,
        savedPayoutAccounts: [],
        createdAt: now,
      },
      {
        id: 'usr-admin-abubakar',
        name: 'Abubakar Arain (REX TRADERS Admin)',
        identifier: SECONDARY_ADMIN_EMAIL,
        passwordPlain: 'Arain@786',
        role: 'admin',
        status: 'ACTIVE',
        activePlanId: null,
        savedPayoutAccounts: [],
        createdAt: now,
      },
      {
        id: 'usr-client-1',
        name: 'Client Account',
        identifier: 'client@rextraders.com',
        passwordPlain: 'RexClient2026!',
        role: 'user',
        status: 'ACTIVE',
        activePlanId: null,
        savedPayoutAccounts: [
          {
            id: 'spa-demo-1',
            methodId: 'wm-easypaisa',
            methodName: 'Easypaisa',
            accountTitle: 'Client Account',
            accountNumber: '03001234567',
            createdAt: now,
          },
        ],
        createdAt: now,
        lastLoginAt: now,
        lastLoginIp: '182.180.142.10',
        loginCount: 3,
        totalInvested: 0,
      },
    ],
    wallets: [
      {
        id: 'wal-usr-admin-owner',
        userId: 'usr-admin-owner',
        availableBalance: 0,
        pendingBalance: 0,
        reservedWithdrawalBalance: 0,
        totalBalance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        pendingWithdrawalsAmount: 0,
        completedWithdrawalsAmount: 0,
        currency: 'PKR',
        updatedAt: now,
      },
      {
        id: 'wal-usr-admin-abubakar',
        userId: 'usr-admin-abubakar',
        availableBalance: 0,
        pendingBalance: 0,
        reservedWithdrawalBalance: 0,
        totalBalance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        pendingWithdrawalsAmount: 0,
        completedWithdrawalsAmount: 0,
        currency: 'PKR',
        updatedAt: now,
      },
      {
        id: 'wal-usr-client-1',
        userId: 'usr-client-1',
        availableBalance: 0,
        pendingBalance: 0,
        reservedWithdrawalBalance: 0,
        totalBalance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        pendingWithdrawalsAmount: 0,
        completedWithdrawalsAmount: 0,
        currency: 'PKR',
        updatedAt: now,
      },
    ],
    ledgerEntries: [],
    unifiedTransactions: [],
    transactions: [],
    orders: [],
    withdrawalMethods: JSON.parse(JSON.stringify(DEFAULT_WITHDRAWAL_METHODS)),
    withdrawals: [],
    notifications: [
      {
        id: 'notif-welcome-client',
        userId: 'usr-client-1',
        title: 'Welcome to REX TRADERS Client Portal',
        message:
          'All wallet balances and transactions in this portal are backed by the transaction ledger. Submit an Easypaisa deposit or select a plan to begin.',
        type: 'INFO',
        read: false,
        createdAt: now,
      },
    ],
    auditLogs: [],
    loginLogs: [
      {
        id: 'LOG-INIT-1',
        userId: 'usr-client-1',
        userName: 'Client Account',
        userIdentifier: 'client@rextraders.com',
        role: 'user',
        timestamp: now,
        ipAddress: '182.180.142.10',
        userAgent: 'Chrome 122.0.0 (Windows NT 10.0)',
        totalInvested: 0,
        activePlanName: null,
      },
    ],
    inquiries: [],
    plans: JSON.parse(JSON.stringify(DEFAULT_PLANS)),
    referralLogs: [],
    sessions: {},
  };
}

function loadDb(): LocalDatabaseSchema {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) {
      const init = createInitialLocalDb();
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw) as LocalDatabaseSchema;
    if (!Array.isArray(parsed.users) || parsed.users.length === 0) {
      const init = createInitialLocalDb();
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    const init = createInitialLocalDb();
    parsed.users = parsed.users
      .filter((u) => u.identifier.toLowerCase() !== 'admin@rextraders.com')
      .map((u) => ({
        ...u,
        role: isAuthorizedAdminEmail(u.identifier) ? 'admin' : 'user',
      }));
    for (const seededAdmin of init.users.filter((u) => u.role === 'admin')) {
      if (
        !parsed.users.some(
          (u) => u.identifier.toLowerCase() === seededAdmin.identifier.toLowerCase()
        )
      ) {
        parsed.users.unshift(seededAdmin);
      }
    }
    parsed.loginLogs =
      Array.isArray(parsed.loginLogs) && parsed.loginLogs.length > 0
        ? parsed.loginLogs
        : init.loginLogs;
    if (
      !Array.isArray(parsed.plans) ||
      parsed.plans.length === 0 ||
      parsed.plans.some((p) => p.id === 'plan-1200' || p.id === 'plan-standard')
    ) {
      parsed.plans = JSON.parse(JSON.stringify(DEFAULT_PLANS));
    }
    parsed.referralLogs = Array.isArray(parsed.referralLogs) ? parsed.referralLogs : [];
    return parsed;
  } catch {
    return createInitialLocalDb();
  }
}

function saveDb(db: LocalDatabaseSchema): void {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  } catch {
    // ignore storage quota errors
  }
}

function formatSafeUser(u: LocalUserRecord): UserAccount {
  return {
    id: u.id,
    name: u.name,
    identifier: u.identifier,
    role: u.role,
    status: u.status || 'ACTIVE',
    activePlanId: u.activePlanId || null,
    savedPayoutAccounts: u.savedPayoutAccounts || [],
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt || null,
    lastLoginIp: u.lastLoginIp || null,
    loginCount: typeof u.loginCount === 'number' ? u.loginCount : 0,
    totalInvested: typeof u.totalInvested === 'number' ? u.totalInvested : 0,
  };
}

function calculateLocalUserInvested(db: LocalDatabaseSchema, userId: string): number {
  const wallet = recalculateWallet(db, userId);
  const approvedDeposits = db.transactions
    .filter((t) => t.userId === userId && t.status === 'Approved')
    .reduce((sum, t) => sum + (t.numericAmount || parseNumericPkr(t.amount)), 0);
  const activeOrders = db.orders
    .filter((o) => o.userId === userId && (o.status === 'ACTIVE' || o.status === 'COMPLETED'))
    .reduce((sum, o) => sum + o.amount, 0);
  return Math.max(wallet.totalDeposited, approvedDeposits, activeOrders);
}

function recalculateWallet(db: LocalDatabaseSchema, userId: string): WalletAccount {
  let wallet = db.wallets.find((w) => w.userId === userId);
  if (!wallet) {
    wallet = {
      id: `wal-${userId}`,
      userId,
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
    };
    db.wallets.push(wallet);
  }

  const pendingDepositsTotal = db.transactions
    .filter((t) => t.userId === userId && t.status === 'Pending')
    .reduce((sum, t) => sum + (t.numericAmount || parseNumericPkr(t.amount)), 0);

  const approvedDepositsTotal = db.transactions
    .filter((t) => t.userId === userId && t.status === 'Approved')
    .reduce((sum, t) => sum + (t.numericAmount || parseNumericPkr(t.amount)), 0);

  const pendingWithdrawalsTotal = db.withdrawals
    .filter((w) => w.userId === userId && (w.status === 'PENDING' || w.status === 'PROCESSING'))
    .reduce((sum, w) => sum + w.amount, 0);

  const completedWithdrawalsTotal = db.withdrawals
    .filter((w) => w.userId === userId && w.status === 'COMPLETED')
    .reduce((sum, w) => sum + w.amount, 0);

  wallet.reservedWithdrawalBalance = pendingWithdrawalsTotal;
  wallet.pendingWithdrawalsAmount = pendingWithdrawalsTotal;
  wallet.completedWithdrawalsAmount = completedWithdrawalsTotal;
  wallet.pendingBalance = pendingDepositsTotal + pendingWithdrawalsTotal;
  wallet.totalDeposited = approvedDepositsTotal;
  wallet.totalWithdrawn = completedWithdrawalsTotal;
  wallet.totalBalance = wallet.availableBalance + wallet.reservedWithdrawalBalance;
  wallet.updatedAt = new Date().toISOString();

  return wallet;
}

function resolveUserFromHeaders(db: LocalDatabaseSchema, options: RequestInit): LocalUserRecord | null {
  const headers = new Headers(options.headers || {});
  const auth = headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  // Support both server-signed base64url JWTs and local session tokens
  if (db.sessions[token]) {
    return db.users.find((u) => u.id === db.sessions[token]) || null;
  }
  try {
    const [dataPart] = token.split('.');
    if (dataPart) {
      const jsonStr = atob(dataPart.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(jsonStr);
      if (payload && payload.userId) {
        return db.users.find((u) => u.id === payload.userId) || null;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export async function handleLocalLedgerFallback<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const db = loadDb();
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body && typeof options.body === 'string' ? JSON.parse(options.body) : {};
  const now = new Date().toISOString();

  const ok = (data: any, status = 200): ApiResponse<T> => {
    saveDb(db);
    return { ok: true, status, data: data as T };
  };
  const fail = (error: string, status = 400): ApiResponse<T> => ({
    ok: false,
    status,
    data: { error } as unknown as T,
    error,
  });

  // 1. Public bootstrap
  if (endpoint === '/api/public/bootstrap' && method === 'GET') {
    return ok({
      settings: db.settings,
      plans: db.plans.filter((p) => p.active),
      withdrawalMethods: db.withdrawalMethods.filter((m) => m.active),
    });
  }

  // 2. Auth Login
  if (endpoint === '/api/auth/login' && method === 'POST') {
    const identifier = String(body.identifier || '').trim().toLowerCase();
    const password = String(body.password || '');
    const user = db.users.find((u) => u.identifier.toLowerCase() === identifier);
    if (!user || user.passwordPlain !== password) {
      return fail('Invalid email/phone or password.', 401);
    }
    const tokenPayload = btoa(
      JSON.stringify({ userId: user.id, role: user.role, exp: Date.now() + 7 * 86400_000 })
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const token = `${tokenPayload}.local`;
    db.sessions[token] = user.id;

    const invested = calculateLocalUserInvested(db, user.id);
    user.lastLoginAt = now;
    user.lastLoginIp = '127.0.0.1';
    user.loginCount = (user.loginCount || 0) + 1;
    user.totalInvested = invested;

    const activePlan = db.plans.find((p) => p.id === user.activePlanId);
    if (!Array.isArray(db.loginLogs)) db.loginLogs = [];
    db.loginLogs.unshift({
      id: `LOG-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userIdentifier: user.identifier,
      role: user.role,
      timestamp: now,
      ipAddress: '127.0.0.1',
      userAgent: 'Web Browser',
      totalInvested: invested,
      activePlanName: activePlan ? activePlan.name : null,
    });
    if (db.loginLogs.length > 200) db.loginLogs.length = 200;
    saveDb(db);

    recalculateWallet(db, user.id);
    return ok({ token, user: formatSafeUser(user) });
  }

  // 3. Auth Register
  if (endpoint === '/api/auth/register' && method === 'POST') {
    const name = String(body.name || '').trim();
    const identifier = String(body.identifier || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (name.length < 2) return fail('Full name must be at least 2 characters.');
    if (identifier.length < 4) return fail('Valid email or mobile number is required.');
    if (password.length < 6) return fail('Password must be at least 6 characters.');

    if (isAuthorizedAdminEmail(identifier)) {
      return fail('This email address is reserved for a platform administrator.', 403);
    }
    if (db.users.some((u) => u.identifier.toLowerCase() === identifier)) {
      return fail('An account with this email or phone number already exists.', 409);
    }

    const newUser: LocalUserRecord = {
      id: `usr-${Date.now()}`,
      name,
      identifier,
      passwordPlain: password,
      role: 'user',
      status: 'ACTIVE',
      activePlanId: null,
      savedPayoutAccounts: [],
      createdAt: now,
      lastLoginAt: now,
      lastLoginIp: '127.0.0.1',
      loginCount: 1,
      totalInvested: 0,
    };
    db.users.push(newUser);
    recalculateWallet(db, newUser.id);
    db.notifications.push({
      id: `NOTIF-${Date.now()}`,
      userId: newUser.id,
      title: 'Account Created Successfully',
      message:
        'Welcome to REX TRADERS. Your wallet has been initialized with 0 PKR balance. Submit an Easypaisa deposit or select a plan to begin.',
      type: 'INFO',
      read: false,
      createdAt: now,
    });

    if (!Array.isArray(db.loginLogs)) db.loginLogs = [];
    db.loginLogs.unshift({
      id: `LOG-${Date.now()}`,
      userId: newUser.id,
      userName: newUser.name,
      userIdentifier: newUser.identifier,
      role: newUser.role,
      timestamp: now,
      ipAddress: '127.0.0.1',
      userAgent: 'Web Registration',
      totalInvested: 0,
      activePlanName: null,
    });
    if (db.loginLogs.length > 200) db.loginLogs.length = 200;
    saveDb(db);

    const tokenPayload = btoa(
      JSON.stringify({ userId: newUser.id, role: newUser.role, exp: Date.now() + 7 * 86400_000 })
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const token = `${tokenPayload}.local`;
    db.sessions[token] = newUser.id;
    return ok({ token, user: formatSafeUser(newUser) }, 201);
  }

  // 4. Inquiries
  if (endpoint === '/api/inquiries' && method === 'POST') {
    const item: SupportInquiry = {
      id: `inq-${Date.now()}`,
      name: String(body.name || '').trim(),
      contactInfo: String(body.contactInfo || '').trim(),
      subject: String(body.subject || '').trim(),
      message: String(body.message || '').trim(),
      status: 'Open',
      adminReply: '',
      createdAt: now,
    };
    db.inquiries.push(item);
    return ok(
      {
        inquiry: item,
        message:
          'Your support request has been logged. For immediate assistance, you can also message us directly on Telegram (@rextrades0).',
      },
      201
    );
  }

  // Authenticated endpoints below
  const user = resolveUserFromHeaders(db, options);
  if (!user) {
    return fail('Authentication required. Please sign in.', 401);
  }

  if (endpoint === '/api/auth/me' && method === 'GET') {
    return ok({ user: formatSafeUser(user) });
  }

  if (endpoint === '/api/dashboard/summary' && method === 'GET') {
    const wallet = recalculateWallet(db, user.id);
    return ok({
      user: formatSafeUser(user),
      wallet,
      deposits: db.transactions.filter((t) => t.userId === user.id).reverse(),
      withdrawals: db.withdrawals.filter((w) => w.userId === user.id).reverse(),
      unifiedTransactions: db.unifiedTransactions.filter((t) => t.userId === user.id).reverse(),
      ledgerEntries: db.ledgerEntries.filter((l) => l.userId === user.id).reverse(),
      orders: db.orders.filter((o) => o.userId === user.id).reverse(),
      notifications: db.notifications.filter((n) => n.userId === user.id).reverse(),
      withdrawalMethods: db.withdrawalMethods.filter((m) => m.active),
    });
  }

  // Submit Deposit
  if (endpoint === '/api/transactions' && method === 'POST') {
    if (user.status !== 'ACTIVE') return fail('Account is currently suspended.');
    const cleanTid = String(body.transactionId || '').trim();
    if (cleanTid.length < 5) return fail('Easypaisa Transaction ID (TID) must be at least 5 characters.');
    if (db.transactions.some((t) => t.transactionId.toLowerCase() === cleanTid.toLowerCase())) {
      return fail('This Easypaisa Transaction ID has already been submitted.', 409);
    }

    const isWalletTopup = Boolean(body.creditToWalletOnly) || body.planId === 'wallet-deposit';
    const plan = isWalletTopup ? null : db.plans.find((p) => p.id === body.planId);
    if (!isWalletTopup && !plan) return fail('Selected service plan was not found.');

    const numericAmount = parseNumericPkr(body.amount);
    if (numericAmount <= 0) return fail('Deposit amount must be greater than zero.');

    const depositId = `DEP-${Date.now()}`;
    const unifiedTxId = `TXN-${Date.now()}`;

    const newDeposit: PaymentTransaction = {
      id: depositId,
      userId: user.id,
      userName: user.name,
      userIdentifier: user.identifier,
      planId: isWalletTopup ? 'wallet-deposit' : plan!.id,
      planName: isWalletTopup ? 'Wallet Deposit (Available Balance)' : plan!.name,
      transactionId: cleanTid,
      amount: `${numericAmount.toLocaleString()} PKR`,
      numericAmount,
      paymentMethod: `Easypaisa (${db.settings.easypaisaNumber})`,
      senderNumber: String(body.senderNumber || '').trim(),
      paymentProofNote: String(body.paymentProofNote || '').trim(),
      creditToWalletOnly: isWalletTopup,
      submittedAt: now,
      status: 'Pending',
      adminNotes: 'Awaiting manual administrator verification of Easypaisa transfer.',
      reviewedAt: null,
      reviewedBy: null,
    };

    db.transactions.push(newDeposit);
    db.unifiedTransactions.push({
      id: unifiedTxId,
      userId: user.id,
      type: 'DEPOSIT',
      amount: numericAmount,
      fee: 0,
      netAmount: numericAmount,
      status: 'PENDING',
      referenceId: depositId,
      description: isWalletTopup
        ? `Easypaisa wallet deposit (TID: ${cleanTid}) — Pending admin verification`
        : `Easypaisa payment for ${plan!.name} (TID: ${cleanTid}) — Pending admin verification`,
      createdAt: now,
      updatedAt: now,
    });

    if (!isWalletTopup && plan) {
      db.orders.push({
        id: `ORD-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        planId: plan.id,
        planName: plan.name,
        amount: numericAmount,
        duration: plan.duration,
        dailyProfit: plan.dailyProfit || '—',
        totalProfit: plan.totalProfit || '—',
        paymentSource: 'EASYPAISA_DEPOSIT',
        status: 'PENDING',
        referenceDepositId: depositId,
        createdAt: now,
        activatedAt: null,
      });
    }

    recalculateWallet(db, user.id);
    return ok(
      {
        transaction: newDeposit,
        message:
          'Payment reference recorded with status: PENDING. An administrator will verify your Easypaisa Transaction ID before crediting your account.',
      },
      201
    );
  }

  // Purchase Plan with Wallet
  if (endpoint === '/api/orders/purchase-wallet' && method === 'POST') {
    const plan = db.plans.find((p) => p.id === body.planId && p.active);
    if (!plan) return fail('Selected service plan is not available.');
    const price = parseNumericPkr(plan.price);
    const wallet = recalculateWallet(db, user.id);
    if (wallet.availableBalance < price) {
      return fail(
        `Insufficient available wallet balance. Required: Rs. ${price.toLocaleString()}, Available: Rs. ${wallet.availableBalance.toLocaleString()}.`
      );
    }

    const balanceBefore = wallet.availableBalance;
    const balanceAfter = balanceBefore - price;
    wallet.availableBalance = balanceAfter;
    user.activePlanId = plan.id;

    const orderId = `ORD-${Date.now()}`;
    const unifiedTxId = `TXN-${Date.now()}`;
    const order: ServiceOrder = {
      id: orderId,
      userId: user.id,
      userName: user.name,
      planId: plan.id,
      planName: plan.name,
      amount: price,
      duration: plan.duration,
      dailyProfit: plan.dailyProfit || '—',
      totalProfit: plan.totalProfit || '—',
      paymentSource: 'WALLET',
      status: 'ACTIVE',
      referenceDepositId: null,
      createdAt: now,
      activatedAt: now,
    };
    db.orders.push(order);
    db.unifiedTransactions.push({
      id: unifiedTxId,
      userId: user.id,
      type: 'SERVICE_PURCHASE',
      amount: price,
      fee: 0,
      netAmount: price,
      status: 'COMPLETED',
      referenceId: orderId,
      description: `Purchased ${plan.name} using Available Wallet Balance`,
      createdAt: now,
      updatedAt: now,
    });
    db.ledgerEntries.push({
      id: `LEDG-${Date.now()}`,
      userId: user.id,
      transactionId: unifiedTxId,
      type: 'SERVICE_PURCHASE',
      direction: 'DEBIT',
      amount: price,
      balanceBefore,
      balanceAfter,
      pendingBefore: wallet.pendingBalance,
      pendingAfter: wallet.pendingBalance,
      status: 'POSTED',
      description: `Service purchase: ${plan.name} (Order ${orderId})`,
      createdAt: now,
    });
    recalculateWallet(db, user.id);
    return ok(
      {
        order,
        message: `Successfully purchased and activated ${order.planName} using your Available Balance.`,
      },
      201
    );
  }

  // Create Withdrawal
  if (endpoint === '/api/withdrawals' && method === 'POST') {
    if (user.status !== 'ACTIVE') return fail('Your account is not active and cannot submit withdrawals.');
    const grossAmount = Math.round(Number(body.amount) || 0);
    if (grossAmount <= 0) return fail('Withdrawal amount must be greater than zero.');

    const methodCfg = db.withdrawalMethods.find((m) => m.id === body.methodId && m.active);
    if (!methodCfg) return fail('Selected withdrawal method is not supported.');
    if (grossAmount < methodCfg.minAmount) {
      return fail(`Minimum withdrawal amount for ${methodCfg.name} is Rs. ${methodCfg.minAmount.toLocaleString()}.`);
    }

    const wallet = recalculateWallet(db, user.id);
    if (grossAmount > wallet.availableBalance) {
      return fail(
        `Insufficient available balance. Requested: Rs. ${grossAmount.toLocaleString()}, Available: Rs. ${wallet.availableBalance.toLocaleString()}.`
      );
    }

    const fee = Math.round((grossAmount * methodCfg.feePercent) / 100) + methodCfg.feeFixed;
    const netAmount = grossAmount - fee;
    const balanceBefore = wallet.availableBalance;
    const pendingBefore = wallet.pendingBalance;
    const balanceAfter = balanceBefore - grossAmount;
    const pendingAfter = pendingBefore + grossAmount;

    wallet.availableBalance = balanceAfter;
    wallet.reservedWithdrawalBalance += grossAmount;
    wallet.pendingBalance = pendingAfter;

    const withdrawalId = `WD-${Date.now()}`;
    const unifiedTxId = `TXN-${Date.now()}`;
    const cleanTitle = String(body.accountTitle || '').trim();
    const cleanNumber = String(body.accountNumber || '').trim();
    const cleanBank = body.bankName ? String(body.bankName).trim() : undefined;

    const withdrawal: WithdrawalRequest = {
      id: withdrawalId,
      userId: user.id,
      userName: user.name,
      userIdentifier: user.identifier,
      amount: grossAmount,
      fee,
      netAmount,
      methodId: methodCfg.id,
      methodName: methodCfg.name,
      accountTitle: cleanTitle,
      accountNumber: cleanNumber,
      maskedAccountNumber: maskAccountNumber(cleanNumber),
      bankName: cleanBank,
      status: 'PENDING',
      adminNotes: 'Withdrawal submitted. Amount reserved from available balance pending admin review.',
      payoutReference: '',
      adminConfirmedRealPayout: false,
      history: [
        {
          fromStatus: 'CREATED',
          toStatus: 'PENDING',
          actorId: user.id,
          actorName: user.name,
          actorRole: 'user',
          note: `Requested withdrawal of Rs. ${grossAmount.toLocaleString()} via ${methodCfg.name}`,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    db.withdrawals.push(withdrawal);
    db.unifiedTransactions.push({
      id: unifiedTxId,
      userId: user.id,
      type: 'WITHDRAWAL',
      amount: grossAmount,
      fee,
      netAmount,
      status: 'PENDING',
      referenceId: withdrawalId,
      description: `Withdrawal request (${withdrawalId}) via ${methodCfg.name} to ${maskAccountNumber(cleanNumber)}`,
      createdAt: now,
      updatedAt: now,
    });
    db.ledgerEntries.push({
      id: `LEDG-${Date.now()}`,
      userId: user.id,
      transactionId: unifiedTxId,
      type: 'WITHDRAWAL_RESERVED',
      direction: 'DEBIT',
      amount: grossAmount,
      balanceBefore,
      balanceAfter,
      pendingBefore,
      pendingAfter,
      status: 'POSTED',
      description: `Reserved Rs. ${grossAmount.toLocaleString()} for withdrawal request ${withdrawalId}`,
      createdAt: now,
    });
    recalculateWallet(db, user.id);
    return ok({ withdrawal }, 201);
  }

  // Cancel Withdrawal
  const cancelMatch = endpoint.match(/^\/api\/withdrawals\/([^/]+)\/cancel$/);
  if (cancelMatch && method === 'POST') {
    const wd = db.withdrawals.find((w) => w.id === cancelMatch[1] && w.userId === user.id);
    if (!wd) return fail('Withdrawal request not found.', 404);
    if (wd.status !== 'PENDING') return fail('Only PENDING withdrawals can be cancelled.');

    const wallet = recalculateWallet(db, user.id);
    const balanceBefore = wallet.availableBalance;
    const pendingBefore = wallet.pendingBalance;
    const balanceAfter = balanceBefore + wd.amount;
    const pendingAfter = Math.max(0, pendingBefore - wd.amount);

    wallet.availableBalance = balanceAfter;
    wallet.reservedWithdrawalBalance = Math.max(0, wallet.reservedWithdrawalBalance - wd.amount);
    wallet.pendingBalance = pendingAfter;
    wd.status = 'CANCELLED';
    wd.adminNotes = 'Cancelled by customer. Reserved funds released back to Available Balance.';
    wd.updatedAt = now;

    const unifiedTx = db.unifiedTransactions.find((t) => t.referenceId === wd.id);
    if (unifiedTx) unifiedTx.status = 'CANCELLED';

    db.ledgerEntries.push({
      id: `LEDG-${Date.now()}`,
      userId: user.id,
      transactionId: unifiedTx ? unifiedTx.id : wd.id,
      type: 'WITHDRAWAL_RELEASED',
      direction: 'CREDIT',
      amount: wd.amount,
      balanceBefore,
      balanceAfter,
      pendingBefore,
      pendingAfter,
      status: 'POSTED',
      description: `Released reserved Rs. ${wd.amount.toLocaleString()} from cancelled withdrawal ${wd.id}`,
      createdAt: now,
    });
    recalculateWallet(db, user.id);
    return ok({ withdrawal: wd });
  }

  if (endpoint === '/api/notifications/read-all' && method === 'POST') {
    db.notifications.forEach((n) => {
      if (n.userId === user.id) n.read = true;
    });
    return ok({ success: true });
  }

  if (endpoint === '/api/profile/payout-accounts' && method === 'POST') {
    const m = db.withdrawalMethods.find((wm) => wm.id === body.methodId);
    if (!m) return fail('Method not found.');
    const acc: SavedPayoutAccount = {
      id: `spa-${Date.now()}`,
      methodId: m.id,
      methodName: m.name,
      accountTitle: String(body.accountTitle || '').trim(),
      accountNumber: String(body.accountNumber || '').trim(),
      bankName: body.bankName ? String(body.bankName).trim() : undefined,
      createdAt: now,
    };
    user.savedPayoutAccounts.push(acc);
    return ok({ account: acc }, 201);
  }

  // Admin routes: Strictly restricted to AUTHORIZED_ADMIN_EMAILS
  if (user.role !== 'admin' || !isAuthorizedAdminEmail(user.identifier)) {
    return fail('Access denied. Only authorized administrators can access the Administrator Console.', 403);
  }

  if (endpoint === '/api/admin/overview' && method === 'GET') {
    db.users.forEach((u) => {
      recalculateWallet(db, u.id);
      u.totalInvested = calculateLocalUserInvested(db, u.id);
    });
    return ok({
      settings: db.settings,
      users: db.users.map(formatSafeUser),
      wallets: db.wallets,
      plans: db.plans,
      loginLogs: db.loginLogs || [],
      transactions: [...db.transactions].reverse(),
      withdrawals: [...db.withdrawals].reverse(),
      withdrawalMethods: db.withdrawalMethods,
      ledgerEntries: [...db.ledgerEntries].reverse(),
      unifiedTransactions: [...db.unifiedTransactions].reverse(),
      orders: [...db.orders].reverse(),
      auditLogs: [...db.auditLogs].reverse(),
      inquiries: [...db.inquiries].reverse(),
    });
  }

  const adminTxMatch = endpoint.match(/^\/api\/admin\/transactions\/([^/]+)$/);
  if (adminTxMatch && method === 'PATCH') {
    const dep = db.transactions.find((t) => t.id === adminTxMatch[1]);
    if (!dep) return fail('Deposit not found.', 404);
    const prevStatus = dep.status;
    const nextStatus = body.status as DepositStatus;
    const targetUser = db.users.find((u) => u.id === dep.userId);
    if (!targetUser) return fail('User not found.');
    const wallet = recalculateWallet(db, targetUser.id);
    const amount = dep.numericAmount || parseNumericPkr(dep.amount);

    dep.status = nextStatus;
    dep.adminNotes = String(body.adminNotes || '').trim() || dep.adminNotes;
    dep.reviewedAt = now;
    dep.reviewedBy = user.name;

    const unifiedTx = db.unifiedTransactions.find((u) => u.referenceId === dep.id);
    const linkedOrder = db.orders.find((o) => o.referenceDepositId === dep.id);

    if (prevStatus !== 'Approved' && nextStatus === 'Approved') {
      const balanceBefore = wallet.availableBalance;
      const balanceAfter = balanceBefore + amount;
      wallet.availableBalance = balanceAfter;
      if (unifiedTx) unifiedTx.status = 'APPROVED';
      if (!dep.creditToWalletOnly && dep.planId !== 'wallet-deposit') {
        targetUser.activePlanId = dep.planId;
        if (linkedOrder) {
          linkedOrder.status = 'ACTIVE';
          linkedOrder.activatedAt = now;
        }
      }
      db.ledgerEntries.push({
        id: `LEDG-${Date.now()}`,
        userId: targetUser.id,
        transactionId: unifiedTx ? unifiedTx.id : dep.id,
        type: 'DEPOSIT_APPROVED',
        direction: 'CREDIT',
        amount,
        balanceBefore,
        balanceAfter,
        pendingBefore: wallet.pendingBalance,
        pendingAfter: Math.max(0, wallet.pendingBalance - amount),
        status: 'POSTED',
        description: `Approved Easypaisa deposit (TID: ${dep.transactionId})`,
        createdAt: now,
      });
    } else if (nextStatus === 'Rejected') {
      if (prevStatus === 'Approved') {
        const balanceBefore = wallet.availableBalance;
        const deductAmount = Math.min(balanceBefore, amount);
        const balanceAfter = balanceBefore - deductAmount;
        wallet.availableBalance = balanceAfter;
        if (targetUser.activePlanId === dep.planId) {
          targetUser.activePlanId = null;
        }
        db.ledgerEntries.push({
          id: `LEDG-${Date.now()}`,
          userId: targetUser.id,
          transactionId: unifiedTx ? unifiedTx.id : dep.id,
          type: 'ADMIN_ADJUSTMENT',
          direction: 'DEBIT',
          amount: deductAmount,
          balanceBefore,
          balanceAfter,
          pendingBefore: wallet.pendingBalance,
          pendingAfter: wallet.pendingBalance,
          status: 'POSTED',
          description: `Disapproved previously approved payment (TID: ${dep.transactionId})`,
          createdAt: now,
        });
      }
      if (unifiedTx) unifiedTx.status = 'REJECTED';
      if (linkedOrder) linkedOrder.status = 'CANCELLED';
    }

    db.auditLogs.push({
      id: `AUD-${Date.now()}`,
      adminId: user.id,
      adminName: user.name,
      action: `DEPOSIT_${nextStatus.toUpperCase()}`,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      entityType: 'DEPOSIT',
      entityId: dep.id,
      amount,
      previousState: `status=${prevStatus}`,
      newState: `status=${nextStatus}`,
      ipAddress: '127.0.0.1',
      userAgent: 'admin-console',
      timestamp: now,
    });
    recalculateWallet(db, targetUser.id);
    return ok({ transaction: dep });
  }

  const adminWdMatch = endpoint.match(/^\/api\/admin\/withdrawals\/([^/]+)$/);
  if (adminWdMatch && method === 'PATCH') {
    const wd = db.withdrawals.find((w) => w.id === adminWdMatch[1]);
    if (!wd) return fail('Withdrawal not found.', 404);
    const targetUser = db.users.find((u) => u.id === wd.userId);
    if (!targetUser) return fail('Target user not found.');
    const wallet = recalculateWallet(db, targetUser.id);
    const prevStatus = wd.status;
    const nextStatus = body.status as WithdrawalStatus;
    const unifiedTx = db.unifiedTransactions.find((t) => t.referenceId === wd.id);

    if (nextStatus === 'PROCESSING') {
      wd.status = 'PROCESSING';
      wd.adminNotes = String(body.adminNotes || 'Approved for processing.');
      if (unifiedTx) unifiedTx.status = 'PROCESSING';
    } else if (nextStatus === 'REJECTED') {
      const balanceBefore = wallet.availableBalance;
      const balanceAfter = balanceBefore + wd.amount;
      wallet.availableBalance = balanceAfter;
      wallet.reservedWithdrawalBalance = Math.max(0, wallet.reservedWithdrawalBalance - wd.amount);
      wd.status = 'REJECTED';
      wd.adminNotes = String(body.adminNotes || 'Rejected; funds returned to available balance.');
      if (unifiedTx) unifiedTx.status = 'REJECTED';
      db.ledgerEntries.push({
        id: `LEDG-${Date.now()}`,
        userId: targetUser.id,
        transactionId: unifiedTx ? unifiedTx.id : wd.id,
        type: 'WITHDRAWAL_RELEASED',
        direction: 'CREDIT',
        amount: wd.amount,
        balanceBefore,
        balanceAfter,
        pendingBefore: wallet.pendingBalance,
        pendingAfter: Math.max(0, wallet.pendingBalance - wd.amount),
        status: 'POSTED',
        description: `Released reserved Rs. ${wd.amount.toLocaleString()} from rejected withdrawal ${wd.id}`,
        createdAt: now,
      });
    } else if (nextStatus === 'COMPLETED') {
      if (!body.confirmRealPayoutSent || String(body.payoutReference || '').trim().length < 3) {
        return fail('Confirm real payout sent and enter transfer reference ID before marking COMPLETED.');
      }
      wallet.reservedWithdrawalBalance = Math.max(0, wallet.reservedWithdrawalBalance - wd.amount);
      wallet.totalWithdrawn += wd.amount;
      wd.status = 'COMPLETED';
      wd.payoutReference = String(body.payoutReference).trim();
      wd.adminConfirmedRealPayout = true;
      wd.adminNotes = String(body.adminNotes || `Payout completed. Ref: ${wd.payoutReference}`);
      if (unifiedTx) unifiedTx.status = 'COMPLETED';
      db.ledgerEntries.push({
        id: `LEDG-${Date.now()}`,
        userId: targetUser.id,
        transactionId: unifiedTx ? unifiedTx.id : wd.id,
        type: 'WITHDRAWAL_COMPLETED',
        direction: 'DEBIT',
        amount: wd.amount,
        balanceBefore: wallet.availableBalance,
        balanceAfter: wallet.availableBalance,
        pendingBefore: wallet.pendingBalance,
        pendingAfter: Math.max(0, wallet.pendingBalance - wd.amount),
        status: 'POSTED',
        description: `Withdrawal ${wd.id} completed (Ref: ${wd.payoutReference})`,
        createdAt: now,
      });
    }

    db.auditLogs.push({
      id: `AUD-${Date.now()}`,
      adminId: user.id,
      adminName: user.name,
      action: `WITHDRAWAL_${nextStatus}`,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      entityType: 'WITHDRAWAL',
      entityId: wd.id,
      amount: wd.amount,
      previousState: `status=${prevStatus}`,
      newState: `status=${nextStatus}`,
      ipAddress: '127.0.0.1',
      userAgent: 'admin-console',
      timestamp: now,
    });
    recalculateWallet(db, targetUser.id);
    return ok({ withdrawal: wd });
  }

  if (endpoint === '/api/admin/wallets/adjust' && method === 'POST') {
    const targetUser = db.users.find((u) => u.id === body.targetUserId);
    if (!targetUser) return fail('Target user not found.');
    const wallet = recalculateWallet(db, targetUser.id);
    const amount = Math.round(Number(body.amount) || 0);
    const direction = body.direction === 'DEBIT' ? 'DEBIT' : 'CREDIT';
    if (direction === 'DEBIT' && wallet.availableBalance < amount) {
      return fail('Insufficient available balance for debit adjustment.');
    }
    const balanceBefore = wallet.availableBalance;
    const balanceAfter = direction === 'CREDIT' ? balanceBefore + amount : balanceBefore - amount;
    wallet.availableBalance = balanceAfter;

    const txId = `TXN-${Date.now()}`;
    db.unifiedTransactions.push({
      id: txId,
      userId: targetUser.id,
      type: body.category === 'REFUND' ? 'REFUND' : 'ADJUSTMENT',
      amount,
      fee: 0,
      netAmount: amount,
      status: 'COMPLETED',
      referenceId: txId,
      description: `${body.category} (${direction}): ${body.reason}`,
      createdAt: now,
      updatedAt: now,
    });
    const entry: LedgerEntry = {
      id: `LEDG-${Date.now()}`,
      userId: targetUser.id,
      transactionId: txId,
      type: body.category === 'REFUND' ? 'REFUND' : 'ADMIN_ADJUSTMENT',
      direction,
      amount,
      balanceBefore,
      balanceAfter,
      pendingBefore: wallet.pendingBalance,
      pendingAfter: wallet.pendingBalance,
      status: 'POSTED',
      description: `Admin ${body.category} (${direction}): ${body.reason}`,
      createdAt: now,
    };
    db.ledgerEntries.push(entry);
    db.auditLogs.push({
      id: `AUD-${Date.now()}`,
      adminId: user.id,
      adminName: user.name,
      action: `WALLET_${body.category}_${direction}`,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      entityType: 'WALLET',
      entityId: wallet.id,
      amount,
      previousState: `availableBalance=${balanceBefore}`,
      newState: `availableBalance=${balanceAfter}`,
      ipAddress: '127.0.0.1',
      userAgent: 'admin-console',
      timestamp: now,
    });
    recalculateWallet(db, targetUser.id);
    return ok({ wallet, ledgerEntry: entry }, 201);
  }

  if (endpoint === '/api/admin/settings' && method === 'PUT') {
    if (body.logoUrl !== undefined) db.settings.logoUrl = body.logoUrl;
    if (body.heroHeadline) db.settings.heroHeadline = body.heroHeadline;
    if (body.heroSubheadline) db.settings.heroSubheadline = body.heroSubheadline;
    return ok({ settings: db.settings });
  }

  if (endpoint === '/api/admin/owner-password' && method === 'PUT') {
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    if (user.passwordPlain !== currentPassword) {
      return fail('Current password is incorrect.', 400);
    }
    if (newPassword.length < 8) {
      return fail('New password must be at least 8 characters.', 400);
    }
    user.passwordPlain = newPassword;
    return ok({ success: true, message: 'Owner administrator password updated.' });
  }

  if (endpoint === '/api/admin/withdrawal-methods' && method === 'POST') {
    if (body.id) {
      const idx = db.withdrawalMethods.findIndex((m) => m.id === body.id);
      if (idx !== -1) {
        db.withdrawalMethods[idx] = { ...db.withdrawalMethods[idx], ...body };
        return ok({ method: db.withdrawalMethods[idx] });
      }
    }
    const newMethod: WithdrawalMethodConfig = {
      id: `wm-${Date.now()}`,
      name: String(body.name || ''),
      code: String(body.code || '').toUpperCase(),
      minAmount: Number(body.minAmount) || 500,
      maxAmount: Number(body.maxAmount) || 500000,
      feePercent: Number(body.feePercent) || 0,
      feeFixed: Number(body.feeFixed) || 0,
      accountLabel: String(body.accountLabel || 'Account Number'),
      requiresBankName: Boolean(body.requiresBankName),
      instructions: String(body.instructions || ''),
      active: body.active !== false,
    };
    db.withdrawalMethods.push(newMethod);
    return ok({ method: newMethod });
  }

  if (endpoint === '/api/admin/plans' && method === 'POST') {
    const newPlan: ServicePlan = {
      id: `plan-${Date.now()}`,
      name: String(body.name || ''),
      targetAudience: String(body.targetAudience || 'Structured 30-Day Package'),
      price: String(body.price || ''),
      dailyProfit: body.dailyProfit ? String(body.dailyProfit) : undefined,
      totalProfit: body.totalProfit ? String(body.totalProfit) : undefined,
      currency: 'PKR',
      duration: String(body.duration || '30 Days (30 دن)'),
      description: String(body.description || ''),
      features: Array.isArray(body.features) ? body.features : [],
      ctaText: 'Invest Now',
      isPopular: Boolean(body.isPopular),
      active: true,
    };
    db.plans.push(newPlan);
    return ok({ plan: newPlan }, 201);
  }

  const delPlanMatch = endpoint.match(/^\/api\/admin\/plans\/([^/]+)$/);
  if (delPlanMatch && method === 'DELETE') {
    db.plans = db.plans.filter((p) => p.id !== delPlanMatch[1]);
    return ok({ success: true });
  }

  const adminInqMatch = endpoint.match(/^\/api\/admin\/inquiries\/([^/]+)$/);
  if (adminInqMatch && method === 'PATCH') {
    const item = db.inquiries.find((i) => i.id === adminInqMatch[1]);
    if (!item) return fail('Inquiry not found.', 404);
    item.status = body.status as InquiryStatus;
    item.adminReply = String(body.adminReply || '');
    return ok({ inquiry: item });
  }

  const adminUserMatch = endpoint.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (adminUserMatch && method === 'PATCH') {
    const target = db.users.find((u) => u.id === adminUserMatch[1]);
    if (!target) return fail('User not found.', 404);
    if (body.status === 'ACTIVE' || body.status === 'SUSPENDED') {
      target.status = body.status;
    }
    return ok({ user: formatSafeUser(target) });
  }

  return fail('Endpoint not found.', 404);
}
