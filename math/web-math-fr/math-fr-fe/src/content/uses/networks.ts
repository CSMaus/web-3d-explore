import type { Piece } from "./kinds";

export const POSTCODES: Piece = {
  id: "postcodes",
  topic: "networks",
  question: "Who read the postcodes on the mail?",
  lede: "Sorting the post means reading a handwritten number on every envelope, millions of times a day, and no rule anyone could write down did it well. The first network to do a job in the world did this one, and by the late 1990s a descendant of it was reading more than a tenth of the cheques in the United States.",
  sections: [
    {
      heading: "Why a rule fails",
      paragraphs: [
        "A nine has a loop at the top and a stroke down the right. Write that as a rule and the first envelope breaks it: a nine with the loop open, a four that looks like a nine, a seven with a crossbar. Every rule added to catch one hand fails another. The fractals topic measured a coast; this one is about a job that a person does without effort and that no list of rules could do at all.",
        "The alternative, the whole idea of the networks topic, is not to write the rule but to learn it: show the machine thousands of digits with their answers, and let it adjust its numbers until it gets them right.",
      ],
    },
    {
      heading: "Nine thousand digits from Buffalo",
      paragraphs: [
        "In 1989 a group at a telephone company's research laboratory took 9,298 digits cut from real postcodes on real mail passing through the post office in Buffalo, New York. They trained on 7,291 of them and kept 2,007 back to test on. The network had 4,635 units and 98,442 connections, but only 2,578 numbers to learn, because the same small detector was slid across the whole image and reused at every position. That reuse is the convolution of the pictures page, and this was among its first uses.",
        "On the digits it had never seen the network was wrong 3.4 times in a hundred. Given the right to refuse a digit it was unsure of, and refusing 9 of every 100 handwritten digits, it was wrong once in a hundred, which is the level at which a machine can be trusted to sort mail with a person handling the refusals. Half its errors turned out to come from digits badly cut out of the postcode, a quarter from digits labelled wrongly by the people who prepared the data.",
      ],
    },
    {
      heading: "From a tenth of a per cent to a tenth of the country",
      paragraphs: [
        "The digits became a standard test, 60,000 to train on and 10,000 to test, and the same group's network of 1998 was wrong 0.95 times in a hundred on it, 0.8 when the training digits were also shown stretched and skewed. A straight line through the pixels, the perceptron of the first page, was wrong 12 times in a hundred; a plain three-layer network 3; a network built for pictures under 1.",
        "The job was cheques. A cheque carries a handwritten amount that a bank has to read, and the same group built a reader that a maker of banking machines put into service in American banks from June 1996. In its authors' words it read several million cheques a day; by the late 1990s, as one of them wrote later, over 10 per cent of all the cheques in the United States passed through it.",
      ],
    },
    {
      heading: "What was learned",
      paragraphs: [
        "Nobody wrote a rule for a nine. The network found its own, in the numbers it adjusted, and the rule it found handled hands its makers had never seen. That is the whole promise of the topic in one job: where a person cannot say how they do a thing, a machine can still be shown enough examples to do it.",
      ],
    },
  ],
  limits: [
    "The figure of 10 per cent of cheques is the one in a paper by the system's authors; a wider range sometimes quoted was not found in a primary source.",
    "The 1989 error rates are on digits already cut from the envelope; reading a whole address is a further problem the piece does not cover.",
  ],
  sources: [
    { label: "LeCun and colleagues, Handwritten digit recognition with a back-propagation network, NIPS 1989", url: "https://proceedings.neurips.cc/paper/1989/file/53c3bce66e43be4f209556518c2fcb54-Paper.pdf" },
    { label: "LeCun and colleagues, Backpropagation applied to handwritten zip code recognition, Neural Computation 1, 1989", url: "https://doi.org/10.1162/neco.1989.1.4.541" },
    { label: "LeCun, Bottou, Bengio, Haffner, Gradient-based learning applied to document recognition, Proceedings of the IEEE 86, 1998", url: "https://doi.org/10.1109/5.726791" },
    { label: "LeCun, Bengio, Hinton, Deep learning, Nature 521, 2015", url: "https://doi.org/10.1038/nature14539" },
  ],
};

export const SKIN: Piece = {
  id: "skin",
  topic: "networks",
  question: "Can a photograph tell a mole from a melanoma?",
  lede: "In 2017 a network trained on 129,450 photographs of skin was tested against 21 dermatologists on biopsy-proven cases and matched them. What it learned, what it did not, and why it is still not the thing a phone does, all turn on the pictures it was shown.",
  sections: [
    {
      heading: "The job",
      paragraphs: [
        "A melanoma is a skin cancer that kills if it is caught late and is nearly always cured if caught early. It looks like a mole. A dermatologist tells the two apart by eye and by a lens held to the skin, and the ones that cannot be told apart go for a biopsy, a small cut examined under a microscope. Most of the world has no dermatologist within reach, and nearly all of it has a phone with a camera.",
      ],
    },
    {
      heading: "A hundred and twenty-nine thousand pictures",
      paragraphs: [
        "A team at Stanford took a network that had already learned to see ordinary photographs and trained it further on 129,450 clinical images covering 2,032 skin conditions, giving it nothing but the pixels and the diagnosis. Then they tested it on two questions a dermatologist faces: is this the most common kind of skin cancer or a harmless growth that looks like it, and is this a melanoma or a mole. Every test image had been biopsied, so the truth was known.",
        "Twenty-one board-certified dermatologists answered the same images. The network's performance, measured as the trade-off between catching cancers and raising false alarms, was on a par with every one of them, and the summary number for that trade-off was above 91 per cent on every test. On the plots, most of the dermatologists' choices fell below the network's curve.",
      ],
    },
    {
      heading: "What the network was actually looking at",
      paragraphs: [
        "Here is where the piece has to slow down, because the interesting part came afterwards. A network learns whatever separates the two piles of pictures it is given, and the piles carry more than skin. Another group found that when dermatologists had drawn purple marks on the skin beside a suspicious lesion, a network's estimate that a harmless mole was a melanoma rose from 0.16 to 0.54, and its ability to clear harmless moles fell from 84 per cent to 46. The marks were a clue that a doctor had been worried, and the network had learned the clue rather than the cancer.",
        "The same team then added a small ruler to images, of the kind clinics photograph beside lesions to record their size, and a network approved for the market went from clearing 88 per cent of harmless cases to clearing between 0 and 44 per cent. Rulers appear more often next to lesions that worried someone. The network had learned that too.",
        "And a review of 70 such studies, using over a million images between them, found that only one in five described the race or ethnicity of the patients and one in ten reported skin tone. A network shown mostly pale skin has learned what melanoma looks like on pale skin.",
      ],
    },
    {
      heading: "Where it stands",
      paragraphs: [
        "The result of 2017 stands: on the pictures it was tested on, the network matched the experts. No evidence was found that this particular network was ever put into a clinic, and the first device the American regulator cleared to help find skin cancer, in 2024, reads how light scatters from the skin rather than a photograph. What the story teaches is the lesson of the pictures page in the networks topic, run at full scale: the machine finds whatever separates the piles, and it is the people who build the piles who decide whether that is the cancer or the ruler.",
      ],
    },
  ],
  limits: [
    "The per-task summary numbers are printed inside a figure in the paper and were not read as text; the piece states the paper's own sentence that each was over 91 per cent.",
    "The ruler and marking studies were done on other networks trained on similar data, not on the 2017 network itself.",
    "The statement that the 2017 network was not deployed is a statement that no evidence of deployment was found.",
  ],
  sources: [
    { label: "Esteva and colleagues, Dermatologist-level classification of skin cancer with deep neural networks, Nature 542, 2017", url: "https://doi.org/10.1038/nature21056" },
    { label: "Winkler and colleagues, Association between surgical skin markings in dermoscopic images and diagnostic performance of a deep learning convolutional neural network, JAMA Dermatology, 2019", url: "https://doi.org/10.1001/jamadermatol.2019.1735" },
    { label: "Winkler and colleagues, Association between different scale bars in dermoscopic images and diagnostic performance of a market-approved deep learning convolutional neural network, European Journal of Cancer, 2021", url: "https://doi.org/10.1016/j.ejca.2020.12.010" },
    { label: "Daneshjou, Smith, Sun, Rotemberg, Zou, Lack of transparency and potential bias in artificial intelligence data sets and algorithms, JAMA Dermatology 157, 2021", url: "https://doi.org/10.1001/jamadermatol.2021.3129" },
    { label: "FDA clears AI tool for detecting skin cancer, STAT News, 2024", url: "https://www.statnews.com/2024/01/17/fda-ai-skin-cancer-medical-device-dermasensor/" },
  ],
};

export const SPEECH: Piece = {
  id: "speech",
  topic: "networks",
  question: "How does a phone hear a word?",
  lede: "Speech arrives as a wave and leaves as text, and for thirty years the machine in between scored each slice of sound against a table of averages. In 2012 four laboratories replaced the table with a network and cut the errors by a third, and the next step was to give the network a memory.",
  sections: [
    {
      heading: "A wave, cut into slices",
      paragraphs: [
        "A microphone records air pressure many thousands of times a second. The first move in every speech recogniser is the one from the imaginary numbers topic: cut the wave into slices a few hundredths of a second long and take each apart into frequencies. A slice of the sound ah has a different pattern of frequencies from a slice of ee, and the recogniser's job is to say which sound each slice most likely is, then which words those sounds most likely spell.",
        "For thirty years the first half of that job was done by a table: for each speech sound, the average pattern of frequencies and how much it varies, fitted as a heap of bell curves. A slice was scored against every heap. It worked, and it plateaued, at word error rates around a quarter on natural telephone conversation.",
      ],
    },
    {
      heading: "The table replaced",
      paragraphs: [
        "In 2012 groups at Toronto, Microsoft, Google and IBM published together what each had found on its own: replace the table of bell curves with a network that takes several neighbouring slices in and gives the probabilities of every speech sound out. On a standard test of telephone conversations, 309 hours of them, the old system was wrong on 23.6 words in a hundred and the network on 16.1. On a phone's voice input the network reached 12.3, a fifth fewer errors than the best of the old kind. A system of the old kind trained on 2,000 hours and adapted to each speaker did about as well as the network trained on 309.",
        "The network was also fast enough to use: with its numbers rounded to eight bits it processed a second of speech in about a fifth of a second on an ordinary processor.",
      ],
    },
    {
      heading: "Why it needed a memory",
      paragraphs: [
        "A slice of sound does not stand alone. The mouth arriving at one sound is coming from the previous one, so the same vowel sounds different after different consonants, and a word is a sequence in which the end depends on the start. The sequence page of the networks topic showed why a plain loop forgets: each step overwrites the last. The gated memory cell on the same page was built for this problem.",
        "By 2015 the recognisers behind a large voicemail service and a voice search were such gated networks, reading the whole stretch of sound as a sequence and remembering, in their makers' words, the data they have seen so far, much as a listener interprets a word from the words before it. The voicemail service reported its transcription errors cut by 49 per cent when it switched. A related network had set the best recorded score on a standard phoneme test two years earlier.",
      ],
    },
    {
      heading: "What changed",
      paragraphs: [
        "Nothing about the sound changed, and the slicing into frequencies is the same as it was. What changed is that the part of the machine that decides which sound is which stopped being a table of averages and became something that had learned from hundreds of hours of speech, and then something that could hold the last few hundredths of a second in mind while deciding. The topic's two ideas, a network that learns and a memory that holds, are the two steps.",
      ],
    },
  ],
  limits: [
    "The 23.6 and 16.1 figures are on one benchmark of telephone conversation; the 12.3 is on a different task, voice input on a phone, and the two are not one improvement.",
    "The 49 per cent cut is the service's own statement about its own errors, not an independent measurement.",
  ],
  sources: [
    { label: "Hinton and colleagues, Deep neural networks for acoustic modeling in speech recognition, IEEE Signal Processing Magazine 29, 2012", url: "https://doi.org/10.1109/MSP.2012.2205597" },
    { label: "Graves, Mohamed, Hinton, Speech recognition with deep recurrent neural networks, ICASSP 2013", url: "https://arxiv.org/abs/1303.5778" },
    { label: "Beaufays, The neural networks behind Google Voice transcription, Google Research blog, 2015", url: "https://research.google/blog/the-neural-networks-behind-google-voice-transcription/" },
    { label: "Sak, Senior, Rao, Beaufays, Schalkwyk, Google voice search: faster and more accurate, Google Research blog, 2015", url: "https://research.google/blog/google-voice-search-faster-and-more-accurate/" },
  ],
};

export const PROTEINS: Piece = {
  id: "proteins",
  topic: "networks",
  question: "How does a string of letters become a shape?",
  lede: "Every protein in a body is a chain of a few hundred building blocks that folds itself into one particular shape in a fraction of a second, and the shape is what it does. Predicting the shape from the chain was an open problem for fifty years. In 2020 a network did it to the width of an atom.",
  sections: [
    {
      heading: "The fifty-year problem",
      paragraphs: [
        "A protein is written as a sequence of twenty kinds of building block, like a word in an alphabet of twenty letters, typically a few hundred letters long. In water the chain folds into a shape, and the shape is everything: a shape with a pocket binds a drug, a shape with a hinge opens a channel. In 1972 a Nobel lecture stated the principle that the sequence alone determines the shape. So in principle the shape can be computed from the letters.",
        "In practice the number of shapes a chain could take is about ten to the power three hundred, and checking them one by one would take longer than the age of the universe, yet a real protein folds in milliseconds. Meanwhile the shape had to be found by growing crystals and shooting X-rays through them, months to years of work for one protein. By 2020 about a hundred thousand shapes were known, against billions of sequences.",
      ],
    },
    {
      heading: "A test with the answers sealed",
      paragraphs: [
        "Every two years since 1994, laboratories that have just solved a shape but not yet published it hand the sequence to a competition, and prediction groups have months to guess the shape before it is revealed. The score compares the guess to the truth and runs from 0 to 100; around 90 is informally the level at which the guess is as good as a second measurement.",
        "In 2020 a network entered from a London laboratory scored a median of 92.4 across the targets. The next best group's summed score was less than half of it. Where the previous best method placed the chain's backbone within 2.8 angstroms of the truth on a typical target, the network placed it within 0.96, which is about the width of a single atom. The problem stated in 1972 was, for most proteins, answered.",
      ],
    },
    {
      heading: "What the network was given",
      paragraphs: [
        "Not the physics. The network was given sequences and, for a hundred thousand of them, the known shapes, and it learned the relation between the two. It also read, for each new sequence, its relatives across all living things: if two letters far apart in the chain have changed together through evolution, they are probably touching in the fold. The attention of the words page in the networks topic, where every position decides which other positions to listen to, is the mechanism that let a position in the chain attend to its distant partner.",
        "Then the shape was refined in steps, each pass adjusting the positions of the atoms and passing its estimate to the next, which is the network doing the job of the correction page many times over on one molecule.",
      ],
    },
    {
      heading: "Two hundred million shapes",
      paragraphs: [
        "The predictions were released for free. The database opened in 2021 with over 360,000 shapes for the proteins of twenty-one organisms, grew to over 200 million on a single day in July 2022, covering nearly every organism whose genome had been read, and passes 214 million now. Over half a million researchers from more than 190 countries used it in its first year.",
        "A shape found by X-rays took years. A shape predicted by the network takes minutes, and every biologist now starts from one. That is the size of the change a network made to a science, and it made it the way every page of this topic did: by being shown enough examples and moving its own numbers until the job was done.",
      ],
    },
  ],
  limits: [
    "The network's confidence varies along a chain, and some regions of some proteins have no fixed shape at all; the predictions carry a confidence score for that reason.",
    "The comparison numbers are the competition's summary statistics over its targets; individual targets scored higher and lower.",
    "How much of the result rests on the evolutionary relatives and how much on the learned physics is a question the field is still working out.",
  ],
  sources: [
    { label: "Jumper and colleagues, Highly accurate protein structure prediction with AlphaFold, Nature 596, 2021", url: "https://doi.org/10.1038/s41586-021-03819-2" },
    { label: "Jumper and colleagues, Applying and improving AlphaFold at CASP14, Proteins, 2021", url: "https://doi.org/10.1002/prot.26257" },
    { label: "AlphaFold: a solution to a 50-year-old grand challenge in biology, DeepMind, 2020", url: "https://deepmind.google/discover/blog/alphafold-a-solution-to-a-50-year-old-grand-challenge-in-biology/" },
    { label: "Varadi and colleagues, AlphaFold Protein Structure Database, Nucleic Acids Research 50, 2022", url: "https://doi.org/10.1093/nar/gkab1061" },
    { label: "AlphaFold predicts structure of almost every catalogued protein known to science, EMBL-EBI, 2022", url: "https://www.ebi.ac.uk/about/news/technology-and-innovation/alphafold-200-million/" },
    { label: "Varadi and colleagues, AlphaFold Protein Structure Database in 2024, Nucleic Acids Research, 2024", url: "https://doi.org/10.1093/nar/gkad1011" },
  ],
};
