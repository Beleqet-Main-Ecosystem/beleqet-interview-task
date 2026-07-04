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

  // ── Demo users (password for all: Password123!) ───────────────────────────
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const employer = await prisma.user.upsert({
    where: { email: 'employer@beleqet.com' },
    update: {},
    create: {
      email: 'employer@beleqet.com',
      passwordHash,
      firstName: 'Sara',
      lastName: 'Bekele',
      role: 'EMPLOYER',
      emailVerified: true,
    },
  });

  const jobSeeker = await prisma.user.upsert({
    where: { email: 'seeker@beleqet.com' },
    update: {},
    create: {
      email: 'seeker@beleqet.com',
      passwordHash,
      firstName: 'Henok',
      lastName: 'Mekonnen',
      role: 'JOB_SEEKER',
      emailVerified: true,
      headline: 'Full Stack Developer',
      location: 'Addis Ababa',
      skills: ['React', 'Node.js', 'TypeScript'],
    },
  });

  const company = await prisma.company.upsert({
    where: { userId: employer.id },
    update: {},
    create: {
      userId: employer.id,
      name: 'TakaCash',
      description: 'Leading fintech company in Ethiopia building digital payment solutions.',
      location: 'Addis Ababa',
      industry: 'Finance',
      size: '51-200',
      verified: true,
    },
  });

  const employer2 = await prisma.user.upsert({
    where: { email: 'hr@ethiotelecom.et' },
    update: {},
    create: {
      email: 'hr@ethiotelecom.et',
      passwordHash,
      firstName: 'Meron',
      lastName: 'Tadesse',
      role: 'EMPLOYER',
      emailVerified: true,
    },
  });

  const telecomCompany = await prisma.company.upsert({
    where: { userId: employer2.id },
    update: {},
    create: {
      userId: employer2.id,
      name: 'ethio telecom',
      description: 'National telecommunications provider.',
      location: 'Addis Ababa',
      industry: 'Telecommunications',
      verified: true,
    },
  });

  const dashenEmployer = await prisma.user.upsert({
    where: { email: 'hr@dashenbank.com' },
    update: {},
    create: {
      email: 'hr@dashenbank.com',
      passwordHash,
      firstName: 'Abebe',
      lastName: 'Kebede',
      role: 'EMPLOYER',
      emailVerified: true,
    },
  });

  const dashenCompany = await prisma.company.upsert({
    where: { userId: dashenEmployer.id },
    update: {},
    create: {
      userId: dashenEmployer.id,
      name: 'Dashen Bank',
      description: 'One of Ethiopia\'s leading private banks.',
      location: 'Addis Ababa',
      industry: 'Banking',
      verified: true,
    },
  });

  console.log('✅ Demo users created (employer@beleqet.com / seeker@beleqet.com — Password123!)');

  // ── Demo jobs ─────────────────────────────────────────────────────────────
  const catSoftware = await prisma.jobCategory.findFirst({
    where: { slug: 'software-design-and-development' },
  });
  const catMarketing = await prisma.jobCategory.findFirst({
    where: { slug: 'marketing-and-advertisement' },
  });
  const catFinance = await prisma.jobCategory.findFirst({
    where: { slug: 'accounting-and-finance' },
  });
  const catDesign = await prisma.jobCategory.findFirst({
    where: { slug: 'creative-art-and-design' },
  });
  const catHR = await prisma.jobCategory.findFirst({
    where: { slug: 'human-resource-and-talent-management' },
  });

  const demoJobs = [
    {
      title: 'Full Stack Developer',
      description:
        'TakaCash is looking for a Full Stack Developer to build and maintain customer-facing fintech products. You will work across our Next.js front end and Node services, ship features end to end, and collaborate closely with product and design.',
      requirements: 'React, Node.js, PostgreSQL, 3+ years experience',
      location: 'Addis Ababa',
      type: 'FULL_TIME' as const,
      categoryId: catSoftware?.id,
      companyId: company.id,
      salaryMin: 35000,
      salaryMax: 55000,
      featured: true,
      tags: ['React', 'Node.js', 'PostgreSQL'],
    },
    {
      title: 'Digital Marketing Specialist',
      description:
        'Plan and execute digital campaigns across search, social, and Telegram channels. Own performance reporting and work with the brand team to grow qualified leads.',
      requirements: 'SEO, Paid Ads, Content Marketing',
      location: 'Addis Ababa',
      type: 'HYBRID' as const,
      categoryId: catMarketing?.id,
      companyId: telecomCompany.id,
      salaryMin: 25000,
      salaryMax: 40000,
      featured: true,
      tags: ['SEO', 'Paid Ads', 'Content'],
    },
    {
      title: 'Customer Service Agent',
      description:
        'Handle customer inquiries across branch and digital channels, resolve account issues, and maintain Dashen Bank\'s service standards.',
      requirements: 'Customer Care, Banking knowledge',
      location: 'Addis Ababa',
      type: 'FULL_TIME' as const,
      categoryId: catFinance?.id,
      companyId: dashenCompany.id,
      salaryMin: 15000,
      salaryMax: 22000,
      featured: true,
      tags: ['Customer Care', 'Banking'],
    },
    {
      title: 'Graphic Designer',
      description:
        'Design marketing assets, social creatives, and brand collateral for a fast-moving product team. Portfolio required.',
      requirements: 'Figma, Branding, Adobe Creative Suite',
      location: 'Remote',
      type: 'REMOTE' as const,
      categoryId: catDesign?.id,
      companyId: company.id,
      salaryMin: 20000,
      salaryMax: 35000,
      featured: true,
      tags: ['Figma', 'Branding'],
    },
    {
      title: 'HR Admin Officer',
      description:
        'Support recruitment, onboarding, and employee records for a growing tech team. Experience with HRIS tools is a plus.',
      requirements: 'HR administration, Recruitment, Excel',
      location: 'Addis Ababa',
      type: 'FULL_TIME' as const,
      categoryId: catHR?.id,
      companyId: telecomCompany.id,
      salaryMin: 18000,
      salaryMax: 28000,
      featured: false,
      tags: ['HR', 'Administration'],
    },
  ];

  for (const job of demoJobs) {
    const categoryId = job.categoryId;
    if (!categoryId) continue;
    const existing = await prisma.job.findFirst({
      where: { title: job.title, companyId: job.companyId },
    });
    if (!existing) {
      const { categoryId: _cat, ...rest } = job;
      await prisma.job.create({
        data: { ...rest, categoryId, status: 'PUBLISHED' },
      });
    }
  }
  console.log('✅ Demo jobs created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('   Login: employer@beleqet.com / seeker@beleqet.com');
  console.log('   Password: Password123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
