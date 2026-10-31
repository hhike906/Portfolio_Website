/*
  IKE CONTENT — shown only after a visitor enters their email.

  art         – artwork pieces: { title, medium, year, img }
  tattoos     – your tattoo journey, oldest first: { when, title, story, img }
  photography – lifestyle / street / portrait work: { title, place, img }

  img paths: put photos in /images/ike/ and write e.g. "../images/ike/flash-01.jpg".
  "" shows a placeholder.
*/
window.IKE = {
  intro: "Ike is where the work stops being polite. Paintings, flash, the tattoos — mine and the ones I've put on other people — and photographs of the life around them.",

  // Every tattoo piece. ALL of them appear in the Archive grid; the ones with featured: true
  // also get a big interactive deck in the Featured section at the top.
  // cover = the image people play with; shots = everything that opens when they click it.
  // A shot can be a photo (img) or a video (video + poster).
  // focus = where the tattoo is in a photo (x/y in % from the top-left), how far to zoom,
  //         and w/h = how much of the photo the tattoo covers (the zoom never crops past it).
  pieces: [
  {
    title: "Luna Moth",
    featured: true, placement: "Upper back", style: "Fine line", date: "2026",
    note: "Fine line, between the shoulder blades — and what she thought of it.",
    cover: "../images/ike/luna-moth-01.jpg",
    shots: [
      { img: "../images/ike/luna-moth-01.jpg", caption: "Luna Moth", focus: { x: 32, y: 71, zoom: 1.6, w: 0.34, h: 0.58 } },
      { video: "../images/ike/luna-moth-session.mp4", poster: "../images/ike/luna-moth-session.jpg", caption: "Client review" }
    ]
  },
  {
    title: "Red Orchid Vine",
    featured: true, placement: "Lower back", style: "Fine line + colour", date: "Aug 2026",
    note: "Fine line + red, across the lower back.",
    cover: "../images/ike/tattoo-01.jpg",
    shots: [
      { img: "../images/ike/tattoo-01.jpg", caption: "Red Orchid Vine", focus: { x: 50, y: 74, zoom: 1.9, w: 0.8, h: 0.12 } },
      { img: "../images/ike/tattoo-09.jpg", caption: "The vine, up close", focus: { x: 25, y: 50, zoom: 1.25, w: 0.12, h: 0.85 } },
      { img: "../images/ike/tattoo-02.jpg", caption: "Full span", focus: { x: 52, y: 33, zoom: 1.9, w: 0.6, h: 0.12 } },
      { img: "../images/ike/tattoo-03.jpg", caption: "Settled in", focus: { x: 42, y: 45, zoom: 1.9, w: 0.5, h: 0.15 } },
      { img: "../images/ike/tattoo-04.jpg", caption: "Standing", focus: { x: 50, y: 43, zoom: 2.2, w: 0.35, h: 0.08 } },
      { img: "../images/ike/tattoo-05.jpg", caption: "Kneeling", focus: { x: 50, y: 62, zoom: 2.6, w: 0.5, h: 0.07 } },
      { img: "../images/ike/tattoo-06.jpg", caption: "Back view", focus: { x: 50, y: 74, zoom: 2.5, w: 0.5, h: 0.07 } },
      { img: "../images/ike/tattoo-07.jpg", caption: "Over the shoulder", focus: { x: 58, y: 80, zoom: 2.3, w: 0.55, h: 0.08 } },
      { img: "../images/ike/tattoo-08.jpg", caption: "Side light", focus: { x: 35, y: 50, zoom: 1.25, w: 0.12, h: 0.85 } },
      { img: "../images/ike/tattoo-10.jpg", caption: "Line and shadow", focus: { x: 26, y: 50, zoom: 1.25, w: 0.12, h: 0.85 } },
      { img: "../images/ike/tattoo-11.jpg", caption: "Low light", focus: { x: 26, y: 50, zoom: 1.25, w: 0.12, h: 0.85 } },
      { img: "../images/ike/tattoo-12.jpg", caption: "Final", focus: { x: 50, y: 71, zoom: 2.4, w: 0.65, h: 0.08 } }
    ]
  }
  ],

  // Client reviews shown above the booking button. Video with a poster, plus an optional quote.
  reviews: [
    { video: "../images/ike/luna-moth-session.mp4", poster: "../images/ike/luna-moth-session.jpg", piece: "Luna Moth", name: "", quote: "" }
  ],

  art: [
    { title: "Untitled I", medium: "Ink on paper", year: "", img: "" },
    { title: "Untitled II", medium: "Mixed media", year: "", img: "" },
    { title: "Untitled III", medium: "Digital", year: "", img: "" },
    { title: "Flash Sheet 01", medium: "Tattoo flash", year: "", img: "" },
    { title: "Flash Sheet 02", medium: "Tattoo flash", year: "", img: "" },
    { title: "Untitled IV", medium: "Ink on paper", year: "", img: "" }
  ],

  tattoos: [
    { when: "The first one", title: "Where it started", story: "Write the story of your first tattoo — getting it or giving it. What made you pick up the machine?", img: "" },
    { when: "Learning", title: "Practice skin & first clients", story: "The early work: what you got wrong, what you learned, who trusted you first.", img: "" },
    { when: "Finding a style", title: "The line that became mine", story: "When your work started looking like you. Show the piece where it clicked.", img: "" },
    { when: "Now", title: "Ike Ink", story: "What you tattoo today, how to book, and where it's going next.", img: "" }
  ],

  photography: [
    { title: "Fire I", place: "Night", img: "../images/ike/fire-01.jpg" },
    { title: "Fire II", place: "Mural wall", img: "../images/ike/fire-02.jpg" },
    { title: "Fire III", place: "Night", img: "../images/ike/fire-03.jpg" },
    { title: "Street", place: "", img: "" },
    { title: "Portrait", place: "", img: "" },
    { title: "Lifestyle", place: "", img: "" },
    { title: "Studio", place: "", img: "" },
    { title: "Behind the scenes", place: "", img: "" }
  ]
};
