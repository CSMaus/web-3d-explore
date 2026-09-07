# story3 - the third story

## scope

one continuous presentation flow that starts with a string of text and ends with a generated paragraph, taking the shortest honest path between them: text becomes tokens, tokens become vectors, vectors are mixed across positions so that earlier text can shape later text, the last vector becomes a distribution over the vocabulary, and one draw from that distribution is appended and the whole thing runs again. eighteen steps, each one a dedicated beat in the story.

## relationship to math/docs/idea3.md

idea3.md is the catalog of terms and their representational angles. this file is the order in which those terms surface and the connective logic between them. each step lists the catalog entries it draws on and does not re-state their content; the catalog is the source of truth for what gets shown per term.

## relationship to math/docs/idea1.md

five of idea1's entries are used here and are named where they surface: the fully-connected layer at steps 6 and 12, softmax at steps 10 and 13, the loss and cross-entropy at step 13, backpropagation and stochastic gradient descent at step 8. story1 delivers all of them; this story assumes them and does not re-derive any.

story1 is therefore a genuine prerequisite for this one, which story2 is not. the alternative would be to re-teach a layer, a loss and a descent inside this flow, which would double its length and duplicate story1's centrepiece.

## the correction this story carries

the original sketch asks why the embedding vector's length is fixed regardless of input length. the answer is split deliberately across three steps rather than given at once, because the question conflates two objects and answering it in one place would preserve the conflation:

- step 6 establishes that one token's vector has a fixed width because the width is an architectural constant and the lookup is by token identity
- step 6 also shows the count of vectors growing with the input while the width does not, so that the shape is n by width with only n varying
- step 17 introduces the single fixed-width vector for a whole passage, as something produced by deliberately collapsing the n vectors, and never as a property of the embedding

## audience assumption

a neural network is known as a stack of layers holding weights and biases, trained by descending a loss, at the level story1 leaves it. no experience of language models. no assumption that "vector" means more than a list of numbers, and none that the transformer is a familiar object.

## pacing principle

as in story1 and story2: every term in the catalog is meant to land as its own animation beat, and compressing two terms into one beat to save time is not in scope.

one addition specific to this story. every step from 6 onward can be shown on one real short input carried through the entire flow, and it is: the same prompt appears at every step, with the step's object computed on it. the running example is the connective tissue, and steps that break away from it to make a general point say so.

## step 1 - text as bytes, characters and code points

draws on (from idea3): "text as bytes, characters and code points"
arrives at: one string shown three ways, as read, as code points and as bytes, with three different counts; variable-length encoding, so that byte count and character count part company across scripts; combining marks and normalisation, where two indistinguishable strings are unequal; case, whitespace and punctuation established as ordinary characters; and the reason neither the byte nor the character is the working unit, since bytes give sequences too long and characters give a vocabulary too small to carry anything
bridge from previous step: opening beat
pace note: medium; the three-counts beat is the one that has to land, because every artefact in step 18 traces back to it

## step 2 - the token

draws on (from idea3): "what a token is"
arrives at: a token as a chunk from a fixed vocabulary, sitting between character and word, with a sentence segmented and its boundaries marked; the token identifier as an integer index, and the statement that this integer is all the model receives; the same sentence segmented by three different vocabularies, so segmentation is a property of the tokeniser and not of the language; leading whitespace carried inside the token; common words as one token and rare words as several; vocabulary size as an architectural constant with its trade; and the special tokens that correspond to no text
bridge from previous step: the two obvious units are both wrong, so the unit is chosen rather than given, and the choice is made once and frozen into a vocabulary
pace note: long; the three-vocabularies beat is the one that prevents tokenisation from being mistaken for a fact about language

## step 3 - how the vocabulary is built

draws on (from idea3): "tokenisation algorithms"
arrives at: byte-pair encoding built on screen from a small corpus, merging the most frequent adjacent pair repeatedly, with the merge list as the trained artefact; the list replayed on unseen text, so encoding is deterministic; byte-level byte-pair encoding, where the alphabet is the 256 byte values and the unknown token disappears; WordPiece as the same shape with a likelihood criterion; the unigram method as the opposite construction, pruning a large candidate set and choosing the most probable segmentation; SentencePiece as the packaging that needs no prior word splitting; and the training corpus as the thing that decides all of it
bridge from previous step: the vocabulary was presented as given, and it is not: it is trained, on text, by a procedure short enough to run on screen
pace note: long; the merge construction is a payoff beat and runs at one merge per beat until the pattern is obvious

## step 4 - going back, and what does not survive

draws on (from idea3): "detokenisation, and where it is not the inverse"
arrives at: decoding as concatenation, exact for a byte-level vocabulary; the cases where it is not exact, with normalisation not undone, whitespace conventions reappearing and lower-casing destroying what no decoder restores; a multi-byte character split across two generated tokens and the buffering that streaming therefore needs; and round-trip checking as the practical test
bridge from previous step: the model will emit tokens, and text has to come back out, so the return trip is worth checking before anything is built on top of it
pace note: short; a completeness beat, deliberately brief

## step 5 - what a token costs

draws on (from idea3): "token counts across languages, and what they cost"
arrives at: one sentence in several languages under one vocabulary, with token counts against character counts; the tokens-per-character ratio and its variation across scripts; the consequences, since sequence length is what is billed, what fills the window and what the attention cost is quadratic in; numerals split so that place value crosses token boundaries, planted here and collected at step 18; and code, whitespace runs and indentation as their own case
bridge from previous step: the round trip is understood, so the remaining question about the vocabulary is a practical one, which is how many tokens a given piece of text actually becomes
pace note: medium; the numerals beat is planted and not explained, and the plant is deliberate

## step 6 - from an integer to a vector

draws on (from idea3): "one-hot representation, and why it is discarded", "embedding, the vector and the table"
arrives at: the one-hot expansion, vocabulary-wide and zero but for a single one, with every pair of distinct one-hot vectors exactly equally far apart, so the representation carries identity and nothing else; the size problem; and the observation that multiplying a one-hot vector by a matrix selects a single row. then the embedding matrix, one row per vocabulary entry at a chosen width, with the lookup identified as that same multiplication implemented as an index because it is cheaper; the width as an architectural constant with the table's parameter count computed; the rows as ordinary trainable parameters under idea1's initialisation and descent; the fixed width stated as the first part of the correction, since the width is a constant and the lookup is by identity, so nothing about a token's vector depends on its surroundings or on the input's length; the count of vectors growing with the input while the width does not, shown on three inputs of different lengths; and the untrained table as noise, with the statement that the coordinates mean nothing until training gives them meaning
bridge from previous step: the model receives integers, and an integer is not something a layer can multiply usefully, since the identifier's numeric value carries no information at all
pace note: very long; two catalog entries in one step because the one-hot form exists here only to be replaced. the fixed-width beat and the growing-count beat are the two the whole step is built to deliver

## step 7 - the shape of the space

draws on (from idea3): "geometry of embedding space"
arrives at: distance and cosine similarity as the two readings of closeness with the difference between them stated; nearest neighbours of a chosen token listed from a trained table as the only direct evidence the coordinates carry anything; a two-dimensional projection with its distortion stated plainly, since a projection invents clusters and hides them; direction as the carrier of relation, with the difference of two vectors as the object; the analogy arithmetic presented together with its failure modes, including that the correct answer is usually excluded from the candidate set by hand; anisotropy, where trained vectors occupy a narrow cone and cosine similarities compress into a high narrow band, with centring as the correction; and the explicit statement of what the space does not contain
bridge from previous step: the table's rows started as noise and end up useful, so the question is what "useful" looks like in a space of a few hundred coordinates, and the answer has to be measured rather than assumed
pace note: long; the analogy-arithmetic beat carries its own correction and is not left as the usual demonstration

## step 8 - where the meaning comes from

draws on (from idea3): "how embeddings are trained"
arrives at: the general statement first, that an embedding table has no objective of its own and takes its structure entirely from the loss downstream of it; the skip-gram objective with negative sampling; the bag-of-words objective as the same idea reversed; count-matrix factorisation, where the dot product is fitted to a function of co-occurrence; subword composition, so an unseen token still gets a vector; the sparse update pattern, where a mini-batch touches only the rows it contains, so a rare token's row is updated a handful of times in a whole run; the distributional premise stated as a premise with its two-senses limitation; and the case that matters here, a generative model's table trained by next-token prediction alone with no embedding objective at all
bridge from previous step: the space has structure that can be measured, and nothing has yet said where the structure comes from; it comes from a loss, and which loss decides what the structure is
pace note: long; the sparse-update beat is planted here for step 18 in the same way step 5 planted the numerals

## step 9 - one row per token is not enough

draws on (from idea3): "contextual representation"
arrives at: the two-senses problem from step 8 restated as motivation; the distinction between a static vector fixed per token by lookup and a contextual vector computed per position from the whole sequence; the same token at two positions in one input, identical on entry and different after a few layers; the residual stream as the running representation, one vector per position, written to and read from by each block, initialised to the embedding row; its width fixed at the embedding width for the whole depth; and the depth-wise reading, from something close to identity early to something close to a prediction late
bridge from previous step: the distributional premise gives a word with two unrelated senses a single vector sitting between them, which is a defect of the object rather than of the training, and fixing it requires the vector to depend on the sentence
pace note: long; the residual stream is introduced here rather than inside the attention step, so that attention arrives as something that reads and writes an object already understood

## step 10 - order has to be supplied

draws on (from idea3): "position"
arrives at: the problem demonstrated before the solution, with a symmetric mixing mechanism giving the same answer for a sentence and its shuffle; learned absolute position embeddings, one trainable vector per index, with the ceiling that follows; sinusoidal encoding as a fixed function of the index built from sine and cosine at many frequencies, with the relative-offset property that motivates it and idea1's complex-exponential material available for reading it as rotation; relative position, where the distance between two positions is what enters; rotary position embedding, where query and key are rotated by an angle proportional to position so the dot product depends on the difference, named as the standard choice; and extrapolation past the trained length as the question every scheme is judged on
bridge from previous step: the contextual vector at a position has to be computed from the whole sequence, and the natural way to combine a whole sequence treats every position alike, which would erase order, so order is added before the combining is built
pace note: long; the shuffle demonstration opens the step and is what makes the rest feel necessary rather than decorative

## step 11 - attention

draws on (from idea3): "attention"
arrives at: the mechanism stated as a weighted average before any name appears, with each position producing a new vector as a weighted sum of vectors from all positions and everything else being how the weights are computed; the three projections of the residual stream into query, key and value; the score as one position's query dotted with another's key, with the scaling by the square root of the width and the reason for it; softmax over the scores at one position, using idea1's softmax material; the output as those weights applied to the value vectors, written back to the stream; the attention pattern as a weight matrix displayed for the running example; causal masking, setting every score against a later position to minus infinity before the softmax, with the statement that this single constraint is what makes generation consistent with training; the direct answer to the sketch's question, that prior tokens shape the next through these weights and nothing else, recomputed at every layer and position; and the quadratic cost computed as the size of the score matrix
bridge from previous step: a contextual vector must be built from all positions, order is now available, and the remaining question is the mechanism, which turns out to be a weighted average whose weights the model computes from the content itself
pace note: very long; the centrepiece of the story, matching step 12 of story1 and step 14 of story2 in weight. every representation in the catalog entry is its own beat, and the causal-masking beat is the one step 15 depends on

## step 12 - the block

draws on (from idea3): "multi-head attention", "the block, and what surrounds attention"
arrives at: the width split into groups with independent query, key and value projections per group, several weighted averages computed in parallel, outputs concatenated and passed through one projection; the parameter count unchanged relative to one wide head; patterns from different heads shown to differ, with a caution against over-reading them. then the position-wise feed-forward network applied identically at every position, expanding and contracting the width, with its parameter count exceeding the attention part's; the two sublayers each wrapped in a residual connection so each writes a correction rather than a replacement; layer normalisation with its position named as a real choice, pointing back to idea1; the block as the stacked unit with depth as the count; and the full parameter count of a small stack computed explicitly, embedding table included
bridge from previous step: one weighted average per position is one thing at a time, and the machinery is cheap enough to run several in parallel; the rest of the block is what turns a mixing step into a layer that can compute
pace note: very long; two catalog entries because the heads are a variation on step 11 rather than a new idea. the explicit parameter count is the beat that puts the parts in proportion

## step 13 - the distribution over the vocabulary

draws on (from idea3): "the output distribution"
arrives at: the final vector at the last position projected to one score per vocabulary entry, so the output width is the vocabulary size; weight tying, reusing the embedding table transposed, with the saving and with a score read as a dot product between the running representation and a token's own row; softmax turning scores into a distribution, displayed for the running example as a ranked list rather than a plot; the typical shape, a handful of plausible continuations holding most of the mass over a long tail; the training objective identified as cross-entropy against the token that actually followed, pointing back to idea1's loss entry, with every position supplying one such term at once; and perplexity as the exponential of the average loss, read as an effective number of equally likely choices
bridge from previous step: the stack turns one vector per position into another vector per position, and the only thing left is to turn the last of those into a statement about what comes next
pace note: long; the weight-tying beat closes the loop back to step 6, which is worth making explicit

## step 14 - one token at a time

draws on (from idea3): "autoregressive generation"
arrives at: the loop written out in four steps, tokenise, run the stack, choose one token, append and run again; the appended token entering the next pass indistinguishable from the prompt's tokens, which is what the word names; the causal mask from step 11 identified as the reason the loop is consistent with training, since the prediction at each training position used only earlier positions, which is exactly the generation situation; the key-value cache, recomputing only the new position and reusing stored keys and values, dropping the per-token cost from the whole sequence to one position; the cache's memory computed as depth times heads times width times length, established as the real limit on a long generation; error accumulation, where an emitted token is conditioned on forever and cannot be revised; and the prompt as the only conditioning there is, so that the distinction between instruction and data inside it is a convention of the text and not a property of the mechanism
bridge from previous step: a distribution over the next token is one token, and a paragraph is not; the whole of the rest is a loop, and the loop is short enough to write on one screen
pace note: very long; the payoff step of the whole story. the cache beat and the error-accumulation beat are the two that are usually skipped and are not skipped here

## step 15 - choosing from the distribution

draws on (from idea3): "sampling and decoding"
arrives at: greedy decoding as always taking the most probable token, with output shown repetitive and determinism shown complete; temperature as a divisor on the scores before the softmax, with one distribution shown at several temperatures and the two limits named; top-k truncation with renormalisation; nucleus truncation to the smallest set whose mass exceeds a threshold, so the candidate count adapts to confidence; repetition and presence penalties; beam search as the alternative shape, with the reason it is standard in translation and not in open-ended generation; and the same model and prompt under several settings, so the decoding choice is seen to change the output as much as a change of model would
bridge from previous step: the loop says "choose one token" and every step so far has left the choice unspecified, and the choice turns out to matter as much as anything the model does
pace note: long; the same-model-different-settings beat is the closing beat of the step and the one that reframes generation as two systems rather than one

## step 16 - the window

draws on (from idea3): "the context window"
arrives at: the window as the number of tokens the model can attend over, counted in tokens and so dependent on the tokeniser from step 5; the two costs that set it, the quadratic score matrix from step 11 and the linear cache from step 14, with the second dominating during generation; the boundary behaviour, truncating the oldest tokens and losing what was there, contrasted against summarising them into fewer; position extrapolation past the trained length, connecting back to step 10, with the degradation observed; and the practical accounting, where prompt, output and any retrieved material draw on one budget
bridge from previous step: the loop can run indefinitely and the mechanism cannot, and the limit is not arbitrary but the sum of two costs both already computed in this story
pace note: medium; largely an assembly beat, drawing three earlier steps together into one number

## step 17 - one vector for a whole passage

draws on (from idea3): "pooled representations, and what embeddings are used for outside generation"
arrives at: the third part of the correction, delivered here on purpose after the per-token picture is complete, that a single fixed-width vector for a whole passage is produced by collapsing the per-position vectors and is not a property of the embedding; mean pooling and reading off a designated position as the two usual collapses, with a causal model's last position as its natural choice; the contrastive objective a retrieval embedding is trained under, pulling similar passages together and pushing dissimilar ones apart, stated as a different training objective and not a different kind of vector; nearest-neighbour search over stored passage vectors as the mechanism behind retrieval, with the index named as engineering and not expanded; and the failure this exposes, that a passage vector is a lossy summary and two passages of opposite meaning can sit close if they share vocabulary and structure
bridge from previous step: everything from step 9 onward has been one vector per position, and the phrase "the embedding of a document" is in ordinary use, so the object that phrase refers to has to be built explicitly and shown to be a construction rather than a given
pace note: long; this step exists to complete the correction begun at step 6 and says so

## step 18 - what the first five steps explain

draws on (from idea3): "tokeniser artefacts, and what they explain"
arrives at: a set of observed model failures, each traced back to a specific mechanism from earlier in this story; counting the letters in a word, failing because the token is the unit and its characters were never separately represented; arithmetic on long numbers, failing because place value is split unevenly by the vocabulary, with the plant from step 5 collected and the same number tokenised two ways; reversing a string and spelling a word, failing for the same reason as counting; an answer changing when prompt whitespace changes, traced to a different segmentation and therefore different input rows; a specialised term segmented into many pieces, connected back to step 8's sparse-update beat, its pieces' rows having been updated rarely; and the closing structural point, that every one of these is a consequence of decisions made in steps 1 to 5, before any network appeared, and none of them is a mystery about the model
bridge from previous step: the mechanism is now complete from a string to a paragraph, and the failures people actually meet have not been mentioned; each one turns out to be a consequence of a choice made in the first five minutes of the story
pace note: long; the closing step. the retracing beat names each failure with the step that explains it, because the point of the story is that the explanation was in place before the model was

## out of scope for this story

- neural network fundamentals: layers, activations, initialisation, loss, gradient descent, backpropagation, optimisers, all in story1, which is a genuine prerequisite for this story
- differential equations, attractors, chaos, fractals: all in idea2 and story2
- the encoder-decoder transformer, cross-attention and translation as a task: the flow is decoder-only throughout and does not name them
- efficient attention variants beyond the cost argument at steps 11 and 16 that motivates them
- training at scale: data collection and filtering, distributed training, mixed precision
- everything after pretraining: instruction tuning, preference optimisation, learning from feedback, and evaluation beyond perplexity at step 13
- multimodal tokenisation of images and audio
- mechanistic interpretability beyond the cautions at steps 7 and 12
- capacity and expressivity results: nothing about what the architecture can or cannot represent in principle
