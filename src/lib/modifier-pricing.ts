import type { ModifierGroup, ModifierOption, Product } from './types'

// One entry per group: the option ids chosen, in click order. An id may appear
// more than once when the group allows doubling up (max 2 of the same salad),
// so the array length is the selection count — not the number of distinct ids.
export type Selections = Record<string, string[]>

export function maxPerOption(group: ModifierGroup): number {
  return Math.max(1, group.maxPerOption ?? 1)
}

// A group is only offered once whatever it depends on has actually been
// chosen. Groups with no dependency are always offered.
export function isGroupAvailable(group: ModifierGroup, selections: Selections): boolean {
  if (!group.dependsOn) return true
  const chosen = selections[group.dependsOn.groupId] ?? []
  return chosen.some((id) => group.dependsOn!.optionIds.includes(id))
}

// Sorted by step order, falling back to the stored array order for products
// saved before sortOrder existed.
export function orderedGroups(product: Pick<Product, 'modifiers'>): ModifierGroup[] {
  return (product.modifiers ?? [])
    .map((g, i) => ({ g, i }))
    .sort((a, b) => (a.g.sortOrder ?? a.i) - (b.g.sortOrder ?? b.i) || a.i - b.i)
    .map(({ g }) => g)
}

export function activeGroups(product: Pick<Product, 'modifiers'>, selections: Selections): ModifierGroup[] {
  return orderedGroups(product).filter((g) => isGroupAvailable(g, selections))
}

// The price this option costs *right now* — which for size-driven extras (a
// cheesy crust) depends on what was picked in the driving group.
export function optionUnitPrice(group: ModifierGroup, option: ModifierOption, selections: Selections): number {
  if (group.priceDependsOn && option.priceBy) {
    const driver = (selections[group.priceDependsOn] ?? [])[0]
    if (driver !== undefined && option.priceBy[driver] !== undefined) return option.priceBy[driver]
  }
  return option.price
}

// Total of every chosen option across every *available* group, in pounds.
// Selections belonging to a group whose dependency is no longer satisfied are
// ignored rather than charged for.
export function modifiersTotal(product: Pick<Product, 'modifiers'>, selections: Selections): number {
  let total = 0
  for (const group of activeGroups(product, selections)) {
    for (const optId of selections[group.id] ?? []) {
      const option = group.options?.find((o) => o.id === optId)
      if (option) total += optionUnitPrice(group, option, selections)
    }
  }
  return total
}

export function unitPrice(product: Pick<Product, 'modifiers' | 'price'>, selections: Selections): number {
  return product.price + modifiersTotal(product, selections)
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string; groupId?: string }

// The single rulebook for "is this a legal set of choices". The step UI uses it
// to decide when a step is satisfied; the server runs the very same function
// over what actually arrives, so the browser can never talk the kitchen into
// accepting a combination the picker wouldn't allow.
export function validateSelections(
  product: Pick<Product, 'modifiers'>,
  selections: Selections
): ValidationResult {
  const groups = orderedGroups(product)
  const available = new Set(activeGroups(product, selections).map((g) => g.id))

  for (const group of groups) {
    const chosen = selections[group.id] ?? []

    if (!available.has(group.id)) {
      if (chosen.length > 0) {
        return { ok: false, error: `"${group.name}" isn't available with those choices`, groupId: group.id }
      }
      continue
    }

    const options = group.options ?? []
    for (const optId of chosen) {
      if (!options.some((o) => o.id === optId)) {
        return { ok: false, error: `Unknown option in "${group.name}"`, groupId: group.id }
      }
    }

    const minRequired = group.required ? Math.max(1, group.min) : group.min
    if (chosen.length < minRequired) {
      return {
        ok: false,
        error: minRequired === 1
          ? `Please choose an option for "${group.name}"`
          : `Please choose at least ${minRequired} for "${group.name}"`,
        groupId: group.id,
      }
    }

    if (group.max > 0 && chosen.length > group.max) {
      return { ok: false, error: `You can choose at most ${group.max} for "${group.name}"`, groupId: group.id }
    }

    if (!group.multiSelect && chosen.length > 1) {
      return { ok: false, error: `Only one option can be chosen for "${group.name}"`, groupId: group.id }
    }

    const cap = maxPerOption(group)
    const counts = new Map<string, number>()
    for (const optId of chosen) {
      const next = (counts.get(optId) ?? 0) + 1
      if (next > cap) {
        const name = options.find((o) => o.id === optId)?.name ?? 'that option'
        return { ok: false, error: `${name} can only be chosen ${cap} time${cap === 1 ? '' : 's'}`, groupId: group.id }
      }
      counts.set(optId, next)
    }
  }

  return { ok: true }
}

// True once this group has everything it needs — used to decide whether a step
// can be left. Optional groups are satisfied from the start (they can be
// skipped), which is why "done" is tracked separately in the picker.
export function isGroupSatisfied(group: ModifierGroup, selections: Selections): boolean {
  const chosen = selections[group.id] ?? []
  const minRequired = group.required ? Math.max(1, group.min) : group.min
  if (chosen.length < minRequired) return false
  if (group.max > 0 && chosen.length > group.max) return false
  return true
}
