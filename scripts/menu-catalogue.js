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

// The complete list of products this menu requires — name, category, price
// (pounds), description, allergens, popular flag. Pulled from the verified
// local catalogue and used by sync-menu.js to bring any database — including
// one holding an old, unrelated demo catalogue — up to exactly this menu.
const PRODUCTS = [
  { name: "Margarita Pizza", category: "pizza", price: 10.99, description: "Tomato and cheese. (Vegetarian)", allergens: ["Dairy"], popular: false },
  { name: "Veggie Special Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, red onion, mushroom, green and red peppers, sweet corn and tomato slices. (Vegetarian)", allergens: ["Dairy"], popular: false },
  { name: "Veggie Sizzler Hot Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, red onion, mushroom, green and red peppers, sweet corn, black olives and jalapenos. (Spicy, Vegetarian)", allergens: ["Dairy"], popular: false },
  { name: "Pizza Guys Special Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, chicken tikka, sweet corn, red onion, jalapenos, red and green peppers, mushroom and black olives. (Spicy)", allergens: ["Dairy"], popular: false },
  { name: "Tandoori Chicken Pizza", category: "pizza", price: 10.99, description: "Onions, tandoori chicken, jalapenos and green peppers. (Spicy)", allergens: [], popular: false },
  { name: "Chicken Tikka Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, chicken tikka, mushroom, red onion, mixed peppers and jalapenos. (Spicy)", allergens: ["Dairy"], popular: false },
  { name: "American Hot Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, tandoori chicken, onion, mixed peppers, black olives, green peppers and jalapenos. (Spicy)", allergens: ["Dairy"], popular: false },
  { name: "Seafood Special Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, tuna, prawns and anchovies.", allergens: ["Fish", "Crustaceans"], popular: false },
  { name: "Cheese Delight Pizza", category: "pizza", price: 10.99, description: "Choice of your 4 toppings.", allergens: ["Dairy"], popular: false },
  { name: "Tuna Delight Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, tuna, red onion, sweet corn and mixed peppers. Contains Milk, Fish", allergens: [], popular: false },
  { name: "Texas BBQ Pizza", category: "pizza", price: 10.99, description: "BBQ sauce, chicken, bacon, red onion and mixed peppers.", allergens: ["Gluten"], popular: false },
  { name: "Meat Feast Pizza", category: "pizza", price: 10.99, description: "BBQ sauce, ham, spicy beef, lamb, pepperoni and chicken tikka.", allergens: [], popular: true },
  { name: "Pepperoni Feast Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, pepperoni and jalapeno. (Spicy)", allergens: ["Dairy"], popular: false },
  { name: "Hawaiian Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, Ham and pineapple.", allergens: ["Dairy"], popular: false },
  { name: "Farm House Pizza", category: "pizza", price: 10.99, description: "BBQ sauce, chicken, lamb, red onion and mixed peppers.", allergens: ["Gluten"], popular: false },
  { name: "New Yorker Pizza", category: "pizza", price: 10.99, description: "Cheese, tomato, spicy beef, lamb, pepperoni, chicken tikka and ham. (Spicy)", allergens: ["Dairy"], popular: false },
  { name: "Hot and Spicy Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, pepperoni, beef, garlic crunch, red and green pepper and jalapeno. (Spicy)", allergens: ["Dairy"], popular: false },
  { name: "Lamb Doner Kebab Pizza", category: "kebab-pizza", price: 10.99, description: "Lamb, onion, green pepper and jalapeno.", allergens: [], popular: true },
  { name: "Chicken Doner Kebab Pizza", category: "kebab-pizza", price: 10.99, description: "Chicken, onion, sweetcorn, green pepper and jalapeno. (Spicy)", allergens: [], popular: false },
  { name: "Mixed Doner Kebab Pizza", category: "kebab-pizza", price: 10.99, description: "Chicken, lamb, onion, green pepper, jalapeno and mushroom. (Spicy)", allergens: [], popular: false },
  { name: "BBQ Kebab Pizza", category: "kebab-pizza", price: 10.99, description: "Lamb or chicken, BBQ sauce, onion, green peppers and jalapeno. (Spicy)", allergens: [], popular: false },
  { name: "Chicken Kebab (In Pitta)", category: "kebab", price: 8, description: "", allergens: [], popular: false },
  { name: "Lamb Kebab (In Pitta)", category: "kebab", price: 8, description: "", allergens: [], popular: false },
  { name: "Mixed Kebab (In Pitta)", category: "kebab", price: 8, description: "", allergens: [], popular: false },
  { name: "Chicken Kebab (Meat Only)", category: "kebab", price: 7.55, description: "", allergens: [], popular: false },
  { name: "Lamb Kebab (Meat Only)", category: "kebab", price: 7.55, description: "", allergens: [], popular: false },
  { name: "Mixed Kebab (Meat Only)", category: "kebab", price: 7.55, description: "", allergens: [], popular: false },
  { name: "Chicken Doner Wrap", category: "wraps", price: 8, description: "Shaved chicken doner wrapped in soft flatbread.", allergens: [], popular: false },
  { name: "Lamb Doner Wrap", category: "wraps", price: 8, description: "Sliced lamb doner meat wrapped in flatbread.", allergens: [], popular: false },
  { name: "Mixed Doner Wrap", category: "wraps", price: 8, description: "A combination of doner meats, wrapped in flatbread.", allergens: [], popular: false },
  { name: "Chicken Doner Wrap (Meat Only)", category: "wraps", price: 7.55, description: "Plain wrap filled with meat, no salad or sauce.", allergens: [], popular: false },
  { name: "Lamb Doner Wrap (Meat Only)", category: "wraps", price: 7.55, description: "Plain wrap filled with meat, no salad or sauce.", allergens: [], popular: false },
  { name: "Mixed Doner Wrap (Meat Only)", category: "wraps", price: 7.55, description: "Plain wrap filled with meat, no salad or sauce.", allergens: [], popular: false },
  { name: "Cheese Burger", category: "burgers", price: 3.99, description: "Beef patty, cheese, bun.", allergens: ["Dairy"], popular: false },
  { name: "Double Cheese Burger", category: "burgers", price: 4.99, description: "Two beef patties and cheese in a bun.", allergens: ["Dairy"], popular: false },
  { name: "Hawaiian Cheese Burger", category: "burgers", price: 4.99, description: "", allergens: ["Dairy"], popular: false },
  { name: "1/4 Pounder with Cheese", category: "burgers", price: 5.99, description: "", allergens: ["Dairy"], popular: false },
  { name: "1/2 Pounder with Cheese", category: "burgers", price: 6.99, description: "Half-pound burger patty topped with cheese in a bun.", allergens: ["Dairy"], popular: false },
  { name: "Chicken Fillet Burger", category: "burgers", price: 5.5, description: "", allergens: [], popular: false },
  { name: "Spicy Chicken Burger", category: "burgers", price: 5.5, description: "Chicken patty, spicy seasoning, burger bun. (Spicy)", allergens: [], popular: false },
  { name: "Veggie Burger", category: "burgers", price: 4.99, description: "(Vegetarian)", allergens: [], popular: false },
  { name: "Hawaiian Smashburger", category: "smash-burgers", price: 8.99, description: "Beef smash patty, ham and pineapple.", allergens: [], popular: false },
  { name: "Classic Burger", category: "smash-burgers", price: 8.99, description: "Smash burger patty in a bun.", allergens: [], popular: false },
  { name: "BBQ Burger", category: "smash-burgers", price: 8.99, description: "Smash burger with BBQ sauce.", allergens: [], popular: false },
  { name: "French Fries (small)", category: "sides", price: 1.99, description: "", allergens: [], popular: false },
  { name: "French Fries (medium)", category: "sides", price: 2.99, description: "Medium portion of golden chips.", allergens: [], popular: false },
  { name: "French Fries (large)", category: "sides", price: 3.99, description: "Large portion of thin-cut potato fries.", allergens: [], popular: false },
  { name: "Cheesy Chips", category: "sides", price: 3.99, description: "", allergens: ["Dairy"], popular: false },
  { name: "Regular Potato Wedges", category: "sides", price: 3.99, description: "", allergens: [], popular: false },
  { name: "Onion Rings (10 pieces)", category: "sides", price: 2.99, description: "Crispy, golden onion rings. 10 pieces.", allergens: [], popular: true },
  { name: "Garlic Pizza (7\")", category: "sides", price: 4.99, description: "", allergens: [], popular: false },
  { name: "Garlic Bread (4 pieces)", category: "sides", price: 2.99, description: "", allergens: [], popular: true },
  { name: "Garlic Bread with Cheese (4 pieces)", category: "sides", price: 3.99, description: "", allergens: [], popular: true },
  { name: "Chicken Nuggets (10 pieces)", category: "sides", price: 4.49, description: "Breaded chicken nuggets, 10 pieces.", allergens: [], popular: false },
  { name: "Hot Chicken Wings (10 pieces)", category: "sides", price: 6.99, description: "(Spicy)", allergens: [], popular: false },
  { name: "BBQ Chicken Wings (6 pieces)", category: "sides", price: 4.99, description: "", allergens: [], popular: false },
  { name: "Chicken Dippers (6 pieces)", category: "sides", price: 4.99, description: "6 pieces of breaded chicken dippers.", allergens: [], popular: false },
  { name: "Vegetable Samosa (5 pieces)", category: "sides", price: 2.99, description: "Savoury pastry parcels with a vegetable filling. 5 pieces.", allergens: [], popular: false },
  { name: "Meat Samosa (4 pieces)", category: "sides", price: 3.99, description: "Crispy pastry parcels with a savoury meat filling. 4 pieces.", allergens: [], popular: false },
  { name: "Mutton Rolls (3 pieces)", category: "sides", price: 5.99, description: "", allergens: [], popular: false },
  { name: "Veg Rolls (3 pieces)", category: "sides", price: 5.99, description: "Two rolls with mixed vegetable filling. (Vegetarian)", allergens: [], popular: false },
  { name: "Chicken Popcorn", category: "sides", price: 4.99, description: "Bite-sized chicken pieces in a crunchy coating.", allergens: [], popular: false },
  { name: "10 Mozzarella Balls", category: "sides", price: 4.49, description: "", allergens: ["Dairy"], popular: false },
  { name: "10 Mozzarella Sticks", category: "sides", price: 4.49, description: "10 breaded mozzarella sticks with a melting centre.", allergens: [], popular: true },
  { name: "Supreme Salads", category: "sides", price: 3.3, description: "", allergens: [], popular: false },
  { name: "Rubicon Guava 300ml", category: "drinks", price: 1.29, description: "Refreshing guava juice drink.", allergens: [], popular: false },
  { name: "Rubicon Lychee 300ml", category: "drinks", price: 1.29, description: "Refreshing lychee juice drink.", allergens: [], popular: false },
  { name: "Rubicon Passion 300ml", category: "drinks", price: 1.29, description: "Refreshing passion fruit juice drink.", allergens: [], popular: false },
  { name: "Coke 300ml", category: "drinks", price: 1.29, description: "Classic sparkling cola 300ml.", allergens: [], popular: false },
  { name: "Diet Coke 300ml", category: "drinks", price: 1.29, description: "Sugar-free sparkling cola 300ml.", allergens: [], popular: false },
  { name: "7 UP 300ml", category: "drinks", price: 1.29, description: "Refreshing 7up 300ml.", allergens: [], popular: false },
  { name: "Mirinda 300ml", category: "drinks", price: 1.29, description: "Sparkling orange soft drink Mirinda 300ml.", allergens: [], popular: false },
  { name: "Pepsi 300ml", category: "drinks", price: 1.29, description: "Classic cola soft drink 300ml.", allergens: [], popular: false },
  { name: "Pepsi Max 300ml", category: "drinks", price: 1.29, description: "Maximum taste, no sugar pepsi max drink 300ml.", allergens: [], popular: false },
  { name: "Tango Orange 300ml", category: "drinks", price: 1.29, description: "Sparkling orange soft drink Tango 300ml.", allergens: [], popular: false },
  { name: "Rubicon Mango 300ml", category: "drinks", price: 1.29, description: "Refreshing mango juice drink.", allergens: [], popular: false },
  { name: "Water 600ml", category: "drinks", price: 1.29, description: "Still bottled water 600ml.", allergens: [], popular: false },
  { name: "Pepsi 1.5 Ltr", category: "drinks", price: 3.3, description: "Large bottle of classic Pepsi 1.5 Ltr.", allergens: [], popular: false },
  { name: "7 UP 1.5 Ltr", category: "drinks", price: 3.3, description: "Large bottle of lemon & lime soft drink .", allergens: [], popular: false },
  { name: "Tango Orange Bottle 1.5 Ltr", category: "drinks", price: 3.3, description: "Large bottle of sparkling orange drink 1.5 Ltr.", allergens: [], popular: false },
  { name: "Pepsi Max Bottle 1.5 Ltr", category: "drinks", price: 3.3, description: "Large bottle of Pepsi Max 1.5 Ltr.", allergens: [], popular: false },
  { name: "Coke Bottle 1.5 Ltr", category: "drinks", price: 3.3, description: "Large bottle of Coke 1.5 Ltr", allergens: [], popular: false },
  { name: "Ben & Jerry Cookie Dough Ice cream (500mL)", category: "desserts", price: 6.99, description: "", allergens: [], popular: false },
  { name: "Haagen-Dazs Belgian Chocolate Ice cream (500 mL)", category: "desserts", price: 6.99, description: "", allergens: ["Dairy"], popular: false },
  { name: "Haagen-Dazs Cookies & Cream Ice cream (500 mL)", category: "desserts", price: 6.99, description: "", allergens: [], popular: false },
  { name: "Haagen-Dazs Vanilla Ice cream (500 mL)", category: "desserts", price: 6.99, description: "", allergens: [], popular: false },
  { name: "Ben & Jerry Choco Fudge Ice cream (500mL)", category: "desserts", price: 6.99, description: "", allergens: [], popular: false },
  { name: "Chocolate Fudge Cake", category: "desserts", price: 3.99, description: "Chocolate cake coated in smooth fudge icing.", allergens: ["Gluten"], popular: false },
  { name: "Strawberry Cheesecake", category: "desserts", price: 3.99, description: "Cheesecake with strawberry flavour and a creamy texture. Contains Gluten, Milk", allergens: [], popular: false },
  { name: "Carrot Cake", category: "desserts", price: 3.99, description: "", allergens: ["Gluten"], popular: false },
  { name: "Sour Cream", category: "dips", price: 0.5, description: "Smooth, tangy sour cream dip.", allergens: ["Dairy"], popular: false },
  { name: "Chilli Sauce", category: "dips", price: 0.5, description: "(Spicy)", allergens: ["Gluten"], popular: false },
  { name: "Garlic Mayo", category: "dips", price: 0.5, description: "", allergens: ["Egg"], popular: false },
  { name: "Burger Sauce", category: "dips", price: 0.5, description: "", allergens: [], popular: false },
  { name: "BBQ Sauce", category: "dips", price: 0.5, description: "", allergens: ["Gluten"], popular: false },
  { name: "Spicy Mayo", category: "dips", price: 0.5, description: "(Spicy)", allergens: [], popular: false },
]

// Every category this menu needs, in menu order — used to make sure a
// database is never missing one outright (a legacy install might not have a
// "Smash Burgers" category, or might spell "Pizzas" differently).
const CATEGORIES = [
  { id: 'pizza',          name: 'Pizzas',               slug: 'pizza',          icon: '🍕', order: 1 },
  { id: 'kebab',          name: 'Kebabs',                slug: 'kebab',          icon: '🥙', order: 2 },
  { id: 'wraps',          name: 'Wraps',                 slug: 'wraps',          icon: '🌯', order: 3 },
  { id: 'kebab-pizza',    name: 'Kebab Pizza Specials',  slug: 'kebab-pizza',    icon: '🍕', order: 4 },
  { id: 'sides',          name: 'Sides',                 slug: 'sides',          icon: '🍟', order: 5 },
  { id: 'drinks',         name: 'Drinks',                slug: 'drinks',         icon: '🥤', order: 6 },
  { id: 'desserts',       name: 'Desserts',              slug: 'desserts',       icon: '🍰', order: 7 },
  { id: 'burgers',        name: 'Burgers',                slug: 'burgers',       icon: '🍔', order: 8 },
  { id: 'smash-burgers',  name: 'Smash Burgers',         slug: 'smash-burgers',  icon: '🍔', order: 9 },
  { id: 'dips',           name: 'Dips',                  slug: 'dips',           icon: '🫙', order: 10 },
]

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
  PRODUCTS,
  GROUPS,
  ALL_GROUPS: Object.values(GROUPS),
  PIZZA_STEPS, KEBAB_PITTA_STEPS, KEBAB_MEAT_STEPS, WRAP_STEPS, WRAP_MEAT_STEPS,
  BEEF_BURGER_STEPS, CHICKEN_BURGER_STEPS,
  CATEGORIES, stepsForProduct,
  DRINKS_300ML, MEAL_DRINKS, TOPPINGS,
}
