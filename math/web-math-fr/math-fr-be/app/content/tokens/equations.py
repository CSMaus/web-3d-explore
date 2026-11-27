"""
the fourteen play pages of topic 4, with the mathematics each one moves. the
order is the reading order of story3: a string becomes tokens, tokens become
vectors, vectors are mixed across positions, and one token at a time becomes a
paragraph. the notes say what the page shows, not what a textbook proves.
"""

SYSTEMS = [
    {
        "id": "bytes",
        "name": "Three ways to count text",
        "summary": "A line of text counted three ways: the characters a reader sees, their numbers in Unicode, and the bytes a computer stores. In English the three counts agree, in most other languages they do not",
        "blocks": [
            {
                "label": "A code point",
                "tex": r"c \in \{0, 1, \ldots, \mathrm{10FFFF}_{16}\}",
                "note": "Unicode, the table of characters shared by all computers, gives each character a whole number, its code point. The largest is 10FFFF in base 16, a little over a million. The play page writes each code point as U+ and its number in base 16",
            },
            {
                "label": "Its bytes",
                "tex": r"\text{bytes}(c) = \begin{cases} 1 & c < 2^{7} \\ 2 & c < 2^{11} \\ 3 & c < 2^{16} \\ 4 & \text{otherwise} \end{cases}",
                "note": "UTF-8, the usual way to store Unicode text, writes a code point below 2 to the power 7, that is below 128, in one byte. Below 2 to the power 11 it uses two bytes, below 2 to the power 16 three bytes, and above that four. A byte is a whole number from 0 to 255. The first byte of a character tells how many bytes follow, and the play page shades each byte by this role",
            },
            {
                "label": "Two spellings, one letter",
                "tex": r"\text{e} + \text{U+0301} \neq \text{U+00E9}, \qquad \mathrm{NFC}(\cdot) \text{ makes them equal}",
                "note": "The letter é can be stored as one code point, U+00E9, or as the letter e followed by a separate accent, U+0301. The two look the same on screen but are different texts for a program. They become equal only after both are rewritten in one standard form, called NFC normalisation",
            },
        ],
        "dimension": {
            "label": "Why neither is the unit",
            "tex": r"|\text{bytes}| \gg |\text{words}|, \qquad |\text{alphabet}| \ll \text{what a row can carry}",
            "note": "A language model, a program that reads and writes text, needs a unit of text. Bytes make a sentence hundreds of units long, and every word must be rebuilt from its pieces. Characters are too few, and one letter alone carries almost no meaning. So the unit, called a token, is chosen between the two",
        },
    },
    {
        "id": "merge",
        "name": "Building a vocabulary of pieces",
        "summary": "How a vocabulary of tokens is learned from a short text: count the pairs of neighbouring symbols, join the commonest pair into one new symbol, and repeat. The list of joins is the whole result",
        "blocks": [
            {
                "label": "One step",
                "tex": r"(a, b)^{*} = \arg\max_{(a,b)} \#\{a\,b \text{ adjacent}\}, \qquad a\,b \rightarrow s_{\text{new}}",
                "note": "Among all pairs a, b of symbols that stand next to each other, the one that occurs most often is chosen. It is replaced everywhere by one new symbol. This step is called a merge. On the play page, the bar chart shows the counts, and the top bar is the pair merged next",
            },
            {
                "label": "The vocabulary after k merges",
                "tex": r"|V| = 256 + k",
                "note": "V is the vocabulary and |V| its size. It starts with the 256 possible bytes, so any text can be written and no character is unknown. Each of the k merges adds exactly one symbol",
            },
            {
                "label": "The text gets shorter",
                "tex": r"\text{tokens}_{k+1} = \text{tokens}_{k} - \#\{(a,b)^{*}\}",
                "note": "Each merge removes one token for every place where its pair occurred. On the play page's sample text, 2039 bytes become 516 tokens after 150 merges",
            },
        ],
        "dimension": {
            "label": "A space stays with the word after it",
            "tex": r"\text{``the cat''} \rightarrow [\text{``the''},\ \text{``\textvisiblespace cat''}]",
            "note": "Before merging, the text is split into words, and each space is attached to the start of the word after it. So merges never cross from one word to the next, and a token can contain its space",
        },
    },
    {
        "id": "segment",
        "name": "Cutting a sentence into tokens",
        "summary": "A new sentence cut into tokens by replaying the learned merges in order. The same sentence under four vocabularies, the space carried inside a token, and the exact way back to the text",
        "blocks": [
            {
                "label": "Cutting is a replay",
                "tex": r"\text{encode}(x) = m_k \circ \cdots \circ m_2 \circ m_1 (\text{bytes}(x))",
                "note": "The text x is written as bytes, then the merges m1, m2, up to mk are applied in the order they were learned. The result never varies: the same text is always cut the same way by the same list",
            },
            {
                "label": "Going back is joining bytes",
                "tex": r"\text{decode}(t_1, \ldots, t_n) = \text{bytes}(t_1) \| \cdots \| \text{bytes}(t_n)",
                "note": "Each token t stands for a fixed string of bytes. Writing these strings one after another, in order, gives the text back. Since every token is made of whole bytes, the round trip is exact, and the play page checks it",
            },
            {
                "label": "A word the text never had",
                "tex": r"\text{pieces}(w) > 1 \iff w \notin \text{training text}",
                "note": "If a word w never occurs in the text the vocabulary was learned from, no merge was ever made for it. So it stays in more than one piece, however many merges are made. The play page's sample sentence has one such word, windowsill",
            },
        ],
        "dimension": {
            "label": "The ids are all the model gets",
            "tex": r"x \mapsto (t_1, \ldots, t_n) \in V^{n}",
            "note": "The model receives only the token numbers t1 to tn, called ids, each the position of a token in the vocabulary V. The size of an id means nothing. Other pages of this topic show how each id is given a list of numbers that does carry meaning",
        },
    },
    {
        "id": "cost",
        "name": "What a token costs",
        "summary": "One sentence in ten languages and once with emoji, all cut by one vocabulary learned from English: tokens against characters, and why the count of tokens decides the price and how much fits in a model at once",
        "blocks": [
            {
                "label": "The ratio",
                "tex": r"r = \frac{\#\text{tokens}}{\#\text{characters}}",
                "note": "r is the number of tokens divided by the number of characters. With this vocabulary it is about 0.23 for English. It is above 1 for writing the vocabulary never saw, where every character takes several bytes and each byte becomes a token",
            },
            {
                "label": "What it multiplies",
                "tex": r"\text{cost}_{\text{attention}} \propto n^{2}, \qquad \text{cache} \propto n",
                "note": "The main step of a model, called attention, compares every token with every other one, so its work grows as n squared for n tokens. The memory it keeps grows as n. The same sentence at four times the tokens costs sixteen times the work",
            },
            {
                "label": "How many fit",
                "tex": r"\left\lfloor \frac{W}{n} \right\rfloor",
                "note": "W is the window, the number of tokens a model reads at once, and n the tokens of the sentence. W divided by n, rounded down, is how many copies of the sentence fit. The window is counted in tokens, so how many words it holds depends on the language",
            },
        ],
        "dimension": {
            "label": "A number, cut by frequency",
            "tex": r"1234567 \rightarrow [12][34][567] \text{ or } [1][2345][67]",
            "note": "A number such as 1234567 is cut wherever merges happened to form, for example into 12, 34 and 567, or into 1, 2345 and 67. Which cut happens depends on which digit pairs were commonest in the learning text, not on the value of the number",
        },
    },
    {
        "id": "table",
        "name": "From a number to a list of numbers",
        "summary": "How a token's number becomes a row of numbers: a list of zeros with a single 1, a table it is multiplied by, and the lookup that gives the same row for free. The width of a row is fixed, only the number of rows grows with the text",
        "blocks": [
            {
                "label": "One-hot",
                "tex": r"e_t \in \{0,1\}^{|V|}, \qquad (e_t)_i = [i = t]",
                "note": "For a token t, e_t is a list as long as the vocabulary V, with 0 everywhere and 1 at position t. Such a list is called a one-hot vector. Any two different one-hot vectors are exactly the square root of 2 apart, so it tells which token it is and nothing else",
            },
            {
                "label": "Multiplying by a matrix picks a row",
                "tex": r"e_t^{\top} E = E_{t,:}",
                "note": "E is the table, a grid of numbers also called a matrix. Multiplying the one-hot vector e_t by E adds up the rows of E, each times its entry in e_t, so the result is row t of E. Models skip the multiplication and read row t directly, which gives the same numbers",
            },
            {
                "label": "The table",
                "tex": r"E \in \mathbb{R}^{|V| \times d}, \qquad |V| \cdot d \text{ trainable numbers}",
                "note": "The table E has one row per token of the vocabulary V, and each row holds d numbers, a width chosen once. So it holds |V| times d numbers in all. The rows start random and are changed by training, like every other number of the model",
            },
            {
                "label": "The shape of an input",
                "tex": r"X = \begin{pmatrix} E_{t_1,:} \\ \vdots \\ E_{t_n,:} \end{pmatrix} \in \mathbb{R}^{n \times d}",
                "note": "For n tokens t1 to tn, the model receives X, the n rows of E stacked in order, each d numbers wide. Only n changes with the input. This is why every token's vector has the same length",
            },
        ],
        "dimension": {
            "label": "What a row depends on",
            "tex": r"E_{t,:} \text{ depends on } t \text{ alone}",
            "note": "Row t of E depends on the token t alone: not on the sentence around it, not on the length of the input. A token's vector is found by its number only. Everything that depends on the context comes later in the model",
        },
    },
    {
        "id": "meaning",
        "name": "Where meaning comes from",
        "summary": "Rows of numbers for each token, trained by predicting the tokens near it and pushing away random others, watched as related words gather. Which rows were moved often and which almost never",
        "blocks": [
            {
                "label": "Skip-gram with negative sampling",
                "tex": r"L = -\log \sigma(e_c \cdot c_o) - \sum_{k=1}^{K} \log \sigma(-e_c \cdot c_{n_k})",
                "note": "e_c is the row of the centre token, c_o a second vector for a neighbour, and c_nk the same for K tokens picked at random. The dot product, the sum of the products of matching numbers, scores each pair, and sigma turns a score into a number between 0 and 1. The loss L is small when the neighbour scores high and the random tokens score low. One row of the table moves per step",
            },
            {
                "label": "The update",
                "tex": r"e_c \leftarrow e_c - \eta \left[(\sigma(e_c \cdot c_o) - 1)\,c_o + \sum_k \sigma(e_c \cdot c_{n_k})\,c_{n_k}\right]",
                "note": "The row e_c is moved a small step, of size eta, in the direction that lowers the loss most. This is the usual way networks are trained, applied to one row. The play page counts how many times each row was moved: the commonest token thousands of times, the rarest only a few",
            },
            {
                "label": "The premise",
                "tex": r"\text{context}(a) \approx \text{context}(b) \Rightarrow e_a \approx e_b",
                "note": "If two tokens a and b appear in similar places in the text, their rows end up similar. Cat and dog end up close because the text puts them in the same sentences. A word with two meanings gets one row, between them",
            },
        ],
        "dimension": {
            "label": "No objective of its own",
            "tex": r"\nabla_E L_{\text{downstream}}",
            "note": "A table gets its structure from whatever loss is computed after it, through the gradient, the direction in which the loss changes fastest. In a model that writes text, the table is trained only by predicting the next token",
        },
    },
    {
        "id": "space",
        "name": "Measuring how close two tokens are",
        "summary": "Two ways to measure closeness of word vectors, the angle and the distance, a flat picture that keeps only part of the spread, the word arithmetic and what it hides, and the narrow cone all the vectors lean into",
        "blocks": [
            {
                "label": "Two readings of closeness",
                "tex": r"\cos(a, b) = \frac{a \cdot b}{\|a\|\,\|b\|}, \qquad d(a, b) = \|a - b\|",
                "note": "For two vectors a and b, the cosine is their dot product divided by the product of their lengths. It is 1 for the same direction, 0 at a right angle, and it ignores length. The distance d is the length of a minus b, how far apart the tips are, and it grows with length. The play page reports both for any two tokens",
            },
            {
                "label": "The flat picture",
                "tex": r"\text{kept} = \frac{\lambda_1 + \lambda_2}{\sum_i \lambda_i}",
                "note": "The picture uses the two directions along which the vectors spread most. Lambda 1 and lambda 2 measure the spread along them, and the sum of all lambdas the whole spread, so the fraction kept is their ratio. The play page shows this fraction. The rest is what the picture hides or distorts",
            },
            {
                "label": "The word arithmetic",
                "tex": r"\arg\max_{w \notin \{a, b, c\}} \cos(e_a - e_b + e_c,\ e_w)",
                "note": "Take the vector of a, subtract that of b, add that of c, and find the word w whose vector has the highest cosine with the result, leaving out a, b and c. The well-known demonstrations leave these three out by hand. The play page shows the answer with and without that rule, and without it the answer is often one of the three",
            },
            {
                "label": "The cone, and centring",
                "tex": r"\bar{e} = \frac{1}{|V|}\sum_t e_t, \qquad e_t' = e_t - \bar{e}",
                "note": "The cosines of random pairs average well above zero: the vectors lean one way together and fill a narrow cone. The mean vector, e bar, is the average of all vectors. Subtracting it from each vector, called centring, spreads them out. The play page's chart shows the cosines before and after",
            },
        ],
        "dimension": {
            "label": "What the space does not contain",
            "tex": r"\text{no axis } i \text{ has an assigned meaning}",
            "note": "No axis i of the space was given a meaning. A direction that seems to mean something was found afterwards, not designed. The space holds what training put there and nothing else",
        },
    },
    {
        "id": "order",
        "name": "Word order has to be added",
        "summary": "The same words in another order give the same result, until each token's list of numbers also carries its position",
        "blocks": [
            {
                "label": "The problem: an average ignores order",
                "tex": r"\frac{1}{n}\sum_i x_{\pi(i)} = \frac{1}{n}\sum_i x_i \quad \text{for every permutation } \pi",
                "note": "Here x_i is the list of numbers at position i, n is the number of tokens, and π is a shuffle of the positions. Adding up the n lists and dividing by n gives the same result in any order. Any mixing that treats every position alike has the same blindness. The page mixes a sentence and its shuffle and gets the same average, up to rounding error",
            },
            {
                "label": "A learned list for each position",
                "tex": r"x_i = E_{t_i,:} + P_{i,:}, \qquad P \in \mathbb{R}^{n_{\max} \times d}",
                "note": "What goes into the model at position i is the row of the token table E for the token t_i, plus row i of a position table P. P has one row of d numbers for each position up to the longest text allowed, n_max. The small model of these pages learns P in training. Past the last row there is no position list",
            },
            {
                "label": "Sines and cosines",
                "tex": r"P_{i, 2j} = \sin\!\left(\frac{i}{10000^{2j/d}}\right), \qquad P_{i, 2j+1} = \cos\!\left(\frac{i}{10000^{2j/d}}\right)",
                "note": "Here the position list is a fixed formula of the position i: column 2j holds a sine and column 2j + 1 a cosine, with slower waves for larger j, and d is the number of columns. Every position has a list, however far along. Moving the same number of positions along turns each sine and cosine pair by the same angle, from any starting position",
            },
            {
                "label": "Turning the query and the key",
                "tex": r"q_i \cdot k_j \text{ after rotating each by } i\theta,\ j\theta \text{ depends on } i - j \text{ only}",
                "note": "The method of large current models. In attention, the query q_i of position i and the key k_j of position j are two lists of numbers, multiplied to give a score. Turning them by an angle θ times their positions makes the score depend only on the distance i - j between the two positions",
            },
        ],
        "dimension": {
            "label": "Every list has the same length",
            "tex": r"x_i \in \mathbb{R}^{d} \text{ for the whole depth}",
            "note": "Each position holds a list of d numbers, 16 on these pages, at every stage of the model. It starts as the token's row plus the position's row",
        },
    },
    {
        "id": "attend",
        "name": "Attention: which earlier words count",
        "summary": "Each token's list of numbers is rebuilt as a weighted average of the lists before it, computed stage by stage on a real sentence with a small trained model",
        "blocks": [
            {
                "label": "Three new lists from each row",
                "tex": r"Q = X W_Q, \qquad K = X W_K, \qquad V = X W_V",
                "note": "X has one row of numbers per token. Multiplying it by three tables of learned weights, W_Q, W_K and W_V, gives each token a query in Q (what it looks for), a key in K (what it offers) and a value in V (what it passes on)",
            },
            {
                "label": "Scores, scaled",
                "tex": r"S_{ij} = \frac{q_i \cdot k_j}{\sqrt{d}}",
                "note": "S_ij is the score of token i for token j: the query of i and the key of j multiplied number by number, summed, and divided by the square root of the list length d. With d = 16 that is a division by 4. There is one score for each pair of tokens, n times n in all. Without the division, scores would grow with d, and each row of weights would end up with one weight near 1 and the rest near 0",
            },
            {
                "label": "The mask, then the weights",
                "tex": r"S_{ij} \leftarrow -\infty \text{ for } j > i, \qquad A_{i,:} = \mathrm{softmax}(S_{i,:})",
                "note": "A score for a later token, j greater than i, is set to minus infinity, so a token never reads a later one. Softmax then turns each row of scores into weights A: positive, and adding up to 1. The page prints the last token's weights as percentages",
            },
            {
                "label": "The mix, added back",
                "tex": r"Z = A V, \qquad H = X + Z",
                "note": "Z is the values averaged with the weights, and the output H is the input X plus Z. This is the only way earlier tokens affect later ones, and it is done at every position",
            },
        ],
        "dimension": {
            "label": "The cost",
            "tex": "|S| = n^{2}",
            "note": "The table of scores has n squared entries for n tokens. This is why a model reads only a limited number of tokens at once. The page's slider computes the count for any length: a thousand tokens give a million scores, for each attention unit in each layer",
        },
    },
    {
        "id": "predict",
        "name": "Guessing the next token",
        "summary": "The model's last list of numbers becomes a probability for every possible next token, and the guess improves as the model trains",
        "blocks": [
            {
                "label": "One score per token",
                "tex": r"z_t = h_n \cdot E_{t,:}",
                "note": "h_n is the model's list of numbers at the last position n, and E_t is the own row of token t in the token table. The score z_t multiplies them number by number and sums. A token scores high when its row points the same way as h_n. Reusing the table this way saves a second table of the same size",
            },
            {
                "label": "From scores to probabilities",
                "tex": r"p_t = \frac{e^{z_t}}{\sum_{t'} e^{z_{t'}}}",
                "note": "Each score becomes e (about 2.718) to that power, divided by the total over all tokens t': shares that are positive and add up to 1. This is called softmax. The page shows the twelve likeliest tokens as a ranked list",
            },
            {
                "label": "The loss, at every position at once",
                "tex": r"L = -\frac{1}{n-1}\sum_{i=1}^{n-1} \log p^{(i)}_{t_{i+1}}",
                "note": "At each position i of a text of n tokens, the model gives a probability to the token that really came next, t_{i+1}. The loss is minus the logarithm of that probability, averaged over all positions. A sure right guess costs 0. The falling curve on the page is this loss during training",
            },
            {
                "label": "Perplexity",
                "tex": r"\mathrm{PPL} = e^{L}",
                "note": "e to the power of the average loss: the number of equally likely tokens the model's uncertainty amounts to. Untrained, it is about the size of the vocabulary. Trained on the short text of these pages, it falls to a handful",
            },
        ],
        "dimension": {
            "label": "What the model knows",
            "tex": r"\text{one text of } \approx 500 \text{ tokens}",
            "note": "The ranked list reflects what that one text made likely, and nothing else. Text written by this model is pieces of that text, rearranged",
        },
    },
    {
        "id": "generate",
        "name": "Writing one token at a time",
        "summary": "Text is written by guessing one token, adding it to the text and guessing again. The model sees only the latest tokens, and nothing written can be changed",
        "blocks": [
            {
                "label": "The loop",
                "tex": r"t_{n+1} \sim p(\cdot \mid t_{1..n}), \qquad n \leftarrow n + 1",
                "note": "Given the tokens t_1 to t_n so far, the model gives probabilities p for the next one. One token, t_{n+1}, is chosen from them and added, and n grows by one. Then the loop repeats. An added token is read exactly like the tokens of the typed start",
            },
            {
                "label": "Why it matches training",
                "tex": r"p(t_{i+1} \mid t_{1..i}) \text{ used only } j \le i \text{ in training too}",
                "note": "In training, each guess of token i + 1 could use only positions j up to i, because of the mask in attention. Writing is the same situation: the next tokens do not exist yet",
            },
            {
                "label": "The store of keys and values",
                "tex": r"\text{keep } K_{1..n}, V_{1..n}; \text{ compute only } q_{n+1}, k_{n+1}, v_{n+1}",
                "note": "The keys K and values V of earlier positions do not change when a token is added, so they are kept. For each new token only its own query q, key k and value v are computed: one position instead of the whole text",
            },
            {
                "label": "What the store costs",
                "tex": r"\text{depth} \times \text{heads} \times 2 \times d_{\text{head}} \times n",
                "note": "The number of layers, times the attention units in each, times 2 (a key and a value), times the numbers in each, times the length n. It grows with the length, and in practice it limits how long a text can get. The page counts it for its one unit and one layer",
            },
        ],
        "dimension": {
            "label": "The window",
            "tex": r"n \le W",
            "note": "The model reads at most W tokens. Past W, the oldest tokens drop out and are gone. The page's slider shrinks the window so that this shows on a short text. Large models instead cut or summarise old text",
        },
    },
    {
        "id": "sample",
        "name": "Choosing the next token",
        "summary": "Always taking the likeliest next token makes text repeat itself. Other rules draw at random, and the rule changes the text as much as the model does",
        "blocks": [
            {
                "label": "Greedy",
                "tex": r"t_{n+1} = \arg\max_t p_t",
                "note": 'The next token t_{n+1} is always the token t with the largest probability p_t. The same start always gives the same text, and a small model soon falls into a loop and stays in it. The page shows greedy in the box "Greedy, for comparison"',
            },
            {
                "label": "Temperature",
                "tex": r"p_t \propto e^{z_t / T}",
                "note": "Each score z_t is divided by the temperature T before the probabilities are made. T below 1 makes likely tokens likelier; T above 1 evens the shares out. Near T = 0 the rule becomes greedy; at a very large T all tokens become equally likely",
            },
            {
                "label": "Top k and nucleus",
                "tex": r"\text{keep the } k \text{ largest}; \quad \text{keep the fewest with } \sum p_t \ge P; \quad \text{renormalise}",
                "note": "Top k keeps the k likeliest tokens. Nucleus keeps the fewest likeliest tokens whose probabilities add up to at least P. What is kept is scaled back up to a total of 1. Nucleus keeps fewer tokens when the model is sure and more when it is not. The page shows what each rule removed",
            },
            {
                "label": "A penalty on what was written",
                "tex": r"z_t \leftarrow z_t - \lambda \,[t \text{ already emitted}]",
                "note": "The score of each token already in the text is lowered by λ, the penalty. It is a blunt cure for the loops of greedy",
            },
        ],
        "dimension": {
            "label": "Two systems, not one",
            "tex": r"\text{text} = \text{decode}(\text{model}, \text{rule})",
            "note": "The text depends on the model and on the rule for choosing. On the page the model is the same in both boxes; only the rule differs. Another rule, beam search, keeps several unfinished texts and suits translation, where one right answer is sought",
        },
    },
    {
        "id": "pool",
        "name": "One list of numbers for a whole passage",
        "summary": "A passage's lists of numbers averaged into one, and why two passages with opposite meanings can still come out almost the same",
        "blocks": [
            {
                "label": "Two ways to collapse",
                "tex": r"v = \frac{1}{n}\sum_i h_i \qquad \text{or} \qquad v = h_n",
                "note": "h_i is the model's list of numbers at position i, and n is the number of tokens. The passage list v is either the average of all h_i or the last one, h_n. A model that reads only earlier tokens naturally uses the last position, since only it has seen the whole passage",
            },
            {
                "label": "The comparison",
                "tex": r"\cos(v_A, v_B)",
                "note": "The cosine of the angle between the lists v_A and v_B of two passages A and B: 1 for the same direction, 0 for unrelated, negative for opposite. The page compares three pairs: the same meaning in other words, the opposite meaning in the same words, and different subjects. The opposite pair comes out close",
            },
            {
                "label": "The training used by search models",
                "tex": r"L = -\log \frac{e^{\cos(v_A, v_{A^{+}})/\tau}}{\sum_{B} e^{\cos(v_A, v_B)/\tau}}",
                "note": "A passage A, a passage A+ that belongs with it, and other passages B. The loss L is low when A is much closer to A+ than to every B; τ is a fixed number that sets how sharp the comparison is. Training pulls matching pairs together and pushes others apart. The lists are of the same kind; only the training differs",
            },
        ],
        "dimension": {
            "label": "One list per passage is built, not given",
            "tex": r"\text{one vector per passage is a construction, not a property of the embedding}",
            "note": "The length of each list comes from the token table, and the number of lists from the length of the input. A single list for a whole passage exists only when the lists are collapsed on purpose. A model that writes text never builds it",
        },
    },
    {
        "id": "artefacts",
        "name": "Four mistakes explained by cutting text",
        "summary": "Counting letters, long numbers, a stray space, a rare word: four common failures of language models, each caused by how text is cut into tokens",
        "blocks": [
            {
                "label": "Letters inside a token",
                "tex": r"\text{``windowsill''} \rightarrow 7 \text{ ids}; \quad \#\text{letters} \notin \text{input}",
                "note": "On the vocabulary of these pages the word arrives as 7 ids, and the number of its letters is not part of what the model receives. A token is the smallest unit the model sees. Counting letters, spelling and reversing a word all fail for this one reason",
            },
            {
                "label": "A number, cut three ways",
                "tex": r"\text{tokens}(1234567) \neq \text{tokens}(1{,}234{,}567) \neq \text{tokens}(\textvisiblespace 1234567)",
                "note": "The same number as typed, with commas, and after a space gives different tokens. Which digits share a token depends on where the vocabulary's pieces fell. Arithmetic on those pieces is not arithmetic on digits",
            },
            {
                "label": "A stray space",
                "tex": r"\text{id}(\text{``the''}) \neq \text{id}(\text{``\textvisiblespace the''})",
                "note": '"the" and "the" with a space in front are different tokens with different ids. So a different list of numbers goes in, and everything after is computed from different numbers',
            },
            {
                "label": "A rare word's lists",
                "tex": r"\#\text{updates}(t) \propto \#\text{occurrences}(t)",
                "note": "Each time a token t appears in the training text, its list of numbers is adjusted. A token that appears rarely is adjusted rarely. The pieces of a rare word were adjusted a few times or never, so they carry little",
            },
        ],
        "dimension": {
            "label": "What the four have in common",
            "tex": r"\text{every failure above} \Leftarrow \text{how text is cut into tokens}",
            "note": "What counts as one piece, how the pieces are chosen, where the space goes, where a number is cut: all decided before the model learned anything. None of these failures is a mystery about the model",
        },
    },
]


DEFINITIONS = [
    {
        "id": "softmax",
        "name": "Softmax",
        "tex": r"\mathrm{softmax}(z)_i = \frac{e^{z_i}}{\sum_j e^{z_j}}",
        "note": "Turns a list of scores z into shares that are positive and add up to 1: each score z_i becomes e (about 2.718) to the power z_i, divided by the total over all j. The topic uses it three times: for attention weights, for the probability of every next token, and, with a temperature, to reshape those probabilities",
    },
    {
        "id": "crossentropy",
        "name": "Cross entropy, the loss",
        "tex": r"L = -\log p_{t^{*}}",
        "note": "The loss L of one guess: minus the logarithm of the probability p given to the token t* that really came next. A sure right guess costs 0; a guess of 1 per cent costs about 4.6. Training lowers the average of this loss over every position of the text",
    },
    {
        "id": "cosine",
        "name": "Cosine similarity",
        "tex": r"\cos(a, b) = \frac{a \cdot b}{\|a\|\,\|b\|}",
        "note": "The cosine of the angle between two lists of numbers a and b, seen as arrows: their product number by number, summed, divided by their two lengths. 1 means the same direction, 0 unrelated, a negative value opposite. The lengths do not matter. Used to find the nearest tokens and to compare passages",
    },
    {
        "id": "onehot",
        "name": "The one-hot list",
        "tex": r"(e_t)_i = [i = t], \qquad \|e_a - e_b\| = \sqrt{2} \text{ for } a \neq b",
        "note": "A token id t written as a list e_t as long as the vocabulary: 0 everywhere except a 1 at place t. Any two different such lists are the same distance apart, the square root of 2, so they say which token it is and nothing else. Multiplying a table by such a list picks out row t",
    },
    {
        "id": "utf8",
        "name": "Bytes as the alphabet",
        "tex": r"|\Sigma| = 256",
        "note": "Computers store text as bytes, whole numbers from 0 to 255. Starting the vocabulary from these 256 values means every text can be written, no token is ever unknown, and turning tokens back into text is exact. The price: text in a script the vocabulary never saw takes one token per byte",
    },
]
