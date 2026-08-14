import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/master_app?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function mapStage(item: any): string {
  const incStage = item.incStage ? String(item.incStage).trim().toLowerCase() : '';
  const poSigned = item.poSigned ? String(item.poSigned).trim().toLowerCase() : '';
  const colS = item.status ? String(item.status).trim().toLowerCase() : ''; // Column S
  const docSub = item.docSubmitted ? String(item.docSubmitted).trim().toLowerCase() : '';
  const docStatus = item.documentStatus ? String(item.documentStatus).trim().toLowerCase() : '';
  const status = item.statusW ? String(item.statusW).trim().toLowerCase() : '';
  const sealing = item.sealingIndent ? String(item.sealingIndent).trim().toLowerCase() : '';
  const dcr = item.dcr ? String(item.dcr).trim() : '';
  const pcr = item.pcr ? String(item.pcr).trim().toLowerCase() : '';
  const subsidy = item.subsidyRedeem ? String(item.subsidyRedeem).trim().toLowerCase() : '';

  // Work backwards from most completed to least
  if (subsidy === 'complete') return 'SUBSIDY_REDEEMED';
  if (pcr === 'complete') return 'PCR_FILED';
  if (dcr) return 'DCR_FILED';
  if (sealing && (sealing.includes('recived') || sealing.includes('received'))) return 'METER_SEALING';
  if (docStatus && (docStatus.includes('ok') || docStatus.includes('recvid') || docStatus.includes('recived'))) return 'DOC_VERIFIED';
  if (docSub && docSub.includes('yes')) return 'DOC_SUBMITTED';
  if (colS && (colS.includes('install') || colS.includes('configured') || colS.includes('sealing') || colS.includes('ended'))) return 'PLANT_INSTALLED';
  if (colS && colS.includes('file subm')) return 'DOC_SUBMITTED';
  if (incStage === 'complete' || incStage === 'completed') return 'CLOSED';
  if (incStage === 'civil' || incStage === 'working') return 'INC_IN_PROGRESS';
  if (incStage === 'inv' || incStage === 'b2b') return 'INVOICED';
  if (poSigned === 'signed' || poSigned === 'lmb2') return 'PO_SIGNED';
  if (poSigned === 'no') return 'LEAD_CAPTURED';

  return 'LEAD_CAPTURED';
}

async function main() {
  console.log('🌱 Starting database seed from parsed JSON data...');

  const dataPath = path.resolve(__dirname, 'seed_data.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ seed_data.json not found at ${dataPath}. Please run parse_numbers.py first.`);
    process.exit(1);
  }

  const seedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Loaded ${seedData.length} records to seed.`);

  // ─── 1. Create Default Admin User ──────────────────────────────────────────────
  console.log('👤 Creating default admin user if not exists...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.employee.upsert({
    where: { email: 'admin@arpitsolar.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@arpitsolar.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // ─── 2. Clean Only Customer, Project, and ActivityLog Tables ────────────────────
  console.log('🧹 Clearing Customer, Project, and ActivityLog tables (preserves Discom, Net Meter, Employees, Schedules)...');
  await prisma.activityLog.deleteMany();
  await prisma.customer.deleteMany(); // Cascades to Project table

  let customerCount = 0;
  let projectCount = 0;

  // ─── 3. Insert MasterSheet Data ────────────────────────────────────────────────
  console.log('📊 Seeding MasterSheet data...');
  for (const item of seedData) {
    try {
      const customer = await prisma.customer.create({
        data: {
          name: item.name,
          callingNo: item.callingNo,
          mobile: item.mobile,
          caNumber: item.caNumber,
          division: item.division,
          location: item.location,
        },
      });
      customerCount++;

      const stage = mapStage(item);

      await prisma.project.create({
        data: {
          customerId: customer.id,
          capacity: item.capacity,
          sourceOfLead: item.sourceOfLead,
          brandModel: item.brandModel,
          referral: item.referral,
          soldBy: item.soldBy,
          amount: item.amount,
          balance: item.balance,
          stage: stage as any,
          surveyStatus: item.surveyStatus,
          poSigned: item.poSigned,
          invoiceDate: item.invoiceDate ? new Date(item.invoiceDate) : null,
          incStage: item.incStage,
          plantStatus: item.plantStatus,
          docSubmitted: item.docSubmitted,
          documentStatus: item.documentStatus,
          meterTypeSl: item.meterTypeSl,
          status: item.status || item.statusW,
          sealingIndent: item.sealingIndent,
          dcr: item.dcr,
          instDetailSub: item.instDetailSub,
          pcr: item.pcr,
          subsidyRedeem: item.subsidyRedeem,
        },
      });
      projectCount++;
    } catch (err: any) {
      console.warn(`  ⚠️ Error importing ${item.name}: ${err.message?.substring(0, 80)}`);
    }
  }

  console.log(`\n🎉 Seed complete! Imported ${customerCount} customers and ${projectCount} projects.`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
