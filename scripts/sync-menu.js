// Applies scripts/menu-catalogue.js to the database.
//
//   node scripts/sync-menu.js          # show what would change
//   node scripts/sync-menu.js --apply  # write it
//
// Safe to re-run: everything is an upsert keyed on a stable id or product name.

require('./load-env.js')()
const { PrismaClient } = require('@prisma/client')
const catalogue = require('./menu-catalogue.js')

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')
const pence = (pounds) => Math.round(pounds * 100)

// The exact JSON shape the storefront reads out of Product.modifiers.
function groupToJson(group) {
  const json = {
    id: group.id,
    name: group.name,
    description: group.description || '',
    required: !!group.required,
    multiSelect: !!group.multiSelect,
    min: group.min ?? 0,
    max: group.max ?? 1,
    sortOrder: group.sortOrder ?? 0,
    options: group.options.map((o) => {
      const out = { id: o.id, name: o.name, price: o.price }
      if (o.tag) out.tag = o.tag
      if (o.priceBy) out.priceBy = o.priceBy
      return out
    }),
  }
  if (group.maxPerOption && group.maxPerOption > 1) json.maxPerOption = group.maxPerOption
  if (group.dependsOn) json.dependsOn = group.dependsOn
  if (group.priceDependsOn) json.priceDependsOn = group.priceDependsOn
  return json
}

async function main() {
  const changes = []
  const note = (msg) => { changes.push(msg); console.log(msg) }

  // ── 1. Modifier tables (what the admin screen edits) ──────────────────────
  const catalogueIds = new Set(catalogue.ALL_GROUPS.map((g) => g.id))
  const existingGroups = await prisma.modifierGroup.findMany({ select: { id: true, name: true } })
  const stale = existingGroups.filter((g) => !catalogueIds.has(g.id))
  if (stale.length) {
    note(`Removing ${stale.length} legacy placeholder modifier group(s): ${stale.map((g) => g.name).join(', ')}`)
    if (APPLY) await prisma.modifierGroup.deleteMany({ where: { id: { in: stale.map((g) => g.id) } } })
  }

  for (const group of catalogue.ALL_GROUPS) {
    const data = {
      name: group.name,
      description: group.description || '',
      required: !!group.required,
      multiSelect: !!group.multiSelect,
      min: group.min ?? 0,
      max: group.max ?? 1,
      maxPerOption: group.maxPerOption ?? 1,
      sortOrder: group.sortOrder ?? 0,
      dependsOnGroup: group.dependsOn ? group.dependsOn.groupId : null,
      dependsOnOptions: JSON.stringify(group.dependsOn ? group.dependsOn.optionIds : []),
      priceDependsOn: group.priceDependsOn ?? null,
    }
    if (APPLY) {
      await prisma.modifierGroup.upsert({ where: { id: group.id }, update: data, create: { id: group.id, ...data } })
      // Options are replaced wholesale so a removed option can't linger.
      await prisma.modifierOption.deleteMany({ where: { groupId: group.id } })
      await prisma.modifierOption.createMany({
        data: group.options.map((o, i) => ({
          id: `${group.id}__${o.id}`,
          groupId: group.id,
          name: o.name,
          price: pence(o.price),
          tag: o.tag || '',
          priceBy: JSON.stringify(
            o.priceBy ? Object.fromEntries(Object.entries(o.priceBy).map(([k, v]) => [k, pence(v)])) : {}
          ),
          sortOrder: i,
        })),
      })
    }
  }
  note(`Modifier catalogue: ${catalogue.ALL_GROUPS.length} groups, ${catalogue.ALL_GROUPS.reduce((n, g) => n + g.options.length, 0)} options`)

  // ── 2. Products the menu requires but the database is missing ─────────────
  for (const p of catalogue.MISSING_PRODUCTS) {
    const found = await prisma.product.findFirst({ where: { name: p.name, category: p.category } })
    if (found) continue
    note(`Adding missing product: ${p.name} (${p.category}) £${p.price.toFixed(2)}`)
    if (APPLY) {
      await prisma.product.create({
        data: {
          name: p.name,
          description: p.description || '',
          price: pence(p.price),
          image: '',
          category: p.category,
          popular: false,
          available: true,
          modifiers: '[]',
          allergens: JSON.stringify(p.allergens || []),
        },
      })
    }
  }

  // ── 3. Description wording ────────────────────────────────────────────────
  for (const [name, description] of Object.entries(catalogue.DESCRIPTION_FIXES)) {
    const found = await prisma.product.findFirst({ where: { name } })
    if (!found || found.description === description) continue
    note(`Fixing description: ${name}`)
    if (APPLY) await prisma.product.update({ where: { id: found.id }, data: { description } })
  }

  // ── 4. Attach the right steps to every product ────────────────────────────
  const products = await prisma.product.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] })
  let attached = 0
  let untouched = 0
  for (const product of products) {
    const steps = catalogue.stepsForProduct(product)
    if (!steps) { untouched++; continue }
    const json = JSON.stringify(steps.map(groupToJson))
    if (product.modifiers === json) { attached++; continue }
    note(`  ${product.category.padEnd(14)} ${product.name} → ${steps.length} step(s)`)
    if (APPLY) await prisma.product.update({ where: { id: product.id }, data: { modifiers: json } })
    attached++
  }
  note(`Products with steps attached: ${attached}; left exactly as they were: ${untouched}`)

  if (!APPLY) console.log('\nDRY RUN — nothing written. Re-run with --apply to save.')
  await prisma.$disconnect()
}

main().catch(async (e) => { console.error('FAILED:', e.message); await prisma.$disconnect(); process.exit(1) })
