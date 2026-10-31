/*
  ENGINEERING PROJECTS: edit this list to add, remove or update projects.

  Each project:
    title     - short name
    type      - "Work", "Class", "Senior Design" or "Fabrication" (drives the filter buttons)
    org       - where it happened
    when      - date or term
    summary   - one sentence shown on the card
    problem   - what needed solving
    approach  - what YOU did (methods, tools)
    result    - measurable outcome. LEAVE "" UNTIL YOU HAVE A REAL NUMBER. Empty results are hidden.
    skills    - list of tags
    img       - path to a photo, e.g. "../images/eng/bosch-line5.jpg". "" shows a placeholder.
    featured  - true puts it in the top row

  Rule: every result should be a number a hiring manager can repeat:
  minutes saved, % defects cut, queue shortened, cost avoided.
*/
window.PROJECTS = [
  {
    title: "Line 5 Insulation Gluing Improvement",
    type: "Senior Design",
    org: "Bosch Home Comfort · ACE Consulting team",
    when: "Fall 2026 · in progress",
    summary: "Senior design engagement improving the insulation gluing operation on a production line for an industry sponsor.",
    problem: "The sponsor's Line 5 insulation gluing step needed analysis and improvement.",
    approach: "Working as part of a consulting team on current-state analysis and improvement proposals for the gluing operation; I own and present a section of the team's progress reports to the sponsor.",
    result: "",
    skills: ["Process analysis", "Process improvement", "Client reporting", "Teamwork"],
    img: "",
    featured: true
  },
  {
    title: "Makerspace Access & Scheduling Bottlenecks",
    type: "Work",
    org: "GoCreate makerspace, Wichita State",
    when: "",
    summary: "Applied queueing and bottleneck analysis to a backlog of roughly 300 pending access-badge requests and equipment scheduling conflicts.",
    problem: "Members waited on badge access (about 300 requests pending) and scheduling on high-demand equipment such as quilting machines was producing delays and fairness complaints.",
    approach: "Mapped the request-to-access process flow, identified the bottleneck steps, applied queueing concepts to the backlog, and proposed scheduling rules for shared equipment.",
    result: "",
    skills: ["Bottleneck analysis", "Queueing", "Process mapping", "Operations"],
    img: "",
    featured: true
  },
  {
    title: "Composites Layup & Research",
    type: "Work",
    org: "NIAR (National Institute for Aviation Research)",
    when: "Since Oct 2022",
    summary: "Composite layup and research support for aerospace work at one of the largest university aviation research institutes in the US.",
    problem: "Research programs need composite parts laid up to specification, consistently and with documented process control.",
    approach: "Perform composite layups and support research testing, following aerospace quality and documentation standards.",
    result: "",
    skills: ["Composites", "Aerospace", "Quality standards", "Documentation"],
    img: "",
    featured: true
  },
  {
    title: "Ergonomic Workstation Redesign",
    type: "Class",
    org: "Wichita State · Industrial Engineering",
    when: "",
    summary: "Redesigned a manual workstation to reduce upper-extremity and lower-back injury risk.",
    problem: "A workstation involving grill-rack handling, a conveyor and parts bins exposed workers to musculoskeletal risk.",
    approach: "Used anthropometric data to set heights and reaches, applied ACGIH lifting guidance, repositioned the conveyor and parts bins, and integrated safety requirements into the layout.",
    result: "",
    skills: ["Ergonomics", "Anthropometry", "ACGIH lifting", "Workplace safety"],
    img: "",
    featured: false
  },
  {
    title: "Contact Management Database",
    type: "Class",
    org: "IME 556 · Information Systems",
    when: "",
    summary: "Relational database application in Microsoft Access with validated, multi-tab data entry.",
    problem: "Build a working contact-management system with clean data entry and enforced relationships.",
    approach: "Designed the relational schema with keys and referential integrity, then built a multi-tab form (contacts, preferences, payments, notes, revisions, map) with validation, lookups and conditional formatting.",
    result: "",
    skills: ["Database design", "Microsoft Access", "Data validation", "UI forms"],
    img: "",
    featured: false
  },
  {
    title: "Statistical Quality Control",
    type: "Class",
    org: "IME 554 · Statistical Quality Control",
    when: "",
    summary: "Statistical process control and quality analysis applied to engineering data.",
    problem: "Detect and control process variation before it produces defects.",
    approach: "Applied control charts, capability analysis and statistical tables to engineering quality problems.",
    result: "",
    skills: ["SPC", "Control charts", "Capability", "Statistics"],
    img: "",
    featured: false
  },
  {
    title: "Blast-Door Frame Fabrication",
    type: "Fabrication",
    org: "RedGuard · via GoCreate",
    when: "",
    summary: "Welded steel frames for blast-door related fabrication on a contracted job.",
    problem: "A commercial client needed steel frames fabricated to spec.",
    approach: "Cut, fit and welded steel frames to drawing.",
    result: "",
    skills: ["Welding", "Steel fabrication", "Reading drawings"],
    img: "",
    featured: false
  },
  {
    title: "Wichita State Airport Sign",
    type: "Fabrication",
    org: "GoCreate makerspace",
    when: "",
    summary: "Helped fabricate a university sign for the airport using a water-jet cutter.",
    problem: "Produce a large, precise metal sign for a public location.",
    approach: "Prepared and ran water-jet cutting and assisted with finishing and assembly.",
    result: "",
    skills: ["Water-jet", "CNC", "Finishing"],
    img: "",
    featured: false
  },
  {
    title: "Pinball Machine Build",
    type: "Fabrication",
    org: "GoCreate makerspace",
    when: "",
    summary: "Fabrication work on a full pinball machine build.",
    problem: "Combine mechanical, electrical and cabinet work into one working machine.",
    approach: "Contributed fabrication and assembly work across the build.",
    result: "",
    skills: ["Fabrication", "Assembly", "Mechanisms"],
    img: "",
    featured: false
  },
  {
    title: "Campus Pipe Installation",
    type: "Fabrication",
    org: "Wichita State",
    when: "",
    summary: "Fabricated metal pipe sections for a campus installation.",
    problem: "Produce pipe components to fit an on-site installation.",
    approach: "Cut and fabricated metal pipe to the installation's requirements.",
    result: "",
    skills: ["Metal fabrication", "Fit-up"],
    img: "",
    featured: false
  },
  {
    title: "Steel & Wood Chair",
    type: "Fabrication",
    org: "Personal build",
    when: "2026",
    summary: "Designed and built a chair with a welded steel base and wood seat and back.",
    problem: "Design a chair that is strong, simple to fabricate and good-looking.",
    approach: "Sketched the design, welded the steel base and legs, and fitted a wood seat and back.",
    result: "",
    skills: ["Product design", "Welding", "Woodwork", "DFM"],
    img: "",
    featured: false
  },
  {
    title: "Steel Wire Marble Track",
    type: "Fabrication",
    org: "Personal build",
    when: "2026 · in progress",
    summary: "A kinetic marble run formed from galvanized steel wire.",
    problem: "Build a reliable rolling path where every curve and drop keeps the marble moving.",
    approach: "Planning track geometry and joining technique for formed steel wire.",
    result: "",
    skills: ["Prototyping", "Wire forming", "Kinematics"],
    img: "",
    featured: false
  }
];
