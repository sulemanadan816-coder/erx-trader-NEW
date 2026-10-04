process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true';

import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { z } from 'zod';
import {
  LedgerEngine,
  type StoredUserRecord,
  isAuthorizedAdminEmail,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  maskAccountNumber,
} from './src/server/ledgerEngine.ts';

const PORT = 3000;
const ledger = new LedgerEngine();

// --- Simple In-Memory Rate Limiter ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = rateLimitMap.get(key);
    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment and try again.',
      });
    }
    record.count += 1;
    return next();
  };
}

function sanitizeText(str: string): string {
  return str.replace(/[<>]/g, '').trim();
}

// --- Zod Validation Schemas ---
const RegisterSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters').max(80),
  identifier: z
    .string()
    .min(4, 'Email or phone number must be at least 4 characters')
    .max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  referralCode: z.string().max(50).optional(),
});

const LoginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

const DepositSubmitSchema = z.object({
  planId: z.string().min(1, 'Please select a valid service plan or wallet deposit'),
  transactionId: z
    .string()
    .min(5, 'Easypaisa Transaction ID (TID) must be at least 5 characters')
    .max(40, 'Transaction ID is too long'),
  amount: z.union([z.string().min(1), z.number().positive()]),
  senderNumber: z
    .string()
    .min(10, 'Sender mobile/account number must be at least 10 digits')
    .max(20),
  paymentProofNote: z.string().max(300).optional(),
  creditToWalletOnly: z.boolean().optional(),
  idempotencyKey: z.string().max(100).optional(),
});

const DepositReviewSchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Rejected']),
  adminNotes: z.string().max(500).optional().default(''),
});

const WalletPurchaseSchema = z.object({
  planId: z.string().min(1, 'Please select a plan to purchase'),
  idempotencyKey: z.string().max(100).optional(),
});

const WithdrawalCreateSchema = z.object({
  amount: z.number().positive('Withdrawal amount must be greater than zero'),
  methodId: z.string().min(1, 'Please select a withdrawal method'),
  accountTitle: z.string().min(2, 'Account holder name / title is required').max(100),
  accountNumber: z.string().min(7, 'Valid account number or IBAN is required').max(50),
  bankName: z.string().max(80).optional(),
  saveAccount: z.boolean().optional(),
  idempotencyKey: z.string().max(100).optional(),
});

const AdminWithdrawalUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED']),
  adminNotes: z.string().max(500).optional(),
  confirmRealPayoutSent: z.boolean().optional(),
  payoutReference: z.string().max(120).optional(),
});

const AdminBalanceAdjustSchema = z.object({
  targetUserId: z.string().min(1, 'Target user is required'),
  direction: z.enum(['CREDIT', 'DEBIT']),
  category: z.enum(['ADJUSTMENT', 'REFUND']).default('ADJUSTMENT'),
  amount: z.number().positive('Amount must be greater than zero'),
  reason: z.string().min(5, 'Please provide a clear audit reason (min 5 chars)').max(300),
});

const WithdrawalMethodSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(60),
  code: z.string().min(2).max(30),
  minAmount: z.number().min(1),
  maxAmount: z.number().min(1),
  feePercent: z.number().min(0).max(50),
  feeFixed: z.number().min(0),
  accountLabel: z.string().min(2).max(120),
  requiresBankName: z.boolean().default(false),
  instructions: z.string().max(300).default(''),
  active: z.boolean().default(true),
});

const SavedPayoutAccountSchema = z.object({
  methodId: z.string().min(1),
  accountTitle: z.string().min(2).max(100),
  accountNumber: z.string().min(7).max(50),
  bankName: z.string().max(80).optional(),
});

const PlanSchema = z.object({
  name: z.string().min(2, 'Plan name is required').max(80),
  targetAudience: z.string().min(4, 'Target audience summary is required').max(160),
  price: z.string().min(1, 'Price label is required').max(60),
  dailyProfit: z.string().max(60).optional(),
  totalProfit: z.string().max(60).optional(),
  currency: z.string().min(1).max(10).default('PKR'),
  duration: z.string().min(2, 'Duration is required').max(60),
  description: z.string().min(10, 'Description is required').max(400),
  features: z.array(z.string().min(1).max(140)).min(1, 'Include at least 1 feature'),
  ctaText: z.string().min(2).max(40).default('Invest Now'),
  isPopular: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
});

const InquirySchema = z.object({
  name: z.string().min(2, 'Your name is required').max(80),
  contactInfo: z
    .string()
    .min(4, 'Telegram username, WhatsApp number, or email is required')
    .max(100),
  subject: z.string().min(3, 'Subject is required').max(120),
  message: z
    .string()
    .min(10, 'Please provide at least 10 characters in your message')
    .max(1500),
});

const InquiryUpdateSchema = z.object({
  status: z.enum(['Open', 'In Progress', 'Resolved']),
  adminReply: z.string().max(1000).optional().default(''),
});

const SettingsUpdateSchema = z.object({
  logoUrl: z.string().max(500000).nullable().optional(),
  heroHeadline: z.string().min(5).max(160).optional(),
  heroSubheadline: z.string().min(10).max(400).optional(),
  announcementText: z.string().max(250).optional(),
});

// --- Auth Middleware ---
interface AuthenticatedRequest extends Request {
  user?: StoredUserRecord;
}

function getAuthenticatedUser(req: Request): StoredUserRecord | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const payload = verifyToken(token);
  if (!payload) return null;
  const db = ledger.readDbSync();
  const user = db.users.find((u) => u.id === payload.userId);
  return user || null;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  req.user = user;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  if (user.role !== 'admin' || !isAuthorizedAdminEmail(user.identifier)) {
    return res.status(403).json({
      error: 'Access denied. Only authorized administrators can access the Administrator Console.',
    });
  }
  req.user = user;
  next();
}

function formatSafeUser(u: StoredUserRecord, totalInvested?: number) {
  return {
    id: u.id,
    name: u.name,
    identifier: u.identifier,
    role: u.role,
    status: u.status || 'ACTIVE',
    activePlanId: u.activePlanId,
    savedPayoutAccounts: u.savedPayoutAccounts || [],
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt || null,
    lastLoginIp: u.lastLoginIp || null,
    loginCount: u.loginCount || 0,
    totalInvested: typeof totalInvested === 'number' ? totalInvested : (u.totalInvested || 0),
    referralCode: u.referralCode || `TZ-${u.id.slice(-6).toUpperCase()}`,
    referredBy: u.referredBy || null,
    referralCount: u.referralCount || 0,
    totalReferralEarnings: u.totalReferralEarnings || 0,
  };
}

async function startServer() {
  const app = express();

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  // --- Health Check ---
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'REX TRADERS API', timestamp: new Date().toISOString() });
  });

  // --- Public Bootstrap ---
  app.get('/api/public/bootstrap', (_req, res) => {
    const db = ledger.readDbSync();
    res.json({
      settings: db.settings,
      plans: db.plans.filter((p) => p.active),
      withdrawalMethods: db.withdrawalMethods.filter((m) => m.active),
    });
  });

  // --- Auth Routes ---
  app.post('/api/auth/register', rateLimit(15, 60_000), async (req, res) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid registration data',
      });
    }

    try {
      const result = await ledger.runInTransaction((db) => {
        const normalizedIdentifier = sanitizeText(parsed.data.identifier).toLowerCase();
        const isAdminEmail = isAuthorizedAdminEmail(normalizedIdentifier);
        const existing = db.users.find(
          (u) => u.identifier.toLowerCase() === normalizedIdentifier
        );
        if (existing) {
          if (isAdminEmail) {
            existing.passwordHash = hashPassword(parsed.data.password);
            existing.name = sanitizeText(parsed.data.name) || existing.name;
            existing.role = 'admin';
            existing.status = 'ACTIVE';
            return existing;
          }
          throw new Error('An account with this email or phone number already exists.');
        }

        const now = new Date().toISOString();

        const refCodeProvided = parsed.data.referralCode?.trim();
        let referrerId: string | null = null;
        if (refCodeProvided) {
          const cleanRef = refCodeProvided.toUpperCase();
          const referrer = db.users.find(
            (u) =>
              (u.referralCode && u.referralCode.toUpperCase() === cleanRef) ||
              u.id.toUpperCase() === cleanRef ||
              u.identifier.toUpperCase() === cleanRef ||
              (cleanRef === 'TZ-CLIENT1' && u.id === 'usr-client-1') ||
              (cleanRef === 'CLIENT1' && u.id === 'usr-client-1')
          );
          if (referrer) {
            referrerId = referrer.id;
            referrer.referralCount = (referrer.referralCount || 0) + 1;
            db.notifications.push({
              id: `NOTIF-${Date.now()}-ref`,
              userId: referrer.id,
              title: '🎉 New Team Referral Joined!',
              message: `${sanitizeText(parsed.data.name)} registered using your referral link! You will earn 13% commission on their plan activations.`,
              type: 'SUCCESS',
              read: false,
              createdAt: now,
            });
          }
        }

        const uniqueRefCode = `TZ${Math.floor(100000 + Math.random() * 900000)}`;
        const newUser: StoredUserRecord = {
          id: `usr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          name: sanitizeText(parsed.data.name),
          identifier: normalizedIdentifier,
          passwordHash: hashPassword(parsed.data.password),
          role: isAdminEmail ? 'admin' : 'user',
          status: 'ACTIVE',
          activePlanId: null,
          savedPayoutAccounts: [],
          createdAt: now,
          lastLoginAt: now,
          lastLoginIp: String(req.ip || req.socket.remoteAddress || '127.0.0.1'),
          loginCount: 1,
          totalInvested: 0,
          referralCode: uniqueRefCode,
          referredBy: referrerId,
          referralCount: 0,
          totalReferralEarnings: 0,
        };

        db.users.push(newUser);
        ledger.getOrCreateWallet(db, newUser.id);
        db.notifications.push({
          id: `NOTIF-${Date.now()}`,
          userId: newUser.id,
          title: 'Account Created Successfully',
          message:
            'Welcome to TrustZone. Your wallet has been initialized. You can now invest in high-yield daily plans and earn 13% + 2% referral commissions!',
          type: 'INFO',
          read: false,
          createdAt: now,
        });

        return newUser;
      });

      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = String(req.headers['user-agent'] || 'Web Registration');
      try {
        await ledger.recordLogin({
          userId: result.id,
          ipAddress: String(ipAddress),
          userAgent,
        });
      } catch {
        // non-fatal
      }

      const token = signToken({
        userId: result.id,
        role: result.role,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        token,
        user: formatSafeUser(result, 0),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      return res.status(msg.includes('already exists') ? 409 : 400).json({ error: msg });
    }
  });

  app.post('/api/auth/login', rateLimit(20, 60_000), async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid login credentials',
      });
    }

    const db = ledger.readDbSync();
    const normalizedIdentifier = sanitizeText(parsed.data.identifier).toLowerCase();
    const user = db.users.find(
      (u) => u.identifier.toLowerCase() === normalizedIdentifier
    );

    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return res.status(401).json({
        error: 'Invalid email/phone or password.',
      });
    }

    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = String(req.headers['user-agent'] || 'Web Browser');

    try {
      await ledger.recordLogin({
        userId: user.id,
        ipAddress: String(ipAddress),
        userAgent,
      });
    } catch {
      // non-fatal
    }

    const token = signToken({
      userId: user.id,
      role: user.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    const refreshedDb = ledger.readDbSync();
    const refreshedUser = refreshedDb.users.find((u) => u.id === user.id) || user;
    const totalInvested = ledger.calculateUserInvested(refreshedDb, refreshedUser.id);

    return res.json({
      token,
      user: formatSafeUser(refreshedUser, totalInvested),
    });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: formatSafeUser(req.user!) });
  });

  // --- Authoritative User Dashboard & Wallet Summary ---
  app.get('/api/dashboard/summary', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = ledger.readDbSync();
    const userId = req.user!.id;
    const wallet = ledger.recalculateWalletDerivedMetrics(db, userId);

    const deposits = db.transactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    const withdrawals = db.withdrawals
      .filter((w) => w.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unifiedTransactions = db.unifiedTransactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const ledgerEntries = db.ledgerEntries
      .filter((l) => l.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const orders = db.orders
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const notifications = db.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const referrals = ledger.getReferralStats(userId);

    res.json({
      user: formatSafeUser(req.user!),
      wallet,
      deposits,
      withdrawals,
      unifiedTransactions,
      ledgerEntries,
      orders,
      notifications,
      referrals,
      withdrawalMethods: db.withdrawalMethods.filter((m) => m.active),
    });
  });

  app.get('/api/user/referrals', requireAuth, (req: AuthenticatedRequest, res) => {
    const stats = ledger.getReferralStats(req.user!.id);
    res.json(stats);
  });

  app.get('/api/transactions/my', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = ledger.readDbSync();
    const list = db.transactions
      .filter((t) => t.userId === req.user!.id)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    res.json({ transactions: list });
  });

  // --- Create Deposit / Payment Submission ---
  app.post(
    '/api/transactions',
    requireAuth,
    rateLimit(12, 60_000),
    async (req: AuthenticatedRequest, res) => {
      const parsed = DepositSubmitSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid deposit details',
        });
      }

      try {
        const deposit = await ledger.createDeposit({
          userId: req.user!.id,
          planId: parsed.data.planId,
          transactionId: sanitizeText(parsed.data.transactionId),
          amount: parsed.data.amount,
          senderNumber: sanitizeText(parsed.data.senderNumber),
          paymentProofNote: parsed.data.paymentProofNote
            ? sanitizeText(parsed.data.paymentProofNote)
            : '',
          creditToWalletOnly: parsed.data.creditToWalletOnly,
          idempotencyKey: parsed.data.idempotencyKey,
        });

        return res.status(201).json({
          transaction: deposit,
          message:
            'Payment reference recorded with status: PENDING. An administrator will verify your Easypaisa Transaction ID before crediting your account.',
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to submit deposit';
        return res.status(msg.includes('already been submitted') ? 409 : 400).json({
          error: msg,
        });
      }
    }
  );

  // --- Purchase Service Plan Using Available Wallet Balance ---
  app.post(
    '/api/orders/purchase-wallet',
    requireAuth,
    rateLimit(10, 60_000),
    async (req: AuthenticatedRequest, res) => {
      const parsed = WalletPurchaseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid purchase request',
        });
      }

      try {
        const order = await ledger.purchasePlanWithWallet({
          userId: req.user!.id,
          planId: parsed.data.planId,
          idempotencyKey: parsed.data.idempotencyKey,
        });
        return res.status(201).json({
          order,
          message: `Successfully purchased and activated ${order.planName} using your Available Balance.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to purchase plan';
        return res.status(400).json({ error: msg });
      }
    }
  );

  // --- Create Withdrawal Request ---
  app.post(
    '/api/withdrawals',
    requireAuth,
    rateLimit(10, 60_000),
    async (req: AuthenticatedRequest, res) => {
      const parsed = WithdrawalCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid withdrawal request',
        });
      }

      try {
        const withdrawal = await ledger.createWithdrawal({
          userId: req.user!.id,
          amount: parsed.data.amount,
          methodId: parsed.data.methodId,
          accountTitle: sanitizeText(parsed.data.accountTitle),
          accountNumber: sanitizeText(parsed.data.accountNumber),
          bankName: parsed.data.bankName ? sanitizeText(parsed.data.bankName) : undefined,
          saveAccount: parsed.data.saveAccount,
          idempotencyKey: parsed.data.idempotencyKey,
        });

        return res.status(201).json({
          withdrawal,
          message: `Withdrawal request ${withdrawal.id} created (Status: PENDING). Rs. ${withdrawal.amount.toLocaleString()} has been reserved from your Available Balance pending administrator review.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Withdrawal failed';
        return res.status(400).json({ error: msg });
      }
    }
  );

  // --- User Cancel Own Pending Withdrawal ---
  app.post(
    '/api/withdrawals/:id/cancel',
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const withdrawal = await ledger.cancelUserWithdrawal({
          userId: req.user!.id,
          withdrawalId: req.params.id,
        });
        return res.json({
          withdrawal,
          message: `Withdrawal ${withdrawal.id} has been cancelled and Rs. ${withdrawal.amount.toLocaleString()} returned to your Available Balance.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not cancel withdrawal';
        return res.status(400).json({ error: msg });
      }
    }
  );

  // --- Manage User Saved Payout Accounts ---
  app.post(
    '/api/profile/payout-accounts',
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      const parsed = SavedPayoutAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid payout account details',
        });
      }

      try {
        const saved = await ledger.runInTransaction((db) => {
          const user = db.users.find((u) => u.id === req.user!.id);
          if (!user) throw new Error('User not found.');
          const method = db.withdrawalMethods.find((m) => m.id === parsed.data.methodId);
          if (!method) throw new Error('Selected withdrawal method not found.');

          const newAcc = {
            id: `spa-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
            methodId: method.id,
            methodName: method.name,
            accountTitle: sanitizeText(parsed.data.accountTitle),
            accountNumber: sanitizeText(parsed.data.accountNumber),
            bankName: parsed.data.bankName ? sanitizeText(parsed.data.bankName) : undefined,
            createdAt: new Date().toISOString(),
          };
          user.savedPayoutAccounts.push(newAcc);
          return newAcc;
        });

        return res.status(201).json({ account: saved });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to save payout account';
        return res.status(400).json({ error: msg });
      }
    }
  );

  app.delete(
    '/api/profile/payout-accounts/:id',
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        await ledger.runInTransaction((db) => {
          const user = db.users.find((u) => u.id === req.user!.id);
          if (!user) throw new Error('User not found.');
          user.savedPayoutAccounts = user.savedPayoutAccounts.filter(
            (a) => a.id !== req.params.id
          );
        });
        return res.json({ success: true });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete payout account';
        return res.status(400).json({ error: msg });
      }
    }
  );

  app.post(
    '/api/notifications/read-all',
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      await ledger.runInTransaction((db) => {
        for (const n of db.notifications) {
          if (n.userId === req.user!.id) {
            n.read = true;
          }
        }
      });
      res.json({ success: true });
    }
  );

  // --- Public & Client Support Inquiries ---
  app.post('/api/inquiries', rateLimit(10, 60_000), async (req, res) => {
    const parsed = InquirySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Please check your inquiry fields.',
      });
    }

    const inquiry = await ledger.runInTransaction((db) => {
      const item = {
        id: `inq-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        name: sanitizeText(parsed.data.name),
        contactInfo: sanitizeText(parsed.data.contactInfo),
        subject: sanitizeText(parsed.data.subject),
        message: sanitizeText(parsed.data.message),
        status: 'Open' as const,
        adminReply: '',
        createdAt: new Date().toISOString(),
      };
      db.inquiries.push(item);
      return item;
    });

    return res.status(201).json({
      inquiry,
      message:
        'Your support request has been logged. For immediate assistance, you can also message us directly on Telegram (@rextrades0).',
    });
  });

  // --- ADMIN ROUTES (Strictly Server-Side Protected) ---
  app.get('/api/admin/overview', requireAdmin, (_req: AuthenticatedRequest, res) => {
    const db = ledger.readDbSync();
    for (const u of db.users) {
      ledger.recalculateWalletDerivedMetrics(db, u.id);
    }

    const safeUsers = db.users.map((u) => {
      const invested = ledger.calculateUserInvested(db, u.id);
      return formatSafeUser(u, invested);
    });

    res.json({
      settings: db.settings,
      users: safeUsers,
      wallets: db.wallets,
      plans: db.plans,
      loginLogs: db.loginLogs || [],
      transactions: [...db.transactions].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      ),
      withdrawals: [...db.withdrawals]
        .map((w) => ({
          ...w,
          maskedAccountNumber: w.maskedAccountNumber || maskAccountNumber(w.accountNumber),
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      withdrawalMethods: db.withdrawalMethods,
      ledgerEntries: [...db.ledgerEntries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      unifiedTransactions: [...db.unifiedTransactions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      orders: [...db.orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      auditLogs: [...db.auditLogs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
      inquiries: [...db.inquiries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      referralLogs: [...(db.referralLogs || [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    });
  });

  // Admin: Review Deposit
  app.patch(
    '/api/admin/transactions/:id',
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      const parsed = DepositReviewSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid review payload',
        });
      }

      try {
        const tx = await ledger.reviewDeposit({
          adminId: req.user!.id,
          depositId: req.params.id,
          status: parsed.data.status,
          adminNotes: parsed.data.adminNotes ? sanitizeText(parsed.data.adminNotes) : '',
          ipAddress: req.ip || '127.0.0.1',
          userAgent: String(req.headers['user-agent'] || 'admin-console'),
        });
        return res.json({ transaction: tx });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to review deposit';
        return res.status(400).json({ error: msg });
      }
    }
  );

  // Admin: Review / Process / Complete Withdrawal
  app.patch(
    '/api/admin/withdrawals/:id',
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      const parsed = AdminWithdrawalUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid withdrawal update payload',
        });
      }

      try {
        const wd = await ledger.adminUpdateWithdrawal({
          adminId: req.user!.id,
          withdrawalId: req.params.id,
          status: parsed.data.status,
          adminNotes: parsed.data.adminNotes ? sanitizeText(parsed.data.adminNotes) : undefined,
          confirmRealPayoutSent: parsed.data.confirmRealPayoutSent,
          payoutReference: parsed.data.payoutReference
            ? sanitizeText(parsed.data.payoutReference)
            : undefined,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: String(req.headers['user-agent'] || 'admin-console'),
        });
        return res.json({ withdrawal: wd });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update withdrawal';
        return res.status(400).json({ error: msg });
      }
    }
  );

  // Admin: Controlled Balance Adjustment / Refund
  app.post(
    '/api/admin/wallets/adjust',
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      const parsed = AdminBalanceAdjustSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid balance adjustment payload',
        });
      }

      try {
        const result = await ledger.adminAdjustBalance({
          adminId: req.user!.id,
          targetUserId: parsed.data.targetUserId,
          direction: parsed.data.direction,
          category: parsed.data.category,
          amount: parsed.data.amount,
          reason: sanitizeText(parsed.data.reason),
          ipAddress: req.ip || '127.0.0.1',
          userAgent: String(req.headers['user-agent'] || 'admin-console'),
        });
        return res.status(201).json(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to adjust balance';
        return res.status(400).json({ error: msg });
      }
    }
  );

  // Admin: Configure Withdrawal Methods
  app.post(
    '/api/admin/withdrawal-methods',
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      const parsed = WithdrawalMethodSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid withdrawal method payload',
        });
      }

      try {
        const method = await ledger.adminSaveWithdrawalMethod({
          adminId: req.user!.id,
          method: {
            id: parsed.data.id,
            name: sanitizeText(parsed.data.name),
            code: sanitizeText(parsed.data.code).toUpperCase(),
            minAmount: parsed.data.minAmount,
            maxAmount: parsed.data.maxAmount,
            feePercent: parsed.data.feePercent,
            feeFixed: parsed.data.feeFixed,
            accountLabel: sanitizeText(parsed.data.accountLabel),
            requiresBankName: parsed.data.requiresBankName,
            instructions: sanitizeText(parsed.data.instructions),
            active: parsed.data.active,
          },
          ipAddress: req.ip || '127.0.0.1',
          userAgent: String(req.headers['user-agent'] || 'admin-console'),
        });
        return res.json({ method });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to save withdrawal method';
        return res.status(400).json({ error: msg });
      }
    }
  );

  // Admin: Manage Plans
  app.post('/api/admin/plans', requireAdmin, async (req: AuthenticatedRequest, res) => {
    const parsed = PlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid plan configuration',
      });
    }

    const newPlan = await ledger.runInTransaction((db) => {
      const plan = {
        id: `plan-${Date.now()}`,
        name: sanitizeText(parsed.data.name),
        targetAudience: sanitizeText(parsed.data.targetAudience),
        price: sanitizeText(parsed.data.price),
        dailyProfit: parsed.data.dailyProfit ? sanitizeText(parsed.data.dailyProfit) : undefined,
        totalProfit: parsed.data.totalProfit ? sanitizeText(parsed.data.totalProfit) : undefined,
        currency: sanitizeText(parsed.data.currency),
        duration: sanitizeText(parsed.data.duration),
        description: sanitizeText(parsed.data.description),
        features: parsed.data.features.map((f) => sanitizeText(f)),
        ctaText: sanitizeText(parsed.data.ctaText),
        isPopular: Boolean(parsed.data.isPopular),
        active: Boolean(parsed.data.active),
      };
      db.plans.push(plan);
      return plan;
    });

    return res.status(201).json({ plan: newPlan });
  });

  app.delete('/api/admin/plans/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      await ledger.runInTransaction((db) => {
        const idx = db.plans.findIndex((p) => p.id === req.params.id);
        if (idx === -1) throw new Error('Plan not found.');
        db.plans.splice(idx, 1);
      });
      return res.json({ success: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete plan';
      return res.status(404).json({ error: msg });
    }
  });

  app.patch('/api/admin/inquiries/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
    const parsed = InquiryUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid inquiry update',
      });
    }

    try {
      const inquiry = await ledger.runInTransaction((db) => {
        const item = db.inquiries.find((i) => i.id === req.params.id);
        if (!item) throw new Error('Support inquiry not found.');
        item.status = parsed.data.status;
        item.adminReply = sanitizeText(parsed.data.adminReply);
        return item;
      });
      return res.json({ inquiry });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Inquiry not found';
      return res.status(404).json({ error: msg });
    }
  });

  app.put('/api/admin/settings', requireAdmin, async (req: AuthenticatedRequest, res) => {
    const parsed = SettingsUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid settings data',
      });
    }

    const settings = await ledger.runInTransaction((db) => {
      if (parsed.data.logoUrl !== undefined) {
        db.settings.logoUrl = parsed.data.logoUrl ? parsed.data.logoUrl.trim() : null;
      }
      if (parsed.data.heroHeadline !== undefined) {
        db.settings.heroHeadline = sanitizeText(parsed.data.heroHeadline);
      }
      if (parsed.data.heroSubheadline !== undefined) {
        db.settings.heroSubheadline = sanitizeText(parsed.data.heroSubheadline);
      }
      if (parsed.data.announcementText !== undefined) {
        db.settings.announcementText = sanitizeText(parsed.data.announcementText);
      }
      return db.settings;
    });

    return res.json({ settings });
  });

  app.put('/api/admin/owner-password', requireAdmin, async (req: AuthenticatedRequest, res) => {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (!currentPassword || newPassword.length < 8) {
      return res.status(400).json({
        error: 'Please provide your current password and a new password of at least 8 characters.',
      });
    }
    try {
      await ledger.adminChangePassword({
        adminId: req.user!.id,
        currentPassword,
        newPassword,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: String(req.headers['user-agent'] || 'admin-console'),
      });
      return res.json({ success: true, message: 'Owner administrator password updated.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update password';
      return res.status(400).json({ error: msg });
    }
  });

  app.patch('/api/admin/users/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const updatedUser = await ledger.runInTransaction((db) => {
        const user = db.users.find((u) => u.id === req.params.id);
        if (!user) throw new Error('User not found.');
        const prev = `status=${user.status}; role=${user.role}`;

        if (typeof req.body.activePlanId === 'string' || req.body.activePlanId === null) {
          user.activePlanId = req.body.activePlanId;
        }
        if (req.body.status === 'ACTIVE' || req.body.status === 'SUSPENDED') {
          if (user.id !== req.user!.id && !isAuthorizedAdminEmail(user.identifier)) {
            user.status = req.body.status;
          }
        }
        // Strictly forbid promoting any unauthorized account to admin
        user.role = isAuthorizedAdminEmail(user.identifier) ? 'admin' : 'user';

        db.auditLogs.push({
          id: `AUD-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
          adminId: req.user!.id,
          adminName: req.user!.name,
          action: 'USER_ACCOUNT_UPDATED',
          targetUserId: user.id,
          targetUserName: user.name,
          entityType: 'USER',
          entityId: user.id,
          amount: null,
          previousState: prev,
          newState: `status=${user.status}; role=${user.role}; plan=${user.activePlanId || 'none'}`,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: String(req.headers['user-agent'] || 'admin-console'),
          timestamp: new Date().toISOString(),
        });

        return formatSafeUser(user);
      });

      return res.json({ user: updatedUser });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'User update failed';
      return res.status(404).json({ error: msg });
    }
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      const msg = err instanceof Error ? err.message : 'Unexpected server error.';
      return res.status(400).json({ error: msg });
    }
    next(err);
  });

  const isDev =
    process.env.NODE_ENV !== 'production' &&
    process.execArgv.some((arg) => arg.includes('tsx'));

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`REX TRADERS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
