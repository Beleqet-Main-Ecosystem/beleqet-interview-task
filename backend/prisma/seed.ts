import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Beleqet database...');

  // ── Job Categories ─────────────────────────────────────────────────────────
  const rawJobCategories = [
    "Accounting And Finance", "Advisory And Consultancy", "Aeronautics And Aerospace",
    "Agriculture", "Architecture And Urban Planning", "Beauty And Grooming",
    "Broker And Case Closer", "Business And Commerce", "Chemical And Biomedical Engineering",
    "Clothing And Textile", "Construction And Civil Engineering", "Creative Art And Design",
    "Customer Service And Care", "Data Mining And Analytics", "Documentation And Writing Services",
    "Entertainment", "Environmental And Energy Engineering", "Event Management And Organization",
    "Fashion Design", "Food And Drink Preparation Or Service", "Gardening And Landscaping",
    "Health Care", "Horticulture", "Hospitality And Tourism", "Human Resource And Talent Management",
    "Information Technology", "Installation And Maintenance Technician", "Janitorial And Other Office Services",
    "Labor Work And Masonry", "Law", "Livestock And Animal Husbandry", "Logistic And Supply Chain",
    "Manufacturing And Production", "Marketing And Advertisement", "Mechanical And Electrical Engineering",
    "Media And Communication", "Multimedia Content Production", "Pharmaceutical",
    "Project Management And Administration", "Psychiatry, Psychology And Social Work",
    "Purchasing And Procurement", "Research And Data Analytics", "Sales And Promotion",
    "Secretarial And Office Management", "Security And Safety", "Shop And Office Attendant",
    "Software Design And Development", "Teaching And Tutor", "Training And Consultancy",
    "Training And Mentorship", "Translation And Transcription", "Transportation",
    "Transportation And Delivery", "Veterinary", "Woodwork And Carpentry"
  ];

  const categories = await Promise.all(
    rawJobCategories.map(cat => {
      const slug = cat.toLowerCase().replace(/[, ]+/g, '-').replace(/-+$/g, '');
      return prisma.jobCategory.upsert({
        where: { slug },
        update: {},
        create: { slug, label: cat, icon: 'briefcase' } // generic icon as default
      });
    })
  );
  console.log('✅ Job categories created');

  // ── Freelance Categories ───────────────────────────────────────────────────
  await Promise.all([
    prisma.freelanceCategory.upsert({ where: { slug: 'graphic-design' },    update: {}, create: { slug: 'graphic-design',    label: 'Graphic Design',      icon: 'palette' } }),
    prisma.freelanceCategory.upsert({ where: { slug: 'web-development' },   update: {}, create: { slug: 'web-development',   label: 'Web Development',     icon: 'code-2' } }),
    prisma.freelanceCategory.upsert({ where: { slug: 'digital-marketing' }, update: {}, create: { slug: 'digital-marketing', label: 'Digital Marketing',   icon: 'megaphone' } }),
    prisma.freelanceCategory.upsert({ where: { slug: 'video-animation' },   update: {}, create: { slug: 'video-animation',   label: 'Video & Animation',   icon: 'clapperboard' } }),
    prisma.freelanceCategory.upsert({ where: { slug: 'writing' },           update: {}, create: { slug: 'writing',           label: 'Writing & Translation', icon: 'pen-line' } }),
  ]);
  console.log('✅ Freelance categories created');

  // ── Subscription Plans ─────────────────────────────────────────────────────
  const plans = [
    {
      slug: 'free',
      name: { en: 'Free Plan', am: 'ነፃ ዕቅድ' },
      description: { en: 'Basic plan to test Beleqet', am: 'መሠረታዊ ዕቅድ' },
      features: ['Post up to 2 jobs', 'Standard candidate screening', 'In-app notifications'],
      limits: { maxJobs: 2 },
      prices: [
        { currency: 'ETB', amount: 0, interval: 'MONTHLY' },
        { currency: 'ETB', amount: 0, interval: 'YEARLY' },
        { currency: 'USD', amount: 0, interval: 'MONTHLY' },
        { currency: 'USD', amount: 0, interval: 'YEARLY' },
      ],
    },
    {
      slug: 'pro',
      name: { en: 'Pro Plan', am: 'ፕሮ ዕቅድ' },
      description: { en: 'For growing teams and professional hiring', am: 'ለሚያድጉ ቡድኖች' },
      features: ['Post up to 15 jobs', 'Priority AI candidate scoring', 'Multi-channel notifications (Email, SMS, Push)', 'Dedicated support'],
      limits: { maxJobs: 15 },
      prices: [
        { currency: 'ETB', amount: 99900, interval: 'MONTHLY' },
        { currency: 'ETB', amount: 999900, interval: 'YEARLY' },
        { currency: 'USD', amount: 1900, interval: 'MONTHLY' },
        { currency: 'USD', amount: 19000, interval: 'YEARLY' },
      ],
    },
    {
      slug: 'enterprise',
      name: { en: 'Enterprise Plan', am: 'ኢንተርፕራይዝ ዕቅድ' },
      description: { en: 'Unlimited capabilities for large scale recruitment', am: 'ለከፍተኛ ቅጥር' },
      features: ['Unlimited jobs', 'Advanced custom screening templates', 'API access', 'Priority channels', 'Account manager'],
      limits: { maxJobs: 999999 },
      prices: [
        { currency: 'ETB', amount: 499900, interval: 'MONTHLY' },
        { currency: 'ETB', amount: 4999900, interval: 'YEARLY' },
        { currency: 'USD', amount: 9900, interval: 'MONTHLY' },
        { currency: 'USD', amount: 99900, interval: 'YEARLY' },
      ],
    },
  ];

  for (const planData of plans) {
    const plan = await prisma.subscriptionPlan.upsert({
      where: { slug: planData.slug },
      update: {
        name: planData.name,
        description: planData.description,
        features: planData.features,
        limits: planData.limits,
      },
      create: {
        slug: planData.slug,
        name: planData.name,
        description: planData.description,
        features: planData.features,
        limits: planData.limits,
      },
    });

    for (const priceData of planData.prices) {
      await prisma.subscriptionPlanPrice.upsert({
        where: {
          planId_currency_interval: {
            planId: plan.id,
            currency: priceData.currency,
            interval: priceData.interval as any,
          },
        },
        update: {
          amount: priceData.amount,
        },
        create: {
          planId: plan.id,
          currency: priceData.currency,
          amount: priceData.amount,
          interval: priceData.interval as any,
        },
      });
    }
  }
  console.log('✅ Subscription plans & prices created');

  console.log('\n🎉 Database seeded successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
