/**
 * BidOps seed — creates the Southern Shade tenant + owner account
 * Run: npx tsx packages/db/prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding BidOps...')

  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where:  { slug: 'southern-shade' },
    update: {},
    create: {
      name:         'Southern Shade Technologies LLC',
      slug:         'southern-shade',
      hubCertified: true,
      primaryNaics: ['541511', '541512', '541715', '541519'],
      status:       'ACTIVE',
    },
  })

  console.log(`Tenant: ${tenant.name} (${tenant.id})`)

  // Create owner user — change password before production
  const password = process.env.SEED_PASSWORD ?? 'BidOps2026!'

  const user = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email:    'admin@southernshadetechnologies.com',
      },
    },
    update: {},
    create: {
      tenantId:     tenant.id,
      email:        'admin@southernshadetechnologies.com',
      name:         'Southern Shade Admin',
      passwordHash: hashSync(password, 12),
      role:         'OWNER',
    },
  })

  console.log(`User: ${user.email} / role: ${user.role}`)
  console.log(`Password: ${password}`)
  console.log('Done.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
