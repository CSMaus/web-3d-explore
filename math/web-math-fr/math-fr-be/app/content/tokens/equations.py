"""
the fourteen play pages of topic 4, with the mathematics each one moves. the
order is the reading order of story3: a string becomes tokens, tokens become
vectors, vectors are mixed across positions, and one token at a time becomes a
paragraph. the notes say what the page shows, not what a textbook proves.
"""

SYSTEMS = [
    {
        "id": "bytes",
        "name": "One string, three ways",
        "summary": (
            "What you read, the code points that name it, the bytes that store it: three counts "
            "that agree in plain English and part company everywhere else"
        ),
        "blocks": [
            {
                "label": "A code point",
                "tex": r"c \in \{0, 1, \ldots, \mathrm{10FFFF}_{16}\}",
                "note": "One integer per character in the standard's table. The page shows each as U+ and its number in hexadecimal",
            },
            {
                "label": "Its bytes",
                "tex": r"\text{bytes}(c) = \begin{cases} 1 & c < 2^{7} \\ 2 & c < 2^{11} \\ 3 & c < 2^{16} \\ 4 & \text{otherwise} \end{cases}",
                "note": "UTF-8: a small code point is one byte, a large one up to four. The first byte says how many follow, which is what the colours on the page mark",
            },
            {
                "label": "Two spellings, one letter",
                "tex": r"\text{e} + \text{U+0301} \neq \text{U+00E9}, \qquad \mathrm{NFC}(\cdot) \text{ makes them equal}",
                "note": "A base letter with a combining mark, or the composed letter: the same to the eye, different as strings, equal only after normalising",
            },
        ],
        "dimension": {
            "label": "Why neither is the unit",
            "tex": r"|\text{bytes}| \gg |\text{words}|, \qquad |\text{alphabet}| \ll \text{what a row can carry}",
            "note": "Bytes make a sentence hundreds long and leave every word to be reassembled; characters give a vocabulary too small to mean anything. The unit is chosen between them",
        },
    },
    {
        "id": "merge",
        "name": "Building a vocabulary",
        "summary": (
            "Byte-pair encoding on a small text, one merge a step: count neighbouring pairs, join "
            "the commonest into a new symbol, repeat. The merge list is the whole result"
        ),
        "blocks": [
            {
                "label": "One step",
                "tex": r"(a, b)^{*} = \arg\max_{(a,b)} \#\{a\,b \text{ adjacent}\}, \qquad a\,b \rightarrow s_{\text{new}}",
                "note": "The commonest adjacent pair becomes one symbol, everywhere it occurs. The bar chart on the page is the count; the top bar is the pair joined next",
            },
            {
                "label": "The vocabulary after k merges",
                "tex": r"|V| = 256 + k",
                "note": "The alphabet is the 256 byte values, so every string is representable and nothing is unknown. Each merge adds exactly one symbol",
            },
            {
                "label": "The text gets shorter",
                "tex": r"\text{tokens}_{k+1} = \text{tokens}_{k} - \#\{(a,b)^{*}\}",
                "note": "Each merge removes one token per occurrence of the pair. On the page's text, 2039 bytes become about 516 tokens after 150 merges",
            },
        ],
        "dimension": {
            "label": "A space stays with the word after it",
            "tex": r"\text{``the cat''} \rightarrow [\text{``the''},\ \text{``\textvisiblespace cat''}]",
            "note": "Words are split before merging with the leading space attached, so merges never cross a word boundary and a token can carry its space",
        },
    },
    {
        "id": "segment",
        "name": "Cutting a sentence",
        "summary": (
            "The merges replayed in order on text the vocabulary never saw. The same sentence under "
            "four vocabularies, the space inside the token, and the exact way back"
        ),
        "blocks": [
            {
                "label": "Encoding is a replay",
                "tex": r"\text{encode}(x) = m_k \circ \cdots \circ m_2 \circ m_1 (\text{bytes}(x))",
                "note": "Apply the merges in the order they were learned. Deterministic: the same text always cuts the same way under the same list",
            },
            {
                "label": "Decoding is a concatenation",
                "tex": r"\text{decode}(t_1, \ldots, t_n) = \text{bytes}(t_1) \| \cdots \| \text{bytes}(t_n)",
                "note": "Each symbol stands for a fixed byte string; join them. With a byte alphabet the round trip is exact, and the page checks it",
            },
            {
                "label": "A word the text never had",
                "tex": r"\text{pieces}(w) > 1 \iff w \notin \text{training text}",
                "note": "No merge ever covered it, so it stays in pieces however many merges are made. The page's default sentence has one such word",
            },
        ],
        "dimension": {
            "label": "The ids are all the model gets",
            "tex": r"x \mapsto (t_1, \ldots, t_n) \in V^{n}",
            "note": "Integers in vocabulary order. Their numeric values carry nothing; the next group of pages is about giving them something",
        },
    },
    {
        "id": "cost",
        "name": "What a token costs",
        "summary": (
            "One sentence in eleven scripts under one English-trained vocabulary: tokens against "
            "characters, and why the ratio is what is billed and what fills the window"
        ),
        "blocks": [
            {
                "label": "The ratio",
                "tex": r"r = \frac{\#\text{tokens}}{\#\text{characters}}",
                "note": "About 0.23 for English on this vocabulary, and above 1 for a script the vocabulary never saw, where every character is several bytes and each byte is a token",
            },
            {
                "label": "What it multiplies",
                "tex": r"\text{cost}_{\text{attention}} \propto n^{2}, \qquad \text{cache} \propto n",
                "note": "The score matrix has one entry per pair of positions. The same sentence at four times the tokens costs sixteen times the attention",
            },
            {
                "label": "How many fit",
                "tex": r"\left\lfloor \frac{W}{n} \right\rfloor",
                "note": "Copies of the sentence that fit in a window of W tokens. The window is counted in tokens, so its size in words depends on the language",
            },
        ],
        "dimension": {
            "label": "A number, cut by frequency",
            "tex": r"1234567 \rightarrow [12][34][567] \text{ or } [1][2345][67]",
            "note": "Place value can sit across a token boundary, decided by which digit pairs the training text happened to have most. The last page collects this",
        },
    },
    {
        "id": "table",
        "name": "From a number to a vector",
        "summary": (
            "A token id as a one-hot row, a matrix that picks one row when multiplied by it, and "
            "the table that makes the picking cheap. The width is fixed; the count grows"
        ),
        "blocks": [
            {
                "label": "One-hot",
                "tex": r"e_t \in \{0,1\}^{|V|}, \qquad (e_t)_i = [i = t]",
                "note": "As long as the vocabulary, zero everywhere but one place. Every pair of distinct one-hot vectors is exactly root two apart, so it carries identity and nothing else",
            },
            {
                "label": "Multiplying by a matrix picks a row",
                "tex": r"e_t^{\top} E = E_{t,:}",
                "note": "The embedding layer is a fully connected layer with a one-hot input, and it is implemented as an index because that is the same thing for free",
            },
            {
                "label": "The table",
                "tex": r"E \in \mathbb{R}^{|V| \times d}, \qquad |V| \cdot d \text{ trainable numbers}",
                "note": "One row per vocabulary entry, of a width chosen once. The rows start random and are trained like any other weights",
            },
            {
                "label": "The shape of an input",
                "tex": r"X = \begin{pmatrix} E_{t_1,:} \\ \vdots \\ E_{t_n,:} \end{pmatrix} \in \mathbb{R}^{n \times d}",
                "note": "n rows for n tokens, each d wide. Only n changes with the input. This is the answer to why a token's vector has a fixed length",
            },
        ],
        "dimension": {
            "label": "What a row depends on",
            "tex": r"E_{t,:} \text{ depends on } t \text{ alone}",
            "note": "Not on the sentence around it, not on the input's length. A token's vector is a lookup by identity, and everything contextual comes later",
        },
    },
    {
        "id": "meaning",
        "name": "Where the meaning comes from",
        "summary": (
            "The rows trained by predicting the tokens near each one and pushing away random "
            "others, watched forming a map. Which rows moved often and which almost never"
        ),
        "blocks": [
            {
                "label": "Skip-gram with negative sampling",
                "tex": r"L = -\log \sigma(e_c \cdot c_o) - \sum_{k=1}^{K} \log \sigma(-e_c \cdot c_{n_k})",
                "note": "The centre token's row against its neighbour's context vector, pushed together; against K random tokens, pushed apart. One row of the table moves per step",
            },
            {
                "label": "The update",
                "tex": r"e_c \leftarrow e_c - \eta \left[(\sigma(e_c \cdot c_o) - 1)\,c_o + \sum_k \sigma(e_c \cdot c_{n_k})\,c_{n_k}\right]",
                "note": "Topic 3's descent on the row alone. The page counts how many times each row was touched: the commonest token thousands of times, the rarest a handful",
            },
            {
                "label": "The premise",
                "tex": r"\text{context}(a) \approx \text{context}(b) \Rightarrow e_a \approx e_b",
                "note": "Tokens found in the same places get similar rows. Cat and dog end up close because the text puts them in the same sentences. A word with two meanings gets one row between them",
            },
        ],
        "dimension": {
            "label": "No objective of its own",
            "tex": r"\nabla_E L_{\text{downstream}}",
            "note": "A table takes its structure from whatever loss sits after it. A generative model's table is trained by next-token prediction alone, which the later pages use",
        },
    },
    {
        "id": "space",
        "name": "Measuring the space",
        "summary": (
            "Cosine against distance, a flat picture that keeps only part of the spread, direction "
            "as the carrier of relation, and the narrow cone every trained table sits in"
        ),
        "blocks": [
            {
                "label": "Two readings of closeness",
                "tex": r"\cos(a, b) = \frac{a \cdot b}{\|a\|\,\|b\|}, \qquad d(a, b) = \|a - b\|",
                "note": "The angle between them, blind to length; and how far apart, which grows with length. The page reports both for any two tokens",
            },
            {
                "label": "The flat picture",
                "tex": r"\text{kept} = \frac{\lambda_1 + \lambda_2}{\sum_i \lambda_i}",
                "note": "The two directions of most spread, by power iteration on the covariance. The fraction kept is on the page, and the rest is what the picture hides or invents",
            },
            {
                "label": "The analogy arithmetic",
                "tex": r"\arg\max_{w \notin \{a, b, c\}} \cos(e_a - e_b + e_c,\ e_w)",
                "note": "The famous demonstration excludes the three inputs by hand. The page shows the answer with and without that exclusion; without it the answer is usually an input",
            },
            {
                "label": "The cone, and centring",
                "tex": r"\bar{e} = \frac{1}{|V|}\sum_t e_t, \qquad e_t' = e_t - \bar{e}",
                "note": "Cosines between random pairs average well above zero: the vectors lean one way together. Taking the mean away spreads them out, and the page's histogram shows both",
            },
        ],
        "dimension": {
            "label": "What the space does not contain",
            "tex": r"\text{no axis } i \text{ has an assigned meaning}",
            "note": "A direction that seems to mean something was found afterwards, not designed. The space carries what the loss put there and nothing else",
        },
    },
    {
        "id": "order",
        "name": "Order has to be supplied",
        "summary": (
            "A sentence and its shuffle give one and the same answer under any symmetric mixing, "
            "until a position is added to every vector"
        ),
        "blocks": [
            {
                "label": "The problem",
                "tex": r"\frac{1}{n}\sum_i x_{\pi(i)} = \frac{1}{n}\sum_i x_i \quad \text{for every permutation } \pi",
                "note": "An average does not care about order, and neither does any mechanism that treats positions alike. The page adds up a sentence and its shuffle and gets the same vector to machine precision",
            },
            {
                "label": "A learned vector per index",
                "tex": r"x_i = E_{t_i,:} + P_{i,:}, \qquad P \in \mathbb{R}^{n_{\max} \times d}",
                "note": "One trainable row per position, added to the token's. The small model on these pages does this. The ceiling: no row exists past the last one",
            },
            {
                "label": "Sines and cosines",
                "tex": r"P_{i, 2j} = \sin\!\left(\frac{i}{10000^{2j/d}}\right), \qquad P_{i, 2j+1} = \cos\!\left(\frac{i}{10000^{2j/d}}\right)",
                "note": "A fixed function of the index at many frequencies. Any index has one. Two positions a fixed distance apart are related by the same rotation wherever they are",
            },
            {
                "label": "Rotating the query and the key",
                "tex": r"q_i \cdot k_j \text{ after rotating each by } i\theta,\ j\theta \text{ depends on } i - j \text{ only}",
                "note": "The current standard: position enters as a rotation of the query and key, so the score depends on the distance between positions rather than on each one",
            },
        ],
        "dimension": {
            "label": "The stream's width",
            "tex": r"x_i \in \mathbb{R}^{d} \text{ for the whole depth}",
            "note": "The running representation is one vector per position, of the embedding width, read and written by every block. It starts as the row plus the position",
        },
    },
    {
        "id": "attend",
        "name": "Attention, with the numbers",
        "summary": (
            "Query, key and value from the stream, the score matrix, the mask, the weights and the "
            "mix written back, on a real prompt through the small model trained on these pages"
        ),
        "blocks": [
            {
                "label": "Three projections",
                "tex": r"Q = X W_Q, \qquad K = X W_K, \qquad V = X W_V",
                "note": "Each row of the stream becomes a query, a key and a value, each a matrix multiplication of the same row",
            },
            {
                "label": "Scores, scaled",
                "tex": r"S_{ij} = \frac{q_i \cdot k_j}{\sqrt{d}}",
                "note": "One entry per pair of positions, n squared of them. Dividing by the root of the width keeps the scores from growing with it, which would drive every row of the softmax to a single one",
            },
            {
                "label": "The mask, then the weights",
                "tex": r"S_{ij} \leftarrow -\infty \text{ for } j > i, \qquad A_{i,:} = \mathrm{softmax}(S_{i,:})",
                "note": "No position may read a later one. After the softmax each row is positive and adds to one, and the page prints the last row as percentages",
            },
            {
                "label": "The mix, written back",
                "tex": r"Z = A V, \qquad H = X + Z",
                "note": "The weights applied to the values, added to what the stream had. This is the only way earlier tokens reach later ones, and it is recomputed at every position",
            },
        ],
        "dimension": {
            "label": "The cost",
            "tex": r"|S| = n^{2}",
            "note": "The reason the window is finite. The page's slider computes it for any length; at a thousand tokens it is a million scores per head per layer",
        },
    },
    {
        "id": "predict",
        "name": "The next token",
        "summary": (
            "The last vector scored against every row of the table, softmaxed into a ranked list. "
            "Watch it sharpen as the model trains, scored against what the text actually said"
        ),
        "blocks": [
            {
                "label": "One score per vocabulary entry",
                "tex": r"z_t = h_n \cdot E_{t,:}",
                "note": "The output layer is the table transposed, so a score is how well the running vector lines up with a token's own row. Tying them saves a whole table of numbers",
            },
            {
                "label": "The distribution",
                "tex": r"p_t = \frac{e^{z_t}}{\sum_{t'} e^{z_{t'}}}",
                "note": "Topic 3's softmax over the vocabulary. The page shows the top twelve as a ranked list rather than a plot, because that is how the shape reads",
            },
            {
                "label": "The loss, at every position at once",
                "tex": r"L = -\frac{1}{n-1}\sum_{i=1}^{n-1} \log p^{(i)}_{t_{i+1}}",
                "note": "Cross entropy against the token that actually followed, one term per position of the text. The curve on the page is this, falling",
            },
            {
                "label": "Perplexity",
                "tex": r"\mathrm{PPL} = e^{L}",
                "note": "The exponential of the average loss: as if choosing among this many equally likely tokens. Untrained it is about the vocabulary size; trained on this small text it falls to a handful",
            },
        ],
        "dimension": {
            "label": "What the model knows",
            "tex": r"\text{one text of } \approx 500 \text{ tokens}",
            "note": "The ranked list is what that text made likely and nothing else. The pages after this one generate from it, and what they generate is that text rearranged",
        },
    },
    {
        "id": "generate",
        "name": "One token at a time",
        "summary": (
            "Run, choose one token, append it, run again. The appended token goes in like any "
            "other, the window fills, the oldest falls out, and nothing can be revised"
        ),
        "blocks": [
            {
                "label": "The loop",
                "tex": r"t_{n+1} \sim p(\cdot \mid t_{1..n}), \qquad n \leftarrow n + 1",
                "note": "Four steps: tokenise the prompt, run the stack, choose from the distribution at the last position, append. The appended token is indistinguishable from the prompt's",
            },
            {
                "label": "Why it matches training",
                "tex": r"p(t_{i+1} \mid t_{1..i}) \text{ used only } j \le i \text{ in training too}",
                "note": "The causal mask made every training prediction depend on earlier positions only, which is exactly the situation at generation time",
            },
            {
                "label": "The cache",
                "tex": r"\text{keep } K_{1..n}, V_{1..n}; \text{ compute only } q_{n+1}, k_{n+1}, v_{n+1}",
                "note": "The keys and values of earlier positions do not change, so they are stored. The work per new token drops from the whole sequence to one position",
            },
            {
                "label": "What the cache costs",
                "tex": r"\text{depth} \times \text{heads} \times 2 \times d_{\text{head}} \times n",
                "note": "Linear in the length, and in practice the real limit on how long a generation runs. The page counts it for its one head and one layer",
            },
        ],
        "dimension": {
            "label": "The window",
            "tex": r"n \le W",
            "note": "Past W tokens the oldest fall out and are gone. The page's slider shrinks the window so this is seen on a short text; a real one truncates or summarises",
        },
    },
    {
        "id": "sample",
        "name": "Choosing from the distribution",
        "summary": (
            "Greedy repeats itself; temperature, top-k and nucleus reshape the same distribution "
            "before the draw, and the choice changes the text as much as the model does"
        ),
        "blocks": [
            {
                "label": "Greedy",
                "tex": r"t_{n+1} = \arg\max_t p_t",
                "note": "Always the most likely. Deterministic, and on a small model it finds a cycle and stays in it, which the page shows in the right-hand column",
            },
            {
                "label": "Temperature",
                "tex": r"p_t \propto e^{z_t / T}",
                "note": "Divide the scores before the softmax. Below one sharpens, above one flattens; the limits are greedy and every token alike",
            },
            {
                "label": "Top-k and nucleus",
                "tex": r"\text{keep the } k \text{ largest}; \quad \text{keep the fewest with } \sum p_t \ge P; \quad \text{renormalise}",
                "note": "Cut the tail, then renormalise what is left. Nucleus adapts the count to how confident the distribution is; the page greys out what each rule removed",
            },
            {
                "label": "A penalty on what was written",
                "tex": r"z_t \leftarrow z_t - \lambda \,[t \text{ already emitted}]",
                "note": "Lower the score of tokens already in the text, which is the blunt cure for the greedy cycle",
            },
        ],
        "dimension": {
            "label": "Two systems, not one",
            "tex": r"\text{text} = \text{decode}(\text{model}, \text{rule})",
            "note": "The model did not change between the two columns; only the rule did. Beam search is the other shape, kept for translation where there is a right answer to find",
        },
    },
    {
        "id": "pool",
        "name": "One vector for a whole passage",
        "summary": (
            "The per-position vectors collapsed into one, on purpose, two ways, and what the one "
            "vector cannot tell apart"
        ),
        "blocks": [
            {
                "label": "Two collapses",
                "tex": r"v = \frac{1}{n}\sum_i h_i \qquad \text{or} \qquad v = h_n",
                "note": "Average every position, or read off a designated one. A causal model's natural choice is the last position, since only it has seen everything",
            },
            {
                "label": "Compared",
                "tex": r"\cos(v_A, v_B)",
                "note": "The page compares three pairs: same meaning in other words, opposite meaning in the same words, and a different subject. The opposite pair sits close",
            },
            {
                "label": "The loss a retrieval model uses instead",
                "tex": r"L = -\log \frac{e^{\cos(v_A, v_{A^{+}})/\tau}}{\sum_{B} e^{\cos(v_A, v_B)/\tau}}",
                "note": "Pairs that belong together pulled close, others pushed apart. A different loss on the same kind of vector, not a different kind of vector",
            },
        ],
        "dimension": {
            "label": "The third part of the correction",
            "tex": r"\text{one vector per passage is a construction, not a property of the embedding}",
            "note": "The fixed width is the table's; the count of vectors is the input's; a single vector for the whole exists only when the count is deliberately collapsed. A generative model never makes it",
        },
    },
    {
        "id": "artefacts",
        "name": "What the first pages explain",
        "summary": (
            "Counting letters, a long number, a stray space, a rare word: four failures people "
            "meet, each traced to a page before any model appeared"
        ),
        "blocks": [
            {
                "label": "Letters inside a token",
                "tex": r"\text{``windowsill''} \rightarrow 3 \text{ ids}; \quad \#\text{letters} \notin \text{input}",
                "note": "The token is the unit and its letters were never separately represented. Counting them, spelling and reversing all fail for this one reason",
            },
            {
                "label": "A number, cut three ways",
                "tex": r"\text{tokens}(1234567) \neq \text{tokens}(1{,}234{,}567) \neq \text{tokens}(\textvisiblespace 1234567)",
                "note": "Place value split wherever the merges fell, and differently in each spelling. Arithmetic on the pieces is not arithmetic on digits",
            },
            {
                "label": "A stray space",
                "tex": r"\text{id}(\text{``the''}) \neq \text{id}(\text{``\textvisiblespace the''})",
                "note": "The space travels inside the token, so a different row of the table goes in and everything after is computed from different numbers",
            },
            {
                "label": "A rare word's rows",
                "tex": r"\#\text{updates}(t) \propto \#\text{occurrences}(t)",
                "note": "The pieces of a rare word were moved a handful of times or never during training, so they carry little. The meaning page counted this",
            },
        ],
        "dimension": {
            "label": "The closing point",
            "tex": r"\text{every failure above} \Leftarrow \text{pages 1 to 4}",
            "note": "The unit, how it is chosen, where the space goes, where a number is cut: decided before any network appeared. None of these is a mystery about the model",
        },
    },
]


DEFINITIONS = [
    {
        "id": "softmax",
        "name": "The softmax",
        "tex": r"\mathrm{softmax}(z)_i = \frac{e^{z_i}}{\sum_j e^{z_j}}",
        "note": (
            "Used three times in this topic: over the scores at one position to make attention "
            "weights, over the vocabulary to make the next-token distribution, and with a "
            "temperature under the scores to reshape it"
        ),
    },
    {
        "id": "crossentropy",
        "name": "Cross entropy",
        "tex": r"L = -\log p_{t^{*}}",
        "note": (
            "The loss of one prediction is the negative log of the probability given to the token "
            "that actually followed. Averaged over every position of the text at once, it is what "
            "the model descends"
        ),
    },
    {
        "id": "cosine",
        "name": "Cosine similarity",
        "tex": r"\cos(a, b) = \frac{a \cdot b}{\|a\|\,\|b\|}",
        "note": (
            "The angle between two vectors, blind to their lengths. The reading of closeness used "
            "for nearest neighbours, for the analogy arithmetic and for comparing passage vectors"
        ),
    },
    {
        "id": "onehot",
        "name": "The one-hot vector",
        "tex": r"(e_t)_i = [i = t], \qquad \|e_a - e_b\| = \sqrt{2} \text{ for } a \neq b",
        "note": (
            "An integer as a vector a matrix can multiply. Every pair is equally far apart, so it "
            "carries identity and nothing else, and multiplying it by a matrix selects one row"
        ),
    },
    {
        "id": "utf8",
        "name": "The byte alphabet",
        "tex": r"|\Sigma| = 256",
        "note": (
            "With bytes as the alphabet every string is representable, no token is unknown, and "
            "decoding is an exact concatenation. The cost is that a script the vocabulary never "
            "saw is one token per byte"
        ),
    },
]
