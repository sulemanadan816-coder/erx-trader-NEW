import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  AuditLogEntry,
  DepositStatus,
  InquiryStatus,
  LedgerEntry,
  LoginLogEntry,
  PaymentTransaction,
  ReferralCommissionLog,
  ReferralMember,
  ReferralStatsResponse,
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
} from '../types/index.ts';

const TOKEN_SECRET = process.env.SESSION_SECRET || 'rex-traders-hmac-secret-key-2026-prod';

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

export function hashPassword(password: string, salt?: string): string {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, useSalt, 64).toString('hex');
  return `${useSalt}:${derived}`;
}

// Pre-computed scrypt hashes for seeded accounts so createInitialDb() never blocks the event loop
const DEFAULT_OWNER_ADMIN_HASH = hashPassword(
  'Suleman@Rex2026!',
  '999bbb5c43dca034a75792ab5c0d7b9a'
);
const DEFAULT_ABUBAKAR_ADMIN_HASH = hashPassword(
  'Arain@786',
  '777aaa4b32cb9023b64681ba4b0c6a8f'
);
const DEFAULT_ADAN_ADMIN_HASH = hashPassword(
  'Adan@Rex2026!',
  '999bbb5c43dca034a75792ab5c0d7b9a'
);
const DEFAULT_CLIENT_PASSWORD_HASH =
  '2b2fb7c338ca016f82fcb3040ca12a22:7a297f0499c88226a1f736aff551da75e9e4b80490f276e3cd8a76865841e38a8457c4da85b8a23e40723af6ed862a8e81dd83108dba75e3064d7ffe33c5c07f';

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}

export interface TokenPayload {
  userId: string;
  role: 'user' | 'admin';
  exp: number;
}

export function signToken(payload: TokenPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8')) as TokenPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function maskAccountNumber(accountNumber: string): string {
  const clean = accountNumber.trim();
  if (clean.length <= 4) return clean;
  const visibleEnd = clean.slice(-4);
  const visibleStart = clean.slice(0, 2);
  return `${visibleStart}${'*'.repeat(Math.max(3, clean.length - 6))}${visibleEnd}`;
}

export function parseNumericPkr(val: string | number): number {
  if (typeof val === 'number') return Math.round(val);
  const digits = val.replace(/[^0-9.]/g, '');
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

export interface StoredUserRecord extends UserAccount {
  passwordHash: string;
  savedPayoutAccounts: SavedPayoutAccount[];
}

export interface DatabaseSchema {
  settings: SiteSettings;
  users: StoredUserRecord[];
  wallets: WalletAccount[];
  ledgerEntries: LedgerEntry[];
  unifiedTransactions: UnifiedTransaction[];
  transactions: PaymentTransaction[]; // Deposits
  orders: ServiceOrder[];
  withdrawalMethods: WithdrawalMethodConfig[];
  withdrawals: WithdrawalRequest[];
  notifications: UserNotification[];
  auditLogs: AuditLogEntry[];
  loginLogs: LoginLogEntry[];
  inquiries: SupportInquiry[];
  plans: ServicePlan[];
  referralLogs: ReferralCommissionLog[];
  idempotencyKeys: Record<string, { createdAt: number; resultId: string }>;
}

export const INITIAL_PLANS: ServicePlan[] = [
  {
    id: 'plan-01',
    name: 'Plan 01',
    targetAudience: 'Tier 01 · 90-Day Package',
    price: 'Rs445.00',
    dailyProfit: 'Rs89.00',
    totalProfit: 'Rs8,010.00',
    currency: 'PKR',
    duration: '90 Day',
    description: 'Entry-tier smart investment with daily return of Rs89.00 and total return of Rs8,010.00.',
    features: [
      'Investment: Rs445.00',
      'Daily Return: Rs89.00',
      'Total Return: Rs8,010.00',
      'Duration: 90 Day',
      'Refer Commission: L1 13% · L2 2%',
    ],
    ctaText: 'Invest Now',
    isPopular: false,
    active: true,
  },
  {
    id: 'plan-02',
    name: 'Plan 02',
    targetAudience: 'Tier 02 · 90-Day Package',
    price: 'Rs845.00',
    dailyProfit: 'Rs169.00',
    totalProfit: 'Rs15,210.00',
    currency: 'PKR',
    duration: '90 Day',
    description: 'Basic-tier smart investment with daily return of Rs169.00 and total return of Rs15,210.00.',
    features: [
      'Investment: Rs845.00',
      'Daily Return: Rs169.00',
      'Total Return: Rs15,210.00',
      'Duration: 90 Day',
      'Refer Commission: L1 13% · L2 2%',
    ],
    ctaText: 'Invest Now',
    isPopular: false,
    active: true,
  },
  {
    id: 'plan-03',
    name: 'Plan 03',
    targetAudience: 'Tier 03 · 90-Day Package',
    price: 'Rs1,645.00',
    dailyProfit: 'Rs329.00',
    totalProfit: 'Rs29,610.00',
    currency: 'PKR',
    duration: '90 Day',
    description: 'Standard-tier smart investment with daily return of Rs329.00 and total return of Rs29,610.00.',
    features: [
      'Investment: Rs1,645.00',
      'Daily Return: Rs329.00',
      'Total Return: Rs29,610.00',
      'Duration: 90 Day',
      'Refer Commission: L1 13% · L2 2%',
    ],
    ctaText: 'Invest Now',
    isPopular: true,
    active: true,
  },
  {
    id: 'plan-04',
    name: 'Plan 04',
    targetAudience: 'Tier 04 · 90-Day Package',
    price: 'Rs3,245.00',
    dailyProfit: 'Rs649.00',
    totalProfit: 'Rs58,410.00',
    currency: 'PKR',
    duration: '90 Day',
    description: 'Silver smart investment with daily return of Rs649.00 and total return of Rs58,410.00.',
    features: [
      'Investment: Rs3,245.00',
      'Daily Return: Rs649.00',
      'Total Return: Rs58,410.00',
      'Duration: 90 Day',
      'Refer Commission: L1 13% · L2 2%',
    ],
    ctaText: 'Invest Now',
    isPopular: false,
    active: true,
  },
  {
    id: 'plan-05',
    name: 'Plan 05',
    targetAudience: 'Tier 05 · 90-Day Package',
    price: 'Rs6,445.00',
    dailyProfit: 'Rs1,289.00',
    totalProfit: 'Rs116,010.00',
    currency: 'PKR',
    duration: '90 Day',
    description: 'Growth smart investment with daily return of Rs1,289.00 and total return of Rs116,010.00.',
    features: [
      'Investment: Rs6,445.00',
      'Daily Return: Rs1,289.00',
      'Total Return: Rs116,010.00',
      'Duration: 90 Day',
      'Refer Commission: L1 13% · L2 2%',
    ],
    ctaText: 'Invest Now',
    isPopular: true,
    active: true,
  },
  {
    id: 'plan-06',
    name: 'Plan 06',
    targetAudience: 'Tier 06 · 90-Day Package',
    price: 'Rs12,045.00',
    dailyProfit: 'Rs2,409.00',
    totalProfit: 'Rs216,810.00',
    currency: 'PKR',
    duration: '90 Day',
    description: 'Gold smart investment with daily return of Rs2,409.00 and total return of Rs216,810.00.',
    features: [
      'Investment: Rs12,045.00',
      'Daily Return: Rs2,409.00',
      'Total Return: Rs216,810.00',
      'Duration: 90 Day',
      'Refer Commission: L1 13% · L2 2%',
    ],
    ctaText: 'Invest Now',
    isPopular: false,
    active: true,
  },
  {
    id: 'plan-07',
    name: 'Plan 07',
    targetAudience: 'Tier 07 · 90-Day Package',
    price: 'Rs24,045.00',
    dailyProfit: 'Rs4,809.00',
    totalProfit: 'Rs432,810.00',
    currency: 'PKR',
    duration: '90 Day',
    description: 'Premier smart investment with daily return of Rs4,809.00 and total return of Rs432,810.00.',
    features: [
      'Investment: Rs24,045.00',
      'Daily Return: Rs4,809.00',
      'Total Return: Rs432,810.00',
      'Duration: 90 Day',
      'Refer Commission: L1 13% · L2 2%',
    ],
    ctaText: 'Invest Now',
    isPopular: false,
    active: true,
  },
  {
    id: 'plan-08',
    name: 'Plan 08',
    targetAudience: 'Tier 08 · 90-Day Package',
    price: 'Rs48,045.00',
    dailyProfit: 'Rs9,609.00',
    totalProfit: 'Rs864,810.00',
    currency: 'PKR',
    duration: '90 Day',
    description: 'Platinum smart investment with daily return of Rs9,609.00 and total return of Rs864,810.00.',
    features: [
      'Investment: Rs48,045.00',
      'Daily Return: Rs9,609.00',
      'Total Return: Rs864,810.00',
      'Duration: 90 Day',
      'Refer Commission: L1 13% · L2 2%',
    ],
    ctaText: 'Invest Now',
    isPopular: true,
    active: true,
  },
  {
    id: 'plan-09',
    name: 'Plan 09',
    targetAudience: 'Tier 09 · 90-Day Package',
    price: 'Rs96,045.00',
    dailyProfit: 'Rs19,209.00',
    totalProfit: 'Rs1,728,810.00',
    currency: 'PKR',
    duration: '90 Day',
    description: 'Executive smart investment with daily return of Rs19,209.00 and total return of Rs1,728,810.00.',
    features: [
      'Investment: Rs96,045.00',
      'Daily Return: Rs19,209.00',
      'Total Return: Rs1,728,810.00',
      'Duration: 90 Day',
      'Refer Commission: L1 13% · L2 2%',
    ],
    ctaText: 'Invest Now',
    isPopular: false,
    active: true,
  },
  {
    id: 'plan-10',
    name: 'Plan 10',
    targetAudience: 'Tier 10 · 90-Day Package',
    price: 'Rs146,945.00',
    dailyProfit: 'Rs29,389.00',
    totalProfit: 'Rs2,645,010.00',
    currency: 'PKR',
    duration: '90 Day',
    description: 'Diamond smart investment with daily return of Rs29,389.00 and total return of Rs2,645,010.00.',
    features: [
      'Investment: Rs146,945.00',
      'Daily Return: Rs29,389.00',
      'Total Return: Rs2,645,010.00',
      'Duration: 90 Day',
      'Refer Commission: L1 13% · L2 2%',
    ],
    ctaText: 'Invest Now',
    isPopular: false,
    active: true,
  },
  {
    id: 'plan-11',
    name: 'Plan 11',
    targetAudience: 'Tier 11 · 90-Day Package',
    price: 'Rs248,945.00',
    dailyProfit: 'Rs49,789.00',
    totalProfit: '4,481,010 PKR',
    currency: 'PKR',
    duration: '90 Day',
    description: 'Venture smart investment with daily return of Rs49,789.00 and total return of Rs4,481,010.00.',
    features: [
      'Investment: Rs248,945.00',
      'Daily Return: Rs49,789.00',
      'Total Return: Rs4,481,010.00',
      'Duration: 90 Day',
      'Refer Commission: L1 13% · L2 2%',
    ],
    ctaText: 'Invest Now',
    isPopular: false,
    active: true,
  },
  {
    id: 'plan-12',
    name: 'Plan 12',
    targetAudience: 'Tier 12 · 90-Day Package',
    price: 'Rs334,945.00',
    dailyProfit: 'Rs66,989.00',
    totalProfit: 'Rs6,029,010.00',
    currency: 'PKR',
    duration: '90 Day',
    description: 'Ultimate smart investment with daily return of Rs66,989.00 and total return of Rs6,029,010.00.',
    features: [
      'Investment: Rs334,945.00',
      'Daily Return: Rs66,989.00',
      'Total Return: Rs6,029,010.00',
      'Duration: 90 Day',
      'Refer Commission: L1 13% · L2 2%',
    ],
    ctaText: 'Invest Now',
    isPopular: true,
    active: true,
  },
];

export const INITIAL_WITHDRAWAL_METHODS: WithdrawalMethodConfig[] = [
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

export function createInitialDb(): DatabaseSchema {
  const now = new Date().toISOString();
  return {
    settings: {
      brandName: 'REX TRADERS',
      logoUrl: '/rex-traders-logo.svg',
      logoAlt: 'REX TRADERS Official Logo',
      whatsappChannelUrl: 'https://whatsapp.com/channel/0029Vb5ZICEFSAt01mUETp3z',
      telegramSupportUrl: 'https://t.me/rextrades0',
      telegramHandle: '@rextrades0',
      easypaisaNumber: '03260767504',
      easypaisaAccountLabel: 'Official REX TRADERS Easypaisa Account',
      heroHeadline: 'Smart Investment · Better Tomorrow',
      heroSubheadline:
        'REX TRADERS offers 12 structured 30-day investment packages from PKR 1,200 to PKR 300,000, a 3-level referral commission structure, direct support via Telegram and WhatsApp, and manual Easypaisa payment verification.',
      announcementText:
        'Official communication is conducted exclusively through our verified Telegram support (@rextrades0) and WhatsApp Channel.',
    },
    users: [
      {
        id: 'usr-admin-owner',
        name: 'Suleman Adan (REX TRADERS Admin)',
        identifier: OWNER_ADMIN_EMAIL,
        passwordHash: DEFAULT_OWNER_ADMIN_HASH,
        role: 'admin',
        status: 'ACTIVE',
        activePlanId: null,
        savedPayoutAccounts: [],
        createdAt: now,
        referralCode: 'TZ-ADMIN',
        referredBy: null,
        referralCount: 0,
        totalReferralEarnings: 0,
      },
      {
        id: 'usr-admin-abubakar',
        name: 'Abubakar Arain (REX TRADERS Admin)',
        identifier: SECONDARY_ADMIN_EMAIL,
        passwordHash: DEFAULT_ABUBAKAR_ADMIN_HASH,
        role: 'admin',
        status: 'ACTIVE',
        activePlanId: null,
        savedPayoutAccounts: [],
        createdAt: now,
        referralCode: 'TZ-ABUBAKAR',
        referredBy: null,
        referralCount: 0,
        totalReferralEarnings: 0,
      },
      {
        id: 'usr-admin-adan',
        name: 'Adan Gujjar (REX TRADERS Admin)',
        identifier: TERTIARY_ADMIN_EMAIL,
        passwordHash: DEFAULT_ADAN_ADMIN_HASH,
        role: 'admin',
        status: 'ACTIVE',
        activePlanId: null,
        savedPayoutAccounts: [],
        createdAt: now,
        referralCode: 'TZ-ADAN',
        referredBy: null,
        referralCount: 0,
        totalReferralEarnings: 0,
      },
      {
        id: 'usr-client-1',
        name: 'Client Account',
        identifier: 'client@rextraders.com',
        passwordHash: DEFAULT_CLIENT_PASSWORD_HASH,
        role: 'user',
        status: 'ACTIVE',
        activePlanId: null,
        savedPayoutAccounts: [],
        createdAt: now,
        lastLoginAt: now,
        lastLoginIp: '182.180.142.10',
        loginCount: 3,
        totalInvested: 0,
        referralCode: 'TZ-CLIENT1',
        referredBy: 'usr-admin-abubakar',
        referralCount: 0,
        totalReferralEarnings: 0,
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
    withdrawalMethods: JSON.parse(JSON.stringify(INITIAL_WITHDRAWAL_METHODS)),
    withdrawals: [],
    notifications: [
      {
        id: 'notif-welcome-client',
        userId: 'usr-client-1',
        title: 'Welcome to REX TRADERS Client Portal',
        message:
          'All wallet balances and transactions in this portal are 100% backed by our server-side ledger. Submit an Easypaisa deposit or select a plan to begin.',
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
    plans: JSON.parse(JSON.stringify(INITIAL_PLANS)),
    referralLogs: [],
    idempotencyKeys: {},
  };
}

/**
 * Transactional Ledger Engine with Mutex Serialization & Atomic Rollback
 */
export class LedgerEngine {
  private dbFile: string;
  private dataDir: string;
  private lockQueue: Promise<unknown> = Promise.resolve();
  private cachedDb: DatabaseSchema | null = null;
  private cachedMtimeMs = 0;

  constructor(customDbFile?: string) {
    this.dbFile = customDbFile || path.resolve(process.cwd(), 'data', 'rex_traders_db.json');
    this.dataDir = path.dirname(this.dbFile);
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.dbFile)) {
      const initial = createInitialDb();
      this.writeDbSync(initial);
    } else {
      const db = this.readDbSync(true);
      this.writeDbSync(db);
    }
  }

  public readDbSync(forceDiskRead = false): DatabaseSchema {
    try {
      if (!forceDiskRead && this.cachedDb && fs.existsSync(this.dbFile)) {
        const stat = fs.statSync(this.dbFile);
        if (stat.mtimeMs === this.cachedMtimeMs) {
          return this.cachedDb;
        }
      }

      const raw = fs.readFileSync(this.dbFile, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      const fallback = createInitialDb();

      const resolvedPlans =
        Array.isArray(parsed.plans) &&
        parsed.plans.length > 0 &&
        !parsed.plans.some((p) => p.id === 'plan-standard' || p.id === 'plan-1200')
          ? parsed.plans
          : fallback.plans;

      const validPlanIds = new Set(resolvedPlans.map((p) => p.id));

      // Purge any legacy admin@rextraders.com and strictly enforce that ONLY AUTHORIZED_ADMIN_EMAILS can have role='admin'
      const rawUsers = (parsed.users || fallback.users).filter(
        (u) => u.identifier.toLowerCase() !== 'admin@rextraders.com'
      );

      const normalizedUsers: StoredUserRecord[] = rawUsers.map((u) => {
        const isAuthorizedAdmin = isAuthorizedAdminEmail(u.identifier);
        return {
          ...u,
          role: isAuthorizedAdmin ? 'admin' : 'user',
          status: isAuthorizedAdmin ? 'ACTIVE' : u.status || 'ACTIVE',
          activePlanId:
            u.activePlanId && validPlanIds.has(u.activePlanId) ? u.activePlanId : null,
          savedPayoutAccounts: Array.isArray(u.savedPayoutAccounts) ? u.savedPayoutAccounts : [],
          lastLoginAt:
            u.lastLoginAt ||
            (u.id === 'usr-client-1' ? new Date(Date.now() - 3600000).toISOString() : null),
          lastLoginIp: u.lastLoginIp || (u.id === 'usr-client-1' ? '182.180.142.10' : null),
          loginCount: typeof u.loginCount === 'number' ? u.loginCount : (u.id === 'usr-client-1' ? 3 : 0),
          totalInvested: typeof u.totalInvested === 'number' ? u.totalInvested : 0,
          referralCode:
            u.referralCode ||
            (u.identifier.toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase()
              ? 'TZ-ADMIN'
              : u.identifier.toLowerCase() === SECONDARY_ADMIN_EMAIL.toLowerCase()
              ? 'TZ-ABUBAKAR'
              : u.identifier.toLowerCase() === TERTIARY_ADMIN_EMAIL.toLowerCase()
              ? 'TZ-ADAN'
              : `TZ-${u.id.slice(-6).toUpperCase()}`),
          referredBy: u.referredBy || (u.id === 'usr-client-1' ? 'usr-admin-abubakar' : null),
          referralCount: typeof u.referralCount === 'number' ? u.referralCount : 0,
          totalReferralEarnings:
            typeof u.totalReferralEarnings === 'number' ? u.totalReferralEarnings : 0,
        };
      });

      for (const seededAdmin of fallback.users.filter((u) => u.role === 'admin')) {
        if (
          !normalizedUsers.some(
            (u) => u.identifier.toLowerCase() === seededAdmin.identifier.toLowerCase()
          )
        ) {
          normalizedUsers.unshift(seededAdmin);
        }
      }

      const rawLoginLogs =
        Array.isArray(parsed.loginLogs) && parsed.loginLogs.length > 0
          ? parsed.loginLogs
          : fallback.loginLogs;

      const db: DatabaseSchema = {
        settings: parsed.settings || fallback.settings,
        users: normalizedUsers,
        wallets: Array.isArray(parsed.wallets) ? parsed.wallets : fallback.wallets,
        ledgerEntries: Array.isArray(parsed.ledgerEntries) ? parsed.ledgerEntries : [],
        unifiedTransactions: Array.isArray(parsed.unifiedTransactions)
          ? parsed.unifiedTransactions
          : [],
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        withdrawalMethods:
          Array.isArray(parsed.withdrawalMethods) && parsed.withdrawalMethods.length > 0
            ? parsed.withdrawalMethods
            : fallback.withdrawalMethods,
        withdrawals: Array.isArray(parsed.withdrawals) ? parsed.withdrawals : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
        loginLogs: rawLoginLogs,
        inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : [],
        plans: resolvedPlans,
        referralLogs: Array.isArray(parsed.referralLogs) ? parsed.referralLogs : [],
        idempotencyKeys: parsed.idempotencyKeys || {},
      };

      // Ensure official channels stay synced
      db.settings.whatsappChannelUrl = 'https://whatsapp.com/channel/0029Vb5ZICEFSAt01mUETp3z';
      db.settings.telegramSupportUrl = 'https://t.me/rextrades0';
      db.settings.easypaisaNumber = '03260767504';
      if (!db.settings.logoUrl) {
        db.settings.logoUrl = '/rex-traders-logo.svg';
      }

      // Ensure every user has an authoritative Wallet row
      for (const u of db.users) {
        this.getOrCreateWallet(db, u.id);
      }

      if (fs.existsSync(this.dbFile)) {
        this.cachedMtimeMs = fs.statSync(this.dbFile).mtimeMs;
      }
      this.cachedDb = db;
      return db;
    } catch {
      const initial = createInitialDb();
      this.cachedDb = initial;
      return initial;
    }
  }

  private writeDbSync(db: DatabaseSchema): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    const tempFile = `${this.dbFile}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, this.dbFile);
    this.cachedDb = db;
    if (fs.existsSync(this.dbFile)) {
      this.cachedMtimeMs = fs.statSync(this.dbFile).mtimeMs;
    }
  }

  /**
   * Executes a callback inside an exclusive serialized mutex lock with atomic rollback on error.
   */
  public async runInTransaction<T>(fn: (db: DatabaseSchema) => T | Promise<T>): Promise<T> {
    const execute = async (): Promise<T> => {
      const db = this.readDbSync();
      const result = await fn(db);
      // Recompute derived wallet totals before committing
      for (const u of db.users) {
        this.recalculateWalletDerivedMetrics(db, u.id);
      }
      this.writeDbSync(db);
      return result;
    };

    const next = this.lockQueue.then(execute, execute);
    this.lockQueue = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  }

  public calculateUserInvested(db: DatabaseSchema, userId: string): number {
    const wallet = this.getOrCreateWallet(db, userId);
    const approvedDeposits = db.transactions
      .filter((t) => t.userId === userId && t.status === 'Approved')
      .reduce((sum, t) => sum + (t.numericAmount || parseNumericPkr(t.amount)), 0);
    const activeOrders = db.orders
      .filter((o) => o.userId === userId && (o.status === 'ACTIVE' || o.status === 'COMPLETED'))
      .reduce((sum, o) => sum + o.amount, 0);
    return Math.max(wallet.totalDeposited, approvedDeposits, activeOrders);
  }

  public async recordLogin(params: {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<LoginLogEntry> {
    return this.runInTransaction((db) => {
      const user = db.users.find((u) => u.id === params.userId);
      if (!user) throw new Error('User not found for login record.');

      const totalInvested = this.calculateUserInvested(db, user.id);
      const activePlan = db.plans.find((p) => p.id === user.activePlanId);
      const now = new Date().toISOString();

      user.lastLoginAt = now;
      user.lastLoginIp = params.ipAddress || '127.0.0.1';
      user.loginCount = (user.loginCount || 0) + 1;
      user.totalInvested = totalInvested;

      if (!Array.isArray(db.loginLogs)) {
        db.loginLogs = [];
      }

      const logEntry: LoginLogEntry = {
        id: `LOG-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        userId: user.id,
        userName: user.name,
        userIdentifier: user.identifier,
        role: user.role,
        timestamp: now,
        ipAddress: params.ipAddress || '127.0.0.1',
        userAgent: params.userAgent || 'Web Browser',
        totalInvested,
        activePlanName: activePlan ? activePlan.name : null,
      };

      db.loginLogs.unshift(logEntry);
      if (db.loginLogs.length > 200) {
        db.loginLogs.length = 200;
      }

      return logEntry;
    });
  }

  public getOrCreateWallet(db: DatabaseSchema, userId: string): WalletAccount {
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
    this.recalculateWalletDerivedMetrics(db, userId);
    return wallet;
  }

  public recalculateWalletDerivedMetrics(db: DatabaseSchema, userId: string): WalletAccount {
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

  private appendLedgerEntry(
    db: DatabaseSchema,
    params: {
      userId: string;
      transactionId: string;
      type: LedgerEntry['type'];
      direction: 'CREDIT' | 'DEBIT';
      amount: number;
      balanceBefore: number;
      balanceAfter: number;
      pendingBefore: number;
      pendingAfter: number;
      description: string;
    }
  ): LedgerEntry {
    const entry: LedgerEntry = {
      id: `LEDG-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      userId: params.userId,
      transactionId: params.transactionId,
      type: params.type,
      direction: params.direction,
      amount: params.amount,
      balanceBefore: params.balanceBefore,
      balanceAfter: params.balanceAfter,
      pendingBefore: params.pendingBefore,
      pendingAfter: params.pendingAfter,
      status: 'POSTED',
      description: params.description,
      createdAt: new Date().toISOString(),
    };
    db.ledgerEntries.push(entry);
    return entry;
  }

  private appendAuditLog(
    db: DatabaseSchema,
    params: {
      adminId: string;
      adminName: string;
      action: string;
      targetUserId: string;
      targetUserName: string;
      entityType: AuditLogEntry['entityType'];
      entityId: string;
      amount: number | null;
      previousState: string;
      newState: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): AuditLogEntry {
    const log: AuditLogEntry = {
      id: `AUD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      adminId: params.adminId,
      adminName: params.adminName,
      action: params.action,
      targetUserId: params.targetUserId,
      targetUserName: params.targetUserName,
      entityType: params.entityType,
      entityId: params.entityId,
      amount: params.amount,
      previousState: params.previousState,
      newState: params.newState,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'server',
      timestamp: new Date().toISOString(),
    };
    db.auditLogs.push(log);
    return log;
  }

  private appendNotification(
    db: DatabaseSchema,
    userId: string,
    title: string,
    message: string,
    type: UserNotification['type'] = 'INFO'
  ): void {
    db.notifications.push({
      id: `NOTIF-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Distribute multi-tier referral commissions (Level 1: 13%, Level 2: 2%)
   * Directly credits referrer wallet available balances and records ledger/audit/notification logs.
   */
  public distributeReferralCommissions(
    db: DatabaseSchema,
    buyerUser: StoredUserRecord,
    sourceAmount: number,
    planName: string,
    sourceDescription: string
  ): void {
    if (!buyerUser.referredBy || sourceAmount <= 0) return;
    const now = new Date().toISOString();

    // 1. Direct Referrer (Level 1 - 13%)
    const l1Referrer = db.users.find(
      (u) =>
        u.id === buyerUser.referredBy ||
        (u.referralCode && u.referralCode.toUpperCase() === buyerUser.referredBy?.toUpperCase())
    );

    if (l1Referrer && l1Referrer.id !== buyerUser.id) {
      const l1Commission = Math.round(sourceAmount * 0.13);
      if (l1Commission > 0) {
        const l1Wallet = this.getOrCreateWallet(db, l1Referrer.id);
        const l1BalBefore = l1Wallet.availableBalance;
        const l1BalAfter = l1BalBefore + l1Commission;
        l1Wallet.availableBalance = l1BalAfter;

        l1Referrer.totalReferralEarnings = (l1Referrer.totalReferralEarnings || 0) + l1Commission;

        const txId = `COMM-L1-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        this.appendLedgerEntry(db, {
          userId: l1Referrer.id,
          transactionId: txId,
          type: 'REFERRAL_COMMISSION',
          direction: 'CREDIT',
          amount: l1Commission,
          balanceBefore: l1BalBefore,
          balanceAfter: l1BalAfter,
          pendingBefore: l1Wallet.pendingBalance,
          pendingAfter: l1Wallet.pendingBalance,
          description: `Level 1 referral commission (13%) from ${buyerUser.name} on ${planName} (Rs. ${sourceAmount.toLocaleString()})`,
        });

        db.unifiedTransactions.push({
          id: `TXN-${txId}`,
          userId: l1Referrer.id,
          type: 'COMMISSION',
          amount: l1Commission,
          fee: 0,
          netAmount: l1Commission,
          status: 'COMPLETED',
          referenceId: buyerUser.id,
          description: `Level 1 referral bonus (13%) from ${buyerUser.name} (${planName})`,
          createdAt: now,
          updatedAt: now,
        });

        if (!Array.isArray(db.referralLogs)) {
          db.referralLogs = [];
        }
        db.referralLogs.push({
          id: `REFLOG-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          referrerId: l1Referrer.id,
          referredUserId: buyerUser.id,
          referredUserName: buyerUser.name,
          level: 1,
          commissionPercent: 13,
          sourceAmount,
          commissionAmount: l1Commission,
          planName,
          createdAt: now,
        });

        this.appendNotification(
          db,
          l1Referrer.id,
          `🎉 Referral Bonus Credited (+Rs. ${l1Commission.toLocaleString()})`,
          `You earned a direct Level 1 referral bonus of Rs. ${l1Commission.toLocaleString()} (13%) from your team member ${buyerUser.name}'s investment in ${planName}. Funds have been credited to your available balance.`,
          'SUCCESS'
        );
      }

      // 2. Indirect Referrer (Level 2 - 2%)
      if (l1Referrer.referredBy) {
        const l2Referrer = db.users.find(
          (u) =>
            u.id === l1Referrer.referredBy ||
            (u.referralCode && u.referralCode.toUpperCase() === l1Referrer.referredBy?.toUpperCase())
        );

        if (
          l2Referrer &&
          l2Referrer.id !== buyerUser.id &&
          l2Referrer.id !== l1Referrer.id
        ) {
          const l2Commission = Math.round(sourceAmount * 0.02);
          if (l2Commission > 0) {
            const l2Wallet = this.getOrCreateWallet(db, l2Referrer.id);
            const l2BalBefore = l2Wallet.availableBalance;
            const l2BalAfter = l2BalBefore + l2Commission;
            l2Wallet.availableBalance = l2BalAfter;

            l2Referrer.totalReferralEarnings = (l2Referrer.totalReferralEarnings || 0) + l2Commission;

            const l2TxId = `COMM-L2-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
            this.appendLedgerEntry(db, {
              userId: l2Referrer.id,
              transactionId: l2TxId,
              type: 'REFERRAL_COMMISSION',
              direction: 'CREDIT',
              amount: l2Commission,
              balanceBefore: l2BalBefore,
              balanceAfter: l2BalAfter,
              pendingBefore: l2Wallet.pendingBalance,
              pendingAfter: l2Wallet.pendingBalance,
              description: `Level 2 referral commission (2%) from ${buyerUser.name} on ${planName} via ${l1Referrer.name}`,
            });

            db.unifiedTransactions.push({
              id: `TXN-${l2TxId}`,
              userId: l2Referrer.id,
              type: 'COMMISSION',
              amount: l2Commission,
              fee: 0,
              netAmount: l2Commission,
              status: 'COMPLETED',
              referenceId: buyerUser.id,
              description: `Level 2 referral bonus (2%) from ${buyerUser.name} via ${l1Referrer.name}`,
              createdAt: now,
              updatedAt: now,
            });

            if (!Array.isArray(db.referralLogs)) {
              db.referralLogs = [];
            }
            db.referralLogs.push({
              id: `REFLOG-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
              referrerId: l2Referrer.id,
              referredUserId: buyerUser.id,
              referredUserName: buyerUser.name,
              level: 2,
              commissionPercent: 2,
              sourceAmount,
              commissionAmount: l2Commission,
              planName,
              createdAt: now,
            });

            this.appendNotification(
              db,
              l2Referrer.id,
              `🎉 Team Referral Bonus (+Rs. ${l2Commission.toLocaleString()})`,
              `You earned a Level 2 team bonus of Rs. ${l2Commission.toLocaleString()} (2%) from ${buyerUser.name}'s investment in ${planName} (invited by ${l1Referrer.name}). Funds have been credited to your available balance.`,
              'SUCCESS'
            );
          }
        }
      }
    }
  }

  /**
   * Retrieves complete referral stats, multi-tier team members, and commission logs for a user.
   */
  public getReferralStats(userId: string): ReferralStatsResponse {
    const db = this.readDbSync();
    const user = db.users.find((u) => u.id === userId);
    const referralCode =
      user?.referralCode || (user ? `TZ-${user.id.slice(-6).toUpperCase()}` : 'TRUSTZONE-VIP');

    if (!user) {
      return {
        referralCode,
        referralLink: `/?ref=${referralCode}`,
        referredBy: null,
        totalEarnings: 0,
        totalReferrals: 0,
        level1Count: 0,
        level2Count: 0,
        level1Earnings: 0,
        level2Earnings: 0,
        teamMembers: [],
        commissionLogs: [],
      };
    }

    const logs = Array.isArray(db.referralLogs)
      ? db.referralLogs.filter((l) => l.referrerId === user.id)
      : [];

    // Level 1 members: users whose referredBy matches user.id or user.referralCode
    const l1Members = db.users.filter(
      (u) =>
        u.id !== user.id &&
        (u.referredBy === user.id ||
          (user.referralCode && u.referredBy?.toUpperCase() === user.referralCode.toUpperCase()))
    );
    const l1MemberIds = new Set(l1Members.map((m) => m.id));

    // Level 2 members: users whose referredBy matches any of l1Member's id or referralCode
    const l2Members = db.users.filter((u) => {
      if (u.id === user.id || l1MemberIds.has(u.id)) return false;
      return l1Members.some(
        (m) =>
          u.referredBy === m.id ||
          (m.referralCode && u.referredBy?.toUpperCase() === m.referralCode.toUpperCase())
      );
    });

    const l1Earnings = logs
      .filter((l) => l.level === 1)
      .reduce((sum, l) => sum + l.commissionAmount, 0);
    const l2Earnings = logs
      .filter((l) => l.level === 2)
      .reduce((sum, l) => sum + l.commissionAmount, 0);

    const teamMembers: ReferralMember[] = [
      ...l1Members.map((m) => {
        const invested = this.calculateUserInvested(db, m.id);
        const earned = logs
          .filter((l) => l.referredUserId === m.id)
          .reduce((sum, l) => sum + l.commissionAmount, 0);
        const plan = db.plans.find((p) => p.id === m.activePlanId);
        return {
          id: m.id,
          userId: m.id,
          name: m.name,
          identifier: m.identifier,
          joinedAt: m.createdAt,
          level: 1 as const,
          activePlanName: plan ? plan.name : null,
          totalInvested: invested,
          commissionEarned: earned,
        };
      }),
      ...l2Members.map((m) => {
        const invested = this.calculateUserInvested(db, m.id);
        const earned = logs
          .filter((l) => l.referredUserId === m.id)
          .reduce((sum, l) => sum + l.commissionAmount, 0);
        const plan = db.plans.find((p) => p.id === m.activePlanId);
        return {
          id: m.id,
          userId: m.id,
          name: m.name,
          identifier: m.identifier,
          joinedAt: m.createdAt,
          level: 2 as const,
          activePlanName: plan ? plan.name : null,
          totalInvested: invested,
          commissionEarned: earned,
        };
      }),
    ];

    return {
      referralCode,
      referralLink: `/?ref=${referralCode}`,
      referredBy: user.referredBy || null,
      totalEarnings: l1Earnings + l2Earnings,
      totalReferrals: l1Members.length + l2Members.length,
      level1Count: l1Members.length,
      level2Count: l2Members.length,
      level1Earnings: l1Earnings,
      level2Earnings: l2Earnings,
      teamMembers,
      commissionLogs: [...logs].reverse(),
    };
  }

  // --- 1. Deposit Creation ---
  public async createDeposit(params: {
    userId: string;
    planId: string;
    transactionId: string;
    amount: string | number;
    senderNumber: string;
    paymentProofNote?: string;
    creditToWalletOnly?: boolean;
    idempotencyKey?: string;
  }): Promise<PaymentTransaction> {
    return this.runInTransaction((db) => {
      const user = db.users.find((u) => u.id === params.userId);
      if (!user) throw new Error('Authenticated user account not found.');
      if (user.status !== 'ACTIVE') throw new Error('Account is currently suspended.');

      if (params.idempotencyKey && db.idempotencyKeys[params.idempotencyKey]) {
        throw new Error('Duplicate deposit request detected.');
      }

      const cleanTid = params.transactionId.trim();
      if (cleanTid.length < 5) {
        throw new Error('Easypaisa Transaction ID (TID) must be at least 5 characters.');
      }

      const duplicate = db.transactions.find(
        (t) => t.transactionId.toLowerCase() === cleanTid.toLowerCase()
      );
      if (duplicate) {
        throw new Error('This Easypaisa Transaction ID has already been submitted.');
      }

      const isWalletTopup =
        params.creditToWalletOnly || params.planId === 'wallet-deposit';
      const plan = isWalletTopup
        ? null
        : db.plans.find((p) => p.id === params.planId);

      if (!isWalletTopup && !plan) {
        throw new Error('Selected service plan was not found.');
      }

      const numericAmount = parseNumericPkr(params.amount);
      if (numericAmount <= 0) {
        throw new Error('Deposit amount must be greater than zero.');
      }

      const now = new Date().toISOString();
      const depositId = `DEP-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const unifiedTxId = `TXN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

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
        senderNumber: params.senderNumber.trim(),
        paymentProofNote: params.paymentProofNote?.trim() || '',
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
          id: `ORD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
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

      if (params.idempotencyKey) {
        db.idempotencyKeys[params.idempotencyKey] = {
          createdAt: Date.now(),
          resultId: depositId,
        };
      }

      this.appendNotification(
        db,
        user.id,
        'Easypaisa Deposit Submitted (Pending)',
        `Your Easypaisa transfer reference (TID: ${cleanTid}) for Rs. ${numericAmount.toLocaleString()} has been recorded as PENDING. It will be credited once verified by an administrator.`,
        'INFO'
      );

      return newDeposit;
    });
  }

  // --- 2. Admin Deposit Review (Approve / Disapprove) ---
  public async reviewDeposit(params: {
    adminId: string;
    depositId: string;
    status: DepositStatus;
    adminNotes?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<PaymentTransaction> {
    return this.runInTransaction((db) => {
      const admin = db.users.find(
        (u) =>
          u.id === params.adminId &&
          u.role === 'admin' &&
          isAuthorizedAdminEmail(u.identifier)
      );
      if (!admin) throw new Error('Unauthorized: Administrator privileges required.');

      const deposit = db.transactions.find((t) => t.id === params.depositId);
      if (!deposit) throw new Error('Deposit transaction record not found.');

      const prevStatus = deposit.status;
      if (prevStatus === params.status) {
        deposit.adminNotes = params.adminNotes?.trim() || deposit.adminNotes;
        return deposit;
      }

      const user = db.users.find((u) => u.id === deposit.userId);
      if (!user) throw new Error('Target customer account not found.');

      const wallet = this.getOrCreateWallet(db, user.id);
      const amount = deposit.numericAmount || parseNumericPkr(deposit.amount);
      const now = new Date().toISOString();

      deposit.status = params.status;
      deposit.adminNotes =
        params.adminNotes?.trim() ||
        (params.status === 'Approved'
          ? 'Payment approved by administrator. Funds credited to Available Balance.'
          : 'Payment disapproved by administrator.');
      deposit.reviewedAt = now;
      deposit.reviewedBy = admin.name;

      const unifiedTx = db.unifiedTransactions.find((u) => u.referenceId === deposit.id);
      const linkedOrder = db.orders.find((o) => o.referenceDepositId === deposit.id);

      if (params.status === 'Approved') {
        const balanceBefore = wallet.availableBalance;
        const pendingBefore = wallet.pendingBalance;
        const balanceAfterDeposit = balanceBefore + amount;

        wallet.availableBalance = balanceAfterDeposit;

        // 1. Immutable Ledger Entry for Approved Deposit
        this.appendLedgerEntry(db, {
          userId: user.id,
          transactionId: unifiedTx ? unifiedTx.id : deposit.id,
          type: 'DEPOSIT_APPROVED',
          direction: 'CREDIT',
          amount,
          balanceBefore,
          balanceAfter: balanceAfterDeposit,
          pendingBefore,
          pendingAfter: Math.max(0, pendingBefore - amount),
          description: `Approved Easypaisa payment (TID: ${deposit.transactionId}) verified by ${admin.name}`,
        });

        if (unifiedTx) {
          unifiedTx.status = 'APPROVED';
          unifiedTx.updatedAt = now;
        }

        if (!deposit.creditToWalletOnly && deposit.planId !== 'wallet-deposit') {
          user.activePlanId = deposit.planId;
          if (linkedOrder) {
            linkedOrder.status = 'ACTIVE';
            linkedOrder.activatedAt = now;
          }
          this.appendNotification(
            db,
            user.id,
            'Payment Approved — Balance Credited & Plan Active',
            `Your payment (TID: ${deposit.transactionId}) of Rs. ${amount.toLocaleString()} has been approved by the admin! Rs. ${amount.toLocaleString()} is now in your Available Balance on your dashboard and eligible for withdrawal.`,
            'SUCCESS'
          );
        } else {
          this.appendNotification(
            db,
            user.id,
            'Payment Approved — Available for Withdrawal',
            `Your payment (TID: ${deposit.transactionId}) of Rs. ${amount.toLocaleString()} has been approved by the admin and added to your Available Balance. You can withdraw it anytime from your dashboard.`,
            'SUCCESS'
          );
        }

        // Trigger multi-tier referral commission distribution
        try {
          this.distributeReferralCommissions(
            db,
            user,
            amount,
            deposit.planName || 'Investment Plan',
            'Deposit Approved'
          );
        } catch (commErr) {
          console.error('Error distributing referral commission on deposit approval:', commErr);
        }
      } else if (params.status === 'Rejected') {
        // If previously Approved, reverse the credited balance cleanly
        if (prevStatus === 'Approved') {
          const balanceBefore = wallet.availableBalance;
          const deductAmount = Math.min(balanceBefore, amount);
          const balanceAfter = balanceBefore - deductAmount;
          wallet.availableBalance = balanceAfter;

          this.appendLedgerEntry(db, {
            userId: user.id,
            transactionId: unifiedTx ? unifiedTx.id : deposit.id,
            type: 'ADMIN_ADJUSTMENT',
            direction: 'DEBIT',
            amount: deductAmount,
            balanceBefore,
            balanceAfter,
            pendingBefore: wallet.pendingBalance,
            pendingAfter: wallet.pendingBalance,
            description: `Disapproved previously approved payment (TID: ${deposit.transactionId}) by ${admin.name}`,
          });

          if (user.activePlanId === deposit.planId) {
            user.activePlanId = null;
          }
        }

        if (unifiedTx) {
          unifiedTx.status = 'REJECTED';
          unifiedTx.updatedAt = now;
        }
        if (linkedOrder) {
          linkedOrder.status = 'CANCELLED';
        }
        this.appendNotification(
          db,
          user.id,
          'Payment Disapproved by Administrator',
          `Your submitted payment reference (TID: ${deposit.transactionId}) for Rs. ${amount.toLocaleString()} was disapproved. Reason: ${deposit.adminNotes}`,
          'ERROR'
        );
      }

      this.appendAuditLog(db, {
        adminId: admin.id,
        adminName: admin.name,
        action: `DEPOSIT_${params.status.toUpperCase()}`,
        targetUserId: user.id,
        targetUserName: user.name,
        entityType: 'DEPOSIT',
        entityId: deposit.id,
        amount,
        previousState: `status=${prevStatus}`,
        newState: `status=${params.status}; notes=${deposit.adminNotes}`,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });

      return deposit;
    });
  }

  // --- 3. Purchase Plan Using Available Wallet Balance ---
  public async purchasePlanWithWallet(params: {
    userId: string;
    planId: string;
    idempotencyKey?: string;
  }): Promise<ServiceOrder> {
    return this.runInTransaction((db) => {
      const user = db.users.find((u) => u.id === params.userId);
      if (!user) throw new Error('User not found.');
      if (user.status !== 'ACTIVE') throw new Error('Account is suspended.');

      if (params.idempotencyKey && db.idempotencyKeys[params.idempotencyKey]) {
        throw new Error('Duplicate plan purchase request.');
      }

      const plan = db.plans.find((p) => p.id === params.planId && p.active);
      if (!plan) throw new Error('Selected service plan is not available.');

      const price = parseNumericPkr(plan.price);
      if (price <= 0) throw new Error('Invalid plan price configuration.');

      const wallet = this.getOrCreateWallet(db, user.id);
      if (wallet.availableBalance < price) {
        throw new Error(
          `Insufficient available wallet balance. Required: Rs. ${price.toLocaleString()}, Available: Rs. ${wallet.availableBalance.toLocaleString()}.`
        );
      }

      const now = new Date().toISOString();
      const orderId = `ORD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const unifiedTxId = `TXN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      const balanceBefore = wallet.availableBalance;
      const balanceAfter = balanceBefore - price;
      wallet.availableBalance = balanceAfter;
      user.activePlanId = plan.id;

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

      this.appendLedgerEntry(db, {
        userId: user.id,
        transactionId: unifiedTxId,
        type: 'SERVICE_PURCHASE',
        direction: 'DEBIT',
        amount: price,
        balanceBefore,
        balanceAfter,
        pendingBefore: wallet.pendingBalance,
        pendingAfter: wallet.pendingBalance,
        description: `Service purchase: ${plan.name} (Order ${orderId})`,
      });

      if (params.idempotencyKey) {
        db.idempotencyKeys[params.idempotencyKey] = {
          createdAt: Date.now(),
          resultId: orderId,
        };
      }

      this.appendNotification(
        db,
        user.id,
        'Service Plan Activated via Wallet',
        `You purchased ${plan.name} for Rs. ${price.toLocaleString()} from your Available Balance.`,
        'SUCCESS'
      );

      // Trigger multi-tier referral commission distribution
      try {
        this.distributeReferralCommissions(
          db,
          user,
          price,
          plan.name,
          'Wallet Plan Activation'
        );
      } catch (commErr) {
        console.error('Error distributing referral commission on wallet purchase:', commErr);
      }

      return order;
    });
  }

  // --- 4. Create Withdrawal Request (Server-Side Validated & Reserved) ---
  public async createWithdrawal(params: {
    userId: string;
    amount: number;
    methodId: string;
    accountTitle: string;
    accountNumber: string;
    bankName?: string;
    saveAccount?: boolean;
    idempotencyKey?: string;
  }): Promise<WithdrawalRequest> {
    return this.runInTransaction((db) => {
      // 1. Verify User Authentication & Active Status
      const user = db.users.find((u) => u.id === params.userId);
      if (!user) throw new Error('Authentication required: User not found.');
      if (user.status !== 'ACTIVE') {
        throw new Error('Your account is not active and cannot submit withdrawals.');
      }

      // 2. Idempotency & Replay Protection
      if (params.idempotencyKey) {
        if (db.idempotencyKeys[params.idempotencyKey]) {
          throw new Error('Duplicate or replayed withdrawal request rejected.');
        }
      }

      // 3. Validate Amount > 0
      const grossAmount = Math.round(Number(params.amount));
      if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
        throw new Error('Withdrawal amount must be greater than zero.');
      }

      // 4. Validate Withdrawal Method
      const method = db.withdrawalMethods.find(
        (m) => m.id === params.methodId && m.active
      );
      if (!method) {
        throw new Error('Selected withdrawal method is not supported or inactive.');
      }

      if (grossAmount < method.minAmount) {
        throw new Error(
          `Minimum withdrawal amount for ${method.name} is Rs. ${method.minAmount.toLocaleString()}.`
        );
      }
      if (grossAmount > method.maxAmount) {
        throw new Error(
          `Maximum single withdrawal amount for ${method.name} is Rs. ${method.maxAmount.toLocaleString()}.`
        );
      }

      // 5. Validate Required Payment Information
      const cleanTitle = (params.accountTitle || '').trim();
      const cleanNumber = (params.accountNumber || '').trim();
      const cleanBank = (params.bankName || '').trim();

      if (cleanTitle.length < 2) {
        throw new Error('Account holder name / title is required.');
      }
      if (cleanNumber.length < 7) {
        throw new Error('Valid destination account number or IBAN is required.');
      }
      if (method.requiresBankName && cleanBank.length < 2) {
        throw new Error('Bank name is required for Bank Transfer withdrawals.');
      }

      // 6. Verify Available Balance Server-Side
      const wallet = this.getOrCreateWallet(db, user.id);
      if (grossAmount > wallet.availableBalance) {
        throw new Error(
          `Insufficient available balance. Requested: Rs. ${grossAmount.toLocaleString()}, Available: Rs. ${wallet.availableBalance.toLocaleString()}.`
        );
      }

      // 7. Calculate Applicable Processing Fee & Net Amount Server-Side
      const fee = Math.round((grossAmount * method.feePercent) / 100) + method.feeFixed;
      const netAmount = grossAmount - fee;
      if (netAmount <= 0) {
        throw new Error('Withdrawal amount must exceed the processing fee.');
      }

      // 8. Reserve Funds from Available Balance Atomically
      const balanceBefore = wallet.availableBalance;
      const pendingBefore = wallet.pendingBalance;
      const balanceAfter = balanceBefore - grossAmount;
      const pendingAfter = pendingBefore + grossAmount;

      wallet.availableBalance = balanceAfter;
      wallet.reservedWithdrawalBalance += grossAmount;
      wallet.pendingBalance = pendingAfter;

      const now = new Date().toISOString();
      const withdrawalId = `WD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const unifiedTxId = `TXN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      const withdrawal: WithdrawalRequest = {
        id: withdrawalId,
        userId: user.id,
        userName: user.name,
        userIdentifier: user.identifier,
        amount: grossAmount,
        fee,
        netAmount,
        methodId: method.id,
        methodName: method.name,
        accountTitle: cleanTitle,
        accountNumber: cleanNumber,
        maskedAccountNumber: maskAccountNumber(cleanNumber),
        bankName: cleanBank || undefined,
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
            note: `Requested withdrawal of Rs. ${grossAmount.toLocaleString()} via ${method.name}`,
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
        description: `Withdrawal request (${withdrawalId}) via ${method.name} to ${maskAccountNumber(cleanNumber)}`,
        createdAt: now,
        updatedAt: now,
      });

      this.appendLedgerEntry(db, {
        userId: user.id,
        transactionId: unifiedTxId,
        type: 'WITHDRAWAL_RESERVED',
        direction: 'DEBIT',
        amount: grossAmount,
        balanceBefore,
        balanceAfter,
        pendingBefore,
        pendingAfter,
        description: `Reserved Rs. ${grossAmount.toLocaleString()} for withdrawal request ${withdrawalId} (${method.name})`,
      });

      if (params.saveAccount) {
        const exists = user.savedPayoutAccounts.some(
          (a) =>
            a.methodId === method.id &&
            a.accountNumber.toLowerCase() === cleanNumber.toLowerCase()
        );
        if (!exists) {
          user.savedPayoutAccounts.push({
            id: `spa-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
            methodId: method.id,
            methodName: method.name,
            accountTitle: cleanTitle,
            accountNumber: cleanNumber,
            bankName: cleanBank || undefined,
            createdAt: now,
          });
        }
      }

      if (params.idempotencyKey) {
        db.idempotencyKeys[params.idempotencyKey] = {
          createdAt: Date.now(),
          resultId: withdrawalId,
        };
      }

      this.appendNotification(
        db,
        user.id,
        `Withdrawal Request Created (${withdrawalId})`,
        `Rs. ${grossAmount.toLocaleString()} has been reserved from your Available Balance for withdrawal via ${method.name}. Status: PENDING.`,
        'INFO'
      );

      return withdrawal;
    });
  }

  // --- 5. User Cancel Own Pending Withdrawal ---
  public async cancelUserWithdrawal(params: {
    userId: string;
    withdrawalId: string;
  }): Promise<WithdrawalRequest> {
    return this.runInTransaction((db) => {
      const user = db.users.find((u) => u.id === params.userId);
      if (!user) throw new Error('User not found.');

      const wd = db.withdrawals.find(
        (w) => w.id === params.withdrawalId && w.userId === user.id
      );
      if (!wd) throw new Error('Withdrawal request not found.');

      if (wd.status !== 'PENDING') {
        throw new Error(
          `Only PENDING withdrawals can be cancelled by the user. Current status: ${wd.status}.`
        );
      }

      const wallet = this.getOrCreateWallet(db, user.id);
      const balanceBefore = wallet.availableBalance;
      const pendingBefore = wallet.pendingBalance;
      const balanceAfter = balanceBefore + wd.amount;
      const pendingAfter = Math.max(0, pendingBefore - wd.amount);

      wallet.availableBalance = balanceAfter;
      wallet.reservedWithdrawalBalance = Math.max(
        0,
        wallet.reservedWithdrawalBalance - wd.amount
      );
      wallet.pendingBalance = pendingAfter;

      const now = new Date().toISOString();
      wd.status = 'CANCELLED';
      wd.adminNotes = 'Cancelled by customer. Reserved funds released back to Available Balance.';
      wd.updatedAt = now;
      wd.history.push({
        fromStatus: 'PENDING',
        toStatus: 'CANCELLED',
        actorId: user.id,
        actorName: user.name,
        actorRole: 'user',
        note: 'Cancelled by customer; reserved funds returned to available balance.',
        timestamp: now,
      });

      const unifiedTx = db.unifiedTransactions.find((t) => t.referenceId === wd.id);
      if (unifiedTx) {
        unifiedTx.status = 'CANCELLED';
        unifiedTx.updatedAt = now;
      }

      this.appendLedgerEntry(db, {
        userId: user.id,
        transactionId: unifiedTx ? unifiedTx.id : wd.id,
        type: 'WITHDRAWAL_RELEASED',
        direction: 'CREDIT',
        amount: wd.amount,
        balanceBefore,
        balanceAfter,
        pendingBefore,
        pendingAfter,
        description: `Released reserved Rs. ${wd.amount.toLocaleString()} from cancelled withdrawal ${wd.id}`,
      });

      this.appendNotification(
        db,
        user.id,
        `Withdrawal Cancelled (${wd.id})`,
        `Your withdrawal request ${wd.id} was cancelled and Rs. ${wd.amount.toLocaleString()} has been returned to your Available Balance.`,
        'WARNING'
      );

      return wd;
    });
  }

  // --- 6. Admin Withdrawal Management (Approve -> PROCESSING, Reject -> Release Funds, Complete -> Require Real Payout Confirmation) ---
  public async adminUpdateWithdrawal(params: {
    adminId: string;
    withdrawalId: string;
    status: WithdrawalStatus;
    adminNotes?: string;
    confirmRealPayoutSent?: boolean;
    payoutReference?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<WithdrawalRequest> {
    return this.runInTransaction((db) => {
      const admin = db.users.find(
        (u) =>
          u.id === params.adminId &&
          u.role === 'admin' &&
          isAuthorizedAdminEmail(u.identifier)
      );
      if (!admin) throw new Error('Unauthorized: Administrator privileges required.');

      const wd = db.withdrawals.find((w) => w.id === params.withdrawalId);
      if (!wd) throw new Error('Withdrawal request not found.');

      const user = db.users.find((u) => u.id === wd.userId);
      if (!user) throw new Error('Target user not found.');

      const prevStatus = wd.status;
      const now = new Date().toISOString();

      // If only updating internal notes without changing status
      if (prevStatus === params.status) {
        if (params.adminNotes !== undefined) {
          wd.adminNotes = params.adminNotes.trim();
          wd.updatedAt = now;
          this.appendAuditLog(db, {
            adminId: admin.id,
            adminName: admin.name,
            action: 'WITHDRAWAL_NOTE_UPDATED',
            targetUserId: user.id,
            targetUserName: user.name,
            entityType: 'WITHDRAWAL',
            entityId: wd.id,
            amount: wd.amount,
            previousState: `status=${prevStatus}`,
            newState: `status=${prevStatus}; note=${wd.adminNotes}`,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
          });
        }
        return wd;
      }

      // Terminal states cannot be transitioned again
      if (prevStatus === 'COMPLETED' || prevStatus === 'REJECTED' || prevStatus === 'CANCELLED') {
        throw new Error(
          `Cannot change status of a withdrawal that is already ${prevStatus}.`
        );
      }

      const wallet = this.getOrCreateWallet(db, user.id);
      const unifiedTx = db.unifiedTransactions.find((t) => t.referenceId === wd.id);

      // Transition 1: Approve / Mark PROCESSING
      if (params.status === 'PROCESSING') {
        wd.status = 'PROCESSING';
        wd.adminNotes =
          params.adminNotes?.trim() ||
          'Approved by administrator. Payment is currently being processed.';
        wd.updatedAt = now;
        wd.history.push({
          fromStatus: prevStatus,
          toStatus: 'PROCESSING',
          actorId: admin.id,
          actorName: admin.name,
          actorRole: 'admin',
          note: wd.adminNotes,
          timestamp: now,
        });

        if (unifiedTx) {
          unifiedTx.status = 'PROCESSING';
          unifiedTx.updatedAt = now;
        }

        this.appendNotification(
          db,
          user.id,
          `Withdrawal Approved for Processing (${wd.id})`,
          `Your withdrawal request of Rs. ${wd.netAmount.toLocaleString()} via ${wd.methodName} has been approved by an administrator and is now PROCESSING.`,
          'INFO'
        );
      }
      // Transition 2: REJECTED (Must release reserved funds back to Available Balance!)
      else if (params.status === 'REJECTED') {
        const balanceBefore = wallet.availableBalance;
        const pendingBefore = wallet.pendingBalance;
        const balanceAfter = balanceBefore + wd.amount;
        const pendingAfter = Math.max(0, pendingBefore - wd.amount);

        wallet.availableBalance = balanceAfter;
        wallet.reservedWithdrawalBalance = Math.max(
          0,
          wallet.reservedWithdrawalBalance - wd.amount
        );
        wallet.pendingBalance = pendingAfter;

        wd.status = 'REJECTED';
        wd.adminNotes =
          params.adminNotes?.trim() ||
          'Withdrawal request rejected by administrator. Reserved funds returned to Available Balance.';
        wd.updatedAt = now;
        wd.history.push({
          fromStatus: prevStatus,
          toStatus: 'REJECTED',
          actorId: admin.id,
          actorName: admin.name,
          actorRole: 'admin',
          note: `${wd.adminNotes} (Rs. ${wd.amount.toLocaleString()} released back to available balance)`,
          timestamp: now,
        });

        if (unifiedTx) {
          unifiedTx.status = 'REJECTED';
          unifiedTx.updatedAt = now;
        }

        this.appendLedgerEntry(db, {
          userId: user.id,
          transactionId: unifiedTx ? unifiedTx.id : wd.id,
          type: 'WITHDRAWAL_RELEASED',
          direction: 'CREDIT',
          amount: wd.amount,
          balanceBefore,
          balanceAfter,
          pendingBefore,
          pendingAfter,
          description: `Released reserved Rs. ${wd.amount.toLocaleString()} from rejected withdrawal ${wd.id} (${wd.adminNotes})`,
        });

        this.appendNotification(
          db,
          user.id,
          `Withdrawal Rejected & Funds Released (${wd.id})`,
          `Your withdrawal request ${wd.id} was rejected (${wd.adminNotes}). The reserved Rs. ${wd.amount.toLocaleString()} has been returned to your Available Balance.`,
          'WARNING'
        );
      }
      // Transition 3: COMPLETED (Requires explicit real payout confirmation!)
      else if (params.status === 'COMPLETED') {
        if (!params.confirmRealPayoutSent) {
          throw new Error(
            'Admin must explicitly confirm that the actual payment transfer has been completed before marking a withdrawal as COMPLETED.'
          );
        }
        const cleanRef = (params.payoutReference || '').trim();
        if (cleanRef.length < 3) {
          throw new Error(
            'Please provide the real payment transfer reference / receipt ID before marking COMPLETED.'
          );
        }

        const pendingBefore = wallet.pendingBalance;
        const pendingAfter = Math.max(0, pendingBefore - wd.amount);
        wallet.reservedWithdrawalBalance = Math.max(
          0,
          wallet.reservedWithdrawalBalance - wd.amount
        );
        wallet.pendingBalance = pendingAfter;
        wallet.totalWithdrawn += wd.amount;

        wd.status = 'COMPLETED';
        wd.payoutReference = cleanRef;
        wd.adminConfirmedRealPayout = true;
        wd.adminNotes =
          params.adminNotes?.trim() ||
          `Payout completed via ${wd.methodName}. Transfer Ref: ${cleanRef}`;
        wd.updatedAt = now;
        wd.history.push({
          fromStatus: prevStatus,
          toStatus: 'COMPLETED',
          actorId: admin.id,
          actorName: admin.name,
          actorRole: 'admin',
          note: `Real payout confirmed (Ref: ${cleanRef}). ${wd.adminNotes}`,
          timestamp: now,
        });

        if (unifiedTx) {
          unifiedTx.status = 'COMPLETED';
          unifiedTx.description = `${unifiedTx.description} · Payout Ref: ${cleanRef}`;
          unifiedTx.updatedAt = now;
        }

        this.appendLedgerEntry(db, {
          userId: user.id,
          transactionId: unifiedTx ? unifiedTx.id : wd.id,
          type: 'WITHDRAWAL_COMPLETED',
          direction: 'DEBIT',
          amount: wd.amount,
          balanceBefore: wallet.availableBalance,
          balanceAfter: wallet.availableBalance,
          pendingBefore,
          pendingAfter,
          description: `Withdrawal ${wd.id} payout completed via ${wd.methodName} (Transfer Ref: ${cleanRef})`,
        });

        this.appendNotification(
          db,
          user.id,
          `Withdrawal Completed (${wd.id})`,
          `Your withdrawal of Rs. ${wd.netAmount.toLocaleString()} via ${wd.methodName} has been sent and marked COMPLETED (Transfer Ref: ${cleanRef}).`,
          'SUCCESS'
        );
      } else {
        throw new Error(`Unsupported target withdrawal status: ${params.status}`);
      }

      this.appendAuditLog(db, {
        adminId: admin.id,
        adminName: admin.name,
        action: `WITHDRAWAL_${params.status}`,
        targetUserId: user.id,
        targetUserName: user.name,
        entityType: 'WITHDRAWAL',
        entityId: wd.id,
        amount: wd.amount,
        previousState: `status=${prevStatus}`,
        newState: `status=${wd.status}; payoutRef=${wd.payoutReference || 'none'}; note=${wd.adminNotes}`,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });

      return wd;
    });
  }

  // --- 7. Controlled Admin Balance Adjustment / Refund (Immutable Ledger Entry) ---
  public async adminAdjustBalance(params: {
    adminId: string;
    targetUserId: string;
    direction: 'CREDIT' | 'DEBIT';
    category: 'ADJUSTMENT' | 'REFUND';
    amount: number;
    reason: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ wallet: WalletAccount; ledgerEntry: LedgerEntry }> {
    return this.runInTransaction((db) => {
      const admin = db.users.find(
        (u) =>
          u.id === params.adminId &&
          u.role === 'admin' &&
          isAuthorizedAdminEmail(u.identifier)
      );
      if (!admin) throw new Error('Unauthorized: Administrator privileges required.');

      const user = db.users.find((u) => u.id === params.targetUserId);
      if (!user) throw new Error('Target user account not found.');

      const amount = Math.round(Number(params.amount));
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Adjustment amount must be a positive number.');
      }

      const cleanReason = (params.reason || '').trim();
      if (cleanReason.length < 5) {
        throw new Error('A clear accounting reason (at least 5 characters) is required for audit compliance.');
      }

      const wallet = this.getOrCreateWallet(db, user.id);
      const balanceBefore = wallet.availableBalance;

      if (params.direction === 'DEBIT' && balanceBefore < amount) {
        throw new Error(
          `Cannot debit Rs. ${amount.toLocaleString()} because user only has Rs. ${balanceBefore.toLocaleString()} available balance.`
        );
      }

      const balanceAfter =
        params.direction === 'CREDIT' ? balanceBefore + amount : balanceBefore - amount;
      wallet.availableBalance = balanceAfter;

      const now = new Date().toISOString();
      const unifiedTxId = `TXN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      db.unifiedTransactions.push({
        id: unifiedTxId,
        userId: user.id,
        type: params.category === 'REFUND' ? 'REFUND' : 'ADJUSTMENT',
        amount,
        fee: 0,
        netAmount: amount,
        status: 'COMPLETED',
        referenceId: unifiedTxId,
        description: `${params.category} (${params.direction}): ${cleanReason}`,
        createdAt: now,
        updatedAt: now,
      });

      const ledgerEntry = this.appendLedgerEntry(db, {
        userId: user.id,
        transactionId: unifiedTxId,
        type: params.category === 'REFUND' ? 'REFUND' : 'ADMIN_ADJUSTMENT',
        direction: params.direction,
        amount,
        balanceBefore,
        balanceAfter,
        pendingBefore: wallet.pendingBalance,
        pendingAfter: wallet.pendingBalance,
        description: `Admin ${params.category.toLowerCase()} (${params.direction}) by ${admin.name}: ${cleanReason}`,
      });

      this.appendAuditLog(db, {
        adminId: admin.id,
        adminName: admin.name,
        action: `WALLET_${params.category}_${params.direction}`,
        targetUserId: user.id,
        targetUserName: user.name,
        entityType: 'WALLET',
        entityId: wallet.id,
        amount,
        previousState: `availableBalance=${balanceBefore}`,
        newState: `availableBalance=${balanceAfter}; reason=${cleanReason}`,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });

      this.appendNotification(
        db,
        user.id,
        `Account Balance ${params.category === 'REFUND' ? 'Refund' : 'Adjustment'}`,
        `An administrator posted a ${params.direction} of Rs. ${amount.toLocaleString()} to your Available Balance. Reason: ${cleanReason}`,
        params.direction === 'CREDIT' ? 'SUCCESS' : 'WARNING'
      );

      return { wallet, ledgerEntry };
    });
  }

  // --- 8. Manage Configurable Withdrawal Methods (Admin) ---
  public async adminSaveWithdrawalMethod(params: {
    adminId: string;
    method: Omit<WithdrawalMethodConfig, 'id'> & { id?: string };
    ipAddress?: string;
    userAgent?: string;
  }): Promise<WithdrawalMethodConfig> {
    return this.runInTransaction((db) => {
      const admin = db.users.find(
        (u) =>
          u.id === params.adminId &&
          u.role === 'admin' &&
          isAuthorizedAdminEmail(u.identifier)
      );
      if (!admin) throw new Error('Unauthorized: Exclusive Owner Administrator privileges required.');

      if (params.method.id) {
        const idx = db.withdrawalMethods.findIndex((m) => m.id === params.method.id);
        if (idx === -1) throw new Error('Withdrawal method not found.');
        const prev = JSON.stringify(db.withdrawalMethods[idx]);
        db.withdrawalMethods[idx] = {
          ...db.withdrawalMethods[idx],
          ...params.method,
          id: params.method.id,
        };
        this.appendAuditLog(db, {
          adminId: admin.id,
          adminName: admin.name,
          action: 'WITHDRAWAL_METHOD_UPDATED',
          targetUserId: admin.id,
          targetUserName: 'System Configuration',
          entityType: 'METHOD',
          entityId: params.method.id,
          amount: null,
          previousState: prev,
          newState: JSON.stringify(db.withdrawalMethods[idx]),
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        });
        return db.withdrawalMethods[idx];
      } else {
        const newMethod: WithdrawalMethodConfig = {
          ...params.method,
          id: `wm-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        };
        db.withdrawalMethods.push(newMethod);
        this.appendAuditLog(db, {
          adminId: admin.id,
          adminName: admin.name,
          action: 'WITHDRAWAL_METHOD_CREATED',
          targetUserId: admin.id,
          targetUserName: 'System Configuration',
          entityType: 'METHOD',
          entityId: newMethod.id,
          amount: null,
          previousState: 'none',
          newState: JSON.stringify(newMethod),
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        });
        return newMethod;
      }
    });
  }

  // --- 9. Owner Admin Change Password ---
  public async adminChangePassword(params: {
    adminId: string;
    currentPassword: string;
    newPassword: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    return this.runInTransaction((db) => {
      const admin = db.users.find(
        (u) =>
          u.id === params.adminId &&
          u.role === 'admin' &&
          isAuthorizedAdminEmail(u.identifier)
      );
      if (!admin) {
        throw new Error('Unauthorized: Only an authorized administrator can change their password.');
      }
      if (!verifyPassword(params.currentPassword, admin.passwordHash)) {
        throw new Error('Current password is incorrect.');
      }
      if (params.newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters.');
      }
      admin.passwordHash = hashPassword(params.newPassword);
      this.appendAuditLog(db, {
        adminId: admin.id,
        adminName: admin.name,
        action: 'OWNER_ADMIN_PASSWORD_UPDATED',
        targetUserId: admin.id,
        targetUserName: admin.name,
        entityType: 'SETTINGS',
        entityId: admin.id,
        amount: null,
        previousState: 'passwordHash=***',
        newState: 'passwordHash=updated',
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    });
  }
}
