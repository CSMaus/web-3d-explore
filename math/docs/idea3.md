# idea3 - tokens, embeddings, and generation one token at a time

## scope

cover how a language model turns text into numbers, what those numbers are, how the numbers acquire whatever meaning they carry, how earlier text shapes what comes next, and how one token at a time becomes a paragraph. begins after idea1's network material and does not re-derive it. contains nothing about differential equations, attractors or fractals (idea2).

## audience assumption

a neural network is known as a stack of layers holding weights and biases, trained by descending a loss, at the level idea1 leaves it. no experience of natural-language processing, no assumption that "vector" means anything beyond a list of numbers, and no familiarity with the transformer.

## relationship to math/docs/idea1.md

five of idea1's entries are prerequisites and are not restated here. they are named as `(idea1)` in the prereq lines below:

- "fully-connected network as a system of equations", since every block in this idea is built from such layers
- "what a neuron is and where the name came from", specifically the softmax and the activation-function material
- "loss surface and gradient descent" and "backpropagation", since training is referred to throughout and never re-derived
- "stochastic gradient descent", for the mini-batch reading of how a vocabulary's worth of embeddings all move at once

idea1's step on differential structure inside layer types already names layer normalisation and residual connections; this idea uses both and points back rather than re-covering them.

## the correction this idea has to make

the original sketch asks why the embedding vector's length is fixed regardless of input length. the question conflates two different objects, and separating them is a structural point rather than a detail:

- each token has its own vector, of a fixed width, because that width is a chosen architectural constant and the embedding table is a lookup by token identity. nothing about it depends on the sentence
- a sequence of n tokens therefore has n vectors, not one. the count grows with the input and the width does not
- a single fixed-width vector for a whole passage exists only when the n vectors are deliberately collapsed into one by pooling or by reading off a designated position, which is what a sentence-embedding or retrieval model does and what a generative model does not

the entries below are ordered so that this distinction is built rather than corrected after the fact: the per-token width is established first, the growth in count second, and pooling last and separately.

## topic chain

- text as bytes, characters and code points
  - prereq: none
  - representations
    - the same string shown as what a person reads, as a sequence of Unicode code points, and as a sequence of bytes under one encoding, with the three counts side by side and different
    - variable-length encoding, where one character occupies one byte in one script and several in another, so that byte count and character count part company
    - combining marks and normalisation, where two byte sequences a person cannot tell apart are not equal, and where the choice of normal form is a decision with consequences
    - case, whitespace and punctuation as characters like any other, established here so that later tokenisation artefacts are not mistaken for magic
    - why neither the byte nor the character is the unit a model works in: bytes make sequences too long, characters make the vocabulary too small to carry meaning, and both leave every word to be reassembled from scratch
  - leads into: what a token is

- what a token is
  - prereq: text as bytes, characters and code points
  - representations
    - a token as a chunk of text drawn from a fixed vocabulary, sitting between the character and the word in size, with a sentence segmented on screen and the boundaries marked
    - the token identifier as an integer index into the vocabulary, and the statement that this integer is the only thing about the token the model receives
    - the same sentence segmented by three different vocabularies, so that the segmentation is seen to be a property of the tokeniser and not of the language
    - leading whitespace carried inside the token, so that the same word after a space and at the start of a line are different tokens
    - common words as single tokens and rare words as several, with a frequency-ordered vocabulary shown against the text it segments
    - the vocabulary size as an architectural constant, with the trade it makes: larger vocabularies give shorter sequences and a larger output layer
    - special tokens (sequence start, sequence end, padding, unknown, and the role markers a chat format adds) as reserved entries that correspond to no text
  - leads into: tokenisation algorithms, embedding

- tokenisation algorithms
  - prereq: what a token is
  - representations
    - byte-pair encoding built on screen from a small corpus: start from single characters, count adjacent pairs, merge the most frequent pair into a new symbol, and repeat a fixed number of times, with the merge list as the trained artefact
    - the merge list applied to unseen text, so that encoding is a deterministic replay of merges and decoding is a concatenation
    - byte-level byte-pair encoding, where the alphabet is the 256 byte values, which removes the unknown token entirely because every possible input is representable
    - WordPiece as the same shape with a likelihood criterion for the merge instead of raw frequency
    - the unigram method as the opposite construction, starting from a large candidate vocabulary and pruning the pieces whose removal costs the least, with the segmentation of a given string then chosen as the most probable one
    - SentencePiece as the packaging that treats the raw string as the input with no prior word splitting, which is what makes the same method work for scripts written without spaces
    - the training corpus as the thing that decides everything, with the consequence that a vocabulary trained mostly on one language segments others into far more pieces
  - leads into: token counts across languages, detokenisation

- detokenisation, and where it is not the inverse
  - prereq: tokenisation algorithms
  - representations
    - decoding as concatenation of the vocabulary strings, shown as the exact inverse for a byte-level vocabulary
    - the cases where it is not exact: normalisation applied before encoding is not undone, whitespace conventions inserted by the tokeniser reappear, and a lower-casing tokeniser has destroyed information that no decoder can restore
    - a partial token at the end of a stream, where a multi-byte character has been split across generated tokens, and the buffering that streaming output requires as a result
    - round-trip checking as the practical test, encoding and decoding a corpus and reporting exactly where the two differ
  - leads into: token counts across languages

- token counts across languages, and what they cost
  - prereq: tokenisation algorithms, detokenisation
  - representations
    - the same sentence in several languages, each tokenised by the same vocabulary, with the token counts compared against the character counts
    - the ratio of tokens to characters as the measure, and its variation across scripts, with Latin-script text at the favourable end and scripts absent from the training corpus at the other
    - the direct consequences, since sequence length is what is billed, what fills the context window, and what the attention cost is quadratic in
    - numerals segmented in ways that split place value across tokens, established here as the mechanism behind arithmetic failures later
    - code, whitespace runs and indentation as their own case, where a vocabulary trained with code in it carries multi-space tokens and one trained without it does not
  - leads into: embedding

- one-hot representation, and why it is discarded
  - prereq: what a token is, fully-connected network as a system of equations (idea1)
  - representations
    - a token identifier expanded into a vector as long as the vocabulary, zero everywhere except a single one, so that the integer becomes something a matrix can multiply
    - every pair of distinct one-hot vectors being exactly equally far apart, so that the representation carries the identity of the token and nothing else about it
    - the size problem, where a vocabulary of fifty thousand gives a fifty-thousand-wide input and a first weight matrix to match
    - the multiplication of a one-hot vector by a matrix shown to select a single row, which is the observation the next entry is built on
  - leads into: embedding

- embedding, the vector and the table
  - prereq: one-hot representation, fully-connected network as a system of equations (idea1)
  - representations
    - the embedding matrix as one row per vocabulary entry, of a chosen width, with the row for a token being that token's embedding
    - the lookup identified with the matrix multiplication from the previous entry, so that the embedding layer is a fully-connected layer with a one-hot input and is implemented as an index because that is cheaper
    - the width as an architectural constant chosen once, with the parameter count of the table computed explicitly as vocabulary size times width
    - the table's rows as ordinary trainable parameters, initialised like any other weights and updated by the same descent, drawing on idea1's initialisation and descent entries
    - the fixed width made explicit as the answer to the sketch's question: the width is a constant of the architecture and the lookup is by token identity, so nothing about one token's vector depends on what surrounds it or on how long the input is
    - the count of vectors growing with the input while the width does not, shown by tokenising inputs of three different lengths and stacking their rows, so that the shape is n by width with only n varying
    - the untrained table as noise, with the statement that a random row is a coordinate carrying nothing, and that everything the coordinates come to mean arrives from training and from nowhere else
  - leads into: geometry of embedding space, how embeddings are trained

- geometry of embedding space
  - prereq: embedding
  - representations
    - distance and cosine similarity as the two readings of closeness, with the difference between them stated: one is sensitive to vector length and the other is not
    - nearest neighbours of a chosen token listed from a trained table, as the only direct evidence that the coordinates carry anything
    - a projection of a high-dimensional table down to two dimensions for viewing, with the distortion stated plainly, since a projection can invent clusters and can hide them
    - direction as the carrier of relation rather than position, with the difference between two vectors as the object of interest
    - the analogy arithmetic (the "king minus man plus woman" family) presented together with its known failure modes: the correct answer is usually excluded from the candidate set by hand, the effect is far weaker off the curated examples, and it is a property of particular static embeddings rather than a general fact about vector representations
    - anisotropy of trained embedding spaces, where vectors occupy a narrow cone and raw cosine similarities are compressed into a high and narrow band, with centring as the usual correction
    - what the space does not contain, stated to close the usual overreading: no axis has a meaning that was assigned, and an interpretable direction is found after the fact rather than designed
  - leads into: how embeddings are trained, contextual representation

- how embeddings are trained
  - prereq: embedding, loss surface and gradient descent (idea1), backpropagation (idea1), stochastic gradient descent (idea1)
  - representations
    - the general statement first, that an embedding table has no objective of its own and acquires its structure entirely from whatever loss sits downstream of it
    - the skip-gram objective, where the vector for a token is pushed to predict the tokens that occur near it, with negative sampling as the practical form
    - the continuous-bag-of-words objective as the same idea reversed, predicting the token from its neighbours
    - the count-matrix factorisation objective, where a matrix of co-occurrence counts is factorised so that the dot product of two vectors matches a function of how often the pair occurs
    - subword composition, where a token's vector is the sum of the vectors of its character n-grams, so that a token never seen in training still receives a vector
    - the sparse update pattern, where one mini-batch touches only the rows of the tokens it contains, so that a rare token's row is updated a handful of times over a whole training run and a frequent token's row constantly
    - the distributional premise stated as the premise it is, that tokens appearing in similar contexts receive similar vectors, and its limitation, that a word with two unrelated senses receives one vector sitting between them
    - the embedding table of a generative model trained by next-token prediction alone, with no separate embedding objective at all, as the case that matters for the rest of this idea
  - leads into: contextual representation

- contextual representation
  - prereq: how embeddings are trained, geometry of embedding space
  - representations
    - the two-sense problem from the previous entry restated as the motivation: one row per token cannot serve a token with two meanings
    - the distinction drawn explicitly between a static vector, fixed per token by lookup, and a contextual vector, computed per position from the whole sequence
    - the same token at two positions in one input, carrying identical rows on entry and different vectors after a few layers, as the demonstration
    - the residual stream as the running representation, one vector per position, written to and read from by each block in turn, with the embedding row as the value it is initialised to
    - the width of that stream fixed at the embedding width for the whole depth, so that every block reads and writes the same shape
    - the depth-wise reading, where early positions carry something close to the token's identity and later ones carry something closer to a prediction, with the layer index as the axis
  - leads into: position, attention

- position
  - prereq: contextual representation
  - representations
    - the problem demonstrated before the solution: a mechanism that combines all positions symmetrically gives the same answer for a sentence and for its shuffle, so order has to be supplied separately
    - learned absolute position embeddings, one trainable vector per position index, added to the token's vector, with the ceiling that follows from having a fixed number of them
    - sinusoidal position encoding, where the vector is a fixed function of the index made of sine and cosine at a range of frequencies, with the relative-offset property that motivates the construction, and with idea1's complex-exponential material available for reading it as rotation
    - relative position, where what enters the mechanism is the distance between two positions rather than each absolute index
    - rotary position embedding, where the query and key vectors are rotated by an angle proportional to their position so that their dot product depends on the difference of positions, presented as the currently standard choice
    - extrapolation beyond the training length as the practical question every scheme is judged on
  - leads into: attention

- attention
  - prereq: position, contextual representation, fully-connected network as a system of equations (idea1)
  - representations
    - the mechanism stated as a weighted average before any of its names appear: each position produces a new vector as a weighted sum of vectors from all positions, and everything else is how the weights are computed
    - the three projections of the residual stream, into a query, a key and a value, each a matrix multiplication of the same input vector
    - the score between two positions as the dot product of one's query with the other's key, with the scaling by the square root of the width and the reason for it
    - softmax over the scores at one position, turning them into weights that are positive and sum to one, drawing on idea1's softmax material
    - the output at a position as those weights applied to the value vectors, written back into the residual stream
    - the attention pattern as a matrix of weights, one row per position, displayed for a real short input
    - causal masking, where every score against a later position is set to minus infinity before the softmax, so that no position can read the future, and the statement that this single constraint is what makes generation one token at a time coherent with training
    - the direct answer to the sketch's question about prior tokens shaping the next: they shape it through these weights and through nothing else, and the weights are recomputed at every layer and at every position
    - the quadratic cost in sequence length, computed as the size of the score matrix, established here because it is the reason the context window is finite
  - leads into: multi-head attention, the block, the context window

- multi-head attention
  - prereq: attention
  - representations
    - the width split into several groups, with an independent query, key and value projection per group, so that several weighted averages are computed in parallel over the same input
    - the outputs of the groups concatenated and passed through one more projection, restoring the residual stream's width
    - the parameter count unchanged relative to a single wide head, with the observation that the split costs nothing and buys the ability to attend to several things at once
    - attention patterns from different heads on the same input, shown to differ, with a caution that a head's pattern invites more interpretation than it supports
  - leads into: the block

- the block, and what surrounds attention
  - prereq: multi-head attention, fully-connected network as a system of equations (idea1)
  - representations
    - the position-wise feed-forward network, applied identically and independently at every position, expanding the width by a factor and contracting it back, with its parameter count exceeding the attention part's
    - the two sublayers, attention and feed-forward, each wrapped in a residual connection so that each writes a correction into the stream rather than replacing it
    - layer normalisation at each sublayer, with its position before or after the sublayer named as a real architectural choice, and idea1's normalisation material pointed to rather than repeated
    - the block as the unit that is stacked, with depth as the count of blocks and every block holding its own parameters
    - the full parameter count of a small stack computed explicitly, embedding table included, so that the proportions between the parts are visible
  - leads into: the output distribution

- the output distribution
  - prereq: the block, what a neuron is and where the name came from (idea1)
  - representations
    - the final vector at the last position projected to one score per vocabulary entry, so that the output width is the vocabulary size
    - weight tying, where that projection reuses the embedding table transposed, with the parameter saving and the reading of a score as a dot product between the running representation and a token's own row
    - softmax over the vocabulary turning the scores into a probability distribution, with the distribution for a real short prompt displayed as a ranked list rather than as a plot
    - the shape of a typical distribution, with a handful of plausible continuations carrying most of the mass and a long tail carrying the rest
    - the training objective identified as cross-entropy between this distribution and the token that actually followed, pointing back to idea1's loss entry, with the observation that every position in the sequence supplies one such term at once
    - perplexity as the exponential of the average loss, and its reading as an effective number of equally likely choices
  - leads into: autoregressive generation, sampling

- autoregressive generation
  - prereq: the output distribution, attention
  - representations
    - the loop written out as four steps: tokenise the prompt, run the stack, choose one token from the distribution at the last position, append it, and run again
    - the appended token entering the next pass as an ordinary input token, indistinguishable from the prompt's tokens, which is what "autoregressive" names
    - the causal mask from the attention entry identified as the reason the loop is consistent with training: the prediction at each position during training used only earlier positions, which is exactly the situation at generation time
    - the key-value cache, where each pass recomputes only the new position's query and reuses the stored keys and values of every earlier one, with the cost per generated token dropping from the whole sequence to one position
    - the memory the cache occupies, computed as depth times heads times width times sequence length, established as the real limit on how long a generation can run
    - error accumulation, where a token once emitted is conditioned on for the rest of the generation and cannot be revised
    - the prompt as the only conditioning there is, so that the distinction between instruction and data inside a prompt is a convention of the text and not a property of the mechanism
  - leads into: sampling and decoding, the context window

- sampling and decoding
  - prereq: autoregressive generation, the output distribution
  - representations
    - greedy decoding as always taking the highest-probability token, with its output shown to be repetitive and its determinism shown to be complete
    - temperature as a divisor applied to the scores before the softmax, with the same distribution shown at several temperatures, flat at high values and concentrated at low ones, and the limits named as uniform and as greedy
    - top-k sampling, truncating to a fixed number of candidates and renormalising
    - nucleus sampling, truncating to the smallest set whose probability mass exceeds a threshold, so that the candidate count adapts to how confident the distribution is
    - repetition and presence penalties as adjustments to the scores of tokens already emitted
    - beam search as the alternative shape, keeping several partial sequences and scoring whole continuations, with the reason it is standard in translation and not in open-ended generation
    - the same model and the same prompt under several decoding settings, so that the decoding choice is seen to change the output as much as a change of model would
  - leads into: the context window

- the context window
  - prereq: autoregressive generation, attention, token counts across languages
  - representations
    - the window as the number of tokens the model can attend over, counted in tokens and therefore dependent on the tokeniser
    - the two costs that set it, the quadratic score matrix from the attention entry and the linear key-value cache from the generation entry, with the second dominating in practice during generation
    - what happens at the boundary, with truncation of the oldest tokens and the loss of anything that was there, contrasted against summarising the oldest tokens into fewer
    - position extrapolation beyond the trained length, connecting back to the position entry, and the degradation observed when a scheme is pushed past it
    - the practical accounting, where prompt, generated output and any retrieved material all draw on the same budget
  - leads into: pooled representations

- pooled representations, and what embeddings are used for outside generation
  - prereq: contextual representation, embedding, the context window
  - representations
    - the third part of the correction stated at the head of this file, delivered here on purpose after the per-token picture is complete: a single fixed-width vector for a whole passage is produced by collapsing the per-position vectors, not by any property of the embedding
    - mean pooling over positions, and reading off a designated position, as the two usual collapses, with the note that a purely causal model's last position is the natural choice while a bidirectional one uses a reserved position
    - the objective a retrieval embedding is trained under, contrastive rather than next-token, so that similar passages are pulled together and dissimilar ones pushed apart, and the statement that this is a different training objective and not a different kind of vector
    - nearest-neighbour search over stored passage vectors as the mechanism behind retrieval, with the index as an engineering concern named and not expanded
    - the failure this exposes, that a passage vector is a lossy summary and two passages with opposite meaning can sit close together if they share vocabulary and structure
  - leads into: tokeniser artefacts

- tokeniser artefacts, and what they explain
  - prereq: token counts across languages, autoregressive generation, pooled representations
  - representations
    - the closing entry, assembled as a set of observed model failures each traced back to a specific mechanism established earlier in this idea
    - counting the letters in a word, failing because the token is the unit and the characters inside it were never separately represented
    - arithmetic on long numbers, failing because place value is split unevenly across tokens by the vocabulary, with the same number tokenised two ways to show the inconsistency
    - reversing a string or spelling a word, failing for the same reason as counting
    - the sensitivity of an answer to a change in prompt whitespace, traced to a different segmentation and therefore different input rows
    - a rare or specialised term segmented into many pieces, with the connection back to the sparse-update entry: its pieces' rows were updated rarely and carry correspondingly less
    - the closing structural point of the whole idea, that every one of these failures is a consequence of decisions made in the first four entries, before any network appeared, and none of them is a mystery about the model
  - leads into: nothing; closing entry

## out of scope for this idea

- neural network fundamentals: layers, activations, initialisation, loss, gradient descent, backpropagation, optimisers, all in idea1
- differential equations, attractors, chaos, fractals: all in idea2
- the encoder-decoder form of the transformer, cross-attention, and machine translation as a task: named nowhere, the flow is decoder-only throughout
- efficient attention variants (sparse, linear, sliding-window, grouped-query) beyond the cost argument that motivates them
- training at scale: data collection and filtering, tokenizer training corpora beyond the statement that the corpus decides the vocabulary, distributed training, mixed precision
- everything after pretraining: instruction tuning, preference optimisation, reinforcement learning from feedback, and evaluation
- multimodal tokenisation of images and audio, which shares the vocabulary idea and nothing else
- mechanistic interpretability beyond the cautions attached to attention patterns and to interpretable directions
- proofs and capacity results: nothing about what a transformer can or cannot represent in principle
