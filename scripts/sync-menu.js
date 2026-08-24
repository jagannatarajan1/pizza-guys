// Brings a database's menu up to exactly what scripts/menu-catalogue.js
// specifies — categories, products (name/price/description/allergens), the
// modifier catalogue, and which steps each product carries.
//
// Safe to point at a database holding an unrelated older catalogue: every
// product this menu needs is created or corrected by NAME, and any existing
// product in an audited category that isn't part of this menu is turned off
// (available: false) rather than deleted — nothing is destroyed, and past
// orders are unaffected since they store their own price/name snapshot.
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
const AUDITED_CATEGORIES = new Set(catalogue.PRODUCTS.map((p) => p.category))

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

  // ── 1. Categories — make sure every one this menu needs actually exists ───
  console.log('\n--- Categories ---')
  for (const cat of catalogue.CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { id: cat.id } })
    if (!existing) {
      note(`Adding missing category: ${cat.name}`)
      if (APPLY) {
        await prisma.category.create({
          data: { id: cat.id, name: cat.name, slug: cat.slug, icon: cat.icon, order: cat.order, visible: true },
        })
      }
    } else if (existing.name !== cat.name || !existing.visible) {
      note(`Fixing category: "${existing.name}"${!existing.visible ? ' (was hidden)' : ''} → "${cat.name}"`)
      if (APPLY) await prisma.category.update({ where: { id: cat.id }, data: { name: cat.name, visible: true } })
    }
  }

  // ── 2. Modifier tables (what the admin screen edits) ───────────────────────
  console.log('\n--- Modifier catalogue ---')
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

  // ── 3. Every product the menu requires — create or correct by name ────────
  console.log('\n--- Products ---')
  const keepNames = new Set()
  for (const target of catalogue.PRODUCTS) {
    keepNames.add(target.name.toLowerCase())
    const found = await prisma.product.findFirst({ where: { name: target.name } })
    const targetPricePence = pence(target.price)

    if (!found) {
      note(`Adding missing product: ${target.name} (${target.category}) £${target.price.toFixed(2)}`)
      if (APPLY) {
        await prisma.product.create({
          data: {
            name: target.name,
            description: target.description || '',
            price: targetPricePence,
            // The exact image this same product uses in the verified catalogue —
            // real only once the matching file has been copied onto this server's
            // disk too (rsync public/uploads/branding across); left blank rather
            // than invented for anything that had no photo there either.
            image: target.image || '',
            category: target.category,
            popular: !!target.popular,
            available: true,
            modifiers: '[]',   // step 4 below attaches the right steps
            allergens: JSON.stringify(target.allergens || []),
          },
        })
      }
      continue
    }

    const fixes = {}
    if (found.category !== target.category) fixes.category = target.category
    if (found.price !== targetPricePence) fixes.price = targetPricePence
    if (!found.available) fixes.available = true
    // Description/allergens are only filled in where the existing row is
    // blank — an admin's own wording on a correctly-named, correctly-priced
    // product is never silently overwritten.
    if (!found.description && target.description) fixes.description = target.description
    if ((!found.allergens || found.allergens === '[]') && target.allergens?.length) {
      fixes.allergens = JSON.stringify(target.allergens)
    }
    // Same rule as description: only fills a genuinely blank photo slot, so an
    // admin's own upload on a correctly-named product is never replaced.
    if (!found.image && target.image) fixes.image = target.image

    if (Object.keys(fixes).length > 0) {
      const bits = Object.entries(fixes).map(([k, v]) => `${k}: ${found[k]} → ${v}`)
      note(`Correcting ${target.name}: ${bits.join(', ')}`)
      if (APPLY) await prisma.product.update({ where: { id: found.id }, data: fixes })
    }
  }

  // ── 4. Legacy products in the same categories that aren't part of this menu
  //       are switched off, never deleted — past orders keep their own
  //       name/price snapshot regardless, so this can't affect order history.
  console.log('\n--- Legacy items in audited categories ---')
  const allInAuditedCats = await prisma.product.findMany({ where: { category: { in: [...AUDITED_CATEGORIES] } } })
  const orphans = allInAuditedCats.filter((p) => !keepNames.has(p.name.toLowerCase()) && p.available)
  if (orphans.length === 0) {
    console.log('  none')
  } else {
    for (const p of orphans) {
      note(`Turning off legacy item not on this menu: "${p.name}" (${p.category}) £${(p.price / 100).toFixed(2)} — still in the database, just hidden from customers`)
      if (APPLY) await prisma.product.update({ where: { id: p.id }, data: { available: false } })
    }
    console.log(`  (${orphans.length} item(s) — review in /admin/products and delete any you don't want to keep)`)
  }

  // ── 4b. Categories this menu replaces outright ────────────────────────────
  //        Same treatment as a legacy item: switched off, never deleted, so
  //        the storefront stops offering two contradictory prices for what is
  //        effectively the same deal. Past orders are unaffected — they carry
  //        their own name/price snapshot.
  console.log('\n--- Retired categories ---')
  const retired = await prisma.product.findMany({
    where: { category: { in: catalogue.RETIRED_CATEGORIES }, available: true },
  })
  if (retired.length === 0) {
    console.log('  none')
  } else {
    for (const p of retired) {
      note(`Retiring superseded deal: "${p.name}" (${p.category}) £${(p.price / 100).toFixed(2)} — replaced by the Meal Deals menu, hidden not deleted`)
      if (APPLY) await prisma.product.update({ where: { id: p.id }, data: { available: false } })
    }
    // An empty category would otherwise sit in the menu nav with nothing
    // behind it.
    for (const catId of catalogue.RETIRED_CATEGORIES) {
      const left = await prisma.product.count({ where: { category: catId, available: true } })
      if (left === 0 && APPLY) {
        await prisma.category.updateMany({ where: { id: catId }, data: { visible: false } })
      }
    }
    note(`Hid ${retired.length} superseded deal product(s) and their now-empty categories`)
  }

  // ── 5. Attach the right steps to every product ─────────────────────────────
  console.log('\n--- Ordering steps ---')
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
