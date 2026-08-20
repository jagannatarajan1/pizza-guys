// Item-by-item audit of the live menu against the source menu.
//   node scripts/audit-menu.js
// Exits non-zero if anything is missing, mispriced, or missing its steps.

require('./load-env.js')()
const { PrismaClient } = require('@prisma/client')
const catalogue = require('./menu-catalogue.js')
const prisma = new PrismaClient()

const problems = []
const ok = (m) => console.log(`  ok    ${m}`)
const bad = (m) => { problems.push(m); console.log(`  MISS  ${m}`) }

// name → expected price in pounds, from the source menu
const EXPECTED = {
  pizzas: Object.fromEntries([
    'Margarita Pizza','Veggie Special Pizza','Veggie Sizzler Hot Pizza','Pizza Guys Special Pizza',
    'Tandoori Chicken Pizza','Chicken Tikka Pizza','American Hot Pizza','Seafood Special Pizza',
    'Cheese Delight Pizza','Tuna Delight Pizza','Texas BBQ Pizza','Meat Feast Pizza',
    'Pepperoni Feast Pizza','Hawaiian Pizza','Farm House Pizza','New Yorker Pizza','Hot and Spicy Pizza',
    'Lamb Doner Kebab Pizza','Chicken Doner Kebab Pizza','Mixed Doner Kebab Pizza','BBQ Kebab Pizza',
  ].map((n) => [n, 10.99])),
  kebabs: {
    'Chicken Kebab (In Pitta)': 8.00, 'Lamb Kebab (In Pitta)': 8.00, 'Mixed Kebab (In Pitta)': 8.00,
    'Chicken Kebab (Meat Only)': 7.55, 'Lamb Kebab (Meat Only)': 7.55, 'Mixed Kebab (Meat Only)': 7.55,
  },
  wraps: {
    'Chicken Doner Wrap': 8.00, 'Lamb Doner Wrap': 8.00, 'Mixed Doner Wrap': 8.00,
    'Chicken Doner Wrap (Meat Only)': 7.55, 'Lamb Doner Wrap (Meat Only)': 7.55, 'Mixed Doner Wrap (Meat Only)': 7.55,
  },
  burgers: {
    'Cheese Burger': 3.99, 'Double Cheese Burger': 4.99, 'Hawaiian Cheese Burger': 4.99,
    '1/4 Pounder with Cheese': 5.99, '1/2 Pounder with Cheese': 6.99,
    'Chicken Fillet Burger': 5.50, 'Spicy Chicken Burger': 5.50, 'Veggie Burger': 4.99,
  },
  smashBurgers: { 'Hawaiian Smashburger': 8.99, 'Classic Burger': 8.99, 'BBQ Burger': 8.99 },
  sides: {
    'French Fries (small)': 1.99, 'French Fries (medium)': 2.99, 'French Fries (large)': 3.99,
    'Cheesy Chips': 3.99, 'Regular Potato Wedges': 3.99, 'Onion Rings (10 pieces)': 2.99,
    'Garlic Pizza (7")': 4.99, 'Garlic Bread (4 pieces)': 2.99, 'Garlic Bread with Cheese (4 pieces)': 3.99,
    'Chicken Nuggets (10 pieces)': 4.49, 'Hot Chicken Wings (10 pieces)': 6.99,
    'BBQ Chicken Wings (6 pieces)': 4.99, 'Chicken Dippers (6 pieces)': 4.99,
    'Vegetable Samosa (5 pieces)': 2.99, 'Meat Samosa (4 pieces)': 3.99,
    'Mutton Rolls (3 pieces)': 5.99, 'Veg Rolls (3 pieces)': 5.99, 'Chicken Popcorn': 4.99,
    '10 Mozzarella Balls': 4.49, '10 Mozzarella Sticks': 4.49, 'Supreme Salads': 3.30,
  },
  drinks: Object.assign(
    Object.fromEntries(['Rubicon Guava 300ml','Rubicon Lychee 300ml','Rubicon Passion 300ml','Coke 300ml',
      'Diet Coke 300ml','7 UP 300ml','Mirinda 300ml','Pepsi 300ml','Pepsi Max 300ml','Tango Orange 300ml',
      'Rubicon Mango 300ml','Water 600ml'].map((n) => [n, 1.29])),
    Object.fromEntries(['Pepsi 1.5 Ltr','7 UP 1.5 Ltr','Tango Orange Bottle 1.5 Ltr','Pepsi Max Bottle 1.5 Ltr',
      'Coke Bottle 1.5 Ltr'].map((n) => [n, 3.30]))
  ),
  desserts: Object.assign(
    Object.fromEntries(['Ben & Jerry Cookie Dough Ice cream (500mL)','Haagen-Dazs Belgian Chocolate Ice cream (500 mL)',
      'Haagen-Dazs Cookies & Cream Ice cream (500 mL)','Haagen-Dazs Vanilla Ice cream (500 mL)',
      'Ben & Jerry Choco Fudge Ice cream (500mL)'].map((n) => [n, 6.99])),
    Object.fromEntries(['Chocolate Fudge Cake','Strawberry Cheesecake','Carrot Cake'].map((n) => [n, 3.99]))
  ),
  dips: Object.fromEntries(['Sour Cream','Chilli Sauce','Garlic Mayo','Burger Sauce','BBQ Sauce','Spicy Mayo']
    .map((n) => [n, 0.50])),
}

const REQUIRED_CATEGORIES = ['Pizzas','Kebabs','Wraps','Burgers','Smash Burgers','Sides','Drinks','Desserts','Dips']

;(async () => {
  const cats = await prisma.category.findMany()
  const products = await prisma.product.findMany()
  const byName = new Map(products.map((p) => [p.name.toLowerCase(), p]))

  console.log('\n=== Categories ===')
  for (const name of REQUIRED_CATEGORIES) {
    const found = cats.find((c) => c.name.toLowerCase() === name.toLowerCase())
    found ? ok(`${name}${found.visible ? '' : ' (HIDDEN)'}`) : bad(`category missing: ${name}`)
  }

  for (const [section, expected] of Object.entries(EXPECTED)) {
    console.log(`\n=== ${section} (${Object.keys(expected).length} expected) ===`)
    for (const [name, price] of Object.entries(expected)) {
      const p = byName.get(name.toLowerCase())
      if (!p) { bad(`${section}: product missing — ${name}`); continue }
      const actual = p.price / 100
      if (Math.abs(actual - price) > 0.001) bad(`${section}: ${name} is £${actual.toFixed(2)}, menu says £${price.toFixed(2)}`)
      else if (!p.available) bad(`${section}: ${name} is marked unavailable`)
      else ok(`${name} £${actual.toFixed(2)}`)
    }
  }

  console.log('\n=== Steps attached to each product ===')
  for (const p of products) {
    const expectedSteps = catalogue.stepsForProduct(p)
    if (!expectedSteps) continue
    let actual = []
    try { actual = JSON.parse(p.modifiers || '[]') } catch { actual = [] }
    const want = expectedSteps.map((g) => g.id).join(',')
    const got = actual.map((g) => g.id).join(',')
    if (want !== got) bad(`${p.name}: steps are [${got}] but should be [${want}]`)
  }
  if (problems.length === 0) ok('every product carries exactly the steps its category calls for')

  console.log('\n=== Step contents ===')
  const pizza = byName.get('margarita pizza')
  const steps = JSON.parse(pizza.modifiers)
  const sizes = steps.find((g) => g.id === 'pizza-size')
  const bases = steps.find((g) => g.id === 'pizza-base')
  const crust = steps.find((g) => g.id === 'pizza-cheesy-crust')
  const tops  = steps.find((g) => g.id === 'pizza-toppings')
  const drink = steps.find((g) => g.id === 'pizza-drink')
  const meal  = steps.find((g) => g.id === 'pizza-meal')
  const mealD = steps.find((g) => g.id === 'pizza-meal-drink')
  const half  = steps.find((g) => g.id === 'pizza-half-half')

  sizes?.options.length === 4 ? ok('4 pizza sizes') : bad('pizza sizes wrong')
  const sizePrices = Object.fromEntries(sizes.options.map((o) => [o.name, o.price]))
  JSON.stringify(sizePrices) === JSON.stringify({'Medium (9")':0,'Large (12")':4.55,'Extra Large (15")':8.9,'Mega Large (18")':12.25})
    ? ok('size prices 0 / 4.55 / 8.90 / 12.25') : bad(`size prices wrong: ${JSON.stringify(sizePrices)}`)
  bases?.options.length === 3 && bases.required ? ok('3 required bases') : bad('pizza bases wrong')
  const cp = crust.options[0].priceBy
  JSON.stringify(cp) === JSON.stringify({'size-medium':1.49,'size-large':1.99,'size-xl':2.49,'size-mega':2.99})
    ? ok('cheesy crust 1.49 / 1.99 / 2.49 / 2.99 by size') : bad(`crust prices wrong: ${JSON.stringify(cp)}`)
  tops?.options.length === 22 ? ok('22 toppings') : bad(`toppings: ${tops?.options.length} of 22`)
  tops?.options.every((o) => o.price === 1.5) ? ok('every topping £1.50') : bad('a topping is not £1.50')
  tops?.max === 10 ? ok('up to 10 toppings') : bad(`topping max is ${tops?.max}`)
  const tagged = tops.options.filter((o) => o.tag).length
  tagged === 8 ? ok(`${tagged} toppings carry a spicy/allergen badge`) : bad(`${tagged} tagged toppings, expected 8`)
  half?.options[0]?.price === 1.5 ? ok('half and half £1.50') : bad('half and half wrong')
  drink?.options.length === 12 && drink.options.every((o) => o.price === 1.29) ? ok('12 drinks at £1.29') : bad('pizza drink list wrong')
  meal?.options[0]?.price === 2.99 ? ok('meal £2.99') : bad('meal price wrong')
  mealD?.options.length === 12 && mealD.dependsOn?.groupId === 'pizza-meal' ? ok('12 meal drinks, shown only after a meal is added') : bad('meal drink step wrong')

  const kebab = byName.get('chicken kebab (in pitta)')
  const ks = JSON.parse(kebab.modifiers)
  const salad = ks.find((g) => g.id === 'kebab-salad')
  const sauce = ks.find((g) => g.id === 'kebab-sauce')
  salad?.options.length === 6 && salad.max === 5 && salad.maxPerOption === 2 && salad.required
    ? ok('kebab salad: 6 options, up to 5, each twice, required') : bad('kebab salad rules wrong')
  sauce?.options.length === 6 && sauce.max === 6 && sauce.maxPerOption === 2 && !sauce.required
    ? ok('kebab sauce: 6 options, up to 6, each twice, optional') : bad('kebab sauce rules wrong')

  console.log('\n=== Extras present in the shop but not on the source menu ===')
  const expectedNames = new Set(Object.values(EXPECTED).flatMap((o) => Object.keys(o)).map((n) => n.toLowerCase()))
  const auditedCats = new Set(['pizza','kebab-pizza','kebab','wraps','burgers','smash-burgers','sides','drinks','desserts','dips'])
  const extras = products.filter((p) => auditedCats.has(p.category) && !expectedNames.has(p.name.toLowerCase()))
  extras.length ? extras.forEach((p) => console.log(`  note  kept: ${p.name} (${p.category}) £${(p.price/100).toFixed(2)}`))
                : console.log('  none')

  console.log(`\n${problems.length === 0 ? 'AUDIT CLEAN — every item on the source menu is present and priced correctly.' : `${problems.length} PROBLEM(S) FOUND`}`)
  await prisma.$disconnect()
  process.exit(problems.length === 0 ? 0 : 1)
})().catch(async (e) => { console.error('FAILED:', e.message); await prisma.$disconnect(); process.exit(1) })
