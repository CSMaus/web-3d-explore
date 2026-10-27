/**
 * the about page: who makes the site. the work, the education and the three public profiles come
 * from the owner's CV (cv-versions/plata, 2026), the work told in plain words for a reader new to
 * the field, its facts and numbers the CV's; the papers and the registered
 * software from her lab's site (sites.google.com/view/ndeshmlab, Publication and Patent & Tech.
 * Transfer). no e-mail, phone or GitHub address goes on this page: the owner shares those herself.
 * the CV's wording stays in English in every language of the site, like the paper titles.
 */

export const NAME = "Kseniia Barashok";

/** the first line of the CV's summary */
export const SUMMARY = "Applied AI/ML Engineer with 5+ years of experience in LLM systems, Deep Learning and Computer Vision.";

/** the public profiles, shown by name only */
export const PROFILES: { label: string; href: string }[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/kseniia-b-0a8764194/" },
  { label: "ResearchGate", href: "https://www.researchgate.net/profile/Kseniia-Barashok" },
  { label: "Google Scholar", href: "https://scholar.google.com/citations?user=ssl4seoAAAAJ" },
];

export type Job = { when: string; place: string; what?: string; role: string; points: string[] };

export const WORK: Job[] = [
  {
    when: "Dec 2025 - Present",
    place: "Reynova Inc.",
    what: "AI products for health insurance in the US",
    role: "Senior ML/AI Engineer",
    points: [
      "Led the team that built, from scratch, an AI assistant for people with health insurance. It answers by text and by live voice, looks up the member's own records and searches the insurance policies to find the answer. The requirements and the design were worked out together with the customer.",
      "Led the testing of the assistant: sets of real questions with checked answers, separate measurements of how well it finds information and how well it answers, and automatic grading, so that every change could be compared with the previous one and the best settings chosen.",
      "Made the assistant's search both more accurate and much faster: the right document now appears among the first ten results in 88% of cases instead of 82%, and a search takes 1.7 milliseconds instead of 133, after tuning how many results the assistant reads and moving to a faster kind of search index.",
      "Built, as the only developer, a service that checks whether a prescribed medicine should be approved by the insurance. Each decision rests on facts from the official US drug labels (FDA) and cites them, and the result goes back to the claim systems of other companies.",
      "Made a slow part of a contract-management system update in 88 milliseconds instead of about 7 seconds: it repeated the same lookups through a language model every time, and that work was moved to run in the background.",
    ],
  },
  {
    when: "Sep 2022 - Dec 2025",
    place: "Changwon National University",
    what: "Nondestructive Evaluation and Structural Health Monitoring Lab",
    role: "ML/DL Researcher",
    points: [
      "Built a voice assistant for the lab's ultrasonic inspection software: an inspector gives commands by voice, in several languages, and the software understands them (speech recognition with Whisper, the commands read by GPT).",
      "Designed and trained neural networks (transformers) that find defects in the signals of ultrasonic scans, and built the final model into the inspection software, also written in the lab. On real inspection data from Korean Air it found every defect that had to be reported.",
      "Built a camera system that guides a Doosan Enerbility welding robot automatically. Trained on more than 6,000 images, collected and labelled for it, it scored 0.95 out of 1 on the standard accuracy measure for finding objects in images (mask mAP), and on site its measurements stayed steady to within 0.2 mm.",
    ],
  },
  {
    when: "Jun 2022 - Sep 2023",
    place: "Kultura Ex Machina",
    what: "A platform for media and art",
    role: "Data Scientist",
    points: ["Built a system that tags artworks automatically from their images (CLIP, ViT) and writes a short description of each with a language model."],
  },
  {
    when: "Jul 2019 - Dec 2021",
    place: "SimRail",
    role: "Software Engineer",
    points: ["Built the detailed mathematical model of the Sapsan high-speed train for a simulator that trains its drivers: every system of the train behaves by real physics."],
  },
];

export const EDUCATION: { when: string; degree: string; place: string }[] = [
  { when: "2022 - 2024", degree: "M.Sc. in Smart Manufacturing", place: "Changwon National University" },
  { when: "2015 - 2019", degree: "B.Sc. in Mechanical Engineering", place: "St. Petersburg Electrotechnical University (LETI)" },
];

export type Paper = { authors: string; title: string; venue: string; year: number; doi: string };

/**
 * the papers on the lab's site, the owner's first-author journal papers in the international
 * journals first, then the review, the Korean society's journal, and the conference paper
 */
export const PAPERS: Paper[] = [
  {
    authors: "Kseniia Barashok, Jungin Choi, Jaesun Lee",
    title: "Deep Learning-based approach for automatic defect detection in complex structures using PAUT data",
    venue: "Sensors, 25(19), 6128",
    year: 2025,
    doi: "10.3390/s25196128",
  },
  {
    authors: "Boris I, Kseniia Barashok, Yongjoon Choi, Yeongil Choi, Mohammed Aslam, Jaesun Lee",
    title: "Machine Learning Techniques in Ultrasonics-Based Defect Detection and Material Characterization: A Comprehensive Review",
    venue: "Advances in Mechanical Engineering",
    year: 2025,
    doi: "10.1177/16878132251347390",
  },
  {
    authors: "Kseniia Barashok, Jaesun Lee, Yeongil Choi, Jeongki Lee, Inho Cho",
    title: "Deep Learning Based Automatic Defect Detection Approach from a Sequence of PAUT A-Scans",
    venue: "Journal of the Korean Society for Nondestructive Testing, 45(5), 404-413",
    year: 2025,
    doi: "10.7779/JKSNT.2025.45.5.404",
  },
  {
    authors: "Kseniia Barashok, Junpil Park, Jaesun Lee",
    title: "Deep learning algorithms for defect detection using phased array ultrasonic testing data",
    venue: "Journal of the Korean Society for Nondestructive Testing, 43(1), 34-43",
    year: 2023,
    doi: "10.7779/JKSNT.2023.43.1.34",
  },
  {
    authors: "Kseniia Barashok, Boris I, Jaesun Lee",
    title: "Deep learning algorithms for design of periodic structures and dispersion curves calculation",
    venue: "Papers of the ECNDT 2023, Research and Review Journal of Nondestructive Testing, 1(1)",
    year: 2023,
    doi: "10.58286/28162",
  },
];

/**
 * the programs registered in Korea with the owner among their authors, as the lab's Patent & Tech.
 * Transfer page lists them; the numbers are those it gives. the English line is a translation of
 * the Korean title
 */
export const REGISTERED: { title: string; english: string; number: string; date: string; authors: string }[] = [
  {
    title: "AI기반 위상배열 초음파 복합재 검사 신호 분석 프로그램",
    english: "AI-based analysis of phased array ultrasonic inspection signals of composites",
    number: "C-2026-003784",
    date: "Jan 19, 2026",
    authors: "Jaesun Lee, Kseniia Barashok, Yeongil Choi, Junhyeok Jeong, Jeongki Lee, Choonwook Hwang, Linam Hyun",
  },
  {
    title: "다층 구조 복합재료의 음향 투과 손실 예측 프로그램",
    english: "Prediction of the sound transmission loss of multilayer composite materials",
    number: "C-2025-018246",
    date: "Jan 14, 2026",
    authors: "Jaesun Lee, Jonghwan Park, Kseniia Barashok, Boris I",
  },
  {
    title: "인공지능 기반 향상된 위상배열 초음파 용접부 검사 신호 분석 프로그램",
    english: "Improved AI-based analysis of phased array ultrasonic weld inspection signals",
    number: "C-2024-052036",
    date: "Dec 10, 2024",
    authors: "Jaesun Lee, Kseniia Barashok, Yeongil Choi, Junpil Park",
  },
  {
    title: "위상배열초음파검사 기량 검증 시편의 결함 판독 프로그램",
    english: "Defect reading on phased array ultrasonic testing qualification specimens",
    number: "C-2024-005878",
    date: "Feb 13, 2024",
    authors: "Jaesun Lee, Kseniia Barashok, Yeongil Choi, Junpil Park",
  },
];
