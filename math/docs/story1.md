# story1 - the first story

## Scope

One continuous presentation flow that starts with the perceptron as the historical and conceptual starting point, generalises through the modern artificial neuron and the fully-connected network, uses the network's training as the motivation for everything underneath, and lands on derivative and integral as the calculus capstone. Eighteen steps, each one a dedicated beat in the story.

## Relationship to math/docs/idea1.md

idea1.md is the catalog of terms and their representational angles. This file is the order in which those terms surface and the connective logic between them. Each step lists the catalog entries it draws on and does not re-state their content; the catalog is the source of truth for what gets shown per term.

## Relationship to math/docs/vis_story1.md

Specific visualisations and concrete animation choices live in vis_story1.md, a separate file written after this one. This file makes no scene-level prescriptions; only the flow, the bridges, and pacing notes appear here.

## Audience assumption

No working memory of calculus. The term "neural network" is new or hazy. Arithmetic, basic plotting, and the idea that one quantity can depend on another are assumed; everything heavier than that gets unfolded on screen at the pace described below.

## Pacing principle

Every term in the catalog is meant to land as its own animation beat. Compressing two terms into one beat to save time is not in scope. When a step contains multiple terms, each one is unfolded in turn, with the bridges between them as their own micro-beats.

## Step 1 - perceptron, the historical and conceptual starting point

Draws on (from idea1): "perceptron, the historical and conceptual starting point of neural networks"
Arrives at: the perceptron (Rosenblatt, late 1950s) is held as the original mathematical model that started the neural-network field - a single unit that takes a weighted sum of inputs, applies a hard threshold, and outputs 0 or 1; the perceptron learning rule is held as the first algorithm that automatically adjusted weights from examples; the geometric reading as a separating hyperplane is on screen; the McCulloch-Pitts neuron (1943) is named as the fixed-weight predecessor; the XOR limitation and the Minsky-Papert 1969 critique that closed the field's first chapter are introduced
Bridge from previous step: opening beat
Pace note: long; the model, the learning rule, the geometric reading, the limitation, and the critique each deserve their own micro-beat inside this step

## Step 2 - neuron, the modern generalisation of the perceptron

Draws on (from idea1): "what a neuron is and where the name came from"
Arrives at: the modern artificial neuron is held as the perceptron generalised by replacing the hard threshold with a smooth differentiable activation function (sigmoid, hyperbolic tangent, rectifier); the change is identified as the technical enabler that re-opened the field after the AI winter, because differentiable activations make gradient-based learning possible across stacked layers; the term "neuron" is held as a deliberate biological analogy carried forward from the 1940s, not a claim that this object is a brain cell; the biological-versus-mathematical distinction is made explicit to keep the analogy honest
Bridge from previous step: the perceptron's hard threshold blocks gradient-based training across multiple layers; replacing it with a smooth activation removes the block and is the move that makes everything later in the story possible
Pace note: long; the perceptron-to-neuron transition (rigid threshold to differentiable activation) is its own beat, separate from the activation-function deep dive that arrives later as step 10

## Step 3 - fully-connected network, composition of neurons into layers

Draws on (from idea1): "fully-connected network as a system of equations" (the layered-graph drawing representation)
Arrives at: a layered graph (input layer, one or more hidden layers, output layer) where each layer's neurons connect to every neuron in the next layer; the network is held as a structure built by composing many copies of the neuron from step 2
Bridge from previous step: a single neuron is too simple to compute anything interesting; stacking and connecting many copies is where capability comes from
Pace note: medium; the structure of layers lands cleanly before any parameter appears

## Step 4 - parameters of the network, weights and biases as tunable values

Draws on (from idea1): "fully-connected network as a system of equations" (the parameter-count representation, the weight-sharing-free reading)
Arrives at: every weight and every bias is held as a named, tunable value; the parameter count of a small example network is computed explicitly; "training" is held from this point on as the act of changing these numbers and only these numbers
Bridge from previous step: the layered graph from step 3 had unlabelled edges and nodes; this step labels every edge and node with the actual numerical knob it carries
Pace note: medium; an explicit parameter count for a small example helps the scale of real networks land later

## Step 5 - network as a system of equations, every variable written out explicitly

Draws on (from idea1): "fully-connected network as a system of equations" (the unrolled scalar-equation form representation, the forward-pass view)
Arrives at: the network is held as a concrete equation set, with every parameter and intermediate value appearing as a labelled variable; the network is no longer a black box but a stack of trivial equations chained together
Bridge from previous step: the parameters are now named knobs (step 4); making the computation that uses them visible removes the last bit of mystery from the structure
Pace note: dense; each equation appears with one variable highlighted at a time, no compression

## Step 6 - same network compressed to matrix form, smooth notational move from step 5

Draws on (from idea1): "fully-connected network as a system of equations" (the matrix-vector form representation, the computational-graph form representation)
Arrives at: the equation set from step 5 is rewritten as one matrix multiplication plus one vector addition per layer, with the activation function applied element-wise; the matrix form is held as compression of notation rather than a different model
Bridge from previous step: the explicit equation set was concrete but verbose; folding it into matrix form preserves every value while making the structure visible at a glance and is the form that the solving methods consume next
Pace note: medium; the equation-to-matrix translation is shown step by step, not as an end-product

## Step 7 - loss function, what gets measured

Draws on (from idea1): "loss surface and gradient descent" (the loss-as-scalar-function-of-parameters representation, the loss-function-choice-as-design-knob representation)
Arrives at: "wrong" is turned into a single number called the loss; the canonical loss equations are introduced (mean squared error, cross-entropy, hinge), each paired with the task it fits (regression, classification, margin-based classification); the loss is held as a function of the parameters with the data held fixed
Bridge from previous step: the network is now a compact expression that turns an input into an answer; before asking whether its parameters can be solved for, "wrong" has to be a number, because every solving method that follows, analytic or iterative, minimises exactly this number
Pace note: long; at least one loss equation appears in full with each of its terms unpacked

## Step 8 - solving the system, analytic route

Draws on (from idea1): "analytical solution" (closed-form via matrix inversion, least-squares via pseudo-inverse, residual-error view, geometric projection reading)
Arrives at: a linear-only network (no activation function) on a small dataset is solved in one shot by the closed-form expression (matrix inverse or pseudo-inverse); the residual error, which is the squared-error loss from step 7, is shown to be exactly minimised; the analytic route is felt as satisfying
Bridge from previous step: the loss is defined (step 7) and the system is in matrix form (step 6), so "can the loss just be driven to its minimum in one calculation" becomes literal; for the simplest case the answer is yes, with no iteration
Pace note: long; the closed-form solution lands as a payoff and deserves its own animation beat

## Step 9 - solving the system, numerical route motivation

Draws on (from idea1): "analytical solution" (the failure-mode representations: non-linearity blocking the closed form, parameter count exceeding data, computational-cost reading)
Arrives at: the moment any activation function appears the closed form breaks; the moment the parameter count grows large the cube-of-parameter-count inversion cost makes the closed form impractical even when it technically applies; a search-based iterative approach is accepted as necessary for any realistic network
Bridge from previous step: the analytic route is satisfying on the toy case but breaks the moment the network gets non-linear or large; this step is the transition that sets up everything that follows
Pace note: medium; the failure modes are the motivation for the next steps and need to be felt, not glossed

## Step 10 - activation function, what keeps the network differentiable end-to-end

Draws on (from idea1): "what a neuron is and where the name came from" (the smooth-activation-replacement representation), "fully-connected network as a system of equations" (the activation-as-the-single-source-of-non-linearity representation)
Arrives at: the activation function is held as doing two jobs - inject non-linearity (without it, depth collapses to one linear layer) and stay differentiable so gradients can flow through it; the canonical activations (sigmoid, hyperbolic tangent, rectified linear unit, softmax) are introduced by equation, with each function and its derivative shown side by side
Bridge from previous step: the closed form broke on the activation function, so the activation function is the thing to look at; descent on the loss is only possible when the network's computation is differentiable, and that property is carried by the activation function at every layer
Pace note: long; each canonical activation gets its own beat with its equation and its derivative on screen at once

## Step 11 - gradient descent

Draws on (from idea1): "loss surface and gradient descent" (the loss-as-scalar-function representation, the low-dimensional slice view, the contour-plot view, the gradient as the local compass, the update rule, the iterative-trajectory view, the loss-versus-iteration plot, the learning-rate sensitivity, the local-minimum / saddle-point behaviour)
Arrives at: the full descent picture - the loss surface in parameter space, the gradient as the local compass, the fixed-size step in the negative-gradient direction, repeated many times; the update rule appears as one equation
Bridge from previous step: the loss is defined (step 7), the network is differentiable end-to-end (step 10), so the gradient of the loss with respect to every parameter is computable; descending it is the obvious move
Pace note: very long; this is the centrepiece of the story; every representation from the catalog entry deserves its own animation beat

## Step 12 - backpropagation

Draws on (from idea1): "backpropagation"
Arrives at: backpropagation is held as the specific algorithm that computes the gradient of the loss with respect to every parameter, by applying the chain rule layer-by-layer from output back to input, with cached forward activations reused during the backward pass; the algorithm is identified as reverse-mode automatic differentiation specialised to the computational graph of a neural network; the backward-pass cost is roughly twice the forward pass; the vanishing and exploding gradient problems are introduced as the practical pitfalls in deep networks, with gradient clipping and skip / residual connections named as defences
Bridge from previous step: gradient descent needs the gradient; with many parameters, the gradient cannot be computed naively; backpropagation is the trick that makes the cost linear in network size rather than quadratic
Pace note: very long; the chain-rule structure layer-by-layer is exactly the kind of thing this style of presentation is built for

## Step 13 - weight initialisation, common schemes and what each preserves

Draws on (from idea1): "weight initialisation"
Arrives at: the starting values of the parameters are held as important rather than arbitrary; the all-zero or all-equal failure (symmetry problem) is understood; common schemes are introduced (uniform random within a small symmetric range, Xavier / Glorot initialisation for sigmoid-family activations, He / Kaiming initialisation for rectifier-family activations, orthogonal initialisation as a stricter signal-norm preserver, sparse initialisation as an alternative) with the motivating concern for each (variance preservation across layers, activation-aware variance, exact signal-norm preservation); bias initialisation and the "dead neuron" issue for rectifiers are named
Bridge from previous step: gradient descent (step 11) and backpropagation (step 12) move the parameters from wherever they start, and the starting point was left unstated; it is not arbitrary, because a bad start leaves the descent stalled on the flat parts of the activations, lets the gradient vanish or explode through the layers just seen, or lands the trajectory in a poor basin; the schemes are the reasons the start is chosen the way it is
Pace note: medium; the comparison of training trajectories from different initialisations is the natural payoff, and it is available here because training now exists; its specific visualisation belongs in vis_story1.md

## Step 14 - brief survey of other numerical methods

Draws on (from idea1): "numerical optimisation methods, survey beyond gradient descent"
Arrives at: gradient descent is held as one of many numerical methods; momentum, Nesterov accelerated gradient, Newton's method, quasi-Newton methods (BFGS, L-BFGS), the conjugate-gradient method, and the adaptive-learning-rate family (Adagrad, RMSProp, Adam) are introduced; each is described in one beat by what it tries to fix relative to plain gradient descent (oscillation, slow narrow valleys, learning-rate tuning, sensitivity to the curvature of the loss surface); the first-order versus second-order distinction lands, along with the practical fact that first-order adaptive methods dominate in deep-learning practice
Bridge from previous step: gradient descent is the workhorse, but it is one option in a wider family; the brief survey makes the choice feel less arbitrary and prepares the ground for the stochastic variant that is the actual real-world tool
Pace note: medium; each method gets one beat naming what it does differently, without unfolding the underlying math

## Step 15 - stochastic gradient descent

Draws on (from idea1): "stochastic processes (brief)" (full topic), "stochastic gradient descent" (full topic)
Arrives at: "stochastic" is held as estimating the gradient from a small random subset (a mini-batch) of the data rather than the whole dataset; the trajectory comparison (clean full-batch path versus noisy mini-batch path on the same loss surface) lands; the noise is felt as not merely tolerated but useful for escaping local minima and saddle points; batch size and learning-rate schedule are named as the practical knobs
Bridge from previous step: the family of numerical methods is now in view; the variant that is universal in real-world training is the stochastic one, and the reason for that needs its own beat
Pace note: long; the stochastic-processes catalog entry feeds in here as prerequisite vocabulary, so both catalog entries are unfolded in this step

## Step 16 - differential equations in neural networks, all three angles in detail

Draws on (from idea1): "differential equations in neural networks"
Arrives at: three places where differential equations appear inside neural-network practice are introduced and each is given its own beat
- (i) training dynamics viewed as a continuous-time descent equation: gradient flow as the infinitesimal limit of gradient descent, with the link back to step 11; the stochastic differential equation (Langevin) reading of stochastic gradient descent is included here as the natural follow-up to step 15
- (ii) continuous-depth architectures: the forward pass framed as the integration of an ordinary differential equation across a depth variable (sometimes called neural ordinary differential equations); residual networks reread as the forward-Euler discretisation of such an equation; the adjoint sensitivity method named as the training procedure
- (iii) the differential structure inside specific layer types and training set-ups: batch normalisation's running-statistics update equation, recurrent networks as discrete-time dynamical systems, physics-informed neural networks (PDE-in-loss), score-based diffusion models - each treated as a small case study with at least one defining equation
Bridge from previous step: stochastic gradient descent closed out the main training-algorithms thread; this step is a side-window showing that the subject keeps connecting back to differential equations even after the main thread is done
Pace note: long; each of the three angles gets its own dedicated beat with at least one defining equation

## Step 17 - derivative, calculus capstone

Draws on (from idea1): "derivative, first order" (all representations), "derivative, second order" (all representations), "gradient" (all representations, now folded in here as the multi-input case of the derivative), "physical meaning synthesis across derivatives" (the time-derivative and gradient-related representations; the Laplacian-specific representations move to idea2)
Arrives at: the full meaning of "derivative" lands - point slope, derivative-as-its-own-function, secant-to-tangent, finite-difference, partial derivative, time derivative, gradient as the bundle of partials, physical readings as velocity / acceleration / steepest-ascent direction / force from a potential; everything from step 11 onward is held in retrospect as having been built on this single object
Bridge from previous step: every algorithm shown earlier (gradient descent, backpropagation, stochastic gradient descent, gradient flow) used the word "derivative" or "gradient" as if it were obvious; this step makes it obvious in retrospect, with the catalog's full menu of representations laid out
Pace note: very long; this is the capstone; each representation from the referenced catalog entries gets its own beat

## Step 18 - integral, calculus capstone

Draws on (from idea1): "integral" (all representations)
Arrives at: the full meaning of "integral" lands - signed area, running accumulation, antiderivative, definite and indefinite, Riemann-sum approximation, accumulation of a rate over time, multidimensional and line integrals, integral as the inverse of differentiation, integral over a probability density; the places where this object already appeared in the story are recognised in retrospect (loss as accumulation of per-sample errors, integration along a depth axis inside a continuous-depth network, integrals over probability densities, time integration of gradient flow)
Bridge from previous step: the derivative has been unfolded; its inverse operation is the integral, and almost every place earlier in the story where "total" or "accumulation" appeared was secretly an integral
Pace note: very long; matches step 17 in density, runs the catalog's representations one beat each

## Out of scope for this story

- Attractors, deterministic chaos, fractals, bifurcation diagrams, complex exponent, Euler's identity, Laplacian: all move to idea2
- Tokens, embeddings, autoregressive generation, language models: all in idea3
- Deep architectures beyond fully-connected (convolutions, attention): not addressed at this level
- Specific optimiser internals beyond what step 14 names: out of scope
- Regularisation techniques (weight decay, dropout, layer normalisation): touched in step 16 as differential-structure carriers but not unfolded as their own steps
- Chain-rule mechanics in their full generality: only the layer-by-layer application inside backpropagation is shown
