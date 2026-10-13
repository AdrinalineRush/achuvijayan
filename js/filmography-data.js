/**
 * Achu Vijayan — Verified Filmography & Creative Production Records
 * Data sourced from official production archives and certified records.
 */

const FEATURE_FILMS = [
  {
    id: "house-for-sale",
    title: "House For Sale",
    year: "2027",
    roles: ["Editor", "VFX"],
    language: "Telugu",
    badge: "In Production",
    highlight: false,
    poster: "assets/images/house_for_sale.jpg",
    director: "HariPrasad",
    production: "SriDurga Productions",
    description: "Upcoming Telugu feature film. Screenplay by Nikhil Raveendran, cinematography by Arjun Balakrishnan. Principal photography currently underway; editorial rhythm and visual effects executed by RenderLogic."
  },
  {
    id: "boom-bang",
    title: "Boom Bang",
    year: "2026",
    roles: ["VFX"],
    language: "Malayalam",
    badge: "Upcoming · Nov 2026",
    highlight: false,
    poster: "assets/images/boom_bang.jpg",
    director: "Junaid Muhammed",
    production: "British Cinemas",
    cast: "Siju Wilson, Sidharth Bharathan, Nishanth Sagar",
    description: "High-voltage action entertainer. Full visual effects pipeline, action enhancement plates, and dynamic digital compositing ahead of its November 2026 theatrical release."
  },
  {
    id: "aaram",
    title: "Aaram",
    year: "2026",
    roles: ["VFX"],
    language: "Malayalam",
    badge: "Theatrical Release",
    highlight: false,
    poster: "assets/images/aaram.jpg",
    director: "Rajeesh Parameswaran",
    cast: "Saiju Kurup, Siddique, Anju Kurian",
    description: "Intense coastal investigative crime thriller written by Vishnu Ramachandran. Executed complete visual effects, digital cleanups, and screen compositing."
  },
  {
    id: "thuninthavan",
    title: "Thuninthavan / Orumbettavan",
    year: "2025",
    roles: ["Editor", "VFX"],
    language: "Tamil / Malayalam",
    badge: "Theatrical Feature",
    highlight: false,
    poster: "assets/images/thuninthavan.jpg",
    director: "Sugeesh Dhekshinakashi & Harinarayanan K.M.",
    production: "Dhekshina Kashi Productions",
    cast: "Indrans, Jaffer Idukki, Sudheesh, Johny Antony, Dayyana Hameed",
    description: "Atmospheric mystery drama directed by Sugeesh Dhekshinakashi and Harinarayanan KM, inspired by real events. Full editorial assembly and rhythm design crafted by Achu Vijayan."
  },
  {
    id: "aattam",
    title: "Aattam (The Play)",
    year: "2024",
    roles: ["Co-Producer"],
    language: "Malayalam",
    badge: "3× National Film Award Winner",
    highlight: true,
    award: "Best Feature Film · Best Screenplay · Best Editing (70th National Film Awards)",
    poster: "assets/images/aattam.jpg",
    director: "Anand Ekarshi",
    production: "Joy Movie Productions",
    cast: "Zarin Shihab, Vinay Forrt, Kalabhavan Shajohn",
    description: "Chamber drama masterpiece co-produced under Joy Movie Productions as Designated Partner. Swept the 70th National Film Awards with 3 wins including the coveted Best Feature Film of India."
  },
  {
    id: "charles-enterprises",
    title: "Charles Enterprises",
    year: "2023",
    roles: ["Editor", "Co-Producer", "VFX"],
    language: "Malayalam",
    badge: "Theatrical & Prime Video",
    highlight: true,
    poster: "assets/images/charles_enterprises.jpg",
    director: "Subhash Lalitha Subrahmanian",
    production: "Joy Movie Productions",
    cast: "Urvashi, Balu Varghese, Guru Somasundaram, Kalabhavan Shajohn",
    description: "Critically celebrated satirical comedy-drama centered on an idol of Lord Ganesha. Comprehensive editorial rhythm design, post-production co-production management, and VFX compositing."
  },
  {
    id: "vichithram",
    title: "Vichithram",
    year: "2022",
    roles: ["Director", "Editor", "Producer", "VFX"],
    language: "Malayalam",
    badge: "Directorial Debut · Amazon Prime",
    highlight: true,
    poster: "assets/images/vichithram.jpg",
    director: "Achu Vijayan",
    production: "Joy Movie Productions",
    cast: "Shine Tom Chacko, Kani Kusruti, Balu Varghese, Lal",
    description: "Achu Vijayan's directorial debut — a critically acclaimed mystery horror thriller celebrated for singular pacing, moody obsidian color grade, intricate ensemble choreography, and VFX."
  },
  {
    id: "mukundan-unni",
    title: "Mukundan Unni Associates",
    year: "2022",
    roles: ["Co-Producer"],
    language: "Malayalam",
    badge: "Cult Blockbuster",
    highlight: true,
    poster: "assets/images/mukundan_unni.jpg",
    director: "Abhinav Sunder Nayak",
    production: "Joy Movie Productions",
    cast: "Vineeth Sreenivasan, Suraj Venjaramoodu",
    description: "Blockbuster dark comedy crime satire co-produced under Joy Movie Productions. Achieved widespread critical acclaim and instant cult status across India."
  },
  {
    id: "oru-adaar-love",
    title: "Oru Adaar Love",
    year: "2019",
    roles: ["Editor", "VFX"],
    language: "Malayalam / Tamil",
    badge: "Global Viral Hit",
    highlight: false,
    poster: "assets/images/oru_adaar_love.jpg",
    director: "Omar Lulu",
    cast: "Roshan Abdul Rahoof, Priya Prakash Varrier, Noorin Shereef",
    description: "High-profile romantic comedy that drove one of Indian cinema's biggest global viral sensations. Edited the feature cut with dynamic musical pacing and executed visual effects."
  },
  {
    id: "simba",
    title: "Simba",
    year: "2019",
    roles: ["Editor", "VFX"],
    language: "Tamil",
    badge: "Stoner Comedy",
    highlight: false,
    poster: "assets/images/simba.jpg",
    director: "Arvind Sridhar",
    cast: "Bharath, Premgi Amaren, Swathi Deekshith, Ramana",
    description: "Inventive Tamil black comedy fantasy featuring a surreal humanized canine perspective. Editorial assembly, tempo styling, and specialized VFX."
  },
  {
    id: "maffi-dona",
    title: "Maffi Dona",
    year: "2019",
    roles: ["Editor"],
    language: "Malayalam",
    badge: "Feature",
    highlight: false,
    poster: "assets/images/maffi_dona.jpg",
    director: "Pauly Vadakkan",
    production: "Heaven Cinemas",
    cast: "Maqbool Salmaan, Sreevidya Nair, Jubil Rajan P. Dev",
    description: "Youth crime and investigative drama directed by Pauly Vadakkan. Dynamic narrative editing, musical pacing, and suspense cutting executed by Achu Vijayan."
  },
  {
    id: "kidu",
    title: "Kidu",
    year: "2018",
    roles: ["Editor"],
    language: "Malayalam",
    badge: "Feature",
    highlight: false,
    poster: "assets/images/kidu.jpg",
    director: "Majeed Abu",
    production: "Pee Kay Productions",
    cast: "Ramzan Muhammed, Minon John, Leona Lishoy, Sudhi Koppa",
    description: "Energetic Malayalam youth and school life drama directed by Majeed Abu. Comprehensive narrative editing and pacing by Achu Vijayan."
  },
  {
    id: "white",
    title: "White",
    year: "2016",
    roles: ["Editor"],
    language: "Malayalam",
    badge: "Theatrical Feature",
    highlight: true,
    poster: "assets/images/white.jpg",
    director: "Uday Ananthan",
    cast: "Mammootty, Huma Qureshi",
    description: "Romantic drama set across London and Kerala starring megastar Mammootty and Huma Qureshi. Edited with sophisticated, high-contrast emotional rhythm."
  },
  {
    id: "32aam-adhyayam",
    title: "32aam Adhyayam 23am Vaakyam",
    year: "2015",
    roles: ["Editor"],
    language: "Malayalam",
    badge: "Suspense Thriller",
    highlight: false,
    poster: "assets/images/32aam_adhyayam.jpg",
    director: "Arjun Prabhakaran & Gokul Ramakrishnan",
    cast: "Govind Padmasoorya, Lal, Miya George",
    description: "Taut psychological mystery thriller structured around biblical and narrative puzzles."
  },
  {
    id: "namaste-bali",
    title: "Namaste Bali",
    year: "2015",
    roles: ["Editor"],
    language: "Malayalam",
    badge: "Feature",
    highlight: false,
    poster: "assets/images/namaste_bali.jpg",
    director: "K. V. Bejoy",
    production: "Minhal Productions",
    cast: "Roma Asrani, Aju Varghese, Manoj K. Jayan",
    description: "Comedy-drama feature spanning picturesque Bali and Kerala locations, starring Roma Asrani and Aju Varghese. Edited by Achu Vijayan."
  },
  {
    id: "starring-pournami",
    title: "Starring Pournami",
    year: "2015",
    roles: ["Editor"],
    language: "Malayalam",
    badge: "Road Movie",
    highlight: false,
    poster: "assets/images/starring_pournami.jpg",
    director: "Albey",
    production: "Marikar Films",
    cast: "Sunny Wayne, Tovino Thomas, Aju Varghese",
    description: "Ambitious Malayalam road movie written by Vini Viswa Lal and directed by Albey. Filmed across 7 Indian states from New Delhi through Manali to Ladakh; edited by Achu Vijayan."
  },
  {
    id: "ezham-suryan",
    title: "Ezham Suryan",
    year: "2012",
    roles: ["Editor"],
    language: "Malayalam",
    badge: "Early Credit",
    highlight: false,
    poster: "assets/images/ezham_suryan.jpg",
    director: "Njanasheelan",
    production: "Kaivalyam Creations",
    cast: "Unni Mukundan, Mahalakshmi, Jagathy Sreekumar",
    description: "Action-drama feature starring Unni Mukundan and Mahalakshmi. Early career feature film editing credit in Malayalam cinema."
  },
  {
    id: "second-show",
    title: "Second Show",
    year: "2012",
    roles: ["Spot Editor"],
    language: "Malayalam",
    badge: "Cult Classic Debut",
    highlight: true,
    poster: "assets/images/second_show.jpg",
    director: "Srinath Rajendran",
    cast: "Dulquer Salmaan, Sunny Wayne, Gauthami Nair",
    description: "Dulquer Salmaan's landmark debut feature — an iconic Malayalam neo-noir crime classic. Achu handled foundational on-set spot editorial cutting that marked the start of his film industry journey."
  }
];

const AI_CAMPAIGNS = [
  {
    id: "allwyn",
    title: "Allwyn — 'Possible is Beautiful'",
    year: "2024",
    role: "AI Video Producer & Storyboard Design",
    client: "The Gate Worldwide",
    badge: "AI Brand Campaign",
    image: "assets/images/allwyn.jpg",
    description: "Crafted a 30-second AI campaign animatic, 22-slide storyboard deck, and character consistency mapping for international lottery and entertainment giant Allwyn."
  },
  {
    id: "breeze",
    title: "Breeze — 25th Anniversary",
    year: "2025",
    role: "AI Video Producer & Editor",
    client: "Breeze",
    badge: "AI Brand Film",
    image: "assets/images/breeze.jpg",
    description: "'Breeze Museum of Art' 25th anniversary brand film — end-to-end local generative AI video production from prompt engineering mapping to the final editorial cut."
  },
  {
    id: "sc-banca",
    title: "SC Banca 2.0",
    year: "2025",
    role: "AI Deliverables & KV Extensions",
    client: "Standard Chartered × Prudential",
    badge: "AI Banking Campaign",
    image: "assets/images/sc_banca.jpg",
    description: "Key visual extensions, character consistency meshes, and final localized campaign deliverables powered by custom Stable Diffusion and Kling pipelines."
  },
  {
    id: "aistory",
    title: "Aistory — Cinema & AI Lab",
    year: "Ongoing",
    role: "Creator & Pipeline Architect",
    client: "Creator Platform",
    badge: "Education & Tech Hub",
    image: "assets/images/aistory.jpg",
    description: "Online educational and research channel showing filmmakers how to bridge traditional cinema post-production (DaVinci Resolve, Premiere Pro) with local ComfyUI models and generative video pipelines."
  }
];

const MILESTONES = [
  {
    stat: "10+",
    suffix: "Years",
    label: "Cinema Post & Direction",
    detail: "Editorial and directorial journey across Malayalam, Tamil, Telugu, and Kannada industries."
  },
  {
    stat: "3×",
    suffix: "National Awards",
    label: "Aattam (2024)",
    detail: "Best Feature Film of India, Best Screenplay, Best Editing at the 70th National Film Awards."
  },
  {
    stat: "FE 049",
    suffix: "FEFKA",
    label: "Registered Editor",
    detail: "Film Employees Federation of Kerala accredited feature film editor."
  },
  {
    stat: "Blackmagic",
    suffix: "Certified",
    label: "DaVinci Resolve Colorist",
    detail: "Theatrical color grading, ACES color science, and DCI-P3 mastering specialist."
  }
];

const TOOLKIT = [
  {
    category: "Narrative Editing",
    items: ["Adobe Premiere Pro", "Final Cut Pro X", "Avid Media Composer", "Multi-Camera Rhythms"]
  },
  {
    category: "Color Grading",
    items: ["DaVinci Resolve Studio (Certified)", "ACES / DaVinci YRGB Color Managed", "Film Emulation & LUT Design", "HDR & Theatrical DCI-P3"]
  },
  {
    category: "Visual Effects & Cleanups",
    items: ["Adobe After Effects", "Digital Compositing & Cleanup", "Screen & Wire Replacement", "Dynamic Motion Graphics"]
  },
  {
    category: "AI Video Pipelines",
    items: ["ComfyUI Custom Workflows", "Kling 3.0 / Higgsfield Soul", "Runway Gen-3 / Seedance", "Consistent Character LoRAs"]
  }
];
