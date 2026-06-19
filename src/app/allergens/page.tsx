export const metadata = { title: 'Allergy Information | Pizza Guys' }

const ALLERGENS = [
  { name: 'Gluten', desc: 'Found in wheat flour used in pizza dough, burger buns, and breading' },
  { name: 'Dairy', desc: 'Present in mozzarella, cheddar, cream cheese, butter, and sauces' },
  { name: 'Eggs', desc: 'Used in mayonnaise, burger sauces, and some coatings' },
  { name: 'Fish', desc: 'Present in seafood pizza, tuna products, and Worcestershire sauce' },
  { name: 'Crustaceans', desc: 'Prawns used in seafood special pizza' },
  { name: 'Nuts', desc: 'Used in some desserts. May be present in our kitchen environment' },
  { name: 'Soya', desc: 'Present in some sauces, veggie products and ice cream' },
  { name: 'Sesame', desc: 'Present in burger buns and some sauces' },
  { name: 'Mustard', desc: 'Present in some dips, sauces and marinades' },
  { name: 'Celery', desc: 'May be present in some spice blends and stocks' },
  { name: 'Sulphites', desc: 'Present in some drinks, dried fruits, and processed meats' },
  { name: 'Lupin', desc: 'May be present in some flour blends' },
]

export default function AllergensPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 mb-8">
        <h2 className="font-bold text-amber-800 mb-2">⚠️ Important Allergy Notice</h2>
        <p className="text-amber-700 text-sm leading-relaxed">
          Our kitchen handles all 14 major allergens. While we take all reasonable precautions to prevent cross-contamination,
          we <strong>cannot guarantee</strong> that any of our products are completely free from allergens.
          If you have a severe allergy, please call us on <strong>01784 452 888</strong> before ordering.
        </p>
      </div>

      <h1 className="text-3xl font-black text-gray-900 mb-2">Allergy Information</h1>
      <p className="text-gray-500 text-sm mb-8">
        Each product on our menu lists the allergens it contains. Below is an overview of the 14 major allergens and where they may be found in our food.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mb-10">
        {ALLERGENS.map((a) => (
          <div key={a.name} className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 text-sm mb-1">{a.name}</h3>
            <p className="text-gray-500 text-xs">{a.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 mb-2">Need More Information?</h3>
        <p className="text-gray-600 text-sm mb-3">
          For detailed allergen information about specific menu items, please speak to a member of our team before ordering.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="tel:01784452888" className="bg-red-600 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-red-700 transition-colors">
            📞 Call Us
          </a>
          <a href="mailto:info@pizzaguys.co.uk" className="bg-gray-200 text-gray-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors">
            ✉️ Email Us
          </a>
        </div>
      </div>
    </div>
  )
}
