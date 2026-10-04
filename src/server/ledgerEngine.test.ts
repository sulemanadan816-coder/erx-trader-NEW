import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  LedgerEngine,
  OWNER_ADMIN_EMAIL,
  SECONDARY_ADMIN_EMAIL,
  verifyPassword,
  signToken,
  verifyToken,
} from './ledgerEngine';

async function runAllTests() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rex-traders-test-'));
  const testDbPath = path.join(tempDir, 'test_db.json');
  const engine = new LedgerEngine(testDbPath);

  console.log('Running REX TRADERS Transactional Ledger & Withdrawal Test Suite...\n');

  // 1. Test Login & Authentication Token Signing/Verification (Both Exclusive Admins)
  {
    const db = engine.readDbSync();
    const admin = db.users.find((u) => u.identifier === OWNER_ADMIN_EMAIL)!;
    const secondAdmin = db.users.find((u) => u.identifier === SECONDARY_ADMIN_EMAIL)!;
    const client = db.users.find((u) => u.identifier === 'client@rextraders.com')!;
    const legacyAdmin = db.users.find((u) => u.identifier === 'admin@rextraders.com');

    assert.ok(admin, 'Seeded primary owner admin user should exist');
    assert.ok(secondAdmin, 'Seeded secondary admin (abubakararain104@gmail.com) should exist');
    assert.strictEqual(legacyAdmin, undefined, 'Legacy admin@rextraders.com must not exist');
    assert.ok(client, 'Seeded client user should exist');
    assert.strictEqual(verifyPassword('Suleman@Rex2026!', admin.passwordHash), true);
    assert.strictEqual(verifyPassword('Arain@786', secondAdmin.passwordHash), true);
    assert.strictEqual(verifyPassword('WrongPassword', admin.passwordHash), false);

    const token = signToken({
      userId: client.id,
      role: client.role,
      exp: Date.now() + 60_000,
    });
    const verified = verifyToken(token);
    assert.ok(verified);
    assert.strictEqual(verified?.userId, client.id);
    console.log('✓ [1/13] Login & cryptographic session token verification passed');
  }

  // 2. Test Authorization & Admin Permissions Enforcement
  {
    await assert.rejects(
      async () => {
        await engine.adminAdjustBalance({
          adminId: 'usr-client-1', // non-admin user ID!
          targetUserId: 'usr-client-1',
          direction: 'CREDIT',
          category: 'ADJUSTMENT',
          amount: 10000,
          reason: 'Unauthorized self-credit attempt',
        });
      },
      /Unauthorized: Administrator privileges required/,
      'Non-admin user must be blocked from administrative actions'
    );
    console.log('✓ [2/13] Authorization & server-side admin permission enforcement passed');
  }

  // 3. Test Initial Balance Calculation (Zero fabricated balance)
  {
    const db = engine.readDbSync();
    const wallet = engine.recalculateWalletDerivedMetrics(db, 'usr-client-1');
    assert.strictEqual(wallet.availableBalance, 0);
    assert.strictEqual(wallet.pendingBalance, 0);
    assert.strictEqual(wallet.totalBalance, 0);
    console.log('✓ [3/13] Initial wallet balance calculation (zero fabricated funds) passed');
  }

  // 4. Test Deposit Creation (Starts as PENDING, increases pendingBalance, does NOT increase availableBalance)
  let depositId = '';
  {
    const dep = await engine.createDeposit({
      userId: 'usr-client-1',
      planId: 'wallet-deposit',
      transactionId: 'TID9988776655',
      amount: 25000,
      senderNumber: '03001234567',
      creditToWalletOnly: true,
      idempotencyKey: 'idem-dep-1',
    });
    depositId = dep.id;
    assert.strictEqual(dep.status, 'Pending');

    const db = engine.readDbSync();
    const wallet = engine.recalculateWalletDerivedMetrics(db, 'usr-client-1');
    assert.strictEqual(
      wallet.availableBalance,
      0,
      'Pending deposit must NOT increase available balance before admin approval'
    );
    assert.strictEqual(
      wallet.pendingBalance,
      25000,
      'Pending deposit must be reflected in pendingBalance'
    );
    console.log('✓ [4/13] Deposit creation & pending balance segregation passed');
  }

  // 5. Test Payment Approval (Credits availableBalance, clears pending, creates immutable LedgerEntry & AuditLog)
  {
    const approved = await engine.reviewDeposit({
      adminId: 'usr-admin-owner',
      depositId,
      status: 'Approved',
      adminNotes: 'Verified against Easypaisa 03260767504 statement',
    });
    assert.strictEqual(approved.status, 'Approved');

    const db = engine.readDbSync();
    const wallet = engine.recalculateWalletDerivedMetrics(db, 'usr-client-1');
    assert.strictEqual(wallet.availableBalance, 25000);
    assert.strictEqual(wallet.pendingBalance, 0);
    assert.strictEqual(wallet.totalDeposited, 25000);
    const clientEntries = db.ledgerEntries.filter((l) => l.userId === 'usr-client-1');
    assert.strictEqual(clientEntries.length, 1);
    assert.strictEqual(clientEntries[0].balanceBefore, 0);
    assert.strictEqual(clientEntries[0].balanceAfter, 25000);
    console.log('✓ [5/13] Payment approval, wallet credit & immutable ledger entry passed');
  }

  // 6. Test Insufficient Balance Protection (User cannot withdraw more than availableBalance)
  {
    await assert.rejects(
      async () => {
        await engine.createWithdrawal({
          userId: 'usr-client-1',
          amount: 30000, // Available is only 25,000!
          methodId: 'wm-easypaisa',
          accountTitle: 'Demo Client',
          accountNumber: '03001234567',
        });
      },
      /Insufficient available balance/,
      'Must reject withdrawal exceeding available balance'
    );
    console.log('✓ [6/13] Insufficient balance withdrawal rejection passed');
  }

  // 7. Test Valid Withdrawal Creation (Reserves funds from availableBalance, sets status = PENDING)
  let firstWithdrawalId = '';
  {
    const wd = await engine.createWithdrawal({
      userId: 'usr-client-1',
      amount: 10000,
      methodId: 'wm-easypaisa',
      accountTitle: 'Demo Client',
      accountNumber: '03001234567',
      idempotencyKey: 'idem-wd-1',
    });
    firstWithdrawalId = wd.id;
    assert.strictEqual(wd.status, 'PENDING');
    assert.strictEqual(wd.amount, 10000);

    const db = engine.readDbSync();
    const wallet = engine.recalculateWalletDerivedMetrics(db, 'usr-client-1');
    assert.strictEqual(wallet.availableBalance, 15000, '10,000 must be reserved from 25,000');
    assert.strictEqual(wallet.reservedWithdrawalBalance, 10000);
    assert.strictEqual(wallet.pendingBalance, 10000);
    console.log('✓ [7/13] Withdrawal creation & atomic balance reservation passed');
  }

  // 8. Test Duplicate / Replayed Withdrawal Protection (Idempotency Key)
  {
    await assert.rejects(
      async () => {
        await engine.createWithdrawal({
          userId: 'usr-client-1',
          amount: 10000,
          methodId: 'wm-easypaisa',
          accountTitle: 'Demo Client',
          accountNumber: '03001234567',
          idempotencyKey: 'idem-wd-1', // Replayed key!
        });
      },
      /Duplicate or replayed withdrawal request rejected/,
      'Must reject duplicate idempotency key'
    );
    console.log('✓ [8/13] Duplicate/replayed withdrawal idempotency protection passed');
  }

  // 9. Test Withdrawal Rejection (Releases reserved funds back to availableBalance)
  {
    const rejected = await engine.adminUpdateWithdrawal({
      adminId: 'usr-admin-owner',
      withdrawalId: firstWithdrawalId,
      status: 'REJECTED',
      adminNotes: 'Account number verification mismatch',
    });
    assert.strictEqual(rejected.status, 'REJECTED');

    const db = engine.readDbSync();
    const wallet = engine.recalculateWalletDerivedMetrics(db, 'usr-client-1');
    assert.strictEqual(
      wallet.availableBalance,
      25000,
      'Rejected withdrawal must release reserved 10,000 back to availableBalance (25,000)'
    );
    assert.strictEqual(wallet.reservedWithdrawalBalance, 0);
    console.log('✓ [9/13] Withdrawal rejection & automatic release of reserved funds passed');
  }

  // 10. Test Concurrent Withdrawal Attempts (Race-condition protection: 5 simultaneous 10,000 PKR requests against 25,000 PKR balance)
  const succeededWithdrawals: string[] = [];
  {
    const attempts = [1, 2, 3, 4, 5].map((i) =>
      engine
        .createWithdrawal({
          userId: 'usr-client-1',
          amount: 10000,
          methodId: 'wm-easypaisa',
          accountTitle: 'Demo Client',
          accountNumber: '03001234567',
          idempotencyKey: `concurrent-wd-${i}`,
        })
        .then((w) => {
          succeededWithdrawals.push(w.id);
          return 'SUCCESS';
        })
        .catch(() => 'REJECTED')
    );

    const results = await Promise.all(attempts);
    const successCount = results.filter((r) => r === 'SUCCESS').length;
    const rejectCount = results.filter((r) => r === 'REJECTED').length;

    assert.strictEqual(
      successCount,
      2,
      'Exactly 2 of the 10,000 PKR withdrawals should succeed out of 25,000 PKR available'
    );
    assert.strictEqual(rejectCount, 3, 'Remaining 3 concurrent attempts must be rejected');

    const db = engine.readDbSync();
    const wallet = engine.recalculateWalletDerivedMetrics(db, 'usr-client-1');
    assert.strictEqual(wallet.availableBalance, 5000, 'Remaining available balance must be 5,000');
    assert.strictEqual(
      wallet.reservedWithdrawalBalance,
      20000,
      'Reserved withdrawal balance must be 20,000'
    );
    console.log('✓ [10/13] Concurrent withdrawal race-condition protection passed');
  }

  // 11. Test Withdrawal Completion Rule (Cannot mark COMPLETED without explicit real payout confirmation)
  {
    const targetWdId = succeededWithdrawals[0];

    // Move to PROCESSING first
    const proc = await engine.adminUpdateWithdrawal({
      adminId: 'usr-admin-owner',
      withdrawalId: targetWdId,
      status: 'PROCESSING',
      adminNotes: 'Approved for payout processing',
    });
    assert.strictEqual(proc.status, 'PROCESSING');

    // Attempt to mark COMPLETED without confirmRealPayoutSent -> MUST FAIL
    await assert.rejects(
      async () => {
        await engine.adminUpdateWithdrawal({
          adminId: 'usr-admin-owner',
          withdrawalId: targetWdId,
          status: 'COMPLETED',
          confirmRealPayoutSent: false,
        });
      },
      /Admin must explicitly confirm that the actual payment transfer has been completed/,
      'Must block COMPLETED status without explicit real payout confirmation'
    );

    // Now mark COMPLETED with confirmRealPayoutSent: true and payoutReference
    const completed = await engine.adminUpdateWithdrawal({
      adminId: 'usr-admin-owner',
      withdrawalId: targetWdId,
      status: 'COMPLETED',
      confirmRealPayoutSent: true,
      payoutReference: 'EP-PAYOUT-778899',
      adminNotes: 'Transferred via Easypaisa',
    });
    assert.strictEqual(completed.status, 'COMPLETED');
    assert.strictEqual(completed.payoutReference, 'EP-PAYOUT-778899');
    console.log('✓ [11/13] Withdrawal PROCESSING -> COMPLETED real payout confirmation rule passed');
  }

  // 12. Test Ledger Integrity (Every balance transition matches sequential balanceBefore -> balanceAfter)
  {
    const db = engine.readDbSync();
    const userLedger = db.ledgerEntries.filter((l) => l.userId === 'usr-client-1');
    assert.ok(userLedger.length >= 5, 'Should have recorded all balance-changing ledger entries');

    // Verify chronological chain of availableBalance changes
    let runningAvailable = 0;
    for (const entry of userLedger) {
      if (entry.type !== 'WITHDRAWAL_COMPLETED') {
        assert.strictEqual(
          entry.balanceBefore,
          runningAvailable,
          `Ledger entry ${entry.id} (${entry.type}) balanceBefore (${entry.balanceBefore}) must equal runningAvailable (${runningAvailable})`
        );
        runningAvailable =
          entry.direction === 'CREDIT'
            ? runningAvailable + entry.amount
            : runningAvailable - entry.amount;
        assert.strictEqual(
          entry.balanceAfter,
          runningAvailable,
          `Ledger entry ${entry.id} balanceAfter must match computed balance`
        );
      }
    }

    const wallet = engine.recalculateWalletDerivedMetrics(db, 'usr-client-1');
    assert.strictEqual(
      wallet.availableBalance,
      runningAvailable,
      'Authoritative wallet availableBalance must match final ledger balanceAfter'
    );
    console.log('✓ [12/13] Immutable ledger chain integrity & balance reconciliation passed');
  }

  // 13. Test Audit Log Integrity
  {
    const db = engine.readDbSync();
    assert.ok(db.auditLogs.length >= 4, 'All admin actions must be recorded in auditLogs');
    const actions = db.auditLogs.map((a) => a.action);
    assert.ok(actions.includes('DEPOSIT_APPROVED'));
    assert.ok(actions.includes('WITHDRAWAL_REJECTED'));
    assert.ok(actions.includes('WITHDRAWAL_PROCESSING'));
    assert.ok(actions.includes('WITHDRAWAL_COMPLETED'));
    console.log('✓ [13/14] Immutable administrator audit log verification passed');
  }

  // 14. Test Login Tracking & User Investment Calculation
  {
    const logEntry = await engine.recordLogin({
      userId: 'usr-client-1',
      ipAddress: '182.180.142.10',
      userAgent: 'Chrome 122.0.0 on Windows',
    });
    assert.ok(logEntry.id.startsWith('LOG-'));
    assert.strictEqual(logEntry.userId, 'usr-client-1');
    assert.strictEqual(logEntry.ipAddress, '182.180.142.10');
    assert.strictEqual(logEntry.userName, 'Client Account');

    const db = engine.readDbSync();
    const updatedClient = db.users.find((u) => u.id === 'usr-client-1')!;
    assert.ok(updatedClient.lastLoginAt);
    assert.strictEqual(updatedClient.lastLoginIp, '182.180.142.10');
    assert.ok(db.loginLogs.length >= 1, 'Login logs must contain entries');
    const totalInvested = engine.calculateUserInvested(db, 'usr-client-1');
    assert.strictEqual(typeof totalInvested, 'number');
    console.log('✓ [14/14] Client login tracking & investment surveillance verification passed');
  }

  // Cleanup temp directory
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('\nALL 14 LEDGER, WALLET, WITHDRAWAL, LOGIN & SECURITY TESTS PASSED SUCCESSFULLY.');
}

runAllTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
