import { L } from "@/lib/lang";
import type { Piece } from "./kinds";

/** a positive mammogram read by counting a thousand women, and the study that taught doctors to count */
export const SCREENING: Piece = {
  id: "screening",
  topic: "probability",
  question: L("How likely is cancer after a positive mammogram?"),
  lede: L("A mammogram is an X-ray picture of the breast, used to look for breast cancer in women who feel well. It finds most cancers and rarely raises a false alarm for a healthy woman. Yet most women with a positive result do not have cancer. In 2007, 160 gynaecologists were asked how likely cancer was after a positive result, and most answered 81 or 90 per cent. The answer is about 1 in 10."),
  sections: [
    {
      heading: L("The question put to the doctors"),
      paragraphs: [
        L("Screening means testing people who feel well, to find a disease before it shows. A mammogram is read by a doctor who specialises in such pictures, called a radiologist. If the picture looks suspicious, the result is called positive. The woman is then called back for more pictures and sometimes a biopsy, a small sample of tissue taken for a closer look. At a training session in 2007, Gerd Gigerenzer gave 160 gynaecologists three numbers for women screened in one region. 1 per cent of the women have breast cancer. A woman with cancer gets a positive result with chance 90 per cent. A woman without cancer gets a positive result with chance 9 per cent. A woman has a positive result. What is the chance that she has cancer?"),
        L("They chose among four answers: about 81 per cent, 9 in 10, 1 in 10, or about 1 per cent. Most chose 90 or 81 per cent. Only 21 per cent of them chose 1 in 10. That is fewer than the 25 per cent who would have chosen it by picking at random among the four."),
      ],
    },
    {
      heading: L("The same numbers, counted"),
      paragraphs: [
        L("Take 1000 women. 1 per cent of them, 10 women, have cancer, and 90 per cent of those, 9 women, get a positive result. The other 990 women do not have cancer, and 9 per cent of them, about 89, get a positive result anyway. So 98 women have a positive result, and 9 of them have cancer. 9 out of 98 is 9.2 per cent, about 1 in 10. A page of this topic, 'A positive test', makes the same count for another disease and another test."),
        L("The answer of 90 per cent is the chance of a positive result for a woman with cancer, one of the three numbers given. The question asked the reverse: the chance of cancer for a woman with a positive result. The two numbers differ because women without cancer are 99 times as many as women with it. So their small rate of false alarms, 9 per cent, gives about ten times as many positive results as the cancers do."),
      ],
    },
    {
      heading: L("Counting is what fixed it"),
      paragraphs: [
        L("In the same session the gynaecologists were taught to turn the percentages into counts of women, as the section above does. Afterwards 87 per cent of them chose 1 in 10. Gigerenzer calls such counts natural frequencies: 10 of 1000 women have cancer, 9 of them get a positive result, and about 89 of the other 990 get a positive result too."),
        L("The effect had been measured before. In 1998 Ulrich Hoffrage and Gigerenzer asked 48 doctors in Munich and Düsseldorf to work out the same kind of chance for four medical tests. Given percentages, the doctors got it right in 10 per cent of the cases. Given counts of people, they got it right in 46 per cent."),
      ],
    },
    {
      heading: L("What a positive result means in practice"),
      paragraphs: [
        L("The numbers given to the gynaecologists were a teaching example. Figures measured in real practice tell the same story. The Breast Cancer Surveillance Consortium followed screening in ordinary American clinics from 2011 to 2018. For digital breast tomosynthesis, a kind of mammogram that builds a three-dimensional picture, it reports that 8.3 per cent of screens were called abnormal and that 5.8 cancers were found per 1000 screens. So of about 83 women called back per 1000 screens, about 5.8 had a cancer found: about 7 in 100."),
        L("Repeated screening adds up. A study published in 1998 followed 2400 women aged 40 to 69 in one American health plan. It estimated that after 10 mammograms the chance of at least one false alarm was 49.1 per cent. A rule used throughout this topic reads that number back: the chance that something happens is 1 minus the chance that it does not. Suppose every mammogram had the same chance of a false alarm, and one result did not affect another. Then a chance of 50.9 per cent of no false alarm in 10 mammograms would mean 6.5 per cent of false alarms on each."),
      ],
    },
    {
      heading: L("What it comes to"),
      paragraphs: [
        L("A positive screening result moves the chance of cancer from about 1 in 100 to about 1 in 10. That is why it leads to more tests and not to a diagnosis. Any test result can be read the same way: count a large group of people, then look only at those with that result."),
      ],
    },
  ],
  limits: [
    L("The figures of 1 per cent, 90 per cent and 9 per cent belong to the training example, not to any one screening programme. Real figures depend on age, on the country and on the machine."),
    L("The shares of gynaecologists who chose 81 or 90 per cent before the training are shown in a figure of the 2007 article, which was not read for this page. The text of the article says only that most chose one of the two."),
    L("The figure of 7 in 100 is computed here from two rates the consortium reports for tomosynthesis. The consortium does not state it. Its figures for ordinary digital mammograms were not read for this page."),
    L("The 6.5 per cent is a reading of the 49.1 per cent that assumes equal chances and results that do not affect each other, which real screening does not meet. It is not a figure from the 1998 study."),
    L("An often quoted study of 1982 by David Eddy says that about 95 of 100 doctors answered about 75 per cent to a problem of this kind. It was found only in later accounts, so it is not used here."),
  ],
  sources: [
    { label: "Gigerenzer, Gaissmaier, Kurz-Milcke, Schwartz, Woloshin, Helping doctors and patients make sense of health statistics, Psychological Science in the Public Interest 8, 2007", url: "https://doi.org/10.1111/j.1539-6053.2008.00033.x" },
    { label: "Hoffrage and Gigerenzer, Using natural frequencies to improve diagnostic inferences, Academic Medicine 73, 1998", url: "https://pubmed.ncbi.nlm.nih.gov/9609869/" },
    { label: "Lee and colleagues, National performance benchmarks for screening digital breast tomosynthesis, Radiology 307, 2023", url: "https://pubmed.ncbi.nlm.nih.gov/37039687/" },
    { label: "Elmore and colleagues, Ten-year risk of false positive screening mammograms and clinical breast examinations, New England Journal of Medicine 338, 1998", url: "https://pubmed.ncbi.nlm.nih.gov/9545356/" },
  ],
};
