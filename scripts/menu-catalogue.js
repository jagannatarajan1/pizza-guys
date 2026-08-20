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
// (pounds), description, allergens, image path and popular flag. Pulled from
// the verified local catalogue and used by sync-menu.js to bring any database
// — including one holding an old, unrelated demo catalogue — up to exactly
// this menu. The image path only works once the matching file under
// public/uploads/branding has actually been copied to that server too —
// this list alone doesn't move any image bytes.
const PRODUCTS = [
  { name: "Margarita Pizza", category: "pizza", price: 10.99, description: "Tomato and cheese. (Vegetarian)", allergens: ["Dairy"], image: "/api/uploads/branding/a2ee9465-5e4d-40e5-a7c4-612dbc0f3d53.jpg", popular: false },
  { name: "Veggie Special Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, red onion, mushroom, green and red peppers, sweet corn and tomato slices. (Vegetarian)", allergens: ["Dairy"], image: "/api/uploads/branding/4af1a4c7-f9f2-4b87-b0da-f45cf33bcce7.jpg", popular: false },
  { name: "Veggie Sizzler Hot Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, red onion, mushroom, green and red peppers, sweet corn, black olives and jalapenos. (Spicy, Vegetarian)", allergens: ["Dairy"], image: "/api/uploads/branding/729a1fe2-0aa9-4fa6-90e6-9fe9c0b2751a.jpg", popular: false },
  { name: "Pizza Guys Special Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, chicken tikka, sweet corn, red onion, jalapenos, red and green peppers, mushroom and black olives. (Spicy)", allergens: ["Dairy"], image: "/api/uploads/branding/e92e1f92-bceb-4dce-b8fc-8b164e3cdeb4.jpg", popular: false },
  { name: "Tandoori Chicken Pizza", category: "pizza", price: 10.99, description: "Onions, tandoori chicken, jalapenos and green peppers. (Spicy)", allergens: [], image: "/api/uploads/branding/b26a7f7e-6311-4516-bd3e-59de2a8ca1b8.jpg", popular: false },
  { name: "Chicken Tikka Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, chicken tikka, mushroom, red onion, mixed peppers and jalapenos. (Spicy)", allergens: ["Dairy"], image: "/api/uploads/branding/64b848f8-3dd4-40f3-8d16-1c17712e154c.jpg", popular: false },
  { name: "American Hot Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, tandoori chicken, onion, mixed peppers, black olives, green peppers and jalapenos. (Spicy)", allergens: ["Dairy"], image: "/api/uploads/branding/64239ceb-ed0e-4c99-b988-ee7362596014.jpg", popular: false },
  { name: "Seafood Special Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, tuna, prawns and anchovies.", allergens: ["Fish", "Crustaceans"], image: "/api/uploads/branding/0aa81364-37b6-4c15-8b8d-d654399e21a4.jpg", popular: false },
  { name: "Cheese Delight Pizza", category: "pizza", price: 10.99, description: "Choice of your 4 toppings.", allergens: ["Dairy"], image: "/api/uploads/branding/af90a016-9c7c-4904-89ef-f8aedf1af740.jpg", popular: false },
  { name: "Tuna Delight Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, tuna, red onion, sweet corn and mixed peppers. Contains Milk, Fish", allergens: [], image: "/api/uploads/branding/3f6396f9-2ca7-4b14-a5b3-f69db56b06c2.jpg", popular: false },
  { name: "Texas BBQ Pizza", category: "pizza", price: 10.99, description: "BBQ sauce, chicken, bacon, red onion and mixed peppers.", allergens: ["Gluten"], image: "/api/uploads/branding/d82fdf40-ff18-4d71-b0a4-bfe2e734ce79.jpg", popular: false },
  { name: "Meat Feast Pizza", category: "pizza", price: 10.99, description: "BBQ sauce, ham, spicy beef, lamb, pepperoni and chicken tikka.", allergens: [], image: "/api/uploads/branding/336b0ed2-a377-4491-bf17-c8c6619dfa8f.jpg", popular: true },
  { name: "Pepperoni Feast Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, pepperoni and jalapeno. (Spicy)", allergens: ["Dairy"], image: "/api/uploads/branding/0b3076b8-e7fa-4acc-8361-e7646f7c2c3f.jpg", popular: false },
  { name: "Hawaiian Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, Ham and pineapple.", allergens: ["Dairy"], image: "/api/uploads/branding/16d3af0e-adcb-4c9b-a4fa-dc110c1cf76f.jpg", popular: false },
  { name: "Farm House Pizza", category: "pizza", price: 10.99, description: "BBQ sauce, chicken, lamb, red onion and mixed peppers.", allergens: ["Gluten"], image: "/api/uploads/branding/a909b79a-0ca7-4d61-922e-aa37e3bb518c.jpg", popular: false },
  { name: "New Yorker Pizza", category: "pizza", price: 10.99, description: "Cheese, tomato, spicy beef, lamb, pepperoni, chicken tikka and ham. (Spicy)", allergens: ["Dairy"], image: "/api/uploads/branding/e18d748d-05b1-4b28-b1d7-8ca4ce394b49.jpg", popular: false },
  { name: "Hot and Spicy Pizza", category: "pizza", price: 10.99, description: "Cheese and tomato, pepperoni, beef, garlic crunch, red and green pepper and jalapeno. (Spicy)", allergens: ["Dairy"], image: "/api/uploads/branding/f185e589-e293-46d0-b686-74903519d246.jpg", popular: false },
  { name: "Lamb Doner Kebab Pizza", category: "kebab-pizza", price: 10.99, description: "Lamb, onion, green pepper and jalapeno.", allergens: [], image: "/api/uploads/branding/df959975-710e-4733-b1dd-5ebcb0bfb527.jpg", popular: true },
  { name: "Chicken Doner Kebab Pizza", category: "kebab-pizza", price: 10.99, description: "Chicken, onion, sweetcorn, green pepper and jalapeno. (Spicy)", allergens: [], image: "/api/uploads/branding/59d64ee5-4462-4df6-b48d-00cacf204ec2.jpg", popular: false },
  { name: "Mixed Doner Kebab Pizza", category: "kebab-pizza", price: 10.99, description: "Chicken, lamb, onion, green pepper, jalapeno and mushroom. (Spicy)", allergens: [], image: "/api/uploads/branding/482f5668-467f-409d-b4f2-14ac6a699a0e.jpg", popular: false },
  { name: "BBQ Kebab Pizza", category: "kebab-pizza", price: 10.99, description: "Lamb or chicken, BBQ sauce, onion, green peppers and jalapeno. (Spicy)", allergens: [], image: "/api/uploads/branding/2a9a2d5f-00fb-434c-bda7-7e7b9d8feb9b.jpg", popular: false },
  { name: "Chicken Kebab (In Pitta)", category: "kebab", price: 8, description: "", allergens: [], image: "/api/uploads/branding/311d4100-9316-467a-ba4f-8f92e4a2b756.jpg", popular: false },
  { name: "Lamb Kebab (In Pitta)", category: "kebab", price: 8, description: "", allergens: [], image: "/api/uploads/branding/c8a78b54-7f8a-440a-b14c-9ef173362aa3.jpg", popular: false },
  { name: "Mixed Kebab (In Pitta)", category: "kebab", price: 8, description: "", allergens: [], image: "/api/uploads/branding/2f253bd9-0b23-4ff8-9b59-fd9cca01f9f2.jpg", popular: false },
  { name: "Chicken Kebab (Meat Only)", category: "kebab", price: 7.55, description: "", allergens: [], image: "/api/uploads/branding/2213b628-ba65-4a96-881d-8d85262c2dd0.jpg", popular: false },
  { name: "Lamb Kebab (Meat Only)", category: "kebab", price: 7.55, description: "", allergens: [], image: "/api/uploads/branding/58e2c8b5-7ffb-40db-b787-488bb6bf5835.jpg", popular: false },
  { name: "Mixed Kebab (Meat Only)", category: "kebab", price: 7.55, description: "", allergens: [], image: "/api/uploads/branding/cdb7aec5-cc69-4eca-985b-a6c4ca0ff770.jpg", popular: false },
  { name: "Chicken Doner Wrap", category: "wraps", price: 8, description: "Shaved chicken doner wrapped in soft flatbread.", allergens: [], image: "/api/uploads/branding/171368e8-a935-432d-86a9-bb41ce850b2c.jpg", popular: false },
  { name: "Lamb Doner Wrap", category: "wraps", price: 8, description: "Sliced lamb doner meat wrapped in flatbread.", allergens: [], image: "/api/uploads/branding/0a60c3e2-1406-4e20-9363-ddfdebed8fd8.jpg", popular: false },
  { name: "Mixed Doner Wrap", category: "wraps", price: 8, description: "A combination of doner meats, wrapped in flatbread.", allergens: [], image: "/api/uploads/branding/5db0665b-3fb8-49f3-96d7-6ce6ab050c92.jpg", popular: false },
  { name: "Chicken Doner Wrap (Meat Only)", category: "wraps", price: 7.55, description: "Plain wrap filled with meat, no salad or sauce.", allergens: [], image: "/api/uploads/branding/4db228e1-d8ec-443c-8d17-23a4dc52ae93.jpg", popular: false },
  { name: "Lamb Doner Wrap (Meat Only)", category: "wraps", price: 7.55, description: "Plain wrap filled with meat, no salad or sauce.", allergens: [], image: "/api/uploads/branding/c9c117b8-13ec-4bed-b945-d0a581500503.jpg", popular: false },
  { name: "Mixed Doner Wrap (Meat Only)", category: "wraps", price: 7.55, description: "Plain wrap filled with meat, no salad or sauce.", allergens: [], image: "/api/uploads/branding/0039e900-7c5c-4132-82bc-dc036896e710.jpg", popular: false },
  { name: "Cheese Burger", category: "burgers", price: 3.99, description: "Beef patty, cheese, bun.", allergens: ["Dairy"], image: "/api/uploads/branding/0d17d72d-3f37-4a55-a5fa-fcb785c7c825.jpg", popular: false },
  { name: "Double Cheese Burger", category: "burgers", price: 4.99, description: "Two beef patties and cheese in a bun.", allergens: ["Dairy"], image: "/api/uploads/branding/354ea6c5-b183-4d80-9963-e79897fb3fb6.jpg", popular: false },
  { name: "Hawaiian Cheese Burger", category: "burgers", price: 4.99, description: "", allergens: ["Dairy"], image: "/api/uploads/branding/535ef186-b243-489c-af00-9b14930d8ab8.jpg", popular: false },
  { name: "1/4 Pounder with Cheese", category: "burgers", price: 5.99, description: "", allergens: ["Dairy"], image: "/api/uploads/branding/7a06d009-2790-4047-8ac0-63d609e945e5.jpg", popular: false },
  { name: "1/2 Pounder with Cheese", category: "burgers", price: 6.99, description: "Half-pound burger patty topped with cheese in a bun.", allergens: ["Dairy"], image: "/api/uploads/branding/04637712-7d67-43a5-bf16-1ab9f622a92d.jpg", popular: false },
  { name: "Chicken Fillet Burger", category: "burgers", price: 5.5, description: "", allergens: [], image: "/api/uploads/branding/aa5ab0c6-99cd-4e0c-b6a2-a07afff7a11a.jpg", popular: false },
  { name: "Spicy Chicken Burger", category: "burgers", price: 5.5, description: "Chicken patty, spicy seasoning, burger bun. (Spicy)", allergens: [], image: "/api/uploads/branding/44f95c78-2396-41bb-a1c4-1c4518fffa03.jpg", popular: false },
  { name: "Veggie Burger", category: "burgers", price: 4.99, description: "(Vegetarian)", allergens: [], image: "/api/uploads/branding/d2e0380e-cd50-4d04-8a65-e4cbdc5833f0.jpg", popular: false },
  { name: "Hawaiian Smashburger", category: "smash-burgers", price: 8.99, description: "Beef smash patty, ham and pineapple.", allergens: [], image: "/api/uploads/branding/1883dc69-97ff-4eda-9298-22faddae7545.jpg", popular: false },
  { name: "Classic Burger", category: "smash-burgers", price: 8.99, description: "Smash burger patty in a bun.", allergens: [], image: "/api/uploads/branding/d52ee7cb-34a1-4f72-9b70-8821671bf2fb.jpg", popular: false },
  { name: "BBQ Burger", category: "smash-burgers", price: 8.99, description: "Smash burger with BBQ sauce.", allergens: [], image: "/api/uploads/branding/19525d75-207f-49d3-bd74-9201137e8e57.jpg", popular: false },
  { name: "French Fries (small)", category: "sides", price: 1.99, description: "", allergens: [], image: "/api/uploads/branding/9bfa2ca1-45e5-4f3c-81ec-78e0051ed081.jpg", popular: false },
  { name: "French Fries (medium)", category: "sides", price: 2.99, description: "Medium portion of golden chips.", allergens: [], image: "/api/uploads/branding/689385dc-5beb-4aad-ad9a-50dfe5791bc4.jpg", popular: false },
  { name: "French Fries (large)", category: "sides", price: 3.99, description: "Large portion of thin-cut potato fries.", allergens: [], image: "/api/uploads/branding/bd81f6b9-96c7-4d83-9813-1808363fb8e2.jpg", popular: false },
  { name: "Cheesy Chips", category: "sides", price: 3.99, description: "", allergens: ["Dairy"], image: "/api/uploads/branding/90c0dd4a-327c-435d-8847-573f98e95c8d.jpg", popular: false },
  { name: "Regular Potato Wedges", category: "sides", price: 3.99, description: "", allergens: [], image: "/api/uploads/branding/77adf1f9-f6c2-442c-bc6b-c482a6626ea9.jpg", popular: false },
  { name: "Onion Rings (10 pieces)", category: "sides", price: 2.99, description: "Crispy, golden onion rings. 10 pieces.", allergens: [], image: "/api/uploads/branding/56e332f6-49f8-4aaf-9ac9-46fc3df07507.jpg", popular: true },
  { name: "Garlic Pizza (7\")", category: "sides", price: 4.99, description: "", allergens: [], image: "", popular: false },
  { name: "Garlic Bread (4 pieces)", category: "sides", price: 2.99, description: "", allergens: [], image: "/api/uploads/branding/c0fe9b67-72a5-4c7e-99cf-513ad0fc0469.jpg", popular: true },
  { name: "Garlic Bread with Cheese (4 pieces)", category: "sides", price: 3.99, description: "", allergens: [], image: "/api/uploads/branding/301552ca-c112-4f6c-8109-3cdc512e120e.jpg", popular: true },
  { name: "Chicken Nuggets (10 pieces)", category: "sides", price: 4.49, description: "Breaded chicken nuggets, 10 pieces.", allergens: [], image: "/api/uploads/branding/0d5567fc-a9b3-4502-affb-2eee95388c7b.jpg", popular: false },
  { name: "Hot Chicken Wings (10 pieces)", category: "sides", price: 6.99, description: "(Spicy)", allergens: [], image: "/api/uploads/branding/efd5a5d4-8233-4f55-a61a-9e9060e2dec3.jpg", popular: false },
  { name: "BBQ Chicken Wings (6 pieces)", category: "sides", price: 4.99, description: "", allergens: [], image: "/api/uploads/branding/61c6c050-5ef7-4b27-8f1f-9284e4876a68.jpg", popular: false },
  { name: "Chicken Dippers (6 pieces)", category: "sides", price: 4.99, description: "6 pieces of breaded chicken dippers.", allergens: [], image: "/api/uploads/branding/c6df151d-7b11-4c95-b30d-fc9d29e22619.jpg", popular: false },
  { name: "Vegetable Samosa (5 pieces)", category: "sides", price: 2.99, description: "Savoury pastry parcels with a vegetable filling. 5 pieces.", allergens: [], image: "/api/uploads/branding/426bc90a-e666-4367-b4c7-4545119cfbf6.jpg", popular: false },
  { name: "Meat Samosa (4 pieces)", category: "sides", price: 3.99, description: "Crispy pastry parcels with a savoury meat filling. 4 pieces.", allergens: [], image: "/api/uploads/branding/c78c9ce8-d706-47db-870d-fb8374650008.jpg", popular: false },
  { name: "Mutton Rolls (3 pieces)", category: "sides", price: 5.99, description: "", allergens: [], image: "/api/uploads/branding/14f602ca-888e-47e9-b890-5c474d60bb4a.jpg", popular: false },
  { name: "Veg Rolls (3 pieces)", category: "sides", price: 5.99, description: "Two rolls with mixed vegetable filling. (Vegetarian)", allergens: [], image: "", popular: false },
  { name: "Chicken Popcorn", category: "sides", price: 4.99, description: "Bite-sized chicken pieces in a crunchy coating.", allergens: [], image: "/api/uploads/branding/0f2b83cb-1f8d-42c3-a535-00312f3dbf2f.jpg", popular: false },
  { name: "10 Mozzarella Balls", category: "sides", price: 4.49, description: "", allergens: ["Dairy"], image: "/api/uploads/branding/cf6cef61-5cc5-42e5-92b7-39e9d0e95a76.jpg", popular: false },
  { name: "10 Mozzarella Sticks", category: "sides", price: 4.49, description: "10 breaded mozzarella sticks with a melting centre.", allergens: [], image: "/api/uploads/branding/903215e6-63b7-41c1-b774-055ab789fc87.jpg", popular: true },
  { name: "Supreme Salads", category: "sides", price: 3.3, description: "", allergens: [], image: "/api/uploads/branding/7c8f3f9e-f210-4318-945f-ebd9b5f4077b.jpg", popular: false },
  { name: "Rubicon Guava 300ml", category: "drinks", price: 1.29, description: "Refreshing guava juice drink.", allergens: [], image: "/api/uploads/branding/6eb18ca6-52dd-43ce-add8-cf6e1f3b8738.jpg", popular: false },
  { name: "Rubicon Lychee 300ml", category: "drinks", price: 1.29, description: "Refreshing lychee juice drink.", allergens: [], image: "/api/uploads/branding/f7522884-cd89-46e6-845e-a53ac6fd380a.jpg", popular: false },
  { name: "Rubicon Passion 300ml", category: "drinks", price: 1.29, description: "Refreshing passion fruit juice drink.", allergens: [], image: "/api/uploads/branding/4f5158d6-d9c3-44c5-9283-a136b03f4bc4.jpg", popular: false },
  { name: "Coke 300ml", category: "drinks", price: 1.29, description: "Classic sparkling cola 300ml.", allergens: [], image: "/api/uploads/branding/fb77bef8-eef1-40de-961d-a36634dcde86.jpg", popular: false },
  { name: "Diet Coke 300ml", category: "drinks", price: 1.29, description: "Sugar-free sparkling cola 300ml.", allergens: [], image: "/api/uploads/branding/fe0969c4-3881-49d3-9179-208cf1bf0603.jpg", popular: false },
  { name: "7 UP 300ml", category: "drinks", price: 1.29, description: "Refreshing 7up 300ml.", allergens: [], image: "/api/uploads/branding/d8800c6e-f703-44a3-8277-633dd858af89.jpg", popular: false },
  { name: "Mirinda 300ml", category: "drinks", price: 1.29, description: "Sparkling orange soft drink Mirinda 300ml.", allergens: [], image: "/api/uploads/branding/e92dfc05-f491-468e-93ba-37c045df0181.jpg", popular: false },
  { name: "Pepsi 300ml", category: "drinks", price: 1.29, description: "Classic cola soft drink 300ml.", allergens: [], image: "/api/uploads/branding/d4c0f3ef-45ca-4002-ae59-f5d0ced6cb64.jpg", popular: false },
  { name: "Pepsi Max 300ml", category: "drinks", price: 1.29, description: "Maximum taste, no sugar pepsi max drink 300ml.", allergens: [], image: "/api/uploads/branding/151fae35-e577-47cf-a173-d736a18d1f93.jpg", popular: false },
  { name: "Tango Orange 300ml", category: "drinks", price: 1.29, description: "Sparkling orange soft drink Tango 300ml.", allergens: [], image: "/api/uploads/branding/02964ee2-3e09-4911-a249-621ed20fd3a9.jpg", popular: false },
  { name: "Rubicon Mango 300ml", category: "drinks", price: 1.29, description: "Refreshing mango juice drink.", allergens: [], image: "/api/uploads/branding/86f3b505-f96d-4cfe-8d19-72db6e3f6045.jpg", popular: false },
  { name: "Water 600ml", category: "drinks", price: 1.29, description: "Still bottled water 600ml.", allergens: [], image: "/api/uploads/branding/e11fc327-e6f4-4f51-bf2c-1f6d26f2cd6f.jpg", popular: false },
  { name: "Pepsi 1.5 Ltr", category: "drinks", price: 3.3, description: "Large bottle of classic Pepsi 1.5 Ltr.", allergens: [], image: "/api/uploads/branding/a22af822-6753-4647-9351-4a9319decf09.jpg", popular: false },
  { name: "7 UP 1.5 Ltr", category: "drinks", price: 3.3, description: "Large bottle of lemon & lime soft drink .", allergens: [], image: "/api/uploads/branding/54fb9676-e7c0-4c2a-816b-d2def8d9874c.jpg", popular: false },
  { name: "Tango Orange Bottle 1.5 Ltr", category: "drinks", price: 3.3, description: "Large bottle of sparkling orange drink 1.5 Ltr.", allergens: [], image: "/api/uploads/branding/ed5d51e9-35a1-4d30-bef9-50e2eb8fbeb0.jpg", popular: false },
  { name: "Pepsi Max Bottle 1.5 Ltr", category: "drinks", price: 3.3, description: "Large bottle of Pepsi Max 1.5 Ltr.", allergens: [], image: "/api/uploads/branding/cbe1c1ac-ab8d-46a2-867a-a76f98022571.jpg", popular: false },
  { name: "Coke Bottle 1.5 Ltr", category: "drinks", price: 3.3, description: "Large bottle of Coke 1.5 Ltr", allergens: [], image: "/api/uploads/branding/c9e088fd-2db7-4a31-95f1-be46785cbf42.jpg", popular: false },
  { name: "Ben & Jerry Cookie Dough Ice cream (500mL)", category: "desserts", price: 6.99, description: "", allergens: [], image: "/api/uploads/branding/bc82a385-6b1a-4f1a-9fc6-33dd6c9eb418.jpg", popular: false },
  { name: "Haagen-Dazs Belgian Chocolate Ice cream (500 mL)", category: "desserts", price: 6.99, description: "", allergens: ["Dairy"], image: "/api/uploads/branding/c6c66c2f-64da-4b93-b22f-fb151df48a09.jpg", popular: false },
  { name: "Haagen-Dazs Cookies & Cream Ice cream (500 mL)", category: "desserts", price: 6.99, description: "", allergens: [], image: "", popular: false },
  { name: "Haagen-Dazs Vanilla Ice cream (500 mL)", category: "desserts", price: 6.99, description: "", allergens: [], image: "", popular: false },
  { name: "Ben & Jerry Choco Fudge Ice cream (500mL)", category: "desserts", price: 6.99, description: "", allergens: [], image: "/api/uploads/branding/827201bb-1e58-4d94-b205-9e0e5543ece8.jpg", popular: false },
  { name: "Chocolate Fudge Cake", category: "desserts", price: 3.99, description: "Chocolate cake coated in smooth fudge icing.", allergens: ["Gluten"], image: "/api/uploads/branding/097d7fb0-6a5f-4771-90e5-d24f8b1d2c73.jpg", popular: false },
  { name: "Strawberry Cheesecake", category: "desserts", price: 3.99, description: "Cheesecake with strawberry flavour and a creamy texture. Contains Gluten, Milk", allergens: [], image: "/api/uploads/branding/8bfb51d8-6373-48c8-8ae4-f6d04a8947a1.jpg", popular: false },
  { name: "Carrot Cake", category: "desserts", price: 3.99, description: "", allergens: ["Gluten"], image: "/api/uploads/branding/9571f7be-628e-4a85-b641-c0e0682f9015.jpg", popular: false },
  { name: "Sour Cream", category: "dips", price: 0.5, description: "Smooth, tangy sour cream dip.", allergens: ["Dairy"], image: "/api/uploads/branding/79cb22ae-c54a-43f5-9b0c-535f9751200e.jpg", popular: false },
  { name: "Chilli Sauce", category: "dips", price: 0.5, description: "(Spicy)", allergens: ["Gluten"], image: "", popular: false },
  { name: "Garlic Mayo", category: "dips", price: 0.5, description: "", allergens: ["Egg"], image: "/api/uploads/branding/7baa7d8b-3132-4fdd-82aa-8eb04c372845.jpg", popular: false },
  { name: "Burger Sauce", category: "dips", price: 0.5, description: "", allergens: [], image: "", popular: false },
  { name: "BBQ Sauce", category: "dips", price: 0.5, description: "", allergens: ["Gluten"], image: "", popular: false },
  { name: "Spicy Mayo", category: "dips", price: 0.5, description: "(Spicy)", allergens: [], image: "", popular: false },
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
