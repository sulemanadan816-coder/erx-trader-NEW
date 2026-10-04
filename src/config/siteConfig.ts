import {
  FAQItem,
  FeatureItem,
  HowItWorksStep,
  ReferralLevel,
  ServicePlan,
  SiteSettings,
} from '../types';
import heroWorkspaceImg from '../assets/images/hero_rex_traders_workspace_1790791807080.jpg';

/**
 * CENTRAL CONFIGURATION FILE — REX TRADERS
 * Official contact details, official logo path, 12 investment plans, and referral structure.
 */
export const SITE_CONFIG: SiteSettings = {
  brandName: 'TrustZone',
  logoUrl: null,
  logoAlt: 'TrustZone Official Logo',
  whatsappChannelUrl: 'https://whatsapp.com/channel/0029Vb5ZICEFSAt01mUETp3z',
  telegramSupportUrl: 'https://t.me/rextrades0',
  telegramHandle: '@rextrades0',
  easypaisaNumber: '03260767504',
  easypaisaAccountLabel: 'Official TrustZone Easypaisa Account',
  heroHeadline: 'Invest with clarity. Grow with NexaPay.',
  heroSubheadline:
    'TrustZone is a trusted and secure online investment platform offering smart investment plans with guaranteed daily returns. Start earning passive income today with instant deposits and fast withdrawals. Join thousands of investors building their financial future with TrustZone.',
  announcementText:
    'Official communication is conducted exclusively through our verified Telegram support (@rextrades0) and WhatsApp Channel.',
};

export const HERO_VISUAL_ASSET = heroWorkspaceImg;

export const REFERRAL_LEVELS: ReferralLevel[] = [
  {
    level: 'Level 1',
    commission: '13%',
    description: 'Direct referral commission on Level 1 partner plan activations',
  },
  {
    level: 'Level 2',
    commission: '2%',
    description: 'Secondary network commission on Level 2 plan activations',
  },
  {
    level: 'Level 3',
    commission: '1%',
    description: 'Third-tier network commission on Level 3 plan activations',
  },
];

export const DEFAULT_PLANS: ServicePlan[] = [
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
    totalProfit: 'Rs4,481,010.00',
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

export const DEFAULT_FEATURES: FeatureItem[] = [
  {
    id: 'feat-1',
    number: '01',
    title: '12 Structured 30-Day Packages',
    description:
      'Choose from 12 clearly defined 30-day plans starting from Rs. 1,200 up to Rs. 300,000 with transparent daily and total profit schedules.',
    outcome: 'PKR 1,200 to PKR 300,000 tiers',
  },
  {
    id: 'feat-2',
    number: '02',
    title: '3-Level Referral Commission',
    description:
      'Earn structured referral rewards across three tiers: 12% on Level 1, 03% on Level 2, and 02% on Level 3 team activations.',
    outcome: '12% · 03% · 02% referral levels',
  },
  {
    id: 'feat-3',
    number: '03',
    title: 'Direct Support & Guidance',
    description:
      'Connect directly with the REX TRADERS support desk on Telegram (@rextrades0) for onboarding questions, plan selection, and account assistance.',
    outcome: 'Direct Telegram support (@rextrades0)',
  },
  {
    id: 'feat-4',
    number: '04',
    title: 'Convenient Easypaisa Deposits',
    description:
      'Transfer your selected plan investment to our official Easypaisa account (03260767504) and log your Transaction ID in the Client Portal.',
    outcome: 'Official Easypaisa: 03260767504',
  },
  {
    id: 'feat-5',
    number: '05',
    title: 'Official WhatsApp Channel Updates',
    description:
      'Stay informed with official announcements, schedule notices, and community updates broadcast via our official WhatsApp Channel.',
    outcome: 'Official WhatsApp Channel broadcasts',
  },
  {
    id: 'feat-6',
    number: '06',
    title: 'Verified Account & Payment Workflow',
    description:
      'Submit Easypaisa transaction details directly in your account portal. Every submission is manually reviewed by an administrator before status approval.',
    outcome: 'Manual administrator payment verification',
  },
];

export const DEFAULT_HOW_IT_WORKS: HowItWorksStep[] = [
  {
    stepNumber: '01',
    title: 'Select Your 30-Day Plan',
    description:
      'Review the 12 official REX TRADERS packages (from 1,200 PKR to 300,000 PKR) and choose the tier that fits your budget.',
    actionLabel: 'Browse 12 Plans',
  },
  {
    stepNumber: '02',
    title: 'Transfer via Official Easypaisa',
    description:
      'Send the exact investment amount for your chosen plan to our official Easypaisa number (03260767504) and save your Transaction ID (TID).',
    actionLabel: 'Copy Easypaisa Number',
  },
  {
    stepNumber: '03',
    title: 'Submit Transaction ID in Portal',
    description:
      'Sign in to the REX TRADERS Client Portal (or message Telegram Support @rextrades0) and submit your Transaction ID and sender number.',
    actionLabel: 'Submit Payment Reference',
  },
  {
    stepNumber: '04',
    title: 'Admin Approval & Plan Activation',
    description:
      'Our administrator verifies your Easypaisa transfer and marks your transaction Approved, activating your 30-day plan in your dashboard.',
    actionLabel: 'Open Client Portal',
  },
];

export const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Plans & Packages',
    question: 'What investment plans are available on REX TRADERS?',
    answer:
      'REX TRADERS offers 12 official 30-day plans: 1,200 PKR, 3,300 PKR, 8,000 PKR, 15,000 PKR, 28,000 PKR, 45,000 PKR, 62,000 PKR, 85,000 PKR, 115,000 PKR, 180,000 PKR, 250,000 PKR, and 300,000 PKR. Each plan has a 30-day (30 دن) duration.',
  },
  {
    id: 'faq-2',
    category: 'Referral Commission',
    question: 'How does the REX TRADERS Referral Commission work?',
    answer:
      'REX TRADERS features a 3-tier referral commission structure: Level 1 pays 12%, Level 2 pays 03%, and Level 3 pays 02% on qualified plan activations.',
  },
  {
    id: 'faq-3',
    category: 'Payments',
    question: 'How do I pay for my selected plan?',
    answer:
      'Send your chosen plan investment amount to our official Easypaisa number: 03260767504. Once sent, sign in to the Client Portal and submit your Transaction ID (TID), amount, and sender number for manual administrator verification.',
  },
  {
    id: 'faq-4',
    category: 'Payments',
    question: 'Are Easypaisa payments verified manually?',
    answer:
      'Yes. Every submitted Transaction ID starts with a Pending status and is only marked Approved after an administrator manually verifies the transfer against our official Easypaisa account.',
  },
  {
    id: 'faq-5',
    category: 'Contact & Channels',
    question: 'What are the official communication channels for REX TRADERS?',
    answer:
      'Our official communication channels are our Telegram Support (@rextrades0 at https://t.me/rextrades0) and our official WhatsApp Channel (https://whatsapp.com/channel/0029Vb5ZICEFSAt01mUETp3z).',
  },
  {
    id: 'faq-6',
    category: 'Account',
    question: 'How can I check the status of my submitted payment or active plan?',
    answer:
      'Sign in to the Client Portal using your registered account credentials. Your dashboard displays your current plan status, submitted Easypaisa transaction records (Pending, Approved, or Rejected), and any notes from the administrator.',
  },
];
