export type ModifierOption = {
  id: string;
  name: string;
  price: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  min: number;
  max: number;
  options: ModifierOption[];
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  popular?: boolean;
  available: boolean;
  modifiers?: ModifierGroup[];
  allergens?: string[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  visible: boolean;
  order: number;
};

export const categories: Category[] = [
  {
    id: "pizza",
    name: "Pizza",
    slug: "pizza",
    icon: "🍕",
    visible: true,
    order: 1,
  },
  {
    id: "pizza-deals",
    name: "Pizza Crazy Deals",
    slug: "pizza-deals",
    icon: "🤩",
    visible: true,
    order: 2,
  },
  {
    id: "pizza-meal",
    name: "Pizza Meals",
    slug: "pizza-meal",
    icon: "🍽️",
    visible: true,
    order: 3,
  },
  {
    id: "burgers",
    name: "Burgers",
    slug: "burgers",
    icon: "🍔",
    visible: true,
    order: 4,
  },
  {
    id: "kebab",
    name: "Kebabs",
    slug: "kebab",
    icon: "🥙",
    visible: true,
    order: 5,
  },
  {
    id: "kebab-pizza",
    name: "Kebab Pizza Specials",
    slug: "kebab-pizza",
    icon: "🍕",
    visible: true,
    order: 6,
  },
  {
    id: "wraps",
    name: "Wraps",
    slug: "wraps",
    icon: "🌯",
    visible: true,
    order: 7,
  },
  {
    id: "sides",
    name: "Sides",
    slug: "sides",
    icon: "🍟",
    visible: true,
    order: 8,
  },
  {
    id: "kids-meal",
    name: "Kids Meals",
    slug: "kids-meal",
    icon: "👶",
    visible: true,
    order: 9,
  },
  {
    id: "lunch-offers",
    name: "Lunch Time Offers",
    slug: "lunch-offers",
    icon: "☀️",
    visible: true,
    order: 10,
  },
  {
    id: "desserts",
    name: "Desserts",
    slug: "desserts",
    icon: "🍰",
    visible: true,
    order: 11,
  },
  {
    id: "dips",
    name: "Dips",
    slug: "dips",
    icon: "🫙",
    visible: true,
    order: 12,
  },
  {
    id: "drinks",
    name: "Drinks",
    slug: "drinks",
    icon: "🥤",
    visible: true,
    order: 13,
  },
];

const pizzaSizeModifier: ModifierGroup = {
  id: "pizza-size",
  name: "Choose Your Size",
  required: true,
  multiSelect: false,
  min: 1,
  max: 1,
  options: [
    { id: "size-9", name: '9" Personal', price: 0 },
    { id: "size-12", name: '12" Medium', price: 3.0 },
    { id: "size-15", name: '15" Large', price: 6.0 },
    { id: "size-18", name: '18" Extra Large', price: 9.0 },
  ],
};

const pizzaCrustModifier: ModifierGroup = {
  id: "pizza-crust",
  name: "Choose Your Crust",
  required: true,
  multiSelect: false,
  min: 1,
  max: 1,
  options: [
    { id: "crust-thin", name: "Thin & Crispy", price: 0 },
    { id: "crust-classic", name: "Classic Hand Tossed", price: 0 },
    { id: "crust-deep", name: "Deep Pan", price: 0.5 },
    { id: "crust-stuffed", name: "Stuffed Crust", price: 1.5 },
  ],
};

const pizzaExtrasModifier: ModifierGroup = {
  id: "pizza-extras",
  name: "Add Extras",
  required: false,
  multiSelect: true,
  min: 0,
  max: 5,
  options: [
    { id: "extra-cheese", name: "Extra Cheese", price: 1.0 },
    { id: "extra-jalapenos", name: "Jalapeños", price: 0.5 },
    { id: "extra-olives", name: "Black Olives", price: 0.5 },
    { id: "extra-mushrooms", name: "Mushrooms", price: 0.5 },
    { id: "extra-pepperoni", name: "Pepperoni", price: 1.0 },
    { id: "extra-sweetcorn", name: "Sweetcorn", price: 0.5 },
  ],
};

const pizzaSauceModifier: ModifierGroup = {
  id: "pizza-sauce",
  name: "Choose Your Sauce",
  required: false,
  multiSelect: false,
  min: 0,
  max: 1,
  options: [
    { id: "sauce-tomato", name: "Tomato", price: 0 },
    { id: "sauce-bbq", name: "BBQ", price: 0 },
    { id: "sauce-garlic", name: "Garlic", price: 0.5 },
    { id: "sauce-peri", name: "Peri Peri", price: 0.5 },
  ],
};

const burgerExtrasModifier: ModifierGroup = {
  id: "burger-extras",
  name: "Add Extras",
  required: false,
  multiSelect: true,
  min: 0,
  max: 4,
  options: [
    { id: "b-extra-cheese", name: "Extra Cheese", price: 0.5 },
    { id: "b-extra-bacon", name: "Bacon", price: 1.0 },
    { id: "b-extra-jalapenos", name: "Jalapeños", price: 0.5 },
    { id: "b-extra-sauce", name: "Burger Sauce", price: 0 },
  ],
};

const drinkSizeModifier: ModifierGroup = {
  id: "drink-size",
  name: "Choose Size",
  required: true,
  multiSelect: false,
  min: 1,
  max: 1,
  options: [
    { id: "drink-can", name: "Can (330ml)", price: 0 },
    { id: "drink-bottle", name: "Bottle (1.5L)", price: 1.0 },
  ],
};

export const products: Product[] = [
  // PIZZAS
  {
    id: "american-hot",
    name: "American Hot",
    description:
      "Spicy beef, jalapeños, red onions and green peppers on a tangy tomato sauce base with mozzarella cheese",
    price: 8.99,
    image: "/images/Pizza/American hot.avif",
    category: "pizza",
    popular: true,
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy", "Soya"],
  },
  {
    id: "cheese-deluxe",
    name: "Cheese Deluxe",
    description:
      "A cheese lover's dream — loaded with mozzarella, cheddar and parmesan on a classic tomato base",
    price: 8.99,
    image: "/images/Pizza/Cheese deluxe.avif",
    category: "pizza",
    popular: true,
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "chicken-tikka",
    name: "Chicken Tikka",
    description:
      "Tender tikka chicken with peppers, red onions and a drizzle of mint yoghurt on a spiced tomato base",
    price: 9.99,
    image: "/images/Pizza/Chicken tikka.avif",
    category: "pizza",
    popular: true,
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy", "Mustard"],
  },
  {
    id: "farm-house",
    name: "Farm House",
    description:
      "Mushrooms, sweetcorn, peppers and red onions on a rich tomato sauce with mozzarella",
    price: 8.99,
    image: "/images/Pizza/Farm house.avif",
    category: "pizza",
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "hawaiian",
    name: "Hawaiian",
    description:
      "Classic combination of ham and pineapple on a tomato sauce base with melted mozzarella cheese",
    price: 8.99,
    image: "/images/Pizza/Hawaiian.avif",
    category: "pizza",
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "hot-spicy",
    name: "Hot & Spicy",
    description:
      "Spicy chicken, jalapeños, red chillies and peppers on a fiery tomato base with extra mozzarella",
    price: 9.99,
    image: "/images/Pizza/Hot & spicy.avif",
    category: "pizza",
    popular: true,
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "margherita",
    name: "Margherita",
    description:
      "The Italian classic — fresh tomato sauce with mozzarella and a hint of basil",
    price: 7.99,
    image: "/images/Pizza/Margherita.avif",
    category: "pizza",
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "meat-feast",
    name: "Meat Feast",
    description:
      "Loaded with pepperoni, beef mince, chicken, ham and sausage on a rich tomato base",
    price: 10.99,
    image: "/images/Pizza/Meat feast.avif",
    category: "pizza",
    popular: true,
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "new-yorker",
    name: "New Yorker",
    description:
      "Big New York slices packed with pepperoni, beef and green peppers on a classic tomato base",
    price: 10.99,
    image: "/images/Pizza/New yorker.avif",
    category: "pizza",
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "pepperoni-feast",
    name: "Pepperoni Feast",
    description:
      "Double pepperoni layered on a zesty tomato sauce with mozzarella — a true classic",
    price: 9.99,
    image: "/images/Pizza/Pepperoni feast.avif",
    category: "pizza",
    popular: true,
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "pepperoni-sizzler",
    name: "Pepperoni Sizzler",
    description:
      "Sizzling pepperoni with jalapeños and extra cheese on a spiced tomato sauce",
    price: 10.99,
    image: "/images/Pizza/Pepperoni sizzler pizza.avif",
    category: "pizza",
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "seafood-special",
    name: "Seafood Special",
    description:
      "Prawns, tuna and sweetcorn on a creamy garlic base with mozzarella cheese",
    price: 11.99,
    image: "/images/Pizza/Seafood special.avif",
    category: "pizza",
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy", "Fish", "Crustaceans"],
  },
  {
    id: "tandoori-chicken",
    name: "Tandoori Chicken",
    description:
      "Marinated tandoori chicken with peppers and onions on a spiced tomato base",
    price: 9.99,
    image: "/images/Pizza/Tandoori chicken.avif",
    category: "pizza",
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy", "Mustard"],
  },
  {
    id: "texas-bbq",
    name: "Texas BBQ",
    description:
      "Smoky BBQ chicken, beef and onions on a rich BBQ sauce base with mozzarella",
    price: 10.99,
    image: "/images/Pizza/Texas bbq.avif",
    category: "pizza",
    popular: true,
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "tuna-delight",
    name: "Tuna Delight",
    description:
      "Tuna, sweetcorn and red onions on a creamy tomato base with mozzarella",
    price: 9.99,
    image: "/images/Pizza/Tuna delight.avif",
    category: "pizza",
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy", "Fish"],
  },
  {
    id: "veggie-sizzler",
    name: "Veggie Sizzler Hot",
    description:
      "Roasted peppers, mushrooms, jalapeños and sweetcorn on a spicy tomato base — vegetarian friendly",
    price: 8.99,
    image: "/images/Pizza/Veggie sizzler hot.avif",
    category: "pizza",
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "veggie-special",
    name: "Veggie Special",
    description:
      "Mushrooms, peppers, red onions, sweetcorn and olives on a classic tomato base",
    price: 8.99,
    image: "/images/Pizza/Veggie special.avif",
    category: "pizza",
    available: true,
    modifiers: [
      pizzaSizeModifier,
      pizzaCrustModifier,
      pizzaSauceModifier,
      pizzaExtrasModifier,
    ],
    allergens: ["Gluten", "Dairy"],
  },

  // PIZZA CRAZY DEALS
  {
    id: "deal-2x9",
    name: 'Any 2 x 9" Pizzas',
    description:
      "Choose any 2 personal 9-inch pizzas from our full menu. Mix and match your favourites!",
    price: 14.99,
    image: "/images/Pizza Crazy deals/Any 2 x 9 inch pizza.avif",
    category: "pizza-deals",
    popular: true,
    available: true,
  },
  {
    id: "deal-2x12",
    name: 'Any 2 x 12" Pizzas',
    description:
      "Choose any 2 medium 12-inch pizzas from our full menu. Perfect for sharing!",
    price: 19.99,
    image: "/images/Pizza Crazy deals/Any 2 x 12 inch pizza.avif",
    category: "pizza-deals",
    popular: true,
    available: true,
  },
  {
    id: "deal-2x15",
    name: 'Any 2 x 15" Pizzas',
    description:
      "Choose any 2 large 15-inch pizzas from our full menu. Great value for hungry families!",
    price: 24.99,
    image: "/images/Pizza Crazy deals/Any 2 x 15 inch pizza.avif",
    category: "pizza-deals",
    available: true,
  },
  {
    id: "deal-2x18",
    name: 'Any 2 x 18" Pizzas',
    description:
      "Choose any 2 extra-large 18-inch pizzas. The ultimate pizza feast for the whole family!",
    price: 29.99,
    image: "/images/Pizza Crazy deals/Any 2 x 18 inch pizza.avif",
    category: "pizza-deals",
    available: true,
  },

  // PIZZA MEALS
  {
    id: "meal-deal-1",
    name: "Meal Deal 1",
    description:
      '9" pizza + side of fries + regular drink. A complete meal at an unbeatable price',
    price: 12.99,
    image: "/images/Pizza Meal/Meal deal 1.avif",
    category: "pizza-meal",
    popular: true,
    available: true,
  },
  {
    id: "meal-deal-2",
    name: "Meal Deal 2",
    description:
      '12" pizza + 2 sides + 2 drinks. Perfect for couples or sharing with a friend',
    price: 17.99,
    image: "/images/Pizza Meal/Meal deal 2.avif",
    category: "pizza-meal",
    available: true,
  },
  {
    id: "big-meal-deal",
    name: "Big Meal Deal",
    description:
      "15\" pizza + 3 sides + 3 drinks. A hearty meal that's perfect for the family",
    price: 24.99,
    image: "/images/Pizza Meal/Big meal deal.avif",
    category: "pizza-meal",
    popular: true,
    available: true,
  },
  {
    id: "pizza-combo-family",
    name: "Pizza Combo Family Deal",
    description:
      '18" pizza + 4 sides + 4 drinks. The ultimate family feast for everyone to enjoy!',
    price: 34.99,
    image: "/images/Pizza Meal/Pizza combo family deal.avif",
    category: "pizza-meal",
    available: true,
  },
  {
    id: "party-pack",
    name: "Party Pack",
    description:
      '2 x 15" pizzas + garlic bread + 6 dips + 6 drinks. Feed the whole party!',
    price: 49.99,
    image: "/images/Pizza Meal/Party pack.avif",
    category: "pizza-meal",
    available: true,
  },
  {
    id: "ice-cream-lovers",
    name: "Ice Cream Lovers",
    description:
      '12" pizza + 2 ice cream desserts of your choice. For those who love pizza AND dessert!',
    price: 18.99,
    image: "/images/Pizza Meal/Ice cream lovers.avif",
    category: "pizza-meal",
    available: true,
  },

  // BURGERS
  {
    id: "bbq-smash-burger",
    name: "BBQ Smash Burger",
    description:
      "Double smash patties with crispy bacon, BBQ sauce, cheese and pickles in a toasted brioche bun",
    price: 8.99,
    image: "/images/Burgers/Bbq smash burger.avif",
    category: "burgers",
    popular: true,
    available: true,
    modifiers: [burgerExtrasModifier],
    allergens: ["Gluten", "Dairy", "Egg", "Sesame"],
  },
  {
    id: "cheeseburger",
    name: "Cheeseburger",
    description:
      "Classic beef patty with melted cheese, lettuce, tomato, onion and burger sauce",
    price: 5.99,
    image: "/images/Burgers/Cheeseburger.avif",
    category: "burgers",
    available: true,
    modifiers: [burgerExtrasModifier],
    allergens: ["Gluten", "Dairy", "Egg", "Sesame"],
  },
  {
    id: "chicken-fillet-burger",
    name: "Chicken Fillet Burger",
    description:
      "Crispy golden chicken fillet with lettuce, mayo and pickles in a soft bun",
    price: 6.99,
    image: "/images/Burgers/Chicken fillet burger.avif",
    category: "burgers",
    popular: true,
    available: true,
    modifiers: [burgerExtrasModifier],
    allergens: ["Gluten", "Dairy", "Egg", "Sesame", "Mustard"],
  },
  {
    id: "classic-smash-burger",
    name: "Classic Smash Burger",
    description:
      "Smashed beef patty with cheese, caramelised onions and signature sauce in a toasted bun",
    price: 7.99,
    image: "/images/Burgers/Classic smash burger.avif",
    category: "burgers",
    available: true,
    modifiers: [burgerExtrasModifier],
    allergens: ["Gluten", "Dairy", "Egg", "Sesame"],
  },
  {
    id: "double-cheeseburger",
    name: "Double Cheeseburger",
    description:
      "Two beef patties, double cheese, lettuce, tomato, onion and burger sauce — double the deliciousness!",
    price: 7.99,
    image: "/images/Burgers/Double cheeseburger.avif",
    category: "burgers",
    available: true,
    modifiers: [burgerExtrasModifier],
    allergens: ["Gluten", "Dairy", "Egg", "Sesame"],
  },
  {
    id: "half-pounder",
    name: "Half Pounder Burger",
    description:
      "A massive half-pound beef patty with lettuce, tomato, cheese and our special sauce",
    price: 10.99,
    image: "/images/Burgers/Half pounder burger.avif",
    category: "burgers",
    popular: true,
    available: true,
    modifiers: [burgerExtrasModifier],
    allergens: ["Gluten", "Dairy", "Egg", "Sesame"],
  },
  {
    id: "quarter-pounder",
    name: "Quarter Pounder Burger",
    description:
      "A juicy quarter-pound beef patty with all the classic burger toppings",
    price: 7.99,
    image: "/images/Burgers/Quarter pounder burger.avif",
    category: "burgers",
    available: true,
    modifiers: [burgerExtrasModifier],
    allergens: ["Gluten", "Dairy", "Egg", "Sesame"],
  },
  {
    id: "spicy-chicken-fillet",
    name: "Spicy Chicken Fillet Burger",
    description:
      "Crispy spiced chicken fillet with peri peri mayo, fresh chillies and pickles in a soft bun",
    price: 7.99,
    image: "/images/Burgers/Spicy chicken fillet burger.avif",
    category: "burgers",
    available: true,
    modifiers: [burgerExtrasModifier],
    allergens: ["Gluten", "Dairy", "Egg", "Sesame", "Mustard"],
  },
  {
    id: "veggie-burger",
    name: "Veggie Burger",
    description:
      "A flavourful plant-based patty with lettuce, tomato, cheese and burger sauce",
    price: 6.99,
    image: "/images/Burgers/Veggie burger.avif",
    category: "burgers",
    available: true,
    modifiers: [burgerExtrasModifier],
    allergens: ["Gluten", "Dairy", "Egg", "Sesame", "Soya"],
  },

  // KEBABS
  {
    id: "chicken-kebab",
    name: "Chicken Kebab",
    description:
      "Marinated grilled chicken served with salad, garlic sauce and pitta bread",
    price: 8.99,
    image: "/images/Kebab/Chicken Kebab.avif",
    category: "kebab",
    popular: true,
    available: true,
    allergens: ["Gluten", "Dairy", "Sesame"],
  },
  {
    id: "lamb-kebab",
    name: "Lamb Doner Kebab",
    description:
      "Tender sliced lamb doner with fresh salad, chilli sauce and pitta bread",
    price: 8.99,
    image: "/images/Kebab/Lamb kebab.avif",
    category: "kebab",
    popular: true,
    available: true,
    allergens: ["Gluten", "Dairy", "Sesame"],
  },

  // KEBAB PIZZA SPECIALS
  {
    id: "kebab-pizza-special",
    name: "Kebab Pizza Special",
    description:
      "A unique fusion of doner kebab meat on a pizza base with garlic sauce and mozzarella",
    price: 11.99,
    image: "/images/Kebab Pizza specials/Kebab Pizza Specials.avif",
    category: "kebab-pizza",
    popular: true,
    available: true,
    modifiers: [pizzaSizeModifier, pizzaCrustModifier],
    allergens: ["Gluten", "Dairy", "Sesame"],
  },
  {
    id: "doner-pizza",
    name: "Lamb/Chicken/Mixed Doner Kebab Pizza",
    description:
      "Your choice of lamb, chicken or mixed doner on a pizza base with salad sauce and cheese",
    price: 12.99,
    image:
      "/images/Kebab Pizza specials/Lamb or chicken or mixed meat doner kebab pizza.avif",
    category: "kebab-pizza",
    available: true,
    modifiers: [pizzaSizeModifier, pizzaCrustModifier],
    allergens: ["Gluten", "Dairy", "Sesame"],
  },

  // WRAPS
  {
    id: "chicken-doner-wrap",
    name: "Chicken Doner Wrap",
    description:
      "Grilled chicken doner with fresh salad, garlic mayo and chilli sauce in a warm tortilla",
    price: 6.99,
    image: "/images/Wraps/Chicken doner wrap.avif",
    category: "wraps",
    popular: true,
    available: true,
    allergens: ["Gluten", "Dairy", "Sesame", "Egg"],
  },
  {
    id: "lamb-doner-wrap",
    name: "Lamb Doner Wrap",
    description:
      "Tender lamb doner with crisp salad, garlic mayo and chilli sauce wrapped in a soft tortilla",
    price: 6.99,
    image: "/images/Wraps/Lamb doner wrap.avif",
    category: "wraps",
    available: true,
    allergens: ["Gluten", "Dairy", "Sesame", "Egg"],
  },
  {
    id: "mixed-doner-wrap",
    name: "Mixed Doner Wrap",
    description:
      "A mix of chicken and lamb doner with salad, garlic mayo and chilli sauce in a warm tortilla",
    price: 7.49,
    image: "/images/Wraps/Mixed doner wrap.avif",
    category: "wraps",
    available: true,
    allergens: ["Gluten", "Dairy", "Sesame", "Egg"],
  },

  // SIDES
  {
    id: "mozzarella-balls",
    name: "10 Mozzarella Balls",
    description:
      "Crispy golden mozzarella balls with a gooey melted cheese centre, served with dipping sauce",
    price: 4.99,
    image: "/images/Sides/10 mozzarella balls.avif",
    category: "sides",
    popular: true,
    available: true,
    allergens: ["Gluten", "Dairy", "Egg"],
  },
  {
    id: "mozzarella-sticks",
    name: "10 Mozzarella Sticks",
    description:
      "Classic mozzarella sticks breaded to perfection, served with marinara dipping sauce",
    price: 4.99,
    image: "/images/Sides/10 mozzarella sticks.avif",
    category: "sides",
    available: true,
    allergens: ["Gluten", "Dairy", "Egg"],
  },
  {
    id: "chicken-nuggets",
    name: "10 Pcs Chicken Nuggets",
    description:
      "Tender chicken nuggets with a crispy golden coating, served with your choice of dipping sauce",
    price: 4.49,
    image: "/images/Sides/10 pcs chicken nuggets.avif",
    category: "sides",
    popular: true,
    available: true,
    allergens: ["Gluten", "Dairy", "Egg"],
  },
  {
    id: "hot-chicken-wings",
    name: "10 Pcs Hot Chicken Wings",
    description:
      "Fiery hot chicken wings marinated in our special spice blend, served with cooling dip",
    price: 5.99,
    image: "/images/Sides/10 pcs hot chicken wings.avif",
    category: "sides",
    available: true,
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "onion-rings",
    name: "10 Pcs Onion Rings",
    description:
      "Beer-battered crispy onion rings, perfectly golden and served with garlic mayo",
    price: 3.99,
    image: "/images/Sides/10 pcs onion rings.avif",
    category: "sides",
    available: true,
    allergens: ["Gluten", "Dairy", "Egg"],
  },
  {
    id: "mutton-rolls",
    name: "3 Pcs Mutton Rolls",
    description:
      "Spiced mutton mince wrapped in crispy pastry, deep fried to golden perfection",
    price: 3.99,
    image: "/images/Sides/3 pcs mutton rolls.avif",
    category: "sides",
    available: true,
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "veg-rolls",
    name: "3 Pcs Veg Rolls",
    description:
      "Mixed vegetable rolls wrapped in crispy pastry — a tasty vegetarian option",
    price: 3.49,
    image: "/images/Sides/3 pcs veg rolls.avif",
    category: "sides",
    available: true,
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "garlic-bread",
    name: "4 Pcs Garlic Bread",
    description:
      "Warm baguette slices brushed with garlic butter, toasted to perfection",
    price: 2.99,
    image: "/images/Sides/4 pcs garlic bread.avif",
    category: "sides",
    popular: true,
    available: true,
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "meat-samosa",
    name: "4 Pcs Meat Samosa",
    description:
      "Crispy pastry triangles filled with spiced minced meat and vegetables",
    price: 3.49,
    image: "/images/Sides/4 pcs meat samosa.avif",
    category: "sides",
    available: true,
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "veg-samosa",
    name: "5 Pcs Vegetable Samosa",
    description:
      "Light and crispy samosas filled with spiced potatoes, peas and vegetables",
    price: 3.49,
    image: "/images/Sides/5 pcs vegetable samosa.avif",
    category: "sides",
    available: true,
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "bbq-wings",
    name: "6 Pcs BBQ Chicken Wings",
    description:
      "Smoky BBQ glazed chicken wings, sticky and finger-licking good",
    price: 4.99,
    image: "/images/Sides/6 pcs bbq chicken wings.avif",
    category: "sides",
    available: true,
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "chicken-dippers",
    name: "6 Pcs Chicken Dippers",
    description:
      "Crispy breaded chicken strips, ideal for dipping in your favourite sauce",
    price: 4.99,
    image: "/images/Sides/6 pcs chicken dippers.avif",
    category: "sides",
    available: true,
    allergens: ["Gluten", "Dairy", "Egg"],
  },
  {
    id: "cheesy-chips",
    name: "Cheesy Chips",
    description:
      "Golden fries topped with melted cheese sauce — irresistibly good",
    price: 3.49,
    image: "/images/Sides/Cheesy chips.avif",
    category: "sides",
    popular: true,
    available: true,
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "chicken-popcorn",
    name: "Chicken Popcorn",
    description:
      "Bite-sized crispy chicken pieces — perfect for snacking or sharing",
    price: 3.99,
    image: "/images/Sides/Chicken popcorn.avif",
    category: "sides",
    available: true,
    allergens: ["Gluten", "Dairy", "Egg"],
  },
  {
    id: "french-fries",
    name: "French Fries",
    description: "Classic crispy golden fries, seasoned with a pinch of salt",
    price: 2.49,
    image: "/images/Sides/French fries.avif",
    category: "sides",
    popular: true,
    available: true,
    allergens: ["Gluten"],
  },
  {
    id: "garlic-bread-cheese",
    name: "Garlic Bread with Cheese",
    description: "Warm garlic bread topped with melted mozzarella cheese",
    price: 3.49,
    image: "/images/Sides/Garlic bread with cheese.avif",
    category: "sides",
    available: true,
    allergens: ["Gluten", "Dairy"],
  },
  {
    id: "potato-wedges",
    name: "Regular Potato Wedges",
    description:
      "Chunky seasoned potato wedges, crispy on the outside and fluffy in the middle",
    price: 3.49,
    image: "/images/Sides/Regular potato wedges.avif",
    category: "sides",
    available: true,
    allergens: ["Gluten"],
  },
  {
    id: "supreme-salad",
    name: "Supreme Salads",
    description:
      "Fresh mixed salad with lettuce, tomatoes, cucumber, onions and dressing",
    price: 3.99,
    image: "/images/Sides/Supreme salads.avif",
    category: "sides",
    available: true,
    allergens: ["Mustard"],
  },

  // KIDS MEALS
  {
    id: "kids-cheeseburger",
    name: "Kids Cheese Burger Meal",
    description:
      "A smaller cheeseburger with kids fries and a drink — perfect for little ones",
    price: 5.99,
    image: "/images/Kids meal/Cheese burger meal.avif",
    category: "kids-meal",
    available: true,
    allergens: ["Gluten", "Dairy", "Egg", "Sesame"],
  },
  {
    id: "kids-chicken-fillet",
    name: "Kids Chicken Fillet Burger Meal",
    description: "Mini chicken fillet burger with kids fries and a soft drink",
    price: 5.99,
    image: "/images/Kids meal/Chicken fillet burger meal.avif",
    category: "kids-meal",
    available: true,
    allergens: ["Gluten", "Dairy", "Egg", "Sesame", "Mustard"],
  },
  {
    id: "kids-nuggets",
    name: "Kids Chicken Nuggets Meal",
    description: "6 chicken nuggets with kids fries and a choice of drink",
    price: 5.49,
    image: "/images/Kids meal/Chicken nuggets meal.avif",
    category: "kids-meal",
    popular: true,
    available: true,
    allergens: ["Gluten", "Dairy", "Egg"],
  },
  {
    id: "kids-popcorn",
    name: "Kids Chicken Popcorn Meal",
    description: "Crispy chicken popcorn with kids fries and a soft drink",
    price: 5.49,
    image: "/images/Kids meal/Chicken popcorn meal.avif",
    category: "kids-meal",
    available: true,
    allergens: ["Gluten", "Dairy", "Egg"],
  },

  // LUNCH TIME OFFERS
  {
    id: "lunch-kebab",
    name: "Any Kebab Meal",
    description:
      "Choice of chicken or lamb kebab + fries + regular drink. Available Mon-Fri 11am-4pm",
    price: 9.99,
    image: "/images/Lunch TIme Offers/Any kebab meal.avif",
    category: "lunch-offers",
    available: true,
  },
  {
    id: "lunch-large-pizza",
    name: "Any Large Pizza Meal",
    description:
      '12" pizza + fries + regular drink. Available Mon-Fri 11am-4pm',
    price: 14.99,
    image: "/images/Lunch TIme Offers/Any large pizza meal.avif",
    category: "lunch-offers",
    popular: true,
    available: true,
  },
  {
    id: "lunch-medium-pizza",
    name: "Any Medium Pizza Meal",
    description: '9" pizza + fries + regular drink. Available Mon-Fri 11am-4pm',
    price: 10.99,
    image: "/images/Lunch TIme Offers/Any medium pizza meal.avif",
    category: "lunch-offers",
    available: true,
  },
  {
    id: "lunch-cheeseburger",
    name: "Cheese Burger Meal",
    description:
      "Cheeseburger + fries + regular drink. Available Mon-Fri 11am-4pm",
    price: 7.99,
    image: "/images/Lunch TIme Offers/Cheese burger meal.avif",
    category: "lunch-offers",
    available: true,
  },
  {
    id: "lunch-wrap",
    name: "Chicken or Lamb Wrap Meal",
    description:
      "Chicken or lamb wrap + fries + regular drink. Available Mon-Fri 11am-4pm",
    price: 8.99,
    image: "/images/Lunch TIme Offers/Chicken or lamb wrap meal.avif",
    category: "lunch-offers",
    available: true,
  },
  {
    id: "lunch-double-cheese",
    name: "Double Cheese Burger Meal",
    description:
      "Double cheeseburger + fries + regular drink. Available Mon-Fri 11am-4pm",
    price: 9.49,
    image: "/images/Lunch TIme Offers/Double cheese burger meal.avif",
    category: "lunch-offers",
    available: true,
  },

  // DESSERTS
  {
    id: "ben-jerrys",
    name: "Ben & Jerry's Ice Cream",
    description:
      "America's most loved ice cream — choose from a range of indulgent flavours",
    price: 4.99,
    image: "/images/Dessert/Ben & jerry's ice cream.avif",
    category: "desserts",
    popular: true,
    available: true,
    allergens: ["Dairy", "Egg", "Soya"],
  },
  {
    id: "carrot-cake",
    name: "Carrot Cake",
    description:
      "Moist homemade carrot cake with cream cheese frosting — a classic treat",
    price: 3.49,
    image: "/images/Dessert/Carrot cake.avif",
    category: "desserts",
    available: true,
    allergens: ["Gluten", "Dairy", "Egg", "Nuts"],
  },
  {
    id: "chocolate-fudge-cake",
    name: "Chocolate Fudge Cake",
    description:
      "Rich and decadent chocolate fudge cake with chocolate ganache — pure indulgence",
    price: 3.49,
    image: "/images/Dessert/Chocolate fudge cake.avif",
    category: "desserts",
    popular: true,
    available: true,
    allergens: ["Gluten", "Dairy", "Egg", "Soya"],
  },
  {
    id: "haagen-dazs",
    name: "Häagen-Dazs Ice Cream",
    description:
      "Premium luxury ice cream in a variety of classic and indulgent flavours",
    price: 4.99,
    image: "/images/Dessert/Haagen-dazs ice cream.avif",
    category: "desserts",
    available: true,
    allergens: ["Dairy", "Egg"],
  },
  {
    id: "strawberry-cheesecake",
    name: "Strawberry Cheesecake",
    description:
      "Creamy New York style cheesecake with a fresh strawberry topping on a biscuit base",
    price: 3.99,
    image: "/images/Dessert/Strawberry cheese cake.avif",
    category: "desserts",
    available: true,
    allergens: ["Gluten", "Dairy", "Egg"],
  },

  // DIPS
  {
    id: "bbq-dip",
    name: "BBQ Dip",
    description:
      "Smoky and sweet BBQ dipping sauce — pairs perfectly with wings and dippers",
    price: 0.99,
    image: "/images/Dips/Bbq dip.avif",
    category: "dips",
    available: true,
  },
  {
    id: "garlic-mayo",
    name: "Garlic Mayo",
    description:
      "Creamy garlic mayonnaise — the perfect dip for fries and kebabs",
    price: 0.99,
    image: "/images/Dips/Garlic mayo.avif",
    category: "dips",
    popular: true,
    available: true,
    allergens: ["Egg", "Mustard"],
  },
  {
    id: "sour-cream",
    name: "Sour Cream",
    description: "Cool and tangy sour cream dip — great with wedges and nachos",
    price: 0.99,
    image: "/images/Dips/Sour cream.avif",
    category: "dips",
    available: true,
    allergens: ["Dairy"],
  },
  {
    id: "spicy-mayo",
    name: "Spicy Mayo",
    description:
      "Creamy mayonnaise with a fiery chilli kick — not for the faint hearted!",
    price: 0.99,
    image: "/images/Dips/Spicy mayo.avif",
    category: "dips",
    available: true,
    allergens: ["Egg", "Mustard"],
  },

  // DRINKS
  {
    id: "coke",
    name: "Coca-Cola",
    description: "The classic taste of Coca-Cola, ice cold and refreshing",
    price: 1.49,
    image: "/images/Drinks/Coke.avif",
    category: "drinks",
    popular: true,
    available: true,
    modifiers: [drinkSizeModifier],
  },
  {
    id: "diet-coke",
    name: "Diet Coke",
    description: "All the great Coca-Cola taste with no sugar",
    price: 1.49,
    image: "/images/Drinks/Diet coke.avif",
    category: "drinks",
    available: true,
    modifiers: [drinkSizeModifier],
  },
  {
    id: "pepsi",
    name: "Pepsi",
    description: "Ice cold Pepsi — the taste that makes you smile",
    price: 1.49,
    image: "/images/Drinks/Pepsi.avif",
    category: "drinks",
    available: true,
    modifiers: [drinkSizeModifier],
  },
  {
    id: "pepsi-max",
    name: "Pepsi Max",
    description: "Maximum Pepsi taste with zero sugar",
    price: 1.49,
    image: "/images/Drinks/Pepsi max.avif",
    category: "drinks",
    available: true,
    modifiers: [drinkSizeModifier],
  },
  {
    id: "7up",
    name: "7UP",
    description: "Crisp, clean lemon-lime flavour — light and refreshing",
    price: 1.49,
    image: "/images/Drinks/7 up.avif",
    category: "drinks",
    available: true,
    modifiers: [drinkSizeModifier],
  },
  {
    id: "tango-orange",
    name: "Tango Orange",
    description: "Intensely fruity orange flavour fizzy drink",
    price: 1.49,
    image: "/images/Drinks/Tango orange.avif",
    category: "drinks",
    available: true,
    modifiers: [drinkSizeModifier],
  },
  {
    id: "mirinda",
    name: "Mirinda",
    description: "Sweet and fruity orange soft drink",
    price: 1.49,
    image: "/images/Drinks/Mirinda.avif",
    category: "drinks",
    available: true,
    modifiers: [drinkSizeModifier],
  },
  {
    id: "rubicon-mango",
    name: "Rubicon Mango",
    description: "Exotic mango fruit drink — a tropical delight",
    price: 1.49,
    image: "/images/Drinks/Rubicon mango.avif",
    category: "drinks",
    popular: true,
    available: true,
  },
  {
    id: "rubicon-guava",
    name: "Rubicon Guava",
    description: "Refreshing guava fruit drink with a tropical twist",
    price: 1.49,
    image: "/images/Drinks/Rubicon guava.avif",
    category: "drinks",
    available: true,
  },
  {
    id: "rubicon-lychee",
    name: "Rubicon Lychee",
    description: "Delicate and sweet lychee fruit drink",
    price: 1.49,
    image: "/images/Drinks/Rubicon lychee.avif",
    category: "drinks",
    available: true,
  },
  {
    id: "rubicon-passion",
    name: "Rubicon Passion",
    description: "Tangy passionfruit drink full of tropical flavour",
    price: 1.49,
    image: "/images/Drinks/Rubicon passion.avif",
    category: "drinks",
    available: true,
  },
  {
    id: "coke-bottle",
    name: "Coca-Cola Bottle (1.5L)",
    description: "Large bottle of ice cold Coca-Cola — perfect for sharing",
    price: 2.49,
    image: "/images/Drinks/Coke bottle.avif",
    category: "drinks",
    available: true,
  },
  {
    id: "pepsi-max-bottle",
    name: "Pepsi Max Bottle (1.5L)",
    description: "Large bottle of Pepsi Max — zero sugar, maximum taste",
    price: 2.49,
    image: "/images/Drinks/Pepsi max bottle.avif",
    category: "drinks",
    available: true,
  },
];

export const openingHours = [
  { day: "Monday", open: "11:00", close: "23:00", closed: false },
  { day: "Tuesday", open: "11:00", close: "23:00", closed: false },
  { day: "Wednesday", open: "11:00", close: "23:00", closed: false },
  { day: "Thursday", open: "11:00", close: "23:00", closed: false },
  { day: "Friday", open: "11:00", close: "23:30", closed: false },
  { day: "Saturday", open: "11:00", close: "23:30", closed: false },
  { day: "Sunday", open: "12:00", close: "23:00", closed: false },
];

export const deliveryZones = [
  { postcode: "TW18", minOrder: 10.0, deliveryFee: 1.99 },
  { postcode: "TW19", minOrder: 10.0, deliveryFee: 1.99 },
  { postcode: "TW20", minOrder: 12.0, deliveryFee: 2.49 },
  { postcode: "KT16", minOrder: 12.0, deliveryFee: 2.49 },
  { postcode: "GU25", minOrder: 15.0, deliveryFee: 2.99 },
];

export const activeCoupons = [
  {
    code: "PIZZA10",
    type: "percentage",
    value: 10,
    minOrder: 15,
    description: "10% off orders over £15",
  },
  {
    code: "FIRSTORDER",
    type: "fixed",
    value: 5,
    minOrder: 20,
    description: "£5 off your first order",
  },
  {
    code: "FREEDEL",
    type: "freeDelivery",
    value: 0,
    minOrder: 20,
    description: "Free delivery on orders over £20",
  },
];

export const popularProducts = products.filter((p) => p.popular);
