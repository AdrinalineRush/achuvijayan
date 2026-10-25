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
    id: "gudiya",
    title: "Gudiya",
    year: "2025",
    roles: ["Editor"],
    language: "Hindi",
    badge: "Music Video",
    highlight: false,
    poster: "assets/images/gudiya.jpg",
    director: "Rahul PS",
    production: "Crearn",
    cast: "Resmi R Nair",
    description: "Hindi romantic music video written and directed by Rahul PS and filmed in Goa — a young woman, the man who falls for her, and the bond that grows between them. Edited by Achu Vijayan."
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
    language: "Malayalam / Tamil",
    languageVersions: "Malayalam — Charles Enterprises · Tamil — Charles Enterprises (Tamil)",
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
    poster: "assets/images/mukundan_unni_hd.jpg",
    director: "Abhinav Sunder Nayak",
    production: "Joy Movie Productions",
    cast: "Vineeth Sreenivasan, Suraj Venjaramoodu",
    description: "Blockbuster dark comedy crime satire co-produced under Joy Movie Productions. Achieved widespread critical acclaim and instant cult status across India."
  },
  {
    id: "flip-side",
    title: "Flip Side",
    year: "2020",
    roles: ["Editor"],
    language: "English",
    badge: "Short Film",
    highlight: false,
    poster: "assets/images/flip_side.jpg",
    director: "Saju Kumar",
    production: "Dream 2 Destiny Arts",
    cast: "Nandha Menon, Manjusha Nair, Priyaroopan",
    description: "English short film directed by Saju Kumar. A ten-year-old girl who always looks at the flip side of things finds her world turned upside down by a documentary about her favourite monument. Edited by Achu Vijayan."
  },
  {
    id: "narai",
    title: "Narai",
    year: "2020",
    roles: ["Editor"],
    language: "Tamil",
    badge: "Feature",
    highlight: false,
    poster: "assets/images/narai.jpg",
    director: "Vivy",
    production: "K7 Studios",
    cast: "Sangili Murugan, Santhana Bharathi, Junior Balaiah, Nalinikanth",
    description: "Tamil feature directed by Vivy for K7 Studios, starring Sangili Murugan, Santhana Bharathi and Junior Balaiah. Cinematography by Sinu Sidharth, music by Anirudh Vijay; edited by Achu Vijayan."
  },
  {
    id: "oru-adaar-love",
    title: "Oru Adaar Love",
    year: "2019",
    roles: ["Editor", "VFX"],
    language: "Malayalam / Tamil / Telugu / Kannada / Hindi",
    languageVersions: "Malayalam — Oru Adaar Love · Tamil — Oru Adaar Love · Telugu — Lovers Day · Kannada — Kirik Love Story · Hindi — Oru Adaar Love (Hindi dubbed)",
    versionEditing: "Edited translated versions across all five languages",
    badge: "Global Viral Hit",
    highlight: false,
    poster: "assets/images/oru_adaar_love.jpg",
    director: "Omar Lulu",
    cast: "Roshan Abdul Rahoof, Priya Prakash Varrier, Noorin Shereef",
    description: "High-profile romantic comedy that drove one of Indian cinema's biggest global viral sensations. Edited the feature cut with dynamic musical pacing, executed visual effects, and edited the translated versions across five languages."
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
    id: "maanasi",
    title: "Maanasi",
    year: "2019",
    roles: ["Editor"],
    language: "Tamil",
    badge: "Theatrical Feature",
    highlight: false,
    poster: "assets/images/maanasi.jpg",
    director: "Navaz Suleiman",
    production: "Movie Masons & MJ Films",
    cast: "Naresh Madeswaran, Harissa Beegum, Kidu Aashique",
    description: "Tamil rural drama directed by Navaz Suleiman — the story of a man and his goat. Cinematography by Kannan Patteri; edited by Achu Vijayan."
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
    id: "copy-that",
    title: "Copy That",
    year: "2015",
    roles: ["Editor"],
    language: "English",
    badge: "Short Film",
    highlight: false,
    poster: "assets/images/copy_that.jpg",
    director: "Gopal Govind",
    production: "6 People Production",
    cast: "Peter Brandt, Gopal Govind, Dhannya Paul",
    description: "28-minute English comedy short directed by Gopal Govind and filmed in Abu Dhabi. A down-on-his-luck copier salesman gets one last chance at the sales call of his life. Edited by Achu Vijayan."
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

/**
 * TV commercials — four selected spots.
 * Paste a YouTube or Vimeo link (unlisted Vimeo links work too), or a path to an .mp4, into `video`.
 * `poster` is optional: YouTube links pick up their thumbnail automatically.
 */
const TV_COMMERCIALS = [
  { title: "Dr. Joy's Medstore — Film 1", brand: "Dr. Joy's Medstore", year: "2023", duration: "0:48", role: "Director & Editor", video: "https://youtu.be/CgLIa42pw70", poster: "" },
  { title: "Cathay Pacific — Student Fare", brand: "Cathay Pacific", year: "2026", duration: "1:07", role: "VFX & Editor", video: "https://youtu.be/td3I1mamYR4", poster: "" },
  { title: "Dr. Joy's Medstore — Film 2", brand: "Dr. Joy's Medstore", year: "2023", duration: "0:42", role: "Director & Editor", video: "https://youtu.be/xxp5gB2fTbI", poster: "" },
  { title: "Pappai Ice Cream", brand: "Pappai", year: "2017", duration: "0:30", role: "Editor", video: "https://youtu.be/VFSJlloIPgc", poster: "" }
];

/**
 * Fully AI films, shown as screens in "05 / AI filmmaking".
 * A 9:16 film goes on the phone; 16:9 films go on cinema screens.
 * Own files: `loop` is the silent web loop, `full` the version with sound. YouTube films: `youtube` id.
 * `credit` is the one-line story of what I did, shown under the title.
 */
const AI_FILMS = [
  { id: "tarmac", title: "My Storage Space — Tarmac", type: "AI brand film", format: "9:16", duration: "1:10", role: "AI filmmaker & editor",
    credit: "Storyboard to screen — every frame generated, every cut mine.",
    loop: "assets/video/tarmac-preview.mp4", full: "assets/video/tarmac.mp4", poster: "assets/video/tarmac-poster.jpg" },
  { id: "fashion-studio", title: "Fashion Studio", type: "AI fashion film", format: "16:9", duration: "0:30", role: "AI filmmaker & editor",
    credit: "The looks, the cities, the light — all generated. The rhythm is mine.",
    loop: "assets/video/fashion-preview.mp4", full: "assets/video/fashion.mp4", poster: "assets/video/fashion-poster.jpg" },
  { id: "cathay-student-fare", title: "Cathay Pacific — Student Fare", type: "AI brand film", format: "16:9", duration: "1:07", role: "AI filmmaker, VFX & editor",
    credit: "Generated, composited and cut — from the first frame to the final grade.",
    loop: "assets/video/cathay-preview.mp4", full: "assets/video/cathay.mp4", poster: "assets/video/cathay-poster.jpg" }
];
