import type { ModifierGroup } from './types'
import { activeGroups, optionUnitPrice, validateSelections, type Selections } from './modifier-pricing'

// The columns any order-creating route needs in order to price a line itself.
export type DbProductForPricing = {
  id: string
  name: string
  price: number       // pence — the DB is the only source for this
  category: string
  modifiers: string   // JSON blob; option prices inside are in pounds
}

// What a cart line looks like coming off the wire. Everything here is treated
// as a *request*, never as fact: only the ids are read, and the names and
// prices that come back out are the ones the database holds.
export type SubmittedModifierGroup = {
  groupId?: unknown
  options?: unknown
}

export type PricedModifierGroup = {
  groupId: string
  groupName: string
  options: { id: string; name: string; price: number }[]  // price in pounds, server-resolved
}

export type PricedItem = {
  unitPricePence: number
  itemTotalPence: number
  modifiers: PricedModifierGroup[]
}

export function parseProductModifiers(json: string): ModifierGroup[] {
  try {
    const parsed = JSON.parse(json || '[]')
    return Array.isArray(parsed) ? (parsed as ModifierGroup[]) : []
  } catch {
    return []
  }
}

// Reduce whatever the client sent to bare group id → option ids. Names and
// prices in the payload are discarded here on purpose.
export function selectionsFromSubmitted(submitted: unknown): Selections {
  const selections: Selections = {}
  if (!Array.isArray(submitted)) return selections

  for (const raw of submitted as SubmittedModifierGroup[]) {
    if (!raw || typeof raw !== 'object') continue
    const groupId = typeof raw.groupId === 'string' ? raw.groupId : null
    if (!groupId) continue
    const options = Array.isArray(raw.options) ? raw.options : []
    const ids: string[] = []
    for (const opt of options) {
      const id = opt && typeof opt === 'object' ? (opt as { id?: unknown }).id : opt
      if (typeof id === 'string' && id) ids.push(id)
    }
    // A group repeated in the payload is merged rather than overwritten, so a
    // split payload can't be used to dodge a maximum-selections check.
    selections[groupId] = [...(selections[groupId] ?? []), ...ids]
  }
  return selections
}

const MAX_SELECTIONS_PER_ITEM = 60

export type PriceItemResult =
  | ({ ok: true } & PricedItem)
  | { ok: false; error: string }

// Recalculate one cart line from scratch: base price from the database,
// modifier prices from the product's own stored definition, and every
// required/maximum/duplicate rule re-checked. Nothing the browser sent about
// money is carried through.
export function priceItem(
  product: DbProductForPricing,
  submittedModifiers: unknown,
  quantity: number
): PriceItemResult {
  const groups = parseProductModifiers(product.modifiers)
  const selections = selectionsFromSubmitted(submittedModifiers)

  const totalSelected = Object.values(selections).reduce((n, ids) => n + ids.length, 0)
  if (totalSelected > MAX_SELECTIONS_PER_ITEM) {
    return { ok: false, error: `Too many options selected for ${product.name}` }
  }

  // Selections naming a group this product doesn't even have are rejected
  // outright — otherwise a made-up group could smuggle in a made-up price.
  const knownGroupIds = new Set(groups.map((g) => g.id))
  for (const groupId of Object.keys(selections)) {
    if (!knownGroupIds.has(groupId)) {
      return { ok: false, error: `Invalid option for ${product.name}` }
    }
  }

  const productShape = { modifiers: groups }
  const verdict = validateSelections(productShape, selections)
  if (!verdict.ok) return { ok: false, error: verdict.error }

  let modifiersPence = 0
  const pricedGroups: PricedModifierGroup[] = []

  for (const group of activeGroups(productShape, selections)) {
    const chosen = selections[group.id] ?? []
    if (chosen.length === 0) continue

    const options: PricedModifierGroup['options'] = []
    for (const optId of chosen) {
      const option = (group.options ?? []).find((o) => o.id === optId)
      if (!option) return { ok: false, error: `Invalid option for ${product.name}` }
      const pounds = optionUnitPrice(group, option, selections)
      // Round per option before summing so a long list of 1.29s can't drift
      // away from what the customer was shown.
      modifiersPence += Math.round(pounds * 100)
      options.push({ id: option.id, name: option.name, price: pounds })
    }
    pricedGroups.push({ groupId: group.id, groupName: group.name, options })
  }

  const unitPricePence = product.price + modifiersPence
  if (unitPricePence < 0) return { ok: false, error: `Invalid price for ${product.name}` }

  return {
    ok: true,
    unitPricePence,
    itemTotalPence: unitPricePence * quantity,
    modifiers: pricedGroups,
  }
}
