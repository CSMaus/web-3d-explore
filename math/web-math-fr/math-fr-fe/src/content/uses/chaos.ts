import type { Piece } from "./kinds";

export const WEATHER: Piece = {
  id: "weather",
  topic: "chaos",
  question: "Why does the forecast say 70 per cent?",
  lede: "A weather forecast used to be one prediction. Since December 1992 it has been fifty predictions run side by side, and the number on the screen is how many of them agreed. The reason is a rounding error in 1961.",
  sections: [
    {
      heading: "Three decimal places",
      paragraphs: [
        "In 1961 Edward Lorenz was running a toy model of the atmosphere on a computer the size of a desk, twelve equations for how warm air rises and cools. He wanted to look at one run again, so he typed the numbers from a printout back in and left for coffee. The printout showed three decimal places: 0.506. The machine had been holding six: 0.506127. When he came back, the new run had drifted from the old one, then diverged, then had nothing to do with it.",
        "A difference in the fourth decimal place, smaller than any weather instrument can measure, had become a completely different weather. Lorenz published the finding in 1963: in this kind of system, two states that differ imperceptibly evolve into states that differ as much as two random ones. A colleague remarked that if this were true, one flap of a seagull's wings would be enough to alter the course of the weather forever. The seagull became a butterfly in the title of a 1972 talk, and the name stuck.",
      ],
    },
    {
      heading: "What it means for a forecast",
      paragraphs: [
        "A forecast starts from measurements: thousands of stations, balloons and satellites, none exact. The atmosphere then does to those small errors what Lorenz's machine did to the fourth decimal: doubles them every couple of days. After a week the error is as large as the thing being forecast. Lorenz worked out in 1969 that the limit depends on the size of the weather: a thunderstorm is predictable for about an hour, a weather system for a few days, the largest patterns for a few weeks, and no improvement in measurement can push past the last of these, because the small scales feed the large ones.",
        "A careful modern study put the limit for day-to-day weather in the middle latitudes at about two weeks. Reliable daily forecasts currently reach nine or ten days. Better instruments and models could add four or five more. That is all there will ever be.",
      ],
    },
    {
      heading: "Fifty forecasts instead of one",
      paragraphs: [
        "If a single forecast is doomed to go wrong at a rate that depends on the day, the useful question is not what will happen but how sure the model can be. So run the model many times, each from a slightly different starting state, each difference no larger than the measurement errors, and watch the runs spread.",
        "On 19 December 1992 the European Centre for Medium-Range Weather Forecasts began doing exactly that in operation: 33 runs, three days a week, ten days ahead, with the starting differences chosen along the directions in which the atmosphere was most sensitive that day. The American centre started its own version twelve days earlier, with 14 runs a day grown by a method that breeds the fastest-growing errors. By December 1996 the European set was 51 runs, and it is 51 today, each at a resolution of 9 kilometres.",
        "Draw one pressure contour from each of the 51 runs on one map. Where the lines lie on top of one another, the forecast is sure. Where they fan out like spaghetti, it is not, and the map shows it. Count how many of the 51 runs rain on a given town on Thursday: if 36 do, the forecast says 70 per cent. A well-tuned set is right about that: on the days it says 70 per cent, it rains about seven times in ten.",
      ],
    },
    {
      heading: "What was gained",
      paragraphs: [
        "Forecasts have improved by about one day of useful range per decade for forty years. The European centre's rain forecast was skilful to about day three in 2002 and to about day seven by 2017. The gain came from better models, better observations and the ensemble, and the ensemble is the part that Lorenz's discovery made necessary: not a way around the limit, but a way to know each day how close the limit is.",
        "The chaos is not defeated. The two-week wall stands, and beyond it a forecast is a climate average. What the fifty runs give is the honest number: a forecast that knows how far to trust itself.",
      ],
    },
  ],
  limits: [
    "The doubling time of forecast errors is quoted from secondary accounts of Lorenz's 1982 analysis, which give between about 1.8 and 2.5 days; the primary figure was not read.",
    "The exact day of the 1972 talk and the resolution of the first ensemble differ between sources; the piece states what the centres' own histories agree on.",
    "The two-week limit is for day-to-day weather in the middle latitudes; tropical weather, and slow patterns such as El Nino, have their own horizons.",
  ],
  sources: [
    { label: "Lorenz, Deterministic nonperiodic flow, Journal of the Atmospheric Sciences 20, 1963", url: "https://doi.org/10.1175/1520-0469(1963)020<0130:DNF>2.0.CO;2" },
    { label: "Lorenz, The predictability of a flow which possesses many scales of motion, Tellus 21, 1969", url: "https://doi.org/10.3402/tellusa.v21i3.10086" },
    { label: "When the butterfly effect took flight, MIT Technology Review, 2011", url: "https://www.technologyreview.com/2011/02/22/196987/when-the-butterfly-effect-took-flight/" },
    { label: "Zhang and colleagues, What is the predictability limit of midlatitude weather?, Journal of the Atmospheric Sciences 76, 2019", url: "https://doi.org/10.1175/JAS-D-18-0269.1" },
    { label: "Molteni, Buizza, Palmer, Petroliagis, The ECMWF ensemble prediction system: methodology and validation, QJRMS 122, 1996", url: "https://doi.org/10.1002/qj.49712252905" },
    { label: "Toth and Kalnay, Ensemble forecasting at NMC: the generation of perturbations, BAMS 74, 1993", url: "https://doi.org/10.1175/1520-0477(1993)074<2317:EFANTG>2.0.CO;2" },
    { label: "Buizza and Richardson, 25 years of ensemble forecasting at ECMWF, ECMWF Newsletter 153, 2017", url: "https://www.ecmwf.int/en/newsletter/153/meteorology/25-years-ensemble-forecasting-ecmwf" },
    { label: "Bauer, Thorpe, Brunet, The quiet revolution of numerical weather prediction, Nature 525, 2015", url: "https://doi.org/10.1038/nature14956" },
    { label: "ECMWF forecast user guide, basic ensemble products", url: "https://confluence.ecmwf.int/display/FUG/Section+8.1.1+Basic+ensemble+products" },
  ],
};

export const POPULATIONS: Piece = {
  id: "populations",
  topic: "chaos",
  question: "Why do the flies boom and crash for no reason?",
  lede: "A population that grows when it is small and starves when it is large is the simplest thing an ecologist can write down. In 1976 a physicist turned biologist showed that this one line of arithmetic can swing for ever without any cause outside itself, and it was later made to happen in a jar of beetles.",
  sections: [
    {
      heading: "One line of arithmetic",
      paragraphs: [
        "Take an insect that breeds once a year, so that this year's adults are gone before next year's hatch. Each adult leaves some number of offspring, but the more adults there are, the fewer offspring each leaves, because they share the same food. Next year's population is this year's, times a growth number, times how much room was left. Written as a fraction of the most the habitat can hold, that is the logistic map of the play pages: next equals a times x times one minus x.",
        "Robert May published what this line does in 1976, in a paper whose title promised very complicated dynamics from simple models. For growth numbers up to 3 the population settles to one value. Just above 3 it settles to two values, alternating, a boom year and a bust year for ever. A little higher, four values; then eight; and past about 3.57 it never repeats at all, and looks, year by year, like noise. Nothing outside the population changed. The swing is in the arithmetic.",
      ],
    },
    {
      heading: "Blowflies in a cage",
      paragraphs: [
        "Twenty years before May's paper, an Australian entomologist, Alexander Nicholson, kept sheep blowflies in cages with a fixed daily ration of meat and counted them every second day for years. The populations swung wildly: thousands of adults, then near-zero, then thousands again, in irregular cycles that no cage condition explained. Nicholson understood the cause in words: when adults were many, their larvae starved, so the next generation was tiny; when adults were few, larvae fed well and the next generation was huge. Overshoot and collapse.",
        "May's map is that story in numbers, and later workers fitted models to Nicholson's counts and asked whether the swings were chaotic in the technical sense, sensitive to tiny differences. The best answer for the blowflies is a careful one: the estimated sensitivity is positive, but real counts carry noise, and two statisticians who did the fitting warned that a strict line between chaos and randomness is misleading for data like these.",
      ],
    },
    {
      heading: "Chaos made to order",
      paragraphs: [
        "The clean demonstration came in 1997, with flour beetles in laboratory jars. The beetles eat their own eggs and pupae, and how much depends on how crowded they are, which is a version of the same feedback. A team wrote a model of larvae, pupae and adults with that cannibalism in it, and the model predicted that as one parameter, the rate at which pupae survive to adulthood, was moved from high to low, the population would go from steady, to cycling, to chaotic.",
        "Then they did it. Every two weeks they counted the beetles and added or removed adults by hand to hold the death rate at 96 per cent and set the recruitment to the model's chosen values: 1.00, 0.50, 0.35, 0.25, 0.10, 0.05, 0.00. The jars did what the model said. At the intermediate value, around 0.35, the counts swung without repeating and diverged from jars started almost identically. Chaos, in an insect, produced by turning a knob the theory named.",
      ],
    },
    {
      heading: "In the wild, honestly",
      paragraphs: [
        "In a jar the answer is clear. In a forest or a fishery it is not, and the field has changed its mind. A 1993 review found the evidence for chaos in wild populations weak: records were short, and noise looked like chaos and chaos like noise. The fisheries model of 1954 that first drew the domed curve of recruits against parents, which is what makes populations overshoot, sits in May's table as one more equation that goes chaotic when the growth is strong enough.",
        "In 2022 a group applied several detection methods to 172 population records from around the world and found chaos in over 30 per cent of them, most often in plankton and insects, least in birds and mammals, against under 10 per cent when older one-dimensional models were fitted. The debate is open and the honest sentence is this: the arithmetic can swing without a cause, it has been made to do so in a jar, and how much of nature's swinging is of that kind is still being counted.",
      ],
    },
  ],
  limits: [
    "The thresholds 3, 3.57 and the period-three window are for the logistic map exactly; other growth laws, such as the fisheries model, have their own thresholds, which May's paper tabulates.",
    "The number of replicate jars and the total length of the flour beetle experiment were reported inconsistently by the sources read and are not stated.",
    "The 2022 figure of over 30 per cent depends on the detection methods chosen, which is the point of the paper and also the reason its authors call the question open.",
  ],
  sources: [
    { label: "May, Simple mathematical models with very complicated dynamics, Nature 261, 1976", url: "https://doi.org/10.1038/261459a0" },
    { label: "Nicholson, An outline of the dynamics of animal populations, Australian Journal of Zoology 2, 1954", url: "https://www.publish.csiro.au/zo/ZO9540009" },
    { label: "Gurney, Blythe, Nisbet, Nicholson's blowflies revisited, Nature 287, 1980", url: "https://doi.org/10.1038/287017a0" },
    { label: "Ellner and Turchin, Chaos in a noisy world, American Naturalist 145, 1995", url: "https://doi.org/10.1086/285744" },
    { label: "Costantino, Desharnais, Cushing, Dennis, Chaotic dynamics in an insect population, Science 275, 1997", url: "https://doi.org/10.1126/science.275.5298.389" },
    { label: "Ricker, Stock and recruitment, Journal of the Fisheries Research Board of Canada 11, 1954", url: "https://doi.org/10.1139/f54-039" },
    { label: "Hastings, Hom, Ellner, Turchin, Godfray, Chaos in ecology: is Mother Nature a strange attractor?, Annual Review of Ecology and Systematics 24, 1993", url: "https://doi.org/10.1146/annurev.es.24.110193.000245" },
    { label: "Rogers, Johnson, Munch, Chaos is not rare in natural ecosystems, Nature Ecology and Evolution 6, 2022", url: "https://doi.org/10.1038/s41559-022-01787-y" },
  ],
};

export const SPACECRAFT: Piece = {
  id: "spacecraft",
  topic: "chaos",
  question: "How did a probe reach the Moon with almost no fuel?",
  lede: "In 1991 a Japanese spacecraft that did not have enough fuel to reach lunar orbit reached it anyway, by a route five months long that used the same sensitivity that makes weather unforecastable. The route runs through the saddles of gravity.",
  sections: [
    {
      heading: "The places where gravity balances",
      paragraphs: [
        "Between the Earth and the Sun there is a point where the pull of each, together with the swing of the orbit, cancels: a spacecraft parked there stays parked, needing only a nudge now and then. There are five such points for every pair of bodies. In 1978 a probe called ISEE-3 became the first object placed at one, 1.5 million kilometres sunward of Earth, in a looping path around the balance point that its designer had named a halo orbit a decade earlier.",
        "A balance point is not a bowl. It is a saddle. Roll a marble onto a saddle and it can sit at the exact centre, but push it a hair to one side and it slides off one way, a hair to the other and it slides off the opposite way. Near a saddle, tiny differences in where a thing is decide everything about where it goes. That is the sensitivity of the chaos topic, and here it is a resource.",
      ],
    },
    {
      heading: "The rescue of Hiten",
      paragraphs: [
        "Japan's first lunar probe, launched in January 1990, carried a small orbiter whose transmitter failed. The main craft was left with a mission to salvage and not enough fuel for the direct three-day route to the Moon, which ends with a hard braking burn. In June 1990 an unsolicited letter arrived from a mathematician in California, Edward Belbruno, with a route he and a colleague had computed: swing far out, to 1.5 million kilometres, into the region where the pulls of Earth, Moon and Sun nearly cancel, and arrive at the Moon so slowly that it captures the craft on its own.",
        "The route took five months instead of three days. It needed about 18 per cent less change of velocity than the direct one, and, decisively, no braking burn at the end. On 2 October 1991 Hiten entered lunar orbit, the first spacecraft ever to arrive by a low-energy route.",
      ],
    },
    {
      heading: "Tubes through the sky",
      paragraphs: [
        "In the late 1990s a group of mathematicians and engineers gave the trick its geometry. Around a halo orbit at a saddle point there are two families of paths: those that wind onto the orbit over time and those that wind off it. Each family forms a tube through space. A spacecraft inside the arriving tube drifts onto the orbit without a burn; one inside the departing tube leaves without one. Where the tubes of different saddle points cross, a craft can change tubes for almost nothing.",
        "The Genesis mission flew it in full. Launched in August 2001, it rode the arriving tube to a halo orbit around the Earth-Sun balance point, spent 850 days there over five loops collecting particles of the solar wind, and then took the departing tube home, through a loop past the far-side balance point, to drop its capsule over Utah in September 2004. The mission designer told the press that in a perfect world it would have needed no fuel at all beyond small corrections. The team called the web of tubes the interplanetary superhighway, and showed that the Earth-Sun tubes and the Earth-Moon tubes differ in energy by only about 50 metres a second, so they intersect.",
      ],
    },
    {
      heading: "What chaos buys, and what it costs",
      paragraphs: [
        "It buys fuel. A saddle amplifies small pushes into large changes of path, so a burn of a few metres a second at the right place chooses a whole route. It costs time, months instead of days, because the amplification is slow to begin. And it costs care, because the same amplification works on errors: a craft that is a little off will also be sent somewhere else, so it must be measured and corrected along the way.",
        "Genesis had its own reminder that not everything is in the mathematics. The capsule's parachute never opened, a sensor having been installed upside down, and it hit the desert at 86 metres a second. The samples survived. The route had been perfect.",
      ],
    },
  ],
  limits: [
    "The 18 per cent saving is the figure in Belbruno and Miller's 1993 paper for their class of routes against the direct one; the saving for a given mission depends on its details.",
    "Hiten's exact correction burns and flight time were reported only in a secondary summary and are not stated.",
    "The tubes are a picture of a mathematical object, the stable and unstable manifolds of the halo orbits; the piece describes what they do without the equations that define them.",
  ],
  sources: [
    { label: "International Cometary Explorer (ISEE-3), Wikipedia", url: "https://en.wikipedia.org/wiki/International_Cometary_Explorer" },
    { label: "Belbruno and Miller, Sun-perturbed Earth-to-Moon transfers with ballistic capture, Journal of Guidance, Control, and Dynamics 16, 1993", url: "https://doi.org/10.2514/3.21079" },
    { label: "Hiten (spacecraft), Wikipedia", url: "https://en.wikipedia.org/wiki/Hiten_(spacecraft)" },
    { label: "Koon, Lo, Marsden, Ross, Heteroclinic connections between periodic orbits and resonance transitions in celestial mechanics, Chaos 10, 2000", url: "https://doi.org/10.1063/1.166509" },
    { label: "Lo and Ross, The Lunar L1 Gateway: portal to the stars and beyond, AIAA Space 2001", url: "https://doi.org/10.2514/6.2001-4768" },
    { label: "Interplanetary superhighway makes space travel simpler, NASA JPL, 2002", url: "https://www.jpl.nasa.gov/news/interplanetary-superhighway-makes-space-travel-simpler/" },
    { label: "Genesis (spacecraft), Wikipedia", url: "https://en.wikipedia.org/wiki/Genesis_(spacecraft)" },
  ],
};
