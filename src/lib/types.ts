export type ModifierOption = {
  id: string
  name: string
  price: number   // in pounds
  // Short badge shown next to the option — "Spicy", "Contains Fish", etc.
  // Kept separate from the name so it can be styled and never ends up baked
  // into the text stored on an order line.
  tag?: string
  // Price overrides keyed by the option id selected in the group named by the
  // owning group's `priceDependsOn` (a cheesy crust costs more on a bigger
  // pizza). Falls back to `price` when the driving option has no entry.
  priceBy?: Record<string, number>
}

export type ModifierGroup = {
  id: string
  name: string
  // Sub-heading under the step title, e.g. "You may be charged for extras."
  description?: string
  required: boolean
  multiSelect: boolean
  min: number
  max: number
  // How many times one option may be picked within this group (salads and
  // sauces allow doubling up). Defaults to 1.
  maxPerOption?: number
  // Position in the step-by-step flow. Groups without one keep their array
  // order, so older products stored before this field still render sensibly.
  sortOrder?: number
  // Only offer this step when the driving group has one of these options
  // chosen — this is what makes "pick your meal drink" appear only after
  // "Make it a meal" is selected.
  dependsOn?: { groupId: string; optionIds: string[] }
  // Group id whose selection drives this group's `priceBy` lookups.
  priceDependsOn?: string
  options: ModifierOption[]
}

export type Product = {
  id: string
  name: string
  description: string
  price: number        // in pounds
  image: string
  category: string
  popular: boolean
  available: boolean
  modifiers: ModifierGroup[]
  allergens: string[]
}

export type Category = {
  id: string
  name: string
  slug: string
  icon: string
  image: string
  visible: boolean
  order: number
}
