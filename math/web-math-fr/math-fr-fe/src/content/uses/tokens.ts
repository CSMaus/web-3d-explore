import type { Piece } from "./kinds";
import { L } from "@/lib/lang";

export const TRANSLATION: Piece = {
  id: "translation",
  topic: "tokens",
  question: L("Why is a translation written rather than looked up?"),
  lede: L("A dictionary matches words to words, and a sentence translated word by word reads badly. Since 2014 machines have translated differently: they read a sentence into a list of numbers and write a new sentence from it, one token at a time. A token is a piece of text, such as a word or part of a word. In 2016 a system in everyday use cut its errors by more than half this way."),
  sections: [
    {
      heading: L("Why looking words up fails"),
      paragraphs: [
        L("Take a sentence, replace each word by its dictionary entry in another language, and read the result. The words are right and the sentence is wrong. The word order is that of the first language, the endings do not agree, and a word with two meanings gets the wrong one. A translation is not a swap of words. It is a new sentence with the same meaning, and writing it needs the whole meaning first."),
        L("The systems of the 2000s did better than a dictionary. They memorised phrases: pairs of short chunks that had appeared together in millions of translated documents. Then they stitched the best chunks together. They worked well, but they had stopped getting better."),
      ],
    },
    {
      heading: L("Read the whole sentence, then write"),
      paragraphs: [
        L("In 2014 a research group showed another approach. It uses neural networks: programs made of many simple units that learn from examples. One network reads the sentence token by token and updates a list of numbers as it goes, until the whole sentence is held in that list. A second network then writes a sentence in the other language, token by token. It chooses each token from that list and from the tokens it has already written. Nothing is looked up. The output is generated, the way a language model writes text one token at a time, except that here the writing is guided by what was read."),
        L("The first such system beat the phrase system on a standard test by a point and a half. Its authors also found something odd that says something about memory: reversing the order of the input words improved the results a great deal. The reversal put the start of the sentence, which the writer needs first, closest to the moment of writing."),
      ],
    },
    {
      heading: L("Tokens that are not words"),
      paragraphs: [
        L("The pieces the machine reads and writes are tokens, and they are not words. A vocabulary, the list of every piece the system knows, holding every word of two languages would be enormous and would still miss names and rare forms. So the system of 2016 cut words into pieces called wordpieces, between 8,000 and 32,000 of them. They were chosen so that common words are one piece and rare words are several: the word Jet becomes two pieces, J and et, and feud becomes fe and ud. A word never seen before is still spelled from pieces that have been seen."),
        L("People compared pairs of translations side by side, one from the phrase system and one from the 2016 system. On simple sentences, the 2016 system made 60 per cent fewer errors on average. Its makers reported cuts of 55 to 85 per cent on sentences sampled from the web, across several pairs of languages. That year it took over every translation from Chinese to English, about 18 million a day."),
      ],
    },
    {
      heading: L("Paying attention to the right word"),
      paragraphs: [
        L("The reading network had to squeeze a whole sentence into one list of numbers, and long sentences did not fit. The fix was attention: while writing each token, the writer looks back at every token of the original sentence and gives each a weight, a share of how much it counts at that moment. In 2017 a design built only from attention set the records on the two standard tests. The score on each test measures how close the machine's translations come to translations made by people: 28.4 from English to German and 41.8 from English to French. It needed three and a half days of training on eight processors. Every language model since has been built on that design."),
        L("A translation is written because meaning lies not in single words but in how they are arranged. A machine that has read the arrangement into numbers can write a new arrangement in another language. This one job uses everything the tokens topic of this site covers: cutting text into tokens, turning them into numbers, attention, and writing one token at a time."),
      ],
    },
  ],
  limits: [
    L("The scores quoted are on standard test sets of news text. Results on other kinds of text and on less common pairs of languages differ."),
    L("The 60 per cent figure comes from people judging single simple sentences side by side. The 55 to 85 per cent range comes from the makers' launch announcement, on sentences sampled from the web. The two figures measure different things."),
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
  question: L("What is a program to a model that has only read?"),
  lede: L("A program is text. A language model is a program that has learned from a great deal of text to predict the next token, a piece of text such as a word. So it can also predict the next token of a program. In 2021 such a model, trained on public code, solved 29 of 100 new programming problems on its first try. A controlled experiment a year later measured what that does for a working programmer."),
  sections: [
    {
      heading: L("Code is a string of tokens"),
      paragraphs: [
        L("A language model starts by cutting text into tokens. A program can be cut the same way: keywords, names, brackets and numbers, in an order with rules. It is a language with a stricter grammar than English, and with words that programmers invent as they go. To a model, predicting the next word of a sentence and the next token of a program differ only in which text it has read."),
        L("In 2021 a language model was trained further on the code that is publicly available on a large code hosting service. Then it was tested on 164 short programming problems, none seen before. Each problem was a description in words plus a set of checks that a correct answer must pass. Asked once for each problem, it produced a working program 28.8 times in a hundred. A model of the same size trained on ordinary text scored zero. Given a hundred attempts at each problem, at least one worked 70 times in a hundred."),
      ],
    },
    {
      heading: L("In the editor"),
      paragraphs: [
        L("In June 2021 a version of that model was built into an editor, the program in which code is written. As the programmer typed, it offered the next line, or a whole function, the way a phone offers the next word. The offer comes from the same loop that writes any text: the code typed so far is the start, and the suggestion is what the model expects to follow."),
        L("A year later the makers ran an experiment to measure the effect rather than ask about it. Ninety-five professional programmers were recruited and given one task: write a small web server in a common programming language, with the checks it had to pass. Forty-five had the assistant and fifty did not. Those with it finished in 71 minutes on average; those without, in 161. The difference, 55.8 per cent less time, held up statistically, though the range of plausible values was wide, from about a fifth to nearly nine tenths. Asked afterwards how much faster they thought they had been, the participants guessed about a third. The clock said more."),
      ],
    },
    {
      heading: L("What it is not"),
      paragraphs: [
        L("The model has read code. It has not run it, and it knows what the program is for only from what the tokens say. 29 in 100 working on the first try means 71 that did not, and a suggestion that looks like working code is the hardest kind to check. The experiment measured speed on a task whose checks were given. It did not measure whether the programs were the ones a careful engineer would have written."),
        L("In short, a model of the next token is a model of what usually follows, in whatever text it has read. Shown enough programs, it predicts programs. A programmer who knows that this is what it does gets an hour back on a task like the one in the experiment."),
      ],
    },
  ],
  limits: [
    L("The 28.8 per cent is on one test of 164 short problems in the Python programming language, at the time of the paper. Later models and tests give different figures."),
    L("The productivity experiment used one task, one language and the 70 participants who completed it, most aged 25 to 34. The range of plausible values for the time saved runs from 21 to 89 per cent."),
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
  question: L("How can a search find a page that uses none of the words?"),
  lede: L("Search engines once matched words, so a page about the same thing in other words was not found. Text can instead be turned into a point in a space where position stands for meaning. Then two texts about the same thing land close together, whatever words they use. Since 2019 one search in ten has been read that way."),
  sections: [
    {
      heading: L("Matching words"),
      paragraphs: [
        L("The oldest way to search is to find the pages that contain the words typed. It works when the words match and fails when they do not: a search for a doctor for a sore throat misses the page that says physician and pharyngitis. A word carries meaning, but the same meaning can be carried by other words, and a word matcher does not know that."),
        L("An embedding turns each token, and then each whole text, into a list of numbers. A token is a piece of text, such as a word. The list can be seen as a point in a space with hundreds of directions. The points are placed so that texts with similar meanings sit near each other. Distance in that space then measures meaning, whatever words were used."),
      ],
    },
    {
      heading: L("Searching by distance"),
      paragraphs: [
        L("In 2019 a method was published for turning a whole sentence into one such point, so that two sentences can be compared by the angle between their points. Finding the most similar pair among 10,000 sentences had taken 65 hours, by asking a model about every pair. With each sentence placed once, it took about five seconds. Search became a matter of geometry."),
        L("In 2020 the same idea was used to find the passage that answers a question. One network places every passage of a collection, another places the question, and the answer is the nearest passage. On standard sets of questions, this found the right passage among its top twenty between 9 and 19 percentage points more often than the best word-matching method."),
      ],
    },
    {
      heading: L("One query in ten"),
      paragraphs: [
        L("The largest search engine began using a language model to read queries in October 2019. A language model is a program trained on a great deal of text to predict what comes next. It read about one in ten English searches in the United States, and the engine called it the biggest leap forward in five years. Its example was the query 2019 brazil traveler to usa need a visa. A word matcher treats to as noise and returns pages about Americans travelling to Brazil. A model that reads how the words are arranged knows that to sends the traveller to the United States, and returns the visa page for Brazilians."),
      ],
    },
    {
      heading: L("What the space is"),
      paragraphs: [
        L("Nobody wrote down what words mean. The points were placed by training on text, so that tokens that appear in similar places in sentences ended up in similar places in the space. The arrangement that came out of that training is one where distance follows meaning closely enough to find a page that uses none of the words searched for. A search now runs through such a space, where words gather by what they are about."),
      ],
    },
  ],
  limits: [
    L("The one-in-ten figure is the engine's own statement at launch, for English queries in one country. How it is used now is not published in that detail."),
    L("The gains in finding passages are measured on standard question-answering collections. A general web search mixes this with many other signals."),
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
  question: L("How does a mailbox know which mail to throw away?"),
  lede: L("The oldest job a machine has done on text is deciding whether a message is wanted. In 1998 the answer was to count words and weigh them. In 2002 it was to weigh every token, every piece of the message. Today, at the largest mail service, more than 999 in 1,000 unwanted messages never reach a mailbox. The whole history of how machines read text is in this one job."),
  sections: [
    {
      heading: L("Words as evidence"),
      paragraphs: [
        L("A message about a free offer is more likely junk than a message about a meeting. Not certainly, only more likely. In 1998 a group at a university and a software company built a filter on exactly that. For each word of a message, it asked how often that word had appeared in junk and how often in wanted mail, then combined those odds. This is weighing evidence, done with probabilities: a probability is a number from 0 to 1 that says how likely something is. They added about 35 hand-picked phrases such as FREE! and only dollar, and 20 facts about the message itself. Junk mail, they noted, is almost never sent from a university address."),
        L("On 1,789 messages, of which 1,578 were junk, words alone caught 94 per cent of the junk, and when they called a message junk they were right 97 per cent of the time. With the phrases and the facts added, they were right every time and caught 98 per cent. The filter called a message junk only when it was more than 99.9 per cent sure, because losing a real message costs far more than reading one advertisement."),
      ],
    },
    {
      heading: L("Every token weighed"),
      paragraphs: [
        L("In 2002 a programmer described a filter he ran on his own mail that dropped the hand-picking. Every token in a message counted, including the hidden headers and the formatting code. A token here is any piece of the message between spaces. The token madam scored 0.99, the code for bright red text scored 0.99, the word continuation scored 0.01. For each message he took the fifteen tokens whose scores were furthest from a half, combined them, and called the message junk above 0.9. It missed about five junk messages in a thousand and, on his mail, threw away none that were wanted."),
        L("His argument was this: a rule written by hand finds what its author thought of, while a filter that learns from the messages finds the patterns nobody would have listed, and moves as the junk moves."),
      ],
    },
    {
      heading: L("From words to tokens to models"),
      paragraphs: [
        L("The tokens of 1998 and 2002 were whole words, or whatever sat between spaces. The tokens of today's language models are smaller and learned: a vocabulary of pieces is built from a text, so that a word never seen before is still spelled from pieces that have been seen. A junk sender who writes fr.ee to dodge a word filter has only spelled the same pieces with a dot between them. Filters then stopped counting tokens one by one and started reading them in order, so that the meaning of a phrase is more than the sum of its words."),
        L("The largest mail service reported in 2019 that it blocks more than 99.9 per cent of the junk, fraud and malicious mail sent to its 1.5 billion users, and that newly trained models were catching about a hundred million more messages a day than the previous ones. The counting of 1998 is still in there, under layers of everything that came after it."),
      ],
    },
  ],
  limits: [
    L("The 1998 and 2002 results come from their authors' own small collections of mail. The numbers are what they measured, not general rates."),
    L("The 99.9 per cent is the service's own statement. It does not say how many wanted messages are wrongly caught."),
  ],
  sources: [
    { label: "Sahami, Dumais, Heckerman, Horvitz, A Bayesian approach to filtering junk e-mail, AAAI workshop, 1998", url: "https://cdn.aaai.org/Workshops/1998/WS-98-05/WS98-05-009.pdf" },
    { label: "Graham, A plan for spam, 2002", url: "https://paulgraham.com/spam.html" },
    { label: "Sennrich, Haddow, Birch, Neural machine translation of rare words with subword units, ACL 2016", url: "https://arxiv.org/abs/1508.07909" },
    { label: "Kumaran, Ridding Gmail of 100 million more spam messages with TensorFlow, Google Workspace blog, 2019", url: "https://workspace.google.com/blog/product-announcements/ridding-gmail-of-100-million-more-spam-messages-with-tensorflow" },
  ],
};
