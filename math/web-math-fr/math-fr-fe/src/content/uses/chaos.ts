import type { Piece } from "./kinds";
import { L } from "@/lib/lang";

export const WEATHER: Piece = {
  id: "weather",
  topic: "chaos",
  question: L("Why does the forecast say 70 per cent?"),
  lede: L("Why does a weather forecast give a chance, such as 70 per cent, rather than a plain yes or no? A forecast used to be one prediction. Since December 1992 it has been fifty predictions computed side by side, and the percentage on the screen says how many of them agreed. The reason goes back to a rounding of numbers in 1961."),
  sections: [
    {
      heading: L("Three decimal places"),
      paragraphs: [
        L("In 1961 Edward Lorenz ran a simplified model of the atmosphere on a computer the size of a desk. The model was twelve equations for how warm air rises and cools. He wanted to see one run again. So he typed the numbers from a printout back in and went for coffee. The printout showed three decimal places: 0.506. The machine had been holding six: 0.506127. When he came back, the new run had first drifted away from the old one, then moved far from it, and in the end had nothing in common with it."),
        L("A difference in the fourth decimal place, smaller than any weather instrument can measure, had grown into completely different weather. Lorenz published the finding in 1963. In systems of this kind, two states that differ by an amount too small to notice turn into states as different as two states picked at random. A colleague remarked that if this were true, one flap of a seagull's wings would be enough to change the course of the weather for ever. In the title of a 1972 talk the seagull became a butterfly, and the name stuck: the butterfly effect."),
      ],
    },
    {
      heading: L("What it means for a forecast"),
      paragraphs: [
        L("A forecast starts from measurements made by thousands of weather stations, balloons and satellites. None of them is exact. The atmosphere then does to these small errors what Lorenz's machine did to the fourth decimal place: it doubles them every couple of days. After a week the error is as large as the weather being forecast. In 1969 Lorenz worked out that this limit depends on the size of the weather. A thunderstorm can be predicted about an hour ahead. A weather system, a large area of high or low pressure, can be predicted a few days ahead, and the largest patterns a few weeks ahead. No better measurement can push past the last of these limits, because small-scale weather feeds into large-scale weather."),
        L("A careful modern study put the limit for day-to-day weather in the middle latitudes, the belt between the tropics and the polar regions, at about two weeks. Today reliable daily forecasts reach nine or ten days ahead. Better instruments and models could add four or five more days. No more than that will ever be possible."),
      ],
    },
    {
      heading: L("Fifty forecasts instead of one"),
      paragraphs: [
        L("Every single forecast goes wrong at some point, and how soon depends on the day. So the useful question is not only what will happen, but how sure the forecast can be. The answer is to run the model many times. Each run starts from a slightly different state, and each difference is no larger than the errors of measurement. Then the spread of the runs shows how sure the forecast is. Such a set of runs is called an ensemble."),
        L("On 19 December 1992 the European Centre for Medium-Range Weather Forecasts began doing this in daily service: 33 runs, three days a week, ten days ahead. The starting differences were chosen along the directions in which the atmosphere was most sensitive that day. The American weather centre had started its own version twelve days earlier, with 14 runs a day. Its starting differences were grown by a method that breeds the fastest-growing errors. By December 1996 the European set had 51 runs. It still has 51 today, each computed on a grid with points 9 kilometres apart."),
        L("A pressure contour is a line on a weather map that joins places with the same air pressure. When one such line from each of the 51 runs is drawn on a single map, the picture shows how sure the forecast is. Where the lines lie on top of one another, the forecast is sure. Where they fan out like spaghetti, it is not. For rain, the runs are counted. If 36 of the 51 runs give rain in a town on Thursday, the forecast says 70 per cent. A well-tuned ensemble is right about this: on the days it says 70 per cent, it rains about seven times in ten."),
      ],
    },
    {
      heading: L("What forecasts gained"),
      paragraphs: [
        L("For forty years forecasts have gained about one day of useful range every ten years. The European centre's rain forecast did better than a guess from long-term averages up to about day three in 2002, and up to about day seven by 2017. The gain came from better models, better observations and the ensemble. The ensemble is the part that Lorenz's discovery made necessary. It is not a way around the limit. It is a way to know, each day, how close the limit is."),
        L("Chaos is not defeated. The two-week limit stands, and beyond it a forecast is no better than the usual weather for that time of year. What the fifty runs give is a number that can be trusted: a forecast that says how far to trust itself."),
      ],
    },
  ],
  limits: [
    L("The time in which forecast errors double, between about 1.8 and 2.5 days, is taken from later accounts of Lorenz's 1982 analysis. The original paper was not read."),
    L("Sources differ on the exact day of the 1972 talk and on the grid spacing of the first ensemble. This text states only what the centres' own histories agree on."),
    L("The two-week limit is for day-to-day weather in the middle latitudes. Tropical weather, and slow patterns such as El Nino, a warming of the Pacific Ocean that returns every few years, have their own limits."),
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
  question: L("Why do the flies boom and crash for no reason?"),
  lede: L("Why does the number of insects in one place sometimes swing from huge to tiny and back, with no change in weather or food? The simplest rule an ecologist can write down is a population that grows when it is small and starves when it is large. In 1976 a physicist who had turned to biology showed that this one-line rule can make a population swing for ever, with no cause from outside. Later the same thing was made to happen in jars of beetles."),
  sections: [
    {
      heading: L("A rule in one line"),
      paragraphs: [
        L("An insect breeds once a year, and this year's adults die before next year's young hatch. Each adult leaves some offspring. But the more adults there are, the fewer offspring each one leaves, because they share the same food. So next year's population is this year's population, times a growth number, times the share of room still left. Let x be the population as a fraction of the most the habitat can hold, and a the growth number. Then next year's x equals a times x times (1 - x). This rule is called the logistic map."),
        L("Robert May published what this rule does in 1976. The title of his paper promised very complicated behaviour from simple models. For growth numbers up to 3 the population settles to one value. A little above 3 it settles to two values that alternate: a boom year, then a bust year, for ever. A little higher it cycles through four values, then eight. Past about 3.57 it never repeats at all, and year by year it looks like random noise. This behaviour, fixed by a rule and still never repeating, is called chaos. Nothing outside the population changed. The swings come from the arithmetic itself."),
      ],
    },
    {
      heading: L("Blowflies in a cage"),
      paragraphs: [
        L("Twenty years before May's paper, the Australian entomologist Alexander Nicholson, a scientist who studies insects, kept sheep blowflies in cages. The flies got a fixed daily ration of meat, and he counted them every second day for years. The numbers swung wildly: thousands of adults, then almost none, then thousands again. The cycles were irregular, and nothing about the cages explained them. Nicholson described the cause in words. When adults were many, their larvae, the young worm-like stage, starved, so the next generation was tiny. When adults were few, the larvae fed well, and the next generation was huge. The population overshot and then collapsed."),
        L("May's rule is this story written in numbers. Later researchers fitted models to Nicholson's counts. They asked whether the swings were chaotic in the mathematical sense, that is, whether tiny differences in the numbers grew into large ones. For the blowflies the best answer is a careful one. The estimated growth of tiny differences is positive. But real counts contain random errors, and two statisticians who did the fitting warned that for data like these a sharp line between chaos and randomness is misleading."),
      ],
    },
    {
      heading: L("Chaos produced on purpose"),
      paragraphs: [
        L("A clear demonstration came in 1997, with flour beetles kept in laboratory jars. The beetles eat their own eggs and pupae, the resting stage between larva and adult, and the more crowded they are, the more they eat. This is a version of the same feedback. A team wrote a model of larvae, pupae and adults that included this cannibalism. The model had a parameter, a number that can be set from outside: the rate at which pupae survive to become adults. The model predicted that as this rate was moved from high to low, the population would go from steady, to cycling, to chaotic."),
        L("Then they did the experiment. Every two weeks they counted the beetles and added or removed adults by hand. This held the adult death rate at 96 per cent and set the recruitment, the rate at which pupae became adults, to values the model had chosen: 1.00, 0.50, 0.35, 0.25, 0.10, 0.05, 0.00. The jars did what the model said. At a middle value, around 0.35, the counts swung without repeating. Jars started in almost the same state soon showed very different counts. This was chaos in a living insect population, produced by setting the one number the theory had named."),
      ],
    },
    {
      heading: L("Chaos in the wild"),
      paragraphs: [
        L("In a jar the answer is clear. In a forest or a fishery it is not, and researchers have changed their minds about it. A 1993 review found the evidence for chaos in wild populations weak. The records were short, and random noise looked like chaos, and chaos like noise. A fisheries model of 1954 first drew the number of young fish against the number of parents as a dome: more parents give more young, but past a point fewer. This dome is what makes populations overshoot. In May's table that model is one more rule that becomes chaotic when growth is strong enough."),
        L("In 2022 a group applied several methods for detecting chaos to 172 population records from around the world. They found chaos in over 30 per cent of them, most often in plankton and insects, least often in birds and mammals. Older models, which describe each population by a single number a year, had found it in under 10 per cent. The debate is open. What can be said is this: the arithmetic can swing without a cause, it has been made to do so in a jar, and how much of the swinging in nature is of this kind is still being counted."),
      ],
    },
  ],
  limits: [
    L("The values 3 and 3.57, and the window of growth numbers where the population repeats every three years, hold exactly for the logistic map. Other growth rules, such as the fisheries model, have their own values, which May's paper lists in a table."),
    L("The sources read give different numbers of repeated jars and different total lengths for the flour beetle experiment, so neither is stated here."),
    L("The 2022 figure of over 30 per cent depends on the detection methods chosen. That is the point of the paper, and it is also why its authors call the question open."),
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
  question: L("How did a probe reach the Moon with almost no fuel?"),
  lede: L("In 1991 a Japanese spacecraft reached orbit around the Moon, although it did not have enough fuel for the usual route. It took a route five months long instead. The route used the same sensitivity to tiny differences that makes the weather impossible to forecast far ahead. It passes through the places in space where the pulls of gravity balance."),
  sections: [
    {
      heading: L("The places where gravity balances"),
      paragraphs: [
        L("Between the Earth and the Sun there is a point where the pull of each body, together with the turning of the orbit, cancels out. A spacecraft placed there stays there and needs only a small push now and then. Every pair of bodies, such as the Sun and the Earth, has five such points, called Lagrange points. In 1978 a probe called ISEE-3 became the first object placed at one, 1.5 million kilometres from Earth towards the Sun. It flew a looping path around the balance point. Its designer had named such a path a halo orbit ten years earlier."),
        L("A balance point is not like the bottom of a bowl, where a marble rolls back to the centre. It is like a saddle. A marble can sit at the exact centre of a saddle. But pushed a hair to one side, it slides off one way, and pushed a hair to the other side, it slides off the opposite way. Near a saddle, a tiny difference in position decides where a thing goes. This is the same sensitivity to tiny differences that defines chaos, and here it is useful."),
      ],
    },
    {
      heading: L("How the Hiten probe was saved"),
      paragraphs: [
        L("Japan's first probe to the Moon, launched in January 1990, carried a small orbiter whose radio transmitter failed. The main craft, Hiten, needed a new mission, and it did not have enough fuel for the direct three-day route to the Moon. That route ends with a strong firing of the engine to brake. In June 1990 a letter nobody had asked for arrived from a mathematician in California, Edward Belbruno. It described a route that he and a colleague had computed. The craft would swing far out, to 1.5 million kilometres, into the region where the pulls of the Earth, the Moon and the Sun nearly cancel. From there it would arrive at the Moon so slowly that the Moon's gravity would hold it on its own."),
        L("The route took five months instead of three days. It needed about 18 per cent less change of speed than the direct route. Change of speed is what a spacecraft's fuel buys, so this is the measure of how much fuel a route needs. Most important, the route needed no braking at the end. On 2 October 1991 Hiten entered orbit around the Moon. It was the first spacecraft ever to arrive by such a low-energy route."),
      ],
    },
    {
      heading: L("Tubes through space"),
      paragraphs: [
        L("In the late 1990s a group of mathematicians and engineers described the shape behind the trick. Around a halo orbit at a balance point there are two families of paths. Paths of the first family wind onto the orbit over time. Paths of the second family wind off it. Each family forms a tube through space. A spacecraft inside an arriving tube drifts onto the orbit without firing its engine. A spacecraft inside a departing tube leaves the orbit without firing. Where the tubes of different balance points cross, a craft can move from one tube to another for almost no fuel."),
        L("The Genesis mission used this route from start to end. It was launched in August 2001. It rode an arriving tube to a halo orbit around the balance point between the Earth and the Sun. It spent 850 days there, over five loops, collecting particles of the solar wind, the stream of particles that flows out from the Sun. Then it took a departing tube home. On the way it made a loop past the balance point on the far side of the Earth, and in September 2004 it dropped its capsule over Utah. The mission designer told the press that in a perfect world it would have needed no fuel at all beyond small corrections. The team called the web of tubes the interplanetary superhighway. They showed that the Earth-Sun tubes and the Earth-Moon tubes differ in energy by only about 50 metres a second of change of speed, so the tubes cross."),
      ],
    },
    {
      heading: L("What the sensitivity saves, and what it costs"),
      paragraphs: [
        L("It saves fuel. A saddle turns small pushes into large changes of path. So a firing of the engine that changes the speed by a few metres a second, made at the right place, chooses a whole route. It costs time, months instead of days, because the growth of a small push starts slowly. And it needs care, because the same growth works on errors. A craft that is a little off course is also sent somewhere else, so its position must be measured and corrected along the way."),
        L("Genesis also showed that not everything depends on the mathematics. The capsule's parachute never opened, because a sensor had been installed upside down, and the capsule hit the desert at 86 metres a second. The samples survived. The route itself had worked perfectly."),
      ],
    },
  ],
  limits: [
    L("The 18 per cent saving is the figure in Belbruno and Miller's 1993 paper, for their type of route compared with the direct one. The saving for a given mission depends on its details."),
    L("Hiten's exact engine corrections and flight time appear only in a secondary summary, so they are not stated here."),
    L("The tubes are a picture of a mathematical object: the stable and unstable manifolds of the halo orbits, that is, the sets of all paths that wind onto an orbit or off it. This text describes what they do without the equations that define them."),
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
