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

  // The interactive "featured" piece at the top of the vault.
  // cover = the image people play with; shots = everything that opens when they click it.
  featured: {
    title: "Red Orchid Vine",
    note: "Fine line + red.",
    cover: "../images/ike/tattoo-02.jpg",
    shots: [
      { img: "../images/ike/tattoo-02.jpg", caption: "Red Orchid Vine — fine line" },
      { img: "../images/ike/tattoo-03.jpg", caption: "Red Orchid Vine — flow" },
      { img: "../images/ike/tattoo-01.jpg", caption: "Lower back — full span" },
      { img: "../images/ike/fire-02.jpg", caption: "Fire, mural wall" },
      { img: "../images/ike/fire-01.jpg", caption: "Fire I" },
      { img: "../images/ike/fire-03.jpg", caption: "Fire III" }
    ]
  },

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
