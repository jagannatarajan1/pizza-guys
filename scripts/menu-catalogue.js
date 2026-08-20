// The complete modifier catalogue for the Pizza Guys menu.
//
// This is the single source of truth for every step, option, price, limit and
// label. `scripts/sync-menu.js` writes it into both the admin-editable
// modifier tables and the JSON snapshot each product carries.
//
// Money here is in POUNDS, matching the shape the storefront reads out of
// Product.modifiers. The sync script converts to pence for the DB tables.

const DRINKS_300ML = [
  ['drink-rubicon-guava',   'Rubicon Guava 300ml'],
  ['drink-rubicon-lychee',  'Rubicon Lychee 300ml'],
  ['drink-rubicon-mango',   'Rubicon Mango 300ml'],
  ['drink-rubicon-passion', 'Rubicon Passion 300ml'],
  ['drink-coke',            'coke 300ml'],
  ['drink-diet-coke',       'Diet Coke 300ml'],
  ['drink-7up',             '7 UP 300ml'],
  ['drink-mirinda',         'Mirinda 300ml'],
  ['drink-pepsi',           'Pepsi 300ml'],
  ['drink-pepsi-max',       'Pepsi Max 300ml'],
  ['drink-tango',           'Tango Orange 300ml'],
  ['drink-water',           'Water 600ml'],
]

// Same drinks, named without the volume, as they appear inside a meal.
const MEAL_DRINKS = [
  ['meal-drink-rubicon-guava',   'Rubicon Guava'],
  ['meal-drink-rubicon-lychee',  'Rubicon Lychee'],
  ['meal-drink-rubicon-passion', 'Rubicon Passion'],
  ['meal-drink-rubicon-mango',   'Rubicon Mango'],
  ['meal-drink-coke',            'Coke'],
  ['meal-drink-diet-coke',       'Diet Coke'],
  ['meal-drink-7up',             '7 UP'],
  ['meal-drink-mirinda',         'Mirinda'],
  ['meal-drink-pepsi',           'Pepsi'],
  ['meal-drink-pepsi-max',       'Pepsi Max'],
  ['meal-drink-tango',           'Tango Orange'],
  ['meal-drink-water',           'Water 600ml'],
]

const TOPPINGS = [
  ['top-ham',              'Ham',                 ''],
  ['top-pepperoni',        'Pepperoni',           ''],
  ['top-spicy-beef',       'Spicy Beef',          'Spicy'],
  ['top-sausage',          'Sausage',             ''],
  ['top-chicken',          'Chicken',             ''],
  ['top-chicken-tikka',    'Chicken Tikka',       ''],
  ['top-tandoori-chicken', 'Tandoori Chicken',    ''],
  ['top-tuna',             'Tuna',                'Contains Fish'],
  ['top-anchovies',        'Anchovies',           'Contains Fish'],
  ['top-prawn',            'Prawn',               'Contains Crustaceans'],
  ['top-sweetcorn',        'Sweetcorn',           ''],
  ['top-mushrooms',        'Fresh Mushrooms',     ''],
  ['top-mix-peppers',      'Mix Peppers',         ''],
  ['top-garlic',           'Garlic',              ''],
  ['top-red-onion',        'Fresh Red Onion',     ''],
  ['top-black-olives',     'Black Olives',        ''],
  ['top-pineapple',        'Pineapple',           ''],
  ['top-bbq-sauce',        'BBQ Sauce',           'Contains Gluten'],
  ['top-garlic-sauce',     'Garlic Sauce',        'Contains Gluten'],
  ['top-jalapeno',         'Jalapeno',            'Spicy'],
  ['top-green-chilli',     'Fresh Green Chilli',  'Spicy'],
  ['top-lamb',             'Lamb',                ''],
]

const KEBAB_SALAD = [
  ['salad-tomato',      'Tomato'],
  ['salad-lettuce',     'Lettuce'],
  ['salad-cucumber',    'Cucumber'],
  ['salad-onion',       'Onion'],
  ['salad-red-cabbage', 'Red Cabbage'],
  ['salad-none',        'No Salad'],
]

const KEBAB_SAUCE = [
  ['sauce-mayo',        'Mayo',         ''],
  ['sauce-garlic-mayo', 'Garlic Mayo',  ''],
  ['sauce-burger',      'Burger Sauce', ''],
  ['sauce-tomato',      'Tomato Sauce', ''],
  ['sauce-chilli',      'Chilli Sauce', 'Spicy'],
  ['sauce-bbq',         'BBQ Sauce',    'Contains Gluten'],
]

const opt = (id, name, price = 0, extra = {}) => ({ id, name, price, ...extra })

// ── Pizza steps ─────────────────────────────────────────────────────────────
const pizzaSize = {
  id: 'pizza-size',
  name: 'Choose Your Size',
  description: 'Choose 1 · Required',
  required: true, multiSelect: false, min: 1, max: 1, sortOrder: 1,
  options: [
    opt('size-medium', 'Medium (9")',      0),
    opt('size-large',  'Large (12")',      4.55),
    opt('size-xl',     'Extra Large (15")', 8.90),
    opt('size-mega',   'Mega Large (18")', 12.25),
  ],
}

const pizzaBase = {
  id: 'pizza-base',
  name: 'Choose Your Base',
  description: 'Choose 1 · Required',
  required: true, multiSelect: false, min: 1, max: 1, sortOrder: 2,
  options: [
    opt('base-garlic', 'Garlic Base',      0),
    opt('base-tomato', 'Tomato Sauce base', 0),
    opt('base-bbq',    'BBQ Base',         0),
  ],
}

// The one option here costs more on a bigger pizza, so its price is looked up
// from whatever was chosen in the size step.
const pizzaCrust = {
  id: 'pizza-cheesy-crust',
  name: 'Cheesy Crust',
  description: 'Choose up to 1 · Optional',
  required: false, multiSelect: false, min: 0, max: 1, sortOrder: 3,
  priceDependsOn: 'pizza-size',
  options: [
    opt('crust-cheesy', 'Add a Cheesy Crust', 1.49, {
      priceBy: { 'size-medium': 1.49, 'size-large': 1.99, 'size-xl': 2.49, 'size-mega': 2.99 },
    }),
  ],
}

const pizzaToppings = {
  id: 'pizza-toppings',
  name: 'Extra Toppings',
  description: 'Choose up to 10 · Optional · £1.50 each',
  required: false, multiSelect: true, min: 0, max: 10, sortOrder: 4,
  options: TOPPINGS.map(([id, name, tag]) => opt(id, name, 1.50, tag ? { tag } : {})),
}

const pizzaHalfHalf = {
  id: 'pizza-half-half',
  name: 'Choose your extra',
  description: 'Choose up to 1 · Optional',
  required: false, multiSelect: false, min: 0, max: 1, sortOrder: 5,
  options: [opt('half-and-half', 'Half and Half', 1.50)],
}

const pizzaDrink = {
  id: 'pizza-drink',
  name: 'Add a Drink',
  description: 'Choose up to 1 · Optional',
  required: false, multiSelect: false, min: 0, max: 1, sortOrder: 6,
  options: DRINKS_300ML.map(([id, name]) => opt(id, name, 1.29)),
}

const pizzaMeal = {
  id: 'pizza-meal',
  name: 'Make it',
  description: 'Choose up to 1 · Optional',
  required: false, multiSelect: false, min: 0, max: 1, sortOrder: 7,
  options: [opt('meal-chips-drink', 'Meal (Chips and Drink)', 2.99)],
}

// Only offered once the meal above is actually chosen.
const pizzaMealDrink = {
  id: 'pizza-meal-drink',
  name: 'Choose your meal drink',
  description: 'Choose 1 · Included with your meal',
  required: true, multiSelect: false, min: 1, max: 1, sortOrder: 8,
  dependsOn: { groupId: 'pizza-meal', optionIds: ['meal-chips-drink'] },
  options: MEAL_DRINKS.map(([id, name]) => opt(id, name, 0)),
}

// ── Kebab steps ─────────────────────────────────────────────────────────────
const kebabSize = {
  id: 'kebab-size',
  name: 'Size',
  description: 'Choose 1 · Required',
  required: true, multiSelect: false, min: 1, max: 1, sortOrder: 1,
  options: [opt('kebab-medium', 'Medium', 0), opt('kebab-large', 'Large', 1.00)],
}

const kebabPitta = {
  id: 'kebab-pitta',
  name: 'Pitta',
  description: 'Choose up to 1 · Optional',
  required: false, multiSelect: false, min: 0, max: 1, sortOrder: 2,
  options: [opt('kebab-extra-pitta', 'Add 1 Pitta', 1.50)],
}

const kebabSalad = {
  id: 'kebab-salad',
  name: 'Salad',
  description: 'Choose up to 5 · each up to 2× · Required',
  required: true, multiSelect: true, min: 1, max: 5, maxPerOption: 2, sortOrder: 3,
  options: KEBAB_SALAD.map(([id, name]) => opt(id, name, 0)),
}

const kebabSauce = {
  id: 'kebab-sauce',
  name: 'Sauce',
  description: 'Choose up to 6 · each up to 2× · Optional',
  required: false, multiSelect: true, min: 0, max: 6, maxPerOption: 2, sortOrder: 4,
  options: KEBAB_SAUCE.map(([id, name, tag]) => opt(id, name, 0, tag ? { tag } : {})),
}

// ── Wrap steps (same choices, their own step titles) ────────────────────────
const wrapSalad = {
  id: 'wrap-salad',
  name: 'Wrap Salad',
  description: 'Choose up to 5 · each up to 2× · Required',
  required: true, multiSelect: true, min: 1, max: 5, maxPerOption: 2, sortOrder: 1,
  options: KEBAB_SALAD.map(([id, name]) => opt(`wrap-${id}`, name, 0)),
}

const wrapSauce = {
  id: 'wrap-sauce',
  name: 'Wrap Sauce',
  description: 'Choose up to 6 · each up to 2× · Optional',
  required: false, multiSelect: true, min: 0, max: 6, maxPerOption: 2, sortOrder: 2,
  options: KEBAB_SAUCE.map(([id, name, tag]) => opt(`wrap-${id}`, name, 0, tag ? { tag } : {})),
}

// ── Burger steps ────────────────────────────────────────────────────────────
const burgerSalad = {
  id: 'burger-salad',
  name: 'Salad',
  description: 'Choose up to 2 · Required',
  required: true, multiSelect: true, min: 1, max: 2, sortOrder: 1,
  options: [
    opt('burger-gerkins', 'Gerkins', 0),
    opt('burger-tomato-slice', 'Fresh Tomato Slice', 0),
    opt('burger-no-salad', 'No Salad', 0),
  ],
}

const burgerSauce = {
  id: 'burger-sauce',
  name: 'Sauce',
  description: 'Choose up to 2 · Optional',
  required: false, multiSelect: true, min: 0, max: 2, sortOrder: 2,
  options: [
    opt('burger-sauce-burger', 'Burger Sauce', 0),
    opt('burger-sauce-tomato', 'Tomato Sauce', 0),
  ],
}

// Chicken and vegetarian burgers carry their own salad and sauce lists.
const chickenBurgerSalad = {
  id: 'chicken-burger-salad',
  name: 'Salad',
  description: 'Choose up to 2 · Required',
  required: true, multiSelect: true, min: 1, max: 2, sortOrder: 1,
  options: [
    opt('cb-lettuce', 'Lettuce', 0),
    opt('cb-no-salad', 'No Salad', 0),
  ],
}

const chickenBurgerSauce = {
  id: 'chicken-burger-sauce',
  name: 'Sauce',
  description: 'Choose up to 4 · Optional',
  required: false, multiSelect: true, min: 0, max: 4, sortOrder: 2,
  options: [
    opt('cb-mayo', 'Mayo', 0),
    opt('cb-tomato-sauce', 'Tomato Sauce', 0),
    opt('cb-chilli-sauce', 'Chilli Sauce', 0, { tag: 'Spicy' }),
    opt('cb-spicy-mayo', 'Spicy Mayo', 0, { tag: 'Spicy' }),
  ],
}

const burgerAdd = {
  id: 'burger-add',
  name: 'Add',
  description: 'Choose up to 1 · Optional',
  required: false, multiSelect: false, min: 0, max: 1, sortOrder: 3,
  options: [opt('burger-extra-cheese', 'Extra Cheese', 0.50)],
}

const GROUPS = {
  pizzaSize, pizzaBase, pizzaCrust, pizzaToppings, pizzaHalfHalf, pizzaDrink, pizzaMeal, pizzaMealDrink,
  kebabSize, kebabPitta, kebabSalad, kebabSauce,
  wrapSalad, wrapSauce,
  burgerSalad, burgerSauce, chickenBurgerSalad, chickenBurgerSauce, burgerAdd,
}

const PIZZA_STEPS       = [pizzaSize, pizzaBase, pizzaCrust, pizzaToppings, pizzaHalfHalf, pizzaDrink, pizzaMeal, pizzaMealDrink]
const KEBAB_PITTA_STEPS = [kebabSize, kebabPitta, kebabSalad, kebabSauce]
const KEBAB_MEAT_STEPS  = [kebabSize, kebabSauce]
const WRAP_STEPS        = [wrapSalad, wrapSauce]
const WRAP_MEAT_STEPS   = [wrapSauce]
const BEEF_BURGER_STEPS = [burgerSalad, burgerSauce, burgerAdd]
const CHICKEN_BURGER_STEPS = [chickenBurgerSalad, chickenBurgerSauce, burgerAdd]

// Products missing from the database that the menu requires.
const MISSING_PRODUCTS = [
  { name: 'Burger Sauce', category: 'dips', price: 0.50, description: '', allergens: [] },
  { name: 'BBQ Sauce',    category: 'dips', price: 0.50, description: '', allergens: ['Gluten'] },
  { name: 'Spicy Mayo',   category: 'dips', price: 0.50, description: '(Spicy)', allergens: [] },
]

// Descriptions that drifted from the menu wording.
const DESCRIPTION_FIXES = {
  'Cheese Delight Pizza':   'Choice of your 4 toppings.',
  'Tandoori Chicken Pizza': 'Onions, tandoori chicken, jalapenos and green peppers. (Spicy)',
}

// Which steps each product gets, decided by category and name.
function stepsForProduct(product) {
  const { category, name } = product
  const meatOnly = /\(Meat Only\)/i.test(name)

  if (category === 'pizza' || category === 'kebab-pizza') return PIZZA_STEPS
  if (category === 'kebab')  return meatOnly ? KEBAB_MEAT_STEPS : KEBAB_PITTA_STEPS
  if (category === 'wraps')  return meatOnly ? WRAP_MEAT_STEPS  : WRAP_STEPS
  if (category === 'smash-burgers') return BEEF_BURGER_STEPS
  if (category === 'burgers') {
    const chickenOrVeg = /chicken|veggie|vegetarian/i.test(name)
    return chickenOrVeg ? CHICKEN_BURGER_STEPS : BEEF_BURGER_STEPS
  }
  return null   // null = leave this product's modifiers exactly as they are
}

module.exports = {
  GROUPS,
  ALL_GROUPS: Object.values(GROUPS),
  PIZZA_STEPS, KEBAB_PITTA_STEPS, KEBAB_MEAT_STEPS, WRAP_STEPS, WRAP_MEAT_STEPS,
  BEEF_BURGER_STEPS, CHICKEN_BURGER_STEPS,
  MISSING_PRODUCTS, DESCRIPTION_FIXES, stepsForProduct,
  DRINKS_300ML, MEAL_DRINKS, TOPPINGS,
}
