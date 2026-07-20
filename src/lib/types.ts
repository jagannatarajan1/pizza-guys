export type ModifierOption = {
  id: string
  name: string
  price: number   // in pounds
}

export type ModifierGroup = {
  id: string
  name: string
  required: boolean
  multiSelect: boolean
  min: number
  max: number
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
