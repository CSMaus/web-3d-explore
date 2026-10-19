import type { Piece } from "./kinds";

export const TRANSLATION: Piece = {
  id: "translation",
  topic: "tokens",
  question: "Why is a translation written rather than looked up?",
  lede: "A dictionary maps words to words, and a sentence translated that way is a joke. Since 2014 machines have translated by reading a sentence into numbers and writing a new sentence out of them one token at a time, and in 2016 a production system cut its errors by more than half that way.",
  sections: [
    {
      heading: "Why lookup fails",
      paragraphs: [
        "Take a sentence, replace each word by its dictionary entry in another language, and read the result. The words are right and the sentence is wrong: the order is the old language's, the endings do not agree, and any word with two meanings has the wrong one. A translation is not a substitution. It is a new sentence that means the same thing, and writing it needs the whole meaning first.",
        "The systems of the 2000s did better than a dictionary by memorising phrases, pairs of chunks that had appeared together in millions of translated documents, and stitching the best chunks together. They were good and they were stuck.",
      ],
    },
    {
      heading: "Read it all in, write it all out",
      paragraphs: [
        "In 2014 a group showed a different shape. One network reads the sentence token by token, updating a list of numbers as it goes, until the whole sentence has been read into that list. A second network then writes, token by token, a sentence in the other language, each token chosen from the list and from the tokens it has already written. Nothing is looked up. The output is generated, the way the loop page of the tokens topic generates text, except that the loop is steered by the reading.",
        "The first such system beat the phrase system on a standard test by a point and a half, and its authors found a curiosity that says something about memory: reversing the order of the input words improved it markedly, because it put the beginning of the sentence, which the writer needs first, closest to the moment of writing.",
      ],
    },
    {
      heading: "Tokens that are not words",
      paragraphs: [
        "The pieces the machine reads and writes are the tokens of this topic, and they are not words. A vocabulary of every word in two languages is enormous and still misses names and rare forms. So the production system of 2016 cut words into wordpieces, between 8,000 and 32,000 of them, chosen so that common words are one piece and rare words are several: the word Jet becomes two pieces, J and et, and feud becomes fe and ud. A word never seen is still spelled from pieces that have been.",
        "Measured against the phrase system by people judging pairs of translations side by side, the 2016 system reduced errors by an average of 60 per cent on simple sentences, and its makers reported cuts of 55 to 85 per cent on sampled sentences from the web across several language pairs. It took over every translation from Chinese to English that year, about 18 million a day.",
      ],
    },
    {
      heading: "Listening to the right word",
      paragraphs: [
        "The reading network had to squeeze a whole sentence into one list of numbers, and long sentences overflowed it. The fix was the attention of the words page: while writing each token, the writer looks back at every token of the source and decides which ones to listen to now. In 2017 a design made of nothing but that attention set the records on the two standard tests, 28.4 English to German and 41.8 English to French, after three and a half days of training on eight processors, and became the shape every language model since has taken.",
        "A translation is written because meaning is not in the words but in their arrangement, and a machine that has read the arrangement into numbers can write a new arrangement out. That is the tokens topic in one job.",
      ],
    },
  ],
  limits: [
    "The scores quoted are on standard test sets of news text; performance on other kinds of text and on less common language pairs differs.",
    "The 60 per cent figure is from human side-by-side judgement of isolated simple sentences; the 55 to 85 per cent range is from the makers' launch announcement on sampled web sentences, and the two measure different things.",
  ],
  sources: [
    { label: "Sutskever, Vinyals, Le, Sequence to sequence learning with neural networks, NeurIPS 2014", url: "https://arxiv.org/abs/1409.3215" },
    { label: "Wu and colleagues, Google's neural machine translation system, 2016", url: "https://arxiv.org/abs/1609.08144" },
    { label: "Le and Schuster, A neural network for machine translation, at production scale, Google Research blog, 2016", url: "https://research.google/blog/a-neural-network-for-machine-translation-at-production-scale/" },
    { label: "Sennrich, Haddow, Birch, Neural machine translation of rare words with subword units, ACL 2016", url: "https://arxiv.org/abs/1508.07909" },
    { label: "Vaswani and colleagues, Attention is all you need, NeurIPS 2017", url: "https://arxiv.org/abs/1706.03762" },
  ],
};

export const CODE: Piece = {
  id: "code",
  topic: "tokens",
  question: "What is a program to a model that has only read?",
  lede: "A program is text, and a model that predicts the next token of text can predict the next token of a program. In 2021 one trained on public code solved 29 of 100 fresh programming problems on its first try, and a controlled experiment a year later measured what that does to a working programmer.",
  sections: [
    {
      heading: "Code is a string of tokens",
      paragraphs: [
        "Every page of this topic began with a line of text cut into tokens. A program is such a line: keywords, names, brackets and numbers, in an order with rules. It is a language with a stricter grammar than English and a vocabulary that programmers invent as they go. To a model, the difference between predicting the next word of a sentence and the next token of a function is only which text it has read.",
        "In 2021 a language model was taken and trained further on the code publicly available in a large hosting service. Then it was given a test: 164 short programming problems, each a description in words and a set of checks the answer must pass, none seen before. Asked once for each, it produced a working program 28.8 times in a hundred. The same size of model trained on ordinary text scored zero. Given a hundred attempts at each problem, at least one worked 70 times in a hundred.",
      ],
    },
    {
      heading: "In the editor",
      paragraphs: [
        "A version of that model was put behind a programmer's editor in June 2021, offering the next line, or a whole function, as the programmer typed, in the way a phone offers the next word. The offer comes from the loop of the generation page: the tokens typed so far are the prompt, and the suggestion is what the model expects to follow them.",
        "A year later the makers ran an experiment to measure it rather than ask about it. Ninety-five professional programmers were recruited and given one task, to write a small web server in a common language, with the checks it had to pass. Forty-five had the assistant and fifty did not. Those with it finished in 71 minutes on average; those without in 161. The difference, 55.8 per cent less time, held up statistically, though the range of plausible values was wide, from about a fifth to nearly nine tenths. Asked afterwards how much faster they thought they had been, the participants guessed about a third; the clock said more.",
      ],
    },
    {
      heading: "What it is not",
      paragraphs: [
        "The model has read code. It has not run it, and it does not know what the program is for beyond what the tokens say. The 29 in 100 that worked on the first try means 71 that did not, and a suggestion that reads like working code is the hardest kind to check. The experiment measured speed on a task whose checks were given; it did not measure whether the resulting programs were the ones a careful engineer would have written.",
        "The honest summary is the one this topic has built towards: a model of the next token is a model of what usually follows, in whatever text it has read. Shown enough programs, it predicts programs, and a programmer who knows that is what it is doing gets an hour back.",
      ],
    },
  ],
  limits: [
    "The 28.8 per cent is on one benchmark of 164 short Python problems at the time of the paper; later models and benchmarks give different figures.",
    "The productivity experiment used one task, one language and 70 participants who completed it, most aged 25 to 34; its confidence interval runs from 21 to 89 per cent.",
  ],
  sources: [
    { label: "Chen and colleagues, Evaluating large language models trained on code, 2021", url: "https://arxiv.org/abs/2107.03374" },
    { label: "Friedman, Introducing GitHub Copilot, GitHub blog, 2021", url: "https://github.blog/news-insights/product-news/introducing-github-copilot-ai-pair-programmer/" },
    { label: "Peng, Kalliamvakou, Cihon, Demirer, The impact of AI on developer productivity: evidence from GitHub Copilot, 2023", url: "https://arxiv.org/abs/2302.06590" },
  ],
};

export const SEARCH: Piece = {
  id: "search",
  topic: "tokens",
  question: "How can a search find a page that uses none of the words?",
  lede: "A search engine once matched words, so a page about the same thing in other words was invisible. When text is turned into a point in a space of meanings, two texts about the same thing land close together whatever words they used, and since 2019 one search in ten has been read that way.",
  sections: [
    {
      heading: "Matching words",
      paragraphs: [
        "The oldest way to search is to find pages containing the words typed. It works when the words match and fails when they do not: a search for a doctor for a sore throat misses the page that says physician and pharyngitis. A word carries meaning, but the same meaning can be carried by other words, and the matcher does not know that.",
        "The space page of this topic showed what an embedding is: each token, and then each text, becomes a list of numbers, a point in a space with hundreds of directions, placed so that texts that mean similar things sit near each other. Distance in that space is a measure of meaning, and it does not care which words were used.",
      ],
    },
    {
      heading: "Searching by distance",
      paragraphs: [
        "In 2019 a method was published for turning a whole sentence into one such point so that two sentences can be compared by the angle between their points. Finding the most similar pair among 10,000 sentences had taken 65 hours by asking a model about every pair; with each sentence placed once, it took about five seconds. Search became geometry.",
        "In 2020 the same idea was applied to finding the passage that answers a question: one network places every passage in a collection, another places the question, and the answer is the nearest passage. On standard question sets this found the right passage in its top twenty between 9 and 19 points more often than the best word-matching method.",
      ],
    },
    {
      heading: "One query in ten",
      paragraphs: [
        "The largest search engine began using a language model to read queries in October 2019, on about one in ten English searches in the United States, calling it the biggest leap forward in five years. The example it gave was the query 2019 brazil traveler to usa need a visa. A word matcher treats to as noise and returns pages about Americans travelling to Brazil. A model that reads the arrangement knows that to points the traveller at the United States, and returns the visa page for Brazilians.",
      ],
    },
    {
      heading: "What the space is",
      paragraphs: [
        "Nothing was defined about meaning. The points were placed by training on text, so that tokens which appear in the same kinds of places ended up in the same kinds of places, and the arrangement that fell out of that is one where distance tracks meaning well enough to find a page that used none of the words. The space page's picture, with words clustering by what they are about, is the thing a search now runs through.",
      ],
    },
  ],
  limits: [
    "The one-in-ten figure is the engine's own statement at launch, for English queries in one country; how it is used now is not published in that detail.",
    "The retrieval gains are on standard question-answering collections; a general web search mixes this with many other signals.",
  ],
  sources: [
    { label: "Reimers and Gurevych, Sentence-BERT: sentence embeddings using siamese BERT networks, EMNLP 2019", url: "https://aclanthology.org/D19-1410/" },
    { label: "Karpukhin and colleagues, Dense passage retrieval for open-domain question answering, EMNLP 2020", url: "https://arxiv.org/abs/2004.04906" },
    { label: "Nayak, Understanding searches better than ever before, Google blog, 2019", url: "https://blog.google/products-and-platforms/products/search/search-language-understanding-bert/" },
  ],
};

export const SPAM: Piece = {
  id: "spam",
  topic: "tokens",
  question: "How does a mailbox know which mail to throw away?",
  lede: "The oldest job done on text by machine is deciding whether a message is wanted. In 1998 the answer was to count words and weigh them; in 2002 it was every token weighed; today more than 999 in 1,000 unwanted messages never reach a mailbox at the largest service. The whole history of this topic is in that one job.",
  sections: [
    {
      heading: "Words as evidence",
      paragraphs: [
        "A message about a free offer is more likely junk than a message about a meeting. Not certain, just more likely. In 1998 a group at a university and a software company built a filter on exactly that: take the words of a message, and for each word ask how often it appeared in junk and how often in wanted mail, then combine those odds. This is the perceptron's idea from the networks topic, weighing evidence, done with probabilities. They added about 35 hand-picked phrases such as FREE! and only dollar, and 20 facts about the message itself: junk mail, they noted, is virtually never sent from a university address.",
        "On 1,789 messages, of which 1,578 were junk, words alone caught 94 per cent of the junk and were right 97 per cent of the time when they cried junk. With the phrases and the facts added, they were right every time and caught 98 per cent. The filter was set to call a message junk only when it was more than 99.9 per cent sure, because losing a real message costs far more than reading one advertisement.",
      ],
    },
    {
      heading: "Every token weighed",
      paragraphs: [
        "In 2002 a programmer described a filter he ran on his own mail that dropped the hand-picking. Every token in a message counted, including the ones in the hidden headers and the formatting code: the token madam scored 0.99, the code for bright red text scored 0.99, the word continuation scored 0.01. For each message he took the fifteen tokens whose scores were furthest from a half, combined them, and called junk above 0.9. It missed about five junk messages in a thousand and, on his mail, threw away none that were wanted.",
        "His argument was the argument of this whole site's networks topic: a rule written by hand finds what its author thought of, while a filter that learns from the messages finds the patterns nobody would have listed, and moves as the junk moves.",
      ],
    },
    {
      heading: "From words to tokens to models",
      paragraphs: [
        "The tokens of 1998 and 2002 were whole words, or whatever sat between spaces. The tokens of this topic are smaller and learned: the merging page built a vocabulary of pieces from a text, so that a word never seen is still spelled from pieces that have been, and a junk sender who writes fr.ee to dodge the word filter has only spelled the same pieces with a dot between. Filters then stopped counting tokens independently and started reading them in order, the way every page after the table page did, so that the meaning of a phrase is more than the sum of its words.",
        "The largest mail service reported in 2019 that it blocks more than 99.9 per cent of the junk, fraud and malicious mail sent to its 1.5 billion users, and that newly trained models were catching about a hundred million more messages a day that the previous ones had missed. The counting of 1998 is still in there, under layers of everything this topic has covered.",
      ],
    },
  ],
  limits: [
    "The 1998 and 2002 results are on their authors' own small collections of mail; the numbers are what they measured, not general rates.",
    "The 99.9 per cent is the service's own statement and does not report how many wanted messages are wrongly caught.",
  ],
  sources: [
    { label: "Sahami, Dumais, Heckerman, Horvitz, A Bayesian approach to filtering junk e-mail, AAAI workshop, 1998", url: "https://cdn.aaai.org/Workshops/1998/WS-98-05/WS98-05-009.pdf" },
    { label: "Graham, A plan for spam, 2002", url: "https://paulgraham.com/spam.html" },
    { label: "Sennrich, Haddow, Birch, Neural machine translation of rare words with subword units, ACL 2016", url: "https://arxiv.org/abs/1508.07909" },
    { label: "Kumaran, Ridding Gmail of 100 million more spam messages with TensorFlow, Google Workspace blog, 2019", url: "https://workspace.google.com/blog/product-announcements/ridding-gmail-of-100-million-more-spam-messages-with-tensorflow" },
  ],
};
