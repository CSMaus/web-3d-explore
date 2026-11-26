import { L } from "@/lib/lang";
import type { Piece } from "./kinds";

export const ACTUARIAL: Piece = {
  id: "actuarial",
  topic: "fractals",
  question: L("How does anyone put a price on a fire that has not happened?"),
  lede: L("Insurance is a promise to pay for a disaster that may never come. The people who work out what that promise should cost are called actuaries. Two facts make their work hard. The worst claims are far worse than all the others. And bad years come in runs. A claim is a request for payment after a loss. Benoit Mandelbrot, the mathematician who coined the word fractal, described both facts as two sides of one idea: a pattern that looks alike at every scale. This piece shows how the price of insurance is worked out, and where these two facts enter."),
  sections: [
    {
      heading: L("A village shares the cost of one barn fire"),
      paragraphs: [
        L("A village has a hundred barns. About once a year one of them burns down. Rebuilding it costs about as much as a farmer earns in ten years. For the farmer who owns that barn, the fire is a catastrophe. For the village as a whole, it is a normal event: about one barn a year."),
        L("So the villagers agree on a scheme. Every year each farmer puts one hundredth of the cost of a barn into a common chest. The farmer whose barn burns takes the whole chest. Nobody is ruined any more. Each farmer pays one hundredth of a barn a year. That is exactly the average loss, one barn a year, shared among a hundred farmers. The yearly payment is called a premium. The money in the chest is called a reserve. The whole arrangement is insurance."),
        L("Within a few years the village notices two problems. In some years two barns burn, and the chest runs empty. So each farmer pays a little extra every year, to keep some money in hand. And some fires are worse than others. A barn full of hay next to the smithy can burn the smithy too, and that costs five barns, not one. The extra paid each year is called the margin of the premium. The money kept in hand is called capital. How much of each is enough: that question is the work of an actuary."),
      ],
    },
    {
      heading: L("What an actuary does"),
      paragraphs: [
        L("An insurance company works like the village chest, only much larger. Its customers are strangers, not neighbours. Instead of a feeling for how often barns burn, it needs numbers. An actuary is the person who works out those numbers and has to get them right."),
        L("Three numbers matter most. The premium is what each customer pays. It must cover the average claim plus the margin, or the insurer loses money every year. The reserve is money set aside for claims that have already happened but are not yet paid: for example, a car crash last month whose repair bill has not arrived. The capital is extra money held for a bad year. With enough capital, a run of claims does not leave a customer with a valid claim and an empty chest. If the premium is too high, customers leave. If it is too low, the insurer fails. If the capital is too low, one bad season ends the company."),
        L("The trade is old. In 1662 John Graunt used the London parish burial lists to count how many Londoners died at each age, and got most of it wrong. In 1693 Edmond Halley did it properly with the records of the city of Breslau, and showed how to work out the price of a pension from such a table. By 1691 London coffee houses were insuring ships. In 1762 a London society began selling life insurance at a fixed premium worked out from such tables. Its manager called the official who did the sums the actuary, from a Latin word for a keeper of accounts."),
      ],
    },
    {
      heading: L("The standard model of an insurer"),
      paragraphs: [
        L("The first model an actuary reaches for comes from a Swedish thesis written by Filip Lundberg in 1903. A model here means a description of the insurer in numbers, simple enough to compute with. It has three parts."),
        L("The first part: how many claims arrive in a year. Claims come at random moments. Some years bring more, some fewer, around an average rate. In the village the rate was one claim a year. For an insurer of cars it might be twenty thousand."),
        L("The second part: how big each claim is. The sizes vary from claim to claim. Most are small and a few are large. The model describes how often each size occurs."),
        L("The third part: the surplus. The surplus is the money the insurer holds at each moment. It starts at the capital. Premiums come in steadily through the year. Each claim takes its size out of the surplus at the moment it arrives. The one question asked of the surplus is whether it ever falls below zero. If it does, the insurer is ruined: it cannot pay. The probability of ruin is the chance that this ever happens, for a given capital and premium. A probability is a number from 0 to 1: 0 means it never happens, 1 means it always does. Computing this probability is the aim of the whole theory."),
        L("For ordinary claims the answer is a simple rule. Lundberg, and Harald Cramér after him, showed that the probability of ruin falls exponentially as the capital grows. That means each added amount of capital multiplies the probability by the same small factor. Doubling the capital squares the probability: a chance of 1 in 10 becomes 1 in 100. So a modest capital makes ruin almost impossible, and an actuary can set the premium and the capital from a formula."),
        L("The formula rests on two assumptions that are rarely stated. First, each year's claims have nothing to do with the last year's. Second, claim sizes stay within a modest range: a claim ten times the average is rare, and a claim a hundred times the average never happens. Both assumptions fail on real data. The two sections below show how."),
      ],
      figure: "ruin",
    },
    {
      heading: L("First failure: the worst claim is enormous"),
      paragraphs: [
        L("From 1980 to 1990 a Danish reinsurer recorded every fire loss in Denmark above a million kroner. A reinsurer is a company that insures insurance companies. There were 2,156 such losses, all converted to 1985 prices. Placed in a row from smallest to largest, most of them are between one and two million. Then the row thins out, and keeps thinning, but does not end: 10 million, 50 million, and one fire at 263 million, a hundred times the typical loss. That one fire is a large share of everything paid out in the eleven years."),
        L("The reinsurer's real question about this data, in the words of the actuary who studied it: what should cover from 50 to 200 million cost? Such cover pays the part of any single loss that lies between 50 and 200 million. Only six of the 2,156 losses reached that range. A price has to come from six points."),
        L("Here the shape of the tail matters. The tail means the large claims, the thin end of the row. Among the losses above 10 million, the sizes are spread in a certain way. Among the losses above 20 million, the sizes are spread in the same way, only scaled up by two. Above 40 million, the same again. A spread of sizes that repeats itself above every threshold is called a Pareto tail. The number that says how fast it thins out is called the tail index and written alpha. A large alpha means huge claims are very rare; a small alpha means they come more often. The Danish fires have an alpha of about 1.4. A standard document from a regulator assumes alpha between 1 and 2 for most kinds of insurance with large losses. Some aircraft losses have an alpha of 1."),
        L("This is where fractals come in. A fractal is a shape whose small parts look like the whole. A coastline is the usual example: a magnified piece of coast is as jagged as the whole coast. The Pareto tail has the same property for sizes: above every threshold, the large claims thin out in the same way. Mandelbrot called this the Noah effect, after the flood in the Bible: a single event so large that it dwarfs all the ordinary ones."),
        L("When alpha is below 2, something happens that the village never imagined. The average claim can still be calculated. But the variance is infinite. The variance measures how far claims stray from the average: it is the average of the squared distance of each claim from the average. Infinite variance means that, sooner or later, a claim comes that is large enough to overturn every estimate of how much claims vary. When alpha is below 1, even the average is infinite. An actuary quoted in the research notes that an insurance policy that pays without limit on such a risk has an infinite expected cost, meaning an infinite average cost over many repetitions, and that some real policies may be written this way without anyone noticing."),
        L("Actuaries use this exactly and every day. Because the tail repeats itself above every threshold, the price of any range of cover follows from alpha and the two ends of the range by a short formula. So the Danish losses above 10 million give a price for the cover from 50 to 200 million, although only six losses fall inside it. And because no single insurer wants to keep such a tail, the top of it is passed on in layers to reinsurers. The insurer pays every claim up to an agreed amount, called the retention, and pays a reinsurer to take whatever is above it. The experiment on this page has the retention as the slider named Reinsurance."),
      ],
    },
    {
      heading: L("Second failure: bad years come in runs"),
      paragraphs: [
        L("The floods of the Nile were measured for centuries. In 1951 the British engineer Harold Edwin Hurst, working in Egypt, asked how large a reservoir would have to be to even out the river's flow. He found that dry years and wet years came in runs longer than chance allows. He measured this with a number, now called the Hurst exponent and written H. H is one half when each year has nothing to do with the year before. Above one half, a run of dry or wet years tends to continue. Hurst found about 0.72, over 690 records of 75 kinds of natural process, from river levels to tree rings. Mandelbrot called this the Joseph effect, after the seven fat years and seven lean years of the Bible story. He described it in mathematics as fractional Brownian motion: a randomly wandering line whose past, when H is above one half, pulls its future the same way."),
        L("Insurance claims come from weather, the economy and human behaviour, and all three have memory. Storm seasons come in clusters. A recession raises theft and fraud for years at a time. A study of the Greek car insurance market from 1998 to 2006 estimated the Hurst exponent at about 0.6 for every class of vehicle, above one half each time. It also found that the best pricing strategy in a market with this memory is quite different from the best one in a market without it."),
        L("Why this matters for the surplus. If the years are independent, the spread of the total claims over ten years grows like the square root of ten: about 3.2 times the spread of a single year. The spread here means the typical distance from the average. With memory it grows faster, like ten to the power H. With H = 0.72 that is about 5.2 times. Capital that looked safe for ten independent years is not safe for ten years that depend on each other. And the probability of ruin no longer falls exponentially as the capital grows, as Lundberg's formula promised."),
        L("How far has this reached real insurers? The mathematics exists and is published. In 1998 Michna estimated the probability of ruin within a fixed time when the surplus follows fractional Brownian motion. In 2014 Biard and Saussereau built the surplus on a fractional Poisson process, a way of counting random events that has memory, and proved that this memory reaches far back. Several groups since then have set prices under random noise with memory. All of these are research models. In the daily work of a regulated insurer, capital follows a rule: enough to survive the loss that comes once in two hundred years, over the next year. This is the European directive's 99.5 per cent over one year. The tail is estimated with the Pareto methods described above. No evidence was found of a model with memory running inside an insurer's working system for prices or capital."),
      ],
    },
    {
      heading: L("The other side: the insurer's investments"),
      paragraphs: [
        L("An insurer does not keep its premiums idle. It invests them, and the claims are paid later. So the surplus depends on the markets as well as on fires. Markets show both effects too, and Mandelbrot first found them there. In 1963 he showed that cotton prices from 1880 to 1958 had a Pareto tail with alpha about 1.7, the same shape on daily and monthly scales, and infinite variance. In 1997 he and two coauthors built a multifractal model of prices, made of fractal patterns at many scales at once. It keeps a long memory in how large price moves are, without needing infinite variance. A later version of it forecasts how turbulent a market will be ten to fifty days ahead better than the standard models."),
        L("Do insurers use it for their investments? A 2022 survey looked at the programs insurers run to simulate future markets for their capital planning. It centres on standard models in which the size of market swings changes at random, and does not mention fractal or multifractal ones. A paper from an actuarial society in 2001 said multifractal models would find their place once one question was answered: how to set prices with them so that no one can make a riskless profit from those prices. That question is still open."),
      ],
    },
    {
      heading: L("Is the word fractal used at all?"),
      paragraphs: [
        L("The three research papers this piece relies on most are the Danish fire analysis, the published discussion of it, and a 2013 actuarial paper on Pareto pricing. Between them they never use the word fractal. Actuaries say extreme value theory, Pareto tail, tail index, Hurst exponent, long-range dependence. They mean exactly two properties of fractals: a tail whose shape repeats above every threshold, and a series of years whose past influences its future."),
        L("So, in short: fractals, under that name, are not a tool actuaries use. A shape is a fractal because of two properties: it looks alike at every scale, and its parts at different scales depend on each other. Actuaries measure both properties, price them and hold capital against them every day, under other names. Mandelbrot named the pair the Noah effect and the Joseph effect in a 1968 paper about rivers. An actuary who prices reinsurance cover against a Danish fire or a run of stormy years deals with exactly that pair."),
      ],
    },
  ],
  limits: [
    L("The experiment on this page is a model with chosen numbers: twenty claims a year, an average claim size of one, thirty years, a thousand runs. It is the standard surplus model with its assumptions switched on and off, not the accounts of any real insurer."),
    L("Hurst's 0.72 was measured with a method that pushes the estimate in one direction. The safe statement is that the exponent is well above one half, not that it is exactly 0.72. Different methods of estimating the exponent disagree on short records."),
    L("The alpha of about 1.4 for the Danish losses is one analyst's final estimate. The fit of the tail depends on the threshold chosen. The same analyst shows the loss exceeded only once in a thousand cases, called the 0.999 quantile, moving from 95 to 147 million as the threshold changes."),
    L("Models with memory are research. The statement that they are absent from insurers' working systems means that no evidence of them was found. It is not a survey of every insurer."),
    L("That the largest Danish claim is a large share of everything paid is inferred from its size compared with the typical loss. The source does not give the exact share."),
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
  question: L("How big must a reservoir be?"),
  lede: L("A dam must hold enough water through dry years to keep the river below it flowing. How many dry years in a row to plan for turned out to be a question about memory: whether one year's flow depends on the years before it. The engineer who asked this of the Nile found a number that now carries his name."),
  sections: [
    {
      heading: L("What sets the size of a reservoir"),
      paragraphs: [
        L("A reservoir takes in whatever the river brings and lets out a steady flow. In a wet year it fills. In a dry year it empties. Engineers describe the ideal dam like this: it releases the same amount every year, never overflows, is as full at the end of a long period as at the start, and is the smallest dam that can do all this. Its size is set by the worst run in the record. Year after year, the amount by which the flow falls short of the long-run average is added up. The size is how far this running total sinks before the river makes up the difference."),
        L("So the size depends on runs of dry years. If each year's flow were a fresh throw of dice, unrelated to earlier years, the mathematics of coin tossing gives the answer: the range of that running total, from its highest to its lowest point, grows like the square root of the number of years. Over a hundred years it is ten times the variation of a single year. A dam designer in 1950 would have assumed this."),
      ],
    },
    {
      heading: L("Hurst and the Nile"),
      paragraphs: [
        L("Harold Edwin Hurst left school at fifteen, won a place at Oxford, and joined Egypt's survey department in 1906. From 1915 he ran the office that measured the Nile. It collected rainfall, water levels and flows from a hundred sites across the river's basin. His 1946 report argued for century storage: reservoirs sized not for one year's flood but for runs of wet and dry years lasting decades. His work fed into the design of the Aswan High Dam, and he was still advising on it in his eighties."),
        L("In 1951 he published what the Nile record showed. For each year he took how far the flow differed from the average, and added these differences up year after year. He measured how far this running total ranged over stretches of n years, where n is the length of the stretch. He divided by the year-to-year variation, so that different rivers could be compared. Then he plotted the result against n on logarithmic axes: axes on which each equal step multiplies the value by the same factor, so that a power law becomes a straight line. If the years were independent, the slope of that line would be one half. It was not. In his own words: there is no obvious periodicity, but there are long stretches when the floods are generally high, and others when they are generally low, and these stretches occur without any regularity either in their time of occurrence or duration."),
        L("He then did the same with 690 records of 75 other things: rainfall, temperature, air pressure, tree rings, layers of mud, sunspots. The slopes gathered around 0.72, not 0.5. Records of nature have longer runs than dice do."),
      ],
    },
    {
      heading: L("How the number changes the size of a dam"),
      paragraphs: [
        L("The arithmetic is short. If years are independent, the storage needed over fifty years grows like 50 to the power one half: about 7 times the variation of one year. Under Hurst's law it grows like 50 to the power 0.72: about 17 times. A dam designed on the dice assumption would be less than half the size the record demands. A dam that is too small does not end with an empty reservoir but with a flood, because the extra water has to go somewhere. Later hydrologists, scientists who study water, confirmed the direction with better methods and argued about the size of the effect: from a safety margin of a few per cent to much more storage, depending on the river and on how many years ahead the design looks."),
        L("The mathematics that finally explained the number came in 1968. Mandelbrot and Van Ness defined fractional Brownian motion: a random walk whose steps remember. A random walk is a line built step by step, each step going up or down by chance. In their walk the Hurst exponent is exactly Hurst's slope. At one half it is an ordinary random walk. Above one half each step tends to go the way the earlier steps went. In the same year Mandelbrot and Wallis, writing about rivers, called the long runs the Joseph effect, after the seven fat and seven lean years of the Bible story, and called the single enormous flood the Noah effect. These are the two properties of fractal shapes: dependence across scales, and extremes far beyond the ordinary."),
      ],
    },
    {
      heading: L("Where the fractal appears"),
      paragraphs: [
        L("Drawn as a line on paper, fractional Brownian motion is rough at every magnification, the way a coastline is. The roughness of such a line is measured by its dimension: 1 for a smooth line, and closer to 2 the more the line crumples, until it almost fills an area. One way to measure it is box counting: the line is covered with a grid of small squares, and the squares it touches are counted as the squares shrink. For this walk the box-counting dimension is two minus the Hurst exponent. So the Nile's record, with H = 0.72, draws a line of dimension about 1.28. The roughness of the line and the length of the runs are one property seen in two ways. A walk with memory still draws a rough, wandering line, but the smoother the line, the longer its runs."),
        L("A hydrologist writing in 2002 described the whole matter as variation on many time scales at once, and gave three quick ways to generate such records for testing a design. This is how the Hurst effect is used today: computers generate centuries of artificial river flow with the right memory, and these are run through a proposed dam to see how often it fails."),
      ],
    },
  ],
  limits: [
    L("Hurst estimated his slope with a method that assumes a fixed point at two years, and that method is biased: it pushes the result one way. Modern estimates on the same records come out lower where Hurst's values were high, and higher where they were low. The direction, well above one half, is not in doubt. The exact value 0.72 is."),
    L("The factor of about 2.4 in storage over fifty years is arithmetic from Hurst's law, not a figure from a published design. Studies of real designs found effects from a few per cent upward."),
    L("The link between the dimension of the line and the exponent holds for fractional Brownian motion itself. For other random processes the two can be set separately: then the dimension describes roughness over short stretches, and the exponent describes memory."),
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
  question: L("Why does internet traffic not even out?"),
  lede: L("Telephone traffic becomes steadier the more calls are added together, and the networks of the 1980s were designed on that fact. Data on a network travels in packets, small blocks of data sent one after another. When engineers first measured data traffic packet by packet, it did not become steadier at any scale. That refusal to even out is a fractal property: the traffic looks equally uneven whether it is viewed over a second or over an hour."),
  sections: [
    {
      heading: L("The steadiness that was expected"),
      paragraphs: [
        L("A telephone exchange handles thousands of calls that start and stop at random. Their total is remarkably steady: the randomness of single callers averages out. An engineer can size the exchange for the average plus a modest margin. The mathematics behind this is the Poisson process, a model of events that arrive at random and independently of each other. The same model describes how many claims an insurer receives in a year. It says that adding many sources together makes the total smoother."),
        L("The first data networks were designed with the same expectation. A router is the device that passes packets on. When packets arrive faster than the outgoing line can carry them, the router holds them in a queue. The space for the queue is called a buffer, and its size was set from the traffic model. If data traffic behaves like telephone calls, a small buffer absorbs the bursts, because the bursts are short and they average out quickly."),
      ],
    },
    {
      heading: L("Hundreds of millions of packets measured"),
      paragraphs: [
        L("From August 1989 to February 1992 a group at Bellcore recorded every packet on an office Ethernet network, a common kind of office network, in Morristown, New Jersey. They used a monitor built for the purpose. Its timestamps were accurate to a ten-thousandth of a second, and it recorded hundreds of millions of packets without losing one. There were four sets of about 28 million packets each, from a quiet 3 per cent of the line's capacity to a busy 16 per cent."),
        L("Then they drew the traffic at different time scales: packets per tenth of a second, per second, per ten seconds, per minute, per ten minutes. At every scale the line was bursty in the same way. In their words, there is no natural length of a burst. Telephone-like traffic drawn the same way is jagged at the finest scale and almost flat a few scales up. The data traffic behaved like a coastline: as rough over a minute as over a millisecond."),
        L("The number that measures this comes from Hurst's study of the Nile: the Hurst exponent H, which is one half for traffic without memory. In normal hours the exponent came out about 0.80 by three different methods. In the busiest hours it was 0.85 and higher. Above one half means the traffic remembers: a busy tenth of a second tends to be followed by another busy one, a busy minute by a busy minute, at every scale. And the more sources were added together, the burstier the total became. Adding traffic together, they wrote, strengthens the self-similarity instead of smoothing it out. Self-similarity means looking the same at every scale."),
      ],
    },
    {
      heading: L("What memory in traffic does to a queue"),
      paragraphs: [
        L("A Finnish mathematician, Ilkka Norros, took this fractal model of traffic and put a queue in front of it. With telephone-like traffic, the chance that the queue overflows falls exponentially as the buffer grows: a little more buffer buys a lot more safety. With traffic whose Hurst exponent is H, the chance falls far more slowly. The buffer needed to keep the same overflow rate at a higher load follows a power rule with exponent H divided by one minus H."),
        L("With H at one half, that exponent is one: if the free capacity on a line is halved, the buffer has to double. With H at 0.8 the exponent is four: halving the free capacity makes the buffer grow sixteen times. Norros drew the conclusion for design: a bigger buffer cannot make it safe to run a line nearly full. He added that traffic without long memory hardly ever fills a large buffer, which means that only traffic with memory does."),
        L("In 1995 two other researchers checked long-distance networks with 24 recordings and found the same failure. The moments when people started sessions did follow the Poisson model, but the packets inside the sessions did not. The standard models seriously underestimated the burstiness over a wide range of time scales."),
      ],
    },
    {
      heading: L("Where the bursts come from, and what happened next"),
      paragraphs: [
        L("The cause was found within two years, and it is a Noah effect, the name Mandelbrot gave to rare events so large that they outweigh all the ordinary ones. The sizes of the files people send have a heavy tail: most files are small and a few are enormous. A source that switches between sending and resting, for stretches whose lengths have such a heavy tail, produces exactly the self-similar traffic that was measured when many such sources are added together. The memory in the traffic is the memory of one long file transfer still running."),
        L("What network engineers do with this today is as follows. The self-similar model is in the textbooks. Its authors, looking back after twenty-five years, called the property ubiquitous in internet traffic to date. But the buffers of the large routers at the core of the internet are sized by a different rule. It comes from the behaviour of the transmission protocol, the set of rules that slows senders down when packets are lost. The rule: bandwidth, how much data the line carries per second, times round-trip time, how long a packet takes to go and an answer to come back, divided by the square root of the number of flows, the separate conversations sharing the line. The fractal measurement changed what everyone knew about the shape of traffic. The design rule that won was built around the protocol that reacts to it."),
      ],
    },
  ],
  limits: [
    L("The Hurst estimates above come from one office network in 1989 to 1992. Long-distance and modern traffic has been measured many times since, with exponents that vary. The piece quotes the founding measurement, not a survey."),
    L("Norros's buffer rule is for an idealised model with an infinite buffer and a single line. Real routers carry many flows under a protocol that changes how they behave. This is why the design rule in use is a different one."),
    L("That the authors of the original paper call the property ubiquitous is their judgement in a look back published in 2019, not a measurement in that paper."),
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
  question: L("Can one antenna listen on five frequencies at once?"),
  lede: L("An antenna is a piece of metal that catches radio waves, and it works best when its length matches the wave. A shape that repeats itself at several sizes can match several waves. For a decade that idea sat inside most mobile phones. What it gained, and what it did not, has been measured."),
  sections: [
    {
      heading: L("Why an antenna has a size"),
      paragraphs: [
        L("A radio wave has a length: the distance from one crest of the wave to the next. The number of crests passing each second is called the frequency. A signal at 900 million cycles a second has a wavelength of about a third of a metre. At 1,800 million cycles a second the wavelength is half that. A straight wire catches a wave best when its length is a simple fraction of the wavelength, a quarter or a half. This is why an old car radio had a rod a metre long. By the same reasoning, a phone that must work on five different bands of frequencies would need five different wires, each cut to its own band."),
        L("Space inside a phone is the scarcest thing there is. So the question is whether one shape can have the right length for several waves at once."),
      ],
    },
    {
      heading: L("A triangle that contains itself"),
      paragraphs: [
        L("The Sierpinski triangle is a filled triangle with its middle triangle cut out, then the middle cut out of each of the three triangles that remain, and so on. The result is made of three copies of itself at half the size, and each of those is made of three more. Cut out of copper and connected to the signal at its lower corner, this shape becomes an antenna that contains a whole triangle, a half-size triangle, a quarter-size one and an eighth-size one, all at once."),
        L("In 1996 a group in Barcelona built one, 8.9 centimetres tall with five levels of cutting, and measured what it did. It resonated in five bands: it responded strongly to five ranges of frequency. The bands were spaced by a factor of two, exactly the factor by which the triangle shrinks from one level to the next. A version connected as a dipole, an antenna made of two halves, was measured at 2, 4, 8 and 16 thousand million cycles a second and behaved alike at each. The repetition in the shape had become a repetition in the frequencies."),
        L("The same group then took the Koch curve. It is made by replacing the middle third of a straight segment with two sides of a small triangle, and repeating this on every piece; three such curves make the edge of a snowflake. They bent a 6 centimetre wire into this curve with one fold, then two, up to five. The height never changed, but each fold made the wire four thirds as long. With each fold the antenna resonated at a longer wavelength than a straight 6 centimetre wire could. The result was a longer antenna in the same space."),
      ],
    },
    {
      heading: L("What the measurements said, and what a sceptic said"),
      paragraphs: [
        L("The effects are real and were measured: several bands from one shape, and a lower resonance from a folded one. The first patent application on fractal antennas for wireless communication was filed in 1995 by the leader of the Barcelona group. From 2001 his company licensed antennas of these shapes, called multilevel and space-filling, for use in phones. In 2011 a court in Texas found that the phones of a major maker infringed four of those patents. For most of the 2000s the wiggly strip of metal inside the top of a phone was a descendant of the Sierpinski triangle."),
        L("In 2003 an antenna engineer asked the obvious next question: does the fractal shape do the work, or only the length of the wire? He built wires that were not fractals, with the same total length and the same enclosed area, and found that they performed as well or better. He concluded that fractal geometry alone is not the significant factor. A standard handbook on small antennas agreed: fractal antennas show no advantage over a thick dipole, a loaded dipole (one made to act longer than it is) or a loop. The fractal shape is one way of fitting a long wire and several resonances into a small space, and there are others."),
      ],
    },
    {
      heading: L("What is in a phone now"),
      paragraphs: [
        L("Mostly not a fractal. The usual internal antenna of a modern phone is a folded metal plate called a planar inverted-F antenna. The newest phones use the metal rim of the case itself, retuned electronically as the bands change. The fractal antenna's decade was the 2000s."),
        L("What remains is the idea that the measurements confirmed: a shape that repeats at several scales responds at several scales. The Sierpinski triangle cut from copper is the clearest demonstration of this ever made. The sceptic's result adds the needed correction: the repeating shape was one way to fit a long wire into a small space, not the only one."),
      ],
    },
  ],
  limits: [
    L("The exact centres of the bands of the 1998 antenna, and the percentage by which the Koch folds lowered the resonance, are given in figures that could not be read as text during the research. The piece states the factor-of-two spacing and the direction of the shift, which the sources state in words."),
    L("The claim that antennas derived from fractals were in most phones of the 2000s rests on the licensing company's own statements and on court records. No independent market share was found."),
    L("That current phones do not use fractal antennas comes from the industry press and standard references on phone antennas, not from a survey of every model."),
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
