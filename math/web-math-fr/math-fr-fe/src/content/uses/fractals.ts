import type { Piece } from "./kinds";

export const ACTUARIAL: Piece = {
  id: "actuarial",
  topic: "fractals",
  question: "How does anyone put a price on a fire that has not happened?",
  lede: "Insurance is a promise to pay for a disaster that may never come. The people who work out what that promise should cost are actuaries, and two facts they live with, that the worst claims are far worse than the rest and that bad years come in runs, are the two halves of what Mandelbrot named when he named fractals.",
  sections: [
    {
      heading: "A village and one barn",
      paragraphs: [
        "A village has a hundred barns. About once a year, one burns down, and rebuilding it costs about as much as ten years of a farmer's income. For the farmer whose barn it is, the fire is a catastrophe. For the village, it is a fact of life: one barn a year, give or take.",
        "So the village makes an arrangement. Each farmer pays a hundredth of a barn into a common chest every year, and whoever's barn burns takes the whole chest. Nobody is ruined any more. The price of belonging is one hundredth of a barn a year, which is exactly the average loss spread over everyone. That price is a premium, the chest is a reserve, and the arrangement is insurance.",
        "The village will notice two things within a few years. Some years two barns burn and the chest runs dry, so a little extra is charged each year to keep something in hand. And some fires are not like the others: a barn full of hay next to the smithy takes the smithy with it, and that costs five barns, not one. The extra charged each year is the premium's margin; the something kept in hand is capital; and the question of how much of each is enough is the whole of the job described next.",
      ],
    },
    {
      heading: "What an actuary is",
      paragraphs: [
        "An insurer is that village chest made large, with strangers instead of neighbours and numbers instead of a feeling for how often barns burn. An actuary is the person who has to put those numbers down and be right about them.",
        "Three numbers above all. The premium: what each customer pays, which must cover the average claim plus the margin, or the insurer bleeds. The reserve: money set aside for claims that have already happened but have not yet been paid, a car crash last month whose repair bill has not arrived. The capital: the extra held against a bad year, so that a run of claims does not leave a customer with a valid claim and an empty chest. Get the premium too high and customers leave; too low and the insurer fails. Get the capital too low and one bad season ends the company.",
        "The trade is old. John Graunt tabulated how many Londoners died at each age in 1662, from the parish burial lists, and got most of it wrong. Edmond Halley did it properly in 1693 with the records of the city of Breslau and showed how to price a pension from the table. Coffee houses in London were underwriting ships by 1691. In 1762 a London society began selling life insurance at a fixed premium worked out from such tables, and its manager named the official in charge of the sums the actuary, from a Latin word for a keeper of accounts.",
      ],
    },
    {
      heading: "The model, as it is actually built",
      paragraphs: [
        "Here is the model an actuary reaches for first, and has since a Swedish thesis of 1903 by Filip Lundberg. It has three parts.",
        "How many claims arrive in a year. Claims come at random moments, some years more, some fewer, around an average rate. In the village that rate was one a year; for a motor insurer it might be twenty thousand.",
        "How big each claim is. Each claim has a size drawn from some spread of sizes, most small, a few large.",
        "The surplus. Start with the capital. Premiums flow in steadily through the year. Every claim takes its size out at the moment it arrives. The surplus is the running balance, and the one question asked of it is whether it ever goes below zero. If it does, the insurer is ruined, and the probability that this ever happens, for a given capital and premium, is the number the whole theory is built to compute.",
        "For the ordinary case the answer is beautiful. Lundberg, and Harald Cramér after him, showed that the probability of ever being ruined falls off exponentially as the capital grows: double the capital and the ruin probability is squared. Under that law a modest capital buys near-certainty, and an actuary can set premium and capital from a formula.",
        "The formula rests on two quiet assumptions. That each year's claims have nothing to do with the last year's. And that the spread of claim sizes is tame: a claim ten times the average is rare, a hundred times the average is unheard of. Both assumptions fail on real data, and they fail in exactly the two ways this topic is about.",
      ],
      figure: "ruin",
    },
    {
      heading: "The first way it breaks: the size of the worst claim",
      paragraphs: [
        "Between 1980 and 1990 a Danish reinsurer recorded every fire loss in Denmark above a million kroner: 2,156 of them, adjusted to 1985 money. Put them in a row from smallest to largest. Most sit between one and two million. Then the row thins out, and thins, and does not stop: 10 million, 50 million, and one fire at 263 million, a hundred times the typical loss. That one fire is a substantial share of everything paid out in eleven years.",
        "Now the question a reinsurer actually asks of this data, in the words of the actuary who analysed it: price a layer of cover running from 50 to 200 million. Only six of the 2,156 losses fell in that range. A price has to come from six points.",
        "This is where the tail's shape matters, and where it turns out to be a fractal. Take only the losses above 10 million and look at how they are spread. Now take only the losses above 20 million. They are spread the same way, just scaled up. Above 40 million: the same again. Mathematicians call a spread that repeats itself above every threshold a Pareto tail, and the number that describes how fast it thins is its index, written alpha. The Danish fires have an alpha of about 1.4. A regulator's standard document assumes most large-loss lines have alpha between 1 and 2; some aircraft losses sit at 1.",
        "The self-similarity of the coastline, the same roughness at every magnification, is the self-similarity of this tail: the same thinning above every threshold. Mandelbrot called this the Noah effect, after the flood: the single event so large it dwarfs all the ordinary ones.",
        "Below alpha equal to 2 something happens that the village never imagined. The average claim can be computed, but the average squared miss around it is infinite: in the long run there is always a claim large enough to reset every estimate of how variable the claims are. Below alpha equal to 1 even the average is infinite, and an actuary quoted in the research notes that a policy with an unlimited payout on such a risk has an infinite expected cost, and that this is perhaps unwittingly done in some real cases.",
        "What actuaries do with this is exact and daily. Because the tail repeats itself above every threshold, the cost of any layer of cover follows from alpha and the layer's bounds by a short formula, and the Danish losses above 10 million price the layer from 50 to 200 without needing more than six points inside it. And because no single insurer wants to hold a tail like that, the top of it is sold on, in layers, to reinsurers: a company keeps every claim up to a retention and pays a reinsurer to take whatever is above. The reader's experiment above has that retention as a slider.",
      ],
    },
    {
      heading: "The second way it breaks: bad years come in runs",
      paragraphs: [
        "The Nile floods were measured for centuries. In 1951 a British engineer in Egypt, Harold Edwin Hurst, asked how large a reservoir would have to be to smooth the river's flow, and found that dry years and wet years came in runs longer than chance allows. He measured the effect with a number that would be one half if each year were independent of the last, and found about 0.72, on 690 records of 75 kinds of natural process, from river levels to tree rings. Mandelbrot named this the Joseph effect, after the seven fat years and seven lean years, and gave it a mathematics: fractional Brownian motion, whose Hurst exponent above one half means the past leans on the future.",
        "Insurance claims are made of weather, economies and behaviour, and all three have memory. Storm seasons cluster. Recessions raise theft and fraud for years at a time. A study of the Greek motor insurance market from 1998 to 2006 estimated Hurst exponents of about 0.6 across vehicle classes, all above one half, and found that the premium strategy that wins in a market with that memory differs considerably from the one that wins without it.",
        "Why this matters for the surplus: under independent years the spread of a decade's total claims grows like the square root of ten, about 3.2 times a single year's spread. Under memory it grows faster, like ten to the power of the Hurst exponent: at 0.72, about 5.2 times. The capital that looked safe for ten independent years is not safe for ten years that lean on each other, and the ruin probability no longer falls off exponentially with capital as Lundberg's formula promises.",
        "Here honesty is required about how far this has gone. The mathematics exists and is published: Michna in 1998 estimated ruin in finite time under a fractional Brownian surplus; Biard and Saussereau in 2014 built the surplus on a fractional Poisson process and proved its long-range dependence; several groups since have priced under fractional noise. These are research models. In the daily practice of a regulated insurer, capital is set by a rule that asks for enough to survive a one-in-two-hundred-year loss over the next year, the European directive's 99.5 per cent over one year, and the tail is estimated with the Pareto tools above. No evidence was found of a fractional risk process running inside a production pricing or capital system.",
      ],
    },
    {
      heading: "The other side of the balance sheet",
      paragraphs: [
        "An insurer does not sit on its premiums. It invests them, and the claims come due later, so the surplus depends on markets as well as fires. Markets show both effects too, and were where Mandelbrot first found them: in 1963 he showed that cotton prices from 1880 to 1958 had a tail with alpha about 1.7, the same shape at daily and monthly scales, and an infinite variance. In 1997 he and two coauthors built a multifractal model of prices that carries long memory in the size of moves without needing infinite variance, and a later version of it forecasts market turbulence ten to fifty days out better than the standard models.",
        "Whether insurers use it on the asset side: a 2022 survey of the scenario generators insurers run for their capital and asset-liability work centres on standard stochastic-volatility models and does not mention fractional or multifractal ones. An actuarial society paper from 2001 said multifractal models would eventually find their place, once the question of how to price them without arbitrage was answered. That question is still open.",
      ],
    },
    {
      heading: "What the word is, and what it is not",
      paragraphs: [
        "The three research papers that this piece leans on most, the Danish fire analysis, its published discussion, and a 2013 actuarial paper on Pareto pricing, contain the word fractal zero times between them. Actuaries say extreme value theory, Pareto tail, tail index, Hurst exponent, long-range dependence. They mean, precisely, the two things the fractals series was about: a tail whose shape repeats above every threshold, and a series whose past leans on its future.",
        "So the honest sentence is this. Fractals, by that name, are not a tool actuaries use. The two properties that make a shape a fractal, self-similarity across scales and dependence across scales, are properties actuaries measure, price and hold capital against every day, under other names. Mandelbrot named the pair the Noah effect and the Joseph effect in a paper about rivers in 1968, and an actuary pricing a reinsurance layer against a Danish fire or a run of storm years is handling exactly that pair.",
      ],
    },
  ],
  limits: [
    "The experiment above is a model with chosen numbers: twenty claims a year of mean size one, thirty years, a thousand runs. It is the classical surplus process with its assumptions switched on and off, not any insurer's book.",
    "Hurst's 0.72 was measured with a method that biases the estimate; the honest statement is that the exponent is well above one half, not exactly 0.72. Estimators of the exponent disagree on short records.",
    "The Danish losses' alpha of about 1.4 is one analyst's settled estimate; the tail fit depends on the threshold chosen, and the analyst who did it shows the 0.999 quantile moving from 95 to 147 million as the threshold changes.",
    "Fractional risk processes are research; the statement that they are absent from production systems is a statement that no evidence of them was found, not a survey of every insurer.",
    "Whether the largest claim in the Danish data is a substantial share of everything paid is inferred from its size against the typical loss; the exact share was not computed in the source.",
  ],
  sources: [
    { label: "Lewin, Actuarial History, Institute and Faculty of Actuaries seminar, 2007", url: "https://www.actuaries.org.uk/system/files/documents/pdf/seminar_2007_Lewin.pdf" },
    { label: "Gupta, The History of Actuarial Science, The Actuary Magazine, 2024", url: "https://www.theactuarymagazine.org/the-history-of-actuarial-science/" },
    { label: "Lloyd's, Coffee and commerce 1652-1811", url: "https://www.lloyds.com/about-lloyds/history/coffee-and-commerce" },
    { label: "Zhou, Sakhanenko, Guo, Lundberg-type inequalities for non-homogeneous risk models, 2020 (Lundberg 1903 and Cramer 1930 references)", url: "https://arxiv.org/abs/2004.11190" },
    { label: "McNeil, Estimating the tails of loss severity distributions using extreme value theory, ASTIN Bulletin 27, 1997", url: "https://doi.org/10.2143/AST.27.1.563210" },
    { label: "Resnick, Discussion of the Danish data on large fire insurance losses, ASTIN Bulletin 27, 1997", url: "https://www.casact.org/sites/default/files/database/astin_vol27no1_139.pdf" },
    { label: "Chen, Embrechts, Wang, Risk exchange under infinite-mean Pareto models, 2025", url: "https://arxiv.org/abs/2403.20171" },
    { label: "Fackler, Reinventing Pareto: fits for both small and large losses, British Actuarial Journal 30, 2025", url: "https://doi.org/10.1017/S1357321725100226" },
    { label: "Directive 2009/138/EC (Solvency II), article 101", url: "https://eur-lex.europa.eu/legal-content/en/ALL/?uri=CELEX%3A32009L0138" },
    { label: "Hurst, Long-term storage capacity of reservoirs, Transactions ASCE 116, 1951", url: "https://doi.org/10.1061/TACEAT.0006518" },
    { label: "Graves, Gramacy, Watkins, Franzke, A brief history of long memory, Entropy 19, 2017", url: "https://arxiv.org/abs/1406.6018" },
    { label: "Mandelbrot and Wallis, Noah, Joseph, and operational hydrology, Water Resources Research 4, 1968", url: "https://doi.org/10.1029/WR004i005p00909" },
    { label: "Zimbidis, Pricing in a competitive insurance market driven by fractional noise, Variance 5, 2011", url: "https://variancejournal.org/article/84251-pricing-in-a-competitive-insurance-market-driven-by-fractional-noise" },
    { label: "Michna, Self-similar processes in collective risk theory, 1998", url: "https://doi.org/10.1155/S1048953398000367" },
    { label: "Biard and Saussereau, Fractional Poisson process: long-range dependence and applications in ruin theory, Journal of Applied Probability 51, 2014", url: "https://doi.org/10.1239/jap/1409932670" },
    { label: "Kumar, Leonenko, Pichler, Fractional risk process in insurance, Mathematics and Financial Economics 14, 2020", url: "https://doi.org/10.1007/s11579-019-00244-y" },
    { label: "Mandelbrot, The variation of certain speculative prices, Journal of Business 36, 1963", url: "https://econpapers.repec.org/RePEc:ucp:jnlbus:v:36:y:1963:p:394" },
    { label: "Mandelbrot, Fisher, Calvet, A multifractal model of asset returns, Cowles Foundation, 1997", url: "https://ideas.repec.org/p/cwl/cwldpp/1164.html" },
    { label: "Calvet and Fisher, How to forecast long-run volatility, Journal of Financial Econometrics 2, 2004", url: "https://doi.org/10.1093/jjfinec/nbh003" },
    { label: "Arrouy, Boumezoued, Lapeyre, Mehalla, Economic scenario generators: a risk management tool for insurance, 2022", url: "https://doi.org/10.5802/msia.16" },
    { label: "Major and Lantsman, Actuarial applications of multifractal modeling, CAS Forum, 2001", url: "https://www.casact.org/abstract/cas-forum-2001-winter-forum" },
  ],
};

export const RESERVOIRS: Piece = {
  id: "reservoirs",
  topic: "fractals",
  question: "How big must a reservoir be?",
  lede: "A dam has to hold enough water through the dry years to keep the river flowing. How many dry years in a row to plan for turned out to be a question about memory, and the man who asked it of the Nile found a number that named an effect.",
  sections: [
    {
      heading: "The problem, stated in one sentence",
      paragraphs: [
        "A reservoir takes in whatever the river brings and lets out a steady flow. In a wet year it fills; in a dry year it empties. The ideal dam, in the engineers' phrase, releases the same amount every year, never overflows, ends a long period as full as it began, and is the smallest dam that can manage this. Its size is set by the worst run of the record: how far the cumulative shortfall wanders below the long-run average before the river makes it up.",
        "So the question of size is a question about runs. If every year's flow were a fresh throw of the dice, the mathematics of coin tossing gives the answer: the range of the cumulative wander grows like the square root of the number of years. Over a hundred years, ten times a single year's variation. That is what a dam designer would have assumed in 1950.",
      ],
    },
    {
      heading: "Hurst and the Nile",
      paragraphs: [
        "Harold Edwin Hurst left school at fifteen, won his way to Oxford, and joined Egypt's survey department in 1906. From 1915 he ran the office that measured the Nile, compiling rainfall, levels and flows from a hundred sites across the basin, and his 1946 report argued for century storage: reservoirs sized not for one year's flood but for the runs of decades. His work fed the design of the Aswan High Dam, on which he was still consulting in his eighties.",
        "In 1951 he published what the Nile record actually did. He took the cumulative departures of yearly flow from their average, measured how far they ranged over stretches of n years, divided by the year-to-year variation to make records comparable, and plotted the result against n on logarithmic axes. If years were independent, the slope would be one half. It was not. And in his own words: there is no obvious periodicity, but there are long stretches when the floods are generally high, and others when they are generally low, and these stretches occur without any regularity either in their time of occurrence or duration.",
        "He then did the same to 690 records of 75 other things: rainfall, temperature, air pressure, tree rings, mud layers, sunspots. The slopes clustered around 0.72, not 0.5. Nature's records have longer runs than dice do.",
      ],
    },
    {
      heading: "What the number does to the dam",
      paragraphs: [
        "Follow the arithmetic. Under independence the required storage over fifty years scales like 50 to the power one half, about 7 times one year's variation. Under Hurst's law it scales like 50 to the power 0.72, about 17 times. A dam designed on the dice would be less than half the size the record demands, and the consequence of a dam too small is not an empty reservoir but a flood, since the excess has to go somewhere. Later hydrologists confirmed the direction with better methods and argued about the size: from a safety factor of a few per cent to substantially more storage, depending on the river and the horizon.",
        "The mathematics that finally explained the number came in 1968, when Mandelbrot and Van Ness defined fractional Brownian motion, a random walk whose steps remember. Its Hurst exponent is exactly Hurst's slope; at one half it is an ordinary walk, above one half each step leans the way the last ones went. Mandelbrot and Wallis, writing about rivers that same year, named the long runs the Joseph effect, after the seven fat and seven lean years, and named the single enormous flood the Noah effect. The two are the two properties of every shape in the fractals series: dependence across scales, and extremes far beyond the ordinary.",
      ],
    },
    {
      heading: "Where the fractal is",
      paragraphs: [
        "Plot fractional Brownian motion and it is rough at every magnification, the way a coastline is. Its graph has a box-counting dimension of two minus the Hurst exponent, so the Nile's record, at 0.72, draws a curve of dimension about 1.28. The roughness of the curve and the length of the runs are one property seen two ways: a walk that remembers where it has been draws a rough, wandering line, and the smoother the line, the longer its runs.",
        "A hydrologist writing in 2002 put the whole matter as fluctuation on many time scales at once, and gave three fast ways to generate such records for testing a design. That is how the Hurst phenomenon is used today: not as a word, but as synthetic centuries of river run through a proposed dam to see how often it fails.",
      ],
    },
  ],
  limits: [
    "Hurst estimated his slope with a method that assumes a fixed point at two years and is biased; modern estimates on the same records are lower for high values and higher for low ones. The direction, well above one half, is not in doubt; the exact 0.72 is.",
    "The factor of about 2.4 in storage over a hundred years is arithmetic from Hurst's law, not a published design figure. Studies of real designs found effects from a few per cent upward.",
    "The relation between the graph's dimension and the exponent holds for fractional Brownian motion itself; for other processes the two can be set separately, so the dimension is local roughness and the exponent is memory.",
  ],
  sources: [
    { label: "Hurst, Long-term storage capacity of reservoirs, Transactions ASCE 116, 1951", url: "https://doi.org/10.1061/TACEAT.0006518" },
    { label: "Graves, Gramacy, Watkins, Franzke, A brief history of long memory: Hurst, Mandelbrot and the road to ARFIMA, Entropy 19, 2017", url: "https://arxiv.org/abs/1406.6018" },
    { label: "Sutcliffe and colleagues, Harold Edwin Hurst: the Nile and Egypt, past and future, Hydrological Sciences Journal 61, 2016", url: "https://doi.org/10.1080/02626667.2015.1019508" },
    { label: "O'Connell and colleagues, The scientific legacy of Harold Edwin Hurst, Hydrological Sciences Journal 61, 2016", url: "https://doi.org/10.1080/02626667.2015.1125998" },
    { label: "Mandelbrot and Wallis, Noah, Joseph, and operational hydrology, Water Resources Research 4, 1968", url: "https://doi.org/10.1029/WR004i005p00909" },
    { label: "Koutsoyiannis, The Hurst phenomenon and fractional Gaussian noise made easy, Hydrological Sciences Journal 47, 2002", url: "https://doi.org/10.1080/02626660209492961" },
    { label: "History of Hydrology wiki, Hurst, H E", url: "http://www.history-of-hydrology.net/mediawiki/index.php/Hurst,_H_E" },
  ],
};

export const TRAFFIC: Piece = {
  id: "traffic",
  topic: "fractals",
  question: "Why does the internet not smooth out?",
  lede: "Telephone traffic gets calmer the more calls are added together, and the networks of the 1980s were designed on that fact. When engineers first measured data traffic packet by packet, it refused to calm down at any scale, and that refusal is a fractal.",
  sections: [
    {
      heading: "The calm that was expected",
      paragraphs: [
        "A telephone exchange handles thousands of calls that start and stop at random. Add them up and the total is remarkably steady: the randomness of individual callers averages out, and an engineer can size the exchange for the average plus a modest margin. The mathematics of this is the Poisson process, the same law that governs how many claims an insurer sees in a year, and it says that aggregation smooths.",
        "The first data networks were designed on the same expectation. A router's job is to hold packets in a queue when they arrive faster than the outgoing line can carry them, and the queue's size, its buffer, is set from the traffic model. If traffic behaves like telephone calls, a small buffer absorbs the bursts, because the bursts are short and the averaging is quick.",
      ],
    },
    {
      heading: "Hundreds of millions of packets",
      paragraphs: [
        "Between August 1989 and February 1992 a group at Bellcore recorded every packet on an office Ethernet at Morristown, New Jersey, with a monitor built for the purpose, timestamps accurate to a ten-thousandth of a second, hundreds of millions of packets without losing one. Four sets of about 28 million packets each, from a quiet 3 per cent of the line's capacity to a busy 16 per cent.",
        "Then they drew the traffic at different time scales. Packets per tenth of a second: bursty. Packets per second: bursty in the same way. Per ten seconds, per minute, per ten minutes: the same bursts, at every scale. In their words, there is no natural length of a burst. A telephone-like process drawn the same way is a jagged line at the finest scale and a nearly flat one a few scales up. This was a coastline: as rough at a minute as at a millisecond.",
        "The measurement that made it a number is Hurst's, from the Nile. On the normal hours the exponent came out about 0.80 by three different estimators; on the busiest hours 0.85 and higher. Above one half means the traffic remembers: a busy tenth of a second tends to be followed by a busy tenth, a busy minute by a busy minute, across every scale. And the more sources were added, the burstier it got. Aggregation, they wrote, intensifies the self-similarity instead of smoothing it.",
      ],
    },
    {
      heading: "What it does to a queue",
      paragraphs: [
        "A Finnish mathematician, Ilkka Norros, took the fractal traffic model and put a queue in front of it. Under telephone-like traffic the chance of a queue overflowing falls off exponentially with the buffer size, so a little more buffer buys a lot more safety. Under traffic with Hurst exponent H it falls off far more slowly, and the buffer needed to keep the same overflow rate at a higher load obeys a rule with the exponent H over one minus H.",
        "With H at one half, that exponent is one: halve the free capacity on a line and the buffer has to double. With H at 0.8 the exponent is four: halve the free capacity and the buffer has to grow sixteen times. Norros drew the conclusion for design: buffers cannot buy utilisation, and it is very difficult for short-range dependent traffic to fill a large buffer, which is another way of saying that only traffic with memory does.",
        "Two other researchers checked the wide-area network in 1995 with 24 traces and found the same failure: the arrivals of human sessions were Poisson, but the packets within them were not, and the standard models seriously underestimated the burstiness over a wide range of time scales.",
      ],
    },
    {
      heading: "Where the burstiness comes from, and what happened next",
      paragraphs: [
        "The cause was found within two years and it is a Noah effect: the sizes of the files people send have a heavy tail. Most are small, a few are enormous, and a source that switches between sending and idling for heavy-tailed stretches produces, in aggregate, exactly the self-similar traffic measured. The memory in the traffic is the memory of one long file transfer still going.",
        "What network engineers do with it today is honest to report. The self-similar model is textbook, and its authors, looking back after twenty-five years, called the property ubiquitous in internet traffic to date. But the buffers of backbone routers are sized by a different rule, from the behaviour of the transmission protocol that slows senders down when packets are lost: bandwidth times round-trip time, divided by the square root of the number of flows. The fractal measurement changed what everyone knew traffic looked like; the design rule that won was built around the protocol that reacts to it.",
      ],
    },
  ],
  limits: [
    "The Hurst estimates above are for one office network in 1989 to 1992; wide-area and modern traffic have been measured many times since with varying exponents, and the piece quotes the founding measurement rather than a survey.",
    "Norros's buffer rule is for an idealised model with an infinite buffer and a single line; real routers carry many flows under a protocol that changes their behaviour, which is why the design rule in use is a different one.",
    "That the authors of the original paper call the property ubiquitous is their judgement in a 2019 retrospective, not a measurement in that paper.",
  ],
  sources: [
    { label: "Leland, Taqqu, Willinger, Wilson, On the self-similar nature of Ethernet traffic, IEEE/ACM Transactions on Networking 2, 1994", url: "https://doi.org/10.1109/90.282603" },
    { label: "Willinger, Taqqu, Wilson, Lessons from On the Self-Similar Nature of Ethernet Traffic, ACM SIGCOMM CCR 49, 2019", url: "https://doi.org/10.1145/3371934.3371955" },
    { label: "Paxson and Floyd, Wide area traffic: the failure of Poisson modeling, IEEE/ACM Transactions on Networking 3, 1995", url: "https://doi.org/10.1109/90.392383" },
    { label: "Norros, A storage model with self-similar input, Queueing Systems 16, 1994", url: "https://doi.org/10.1007/BF01158964" },
    { label: "Norros, On the use of fractional Brownian motion in the theory of connectionless networks, IEEE JSAC 13, 1995", url: "https://doi.org/10.1109/49.400651" },
    { label: "Appenzeller, Keslassy, McKeown, Sizing router buffers, ACM SIGCOMM 2004", url: "https://doi.org/10.1145/1015467.1015499" },
  ],
};

export const ANTENNAS: Piece = {
  id: "antennas",
  topic: "fractals",
  question: "Can one antenna listen on five frequencies at once?",
  lede: "An antenna is a piece of metal whose length matches the wave it catches. A shape that repeats itself at several sizes matches several waves, and for a decade that idea sat inside most mobile phones. What it actually bought, and what it did not, has been measured.",
  sections: [
    {
      heading: "Why an antenna has a size",
      paragraphs: [
        "A radio wave has a length: about a third of a metre for a signal at 900 million cycles a second, half that at 1,800 million. A straight wire catches such a wave best when its length is a simple fraction of the wavelength, a quarter or a half. That is why an old car radio had a metre of rod, and why a phone that has to work on five different bands would, on this reasoning, need five different wires, each cut to its own band.",
        "Space in a phone is the one thing there is none of. So the question is whether one shape can be the right length for several waves at once.",
      ],
    },
    {
      heading: "A triangle that contains itself",
      paragraphs: [
        "In the fractals series, the Sierpinski triangle was a filled triangle with its middle cut out, and each remaining triangle's middle cut out, and so on: three copies of itself at half the size, and inside each of those three more. Cut that shape out of copper, feed it at its lower corner, and it is an antenna that contains a whole triangle, and half a triangle, and a quarter, and an eighth, all at once.",
        "In 1996 a group in Barcelona built one, 8.9 centimetres tall with five levels of cutting, and measured what it did. It resonated in five bands, and the bands were spaced by a factor of two, exactly the factor by which the triangle shrinks at each level. A version fed as a dipole was measured at 2, 4, 8 and 16 thousand million cycles a second and behaved alike at each. The self-similarity of the shape had become a self-similarity of frequencies.",
        "The same group then took the Koch curve, the snowflake edge of the series, and bent a 6 centimetre wire into it, one fold, two, up to five. The height never changed, but each fold multiplied the wire's length by four thirds, and with each fold the antenna resonated at a longer wavelength than a straight 6 centimetre wire could. A longer antenna in the same space.",
      ],
    },
    {
      heading: "What the measurements said, and what a sceptic said",
      paragraphs: [
        "The effects are real and were measured: several bands from one shape, and a lower resonance from a folded one. The first patent application on fractal antennas for wireless communication was filed in 1995 by the Barcelona group's leader, and his company licensed multilevel and space-filling antennas into phones from 2001; a court in Texas found in 2011 that a major handset maker's phones infringed four of those patents. For most of the 2000s the squiggle of metal inside the top of a phone was a descendant of the Sierpinski triangle.",
        "Then an antenna engineer asked the sharp question in 2003: is it the fractal that does it, or just the wire? He built non-fractal wires with the same total length and the same enclosed area and found they performed the same or better. Fractal geometry alone, he concluded, is not the significant factor. A standard handbook on small antennas agreed: no advantage over a fat dipole, a loaded dipole or a loop. The fractal shape is one way of packing a long wire and several resonances into a small space, and there are others.",
      ],
    },
    {
      heading: "What is in a phone now",
      paragraphs: [
        "Not a fractal, mostly. The common internal antenna of a modern phone is a folded plate called a planar inverted-F, and the newest phones use the metal rim of the case itself, retuned electronically as the bands change. The fractal antenna's decade was the 2000s.",
        "What remains is the idea that was measured true: a shape that repeats at several scales answers at several scales. The Sierpinski triangle is the clearest demonstration of it that has ever been cut from copper, and the sceptic's result is the honest footnote, that the repeating shape was one route to a long wire in a small space rather than the only one.",
      ],
    },
  ],
  limits: [
    "The exact band centres of the 1998 monopole and the percentage by which the Koch folds lowered the resonance are in figures the research could not read as text; the piece states the factor-of-two spacing and the direction of the shift, which are stated in words in the sources.",
    "The claim that fractal-derived antennas were in most 2000s phones rests on the licensing company's own statements and on litigation records; an independent market share was not found.",
    "That current phones do not use fractal antennas is drawn from the industry press and standard references on handset antennas, not from a survey of every model.",
  ],
  sources: [
    { label: "Puente, Romeu, Pous, Cardama, On the behavior of the Sierpinski multiband fractal antenna, IEEE Transactions on Antennas and Propagation 46, 1998", url: "https://doi.org/10.1109/8.664115" },
    { label: "Puente, Romeu, Pous, Ramis, Hijazo, Small but long Koch fractal monopole, Electronics Letters 34, 1998", url: "https://doi.org/10.1049/el:19980114" },
    { label: "Best, A discussion on the significance of geometry in determining the resonant behavior of fractal and other non-Euclidean wire antennas, IEEE Antennas and Propagation Magazine 45, 2003", url: "https://doi.org/10.1109/MAP.2003.1232160" },
    { label: "Hansen and Collin, Small Antenna Handbook, Wiley, 2011", url: "https://doi.org/10.1002/9781118106860" },
    { label: "Fractus, company history", url: "https://www.fractus.com/company/about/" },
    { label: "Nordrum, Fractus Antennas pitches new antennaless smartphone technology, IEEE Spectrum, 2017", url: "https://spectrum.ieee.org/fractus-antennas-pitches-new-antennaless-smartphone-technology" },
    { label: "Inverted-F antenna, Wikipedia, with its handset references", url: "https://en.wikipedia.org/wiki/Inverted-F_antenna" },
  ],
};
