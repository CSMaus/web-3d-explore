/**
 * the about page: who makes the site. the work, the education and the three public profiles come
 * from the owner's CV (cv-versions/plata, 2026), in its own words; the papers and the registered
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
    what: "AI & LLM products for US healthcare",
    role: "Senior ML/AI Engineer",
    points: [
      "Led the cross-functional team that built an LLM assistant for health-insurance members from scratch, with tool calling over member records and policy search, text and real-time voice, defining the requirements and architecture together with the customer.",
      "Led the design of the assistant's evaluation: labelled question sets, separate retrieval, answer and end-to-end runs, automated grading and run-by-run comparison, used to choose model settings and retrieval depth.",
      "Raised recall@10 from 0.82 to 0.88 and cut search latency from 133 ms to 1.7 ms, measured on that evaluation set, by leading retrieval depth tuning and the move to a graph-based vector index.",
      "Built, as sole developer, an LLM/RAG service that assesses prescribed medications for insurance approval, grounding each assessment in facts from FDA drug labels and returning a structured, cited result to external claim systems.",
      "Cut a slow metrics refresh in a contract-management backend from ~7 s to 88 ms by finding repeated LLM vendor lookups and moving the recomputation to a background task.",
    ],
  },
  {
    when: "Sep 2022 - Dec 2025",
    place: "Changwon National University",
    what: "NDE & SHM Lab",
    role: "ML/DL Researcher",
    points: [
      "Built a multilingual voice-controlled LLM assistant for the inspection software (Whisper STT, GPT structured output).",
      "Designed and trained transformer models for anomaly detection in sequential sensor data, with balanced sampling; integrated the final NN model via ONNX into the inspection software I developed, where it detected every reportable defect in real Korean Air data.",
      "Built a computer vision system for automatic control of a Doosan Enerbility welding robot, reaching 0.95 mask mAP on 6000+ images I collected and labelled and ±0.2 mm on-site measurement stability.",
    ],
  },
  {
    when: "Jun 2022 - Sep 2023",
    place: "Kultura Ex Machina",
    what: "Media & Art platform",
    role: "Data Scientist",
    points: ["Built an image auto-tagging pipeline (CLIP, ViT) with an LLM module that generates artwork descriptions."],
  },
  {
    when: "Jul 2019 - Dec 2021",
    place: "SimRail",
    role: "Software Engineer",
    points: ["Developed the detailed mathematical model of the Sapsan high-speed train for a driver training simulator, simulating the train's systems with real physics."],
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
