/*
  HOVE HURU PRODUCTS: edit this list to manage the shop.

  Each product:
    name        - product name
    category    - "Bracelets", "Rings", "Furniture", "Metalwork" or "Textiles" (drives the filter)
    clan        - one of the six orders, or ""
    price       - number in USD, e.g. 120. Use null to show "Price on request".
    status      - "available", "made-to-order", "coming-soon" or "sold-out"
    edition     - e.g. "Edition of 25" or ""
    description - 1 or 2 sentences
    img         - photo path, e.g. "../images/hh/ninth-fin-bracelet.jpg". "" shows a placeholder.
    buyLink     - Stripe Payment Link (https://buy.stripe.com/...). When set and status is
                  "available", the button becomes BUY NOW and takes card payment.
                  When empty, the button opens an inquiry form instead.

  HOW TO TAKE PAYMENTS (no website code needed):
    1. Make a Stripe account → Payment Links → New.
    2. Add the product name, price and photo; turn on "Collect shipping address".
    3. Copy the link (https://buy.stripe.com/...) and paste it into buyLink below.
*/
window.PRODUCTS = [
  {
    name: "Ninth Fin Copper Bracelet",
    category: "Bracelets",
    clan: "The Ninth Fin",
    price: null,
    status: "available",
    edition: "First edition",
    description: "The house's first piece. Hand-braided copper for the strategists and financiers, those who move unseen.",
    img: "",
    buyLink: "",
    featured: true
  },
  {
    name: "Braided Copper Bracelet",
    category: "Bracelets",
    clan: "",
    price: null,
    status: "made-to-order",
    edition: "",
    description: "Copper wire braided by hand in the workshop and finished to your wrist size. Each one carries small variations. That is the point.",
    img: "",
    buyLink: ""
  },
  {
    name: "Clan Signet Ring",
    category: "Rings",
    clan: "",
    price: null,
    status: "coming-soon",
    edition: "",
    description: "A signet bearing your order's mark. A symbol of belonging, worn on the hand that signs.",
    img: "",
    buyLink: ""
  },
  {
    name: "Throne Hearth",
    category: "Metalwork",
    clan: "",
    price: null,
    status: "made-to-order",
    edition: "Commissioned",
    description: "A hand-fabricated steel fire pit built as a gathering place, the centre of a home's ritual life.",
    img: "",
    buyLink: ""
  },
  {
    name: "Steel & Timber Chair",
    category: "Furniture",
    clan: "",
    price: null,
    status: "made-to-order",
    edition: "",
    description: "Welded steel frame with a solid wood seat and back. Built one at a time in Wichita.",
    img: "",
    buyLink: ""
  },
  {
    name: "Custom Metalwork Commission",
    category: "Metalwork",
    clan: "",
    price: null,
    status: "made-to-order",
    edition: "",
    description: "Signs, frames, sculpture and functional pieces in steel, designed with you and fabricated by hand.",
    img: "",
    buyLink: ""
  },
  {
    name: "Clan Bandana",
    category: "Textiles",
    clan: "",
    price: null,
    status: "coming-soon",
    edition: "Limited",
    description: "Printed with the symbols of the six orders.",
    img: "",
    buyLink: ""
  },
  {
    name: "Silk Scarf",
    category: "Textiles",
    clan: "",
    price: null,
    status: "coming-soon",
    edition: "Limited",
    description: "Silk carrying the house mythology, released in small numbered runs.",
    img: "",
    buyLink: ""
  }
];

window.CLANS = [
  { name: "The Ninth Fin", animal: "Great White Shark", role: "Strategists, financiers and shadow rulers." },
  { name: "Order of the Pine", animal: "Porcupine", role: "Legacy guardians and tacticians." },
  { name: "Sable Tongue", animal: "", role: "Diplomats, artists, seducers and influencers." },
  { name: "Gora", animal: "White-Headed Vulture", role: "Archivists, resurrectionists and truth-reapers." },
  { name: "Order of Mvumi", animal: "Copper Serpent", role: "Alchemists, illusionists and paradox philosophers." },
  { name: "Well of Dziva", animal: "Thread of Mawe", role: "Healers, oathkeepers and bloodlines." }
];
