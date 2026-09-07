# idea1 - math intuition, then a first neural network

## scope

cover the math instincts a viewer needs before the words "neural network" appear, then connect those instincts to the simplest possible network and to the methods that train it. ends just before systems of differential equations (idea2) and before any talk of tokens, embeddings, or language models (idea3).

## audience assumption

no working memory of calculus. "derivative" and "integral" are at most vaguely familiar words. arithmetic, basic plotting, and the idea that one quantity can depend on another are assumed; anything heavier than that gets built up on screen.

## topic chain

- derivative, first order
  - prereq: none
  - representations
    - tangent slope at a single point on a function curve, expressing the local rate as one scalar attached to one input location
    - the derivative as its own function plotted on the same input axis as the original, showing how the rate varies across the whole domain rather than at one point
    - secant slope between two sample points, brought together until they coincide, surfacing the limit definition geometrically
    - finite-difference numerical approximation, replacing the limit with a small non-zero step and exposing where calculus meets computation
    - sign of the derivative as a partition of the input axis into increasing, zero, and decreasing regions, reducing the concept to qualitative monotonicity information
    - small-change ratio of output change to input change (Δy / Δx), grounding the concept in arithmetic before any limits appear
    - linear approximation of the function near a point, with the tangent line serving as a local stand-in and the derivative as its slope
    - first-order partial derivative with respect to one coordinate in a multi-input function, isolating variation in a single direction while others are held fixed
    - first-order time derivative when the independent axis is time, with the physical reading as velocity for position, current for charge, flow rate for accumulated volume
    - the same scalar function differentiated with respect to a coordinate versus with respect to time, in parallel, exposing that the operator is identical and only the variable being changed differs
    - units interpretation, where the derivative carries the function's units divided by the input variable's units
  - leads into: derivative second order, integral, gradient

- derivative, second order
  - prereq: derivative first order
  - representations
    - the second derivative as a third curve on the same input axis alongside the original and the first derivative, so value, rate, and rate-of-rate can be read together
    - concavity sign as a partition of the input axis into curves-up versus curves-down regions, reducing the second derivative to qualitative curvature information
    - inflection points where the second derivative crosses zero, isolating input values at which curvature flips direction
    - second-difference numerical approximation, where the second derivative is estimated as a finite difference of finite differences
    - second partial derivative with respect to one coordinate, isolating curvature in a single direction within a multi-input function
    - mixed second partial derivative with respect to two different coordinates in sequence, capturing how the rate in one direction varies as another coordinate changes
    - second time derivative when the independent axis is time, with the physical reading as acceleration for position, jerk for velocity, change-in-rate-of-flow for many other quantities
    - the same scalar function under second-order spatial and second-order temporal differentiation, side by side, surfacing the parallel structure of the two cases
    - the second derivative as the derivative of the first derivative, expressing the operator's compositional structure rather than presenting it as a fresh definition
    - sign-of-second-derivative as the local "concave up" / "concave down" classifier, determining whether a stationary point is a minimum or a maximum
    - units interpretation, where the second derivative carries the function's units divided by the input variable's units squared
  - leads into: integral, laplacian, physical meaning synthesis

- integral
  - prereq: derivative first order
  - representations
    - signed area between a function curve and the input axis over a fixed interval, with above-axis contributions positive and below-axis contributions negative
    - running accumulation of that area as the upper limit sweeps from left to right, producing a new curve that grows as area is added
    - the indefinite integral (antiderivative) as a family of curves whose derivative recovers the original function, with one curve per choice of additive constant
    - the definite integral as a single number, obtained by evaluating the antiderivative at two endpoints and subtracting
    - riemann-sum approximation, where the area under the curve is decomposed into stacks of rectangles or trapezoids of finite width
    - left-, right-, midpoint-, and trapezoidal-rule variants of the same approximation, each isolating a different choice of sample point inside each strip
    - inverse-of-differentiation framing, where applying the integral to the derivative of a function recovers the original function (up to a constant), making the fundamental theorem visible as an operation cancellation
    - integral as accumulation of a rate over time, with the physical reading: integrating velocity over time gives displacement, integrating current over time gives charge, integrating power over time gives energy
    - multidimensional integral as a volume under a surface above a 2d input domain, with the natural extension to higher-dimensional input
    - line integral along a path, where the integration variable is arc length or another path parameter rather than a flat input axis
    - probability density treated as an integrand, with the integral over a region giving the probability of landing in that region
    - units interpretation, where the integral carries the integrand's units multiplied by the input variable's units
  - leads into: exponent and natural log, loss surface (loss as an accumulated error)

- exponent function and natural logarithm
  - prereq: derivative first order, integral
  - representations
    - the family of curves a^x for different bases a, each with its tangent slope at every point compared against the curve's value at that point, isolating the ratio (slope divided by value) as a base-dependent constant
    - the unique base e for which that ratio equals one everywhere, characterising e as the base whose exponent function is its own derivative
    - the natural logarithm as the inverse function of e^x, plotted as the mirror image across the diagonal y = x
    - the exponential function as the solution to the simplest possible differential equation, where the rate equals the current value (named here, fully treated in idea2)
    - log-linear plotting, where exponential curves become straight lines on a logarithmically scaled vertical axis, exposing exponential structure that is invisible on linear axes
    - the natural logarithm as the integral of 1/x from 1 to x, tying the function back to the integral concept rather than treating it as a brand-new object
    - compound-growth limit definition, where (1 + 1/n)^n approaches e as n grows, surfacing the appearance of e in finite-step compounding
    - exponential decay alongside exponential growth, showing the same operator with a flipped sign in the exponent
    - half-life and doubling time as inverse readings of the same constant, both expressible through the natural logarithm of 2
    - units interpretation, where the argument of any exponent or logarithm is dimensionless and any unit handling happens outside the function
  - leads into: complex exponent and Euler's identity, loss surfaces

- complex exponent and Euler's identity
  - prereq: exponent and natural log
  - representations
    - the complex plane laid out with a real axis horizontally and an imaginary axis vertically, with each point expressible as a sum of a real part and an imaginary part
    - multiplication by the imaginary unit i as a quarter-turn rotation in this plane, separating the algebraic operation from its geometric effect
    - e raised to (i times theta) as a point on the unit circle, with theta the angle measured counter-clockwise from the positive real axis
    - the path traced as theta sweeps from zero upward: a continuous walk around the unit circle, completing one full revolution at theta equals 2*pi
    - the half-turn position at theta equals pi landing exactly at -1, which is the content of Euler's identity
    - the same trajectory decomposed into its real and imaginary parts plotted against theta, producing cosine and sine waves respectively and surfacing why cosine and sine live inside the same complex-exponential object
    - complex multiplication of two unit-modulus complex numbers as the addition of their angles, reframing a multiplicative operation as a rotational one
    - the identity rewritten as e^(i*pi) + 1 = 0, isolating the appearance of five fundamental constants (0, 1, pi, e, i) inside one equation
    - periodicity of the complex exponential, repeating every 2*pi increase in theta
    - analytic-continuation framing, where the exponent function is extended from real inputs to complex inputs without losing its self-derivative property
    - the standing-wave / rotating-wave duality, where a rotation in the complex plane and a sinusoidal oscillation in time are the same object viewed two ways (named here, used heavily in idea2)
  - leads into: gradient (for the multi-input side of differentiation), idea2 (for oscillatory differential equations)

- gradient
  - prereq: derivative first order
  - representations
    - gradient of a scalar function of several inputs, defined as the vector whose components are the partial derivatives with respect to each input coordinate
    - arrow field on the input space, where every input point carries a vector pointing in the direction of fastest increase of the function
    - magnitude of the gradient vector at a point, encoding how steep the function is in its steepest direction
    - zero-gradient points, partitioning the input space into stationary points (minima, maxima, saddles) versus everywhere else
    - the gradient as a one-row matrix of partial derivatives, exposing the linear-algebraic side of the object
    - directional derivative along a chosen unit direction, computed as the dot product of the gradient with that direction, recovering the 1d derivative concept on a slice through the multi-input function
    - level-set picture, where the gradient at a point is perpendicular to the level curve or level surface of the function passing through that point
    - gradient field on the flat input plane drawn directly below a 3d surface plot of the function, showing the relationship between height above and direction-of-steepest-ascent below
    - physical reading as force from a potential in mechanics, where the negative gradient of a potential energy field gives the force vector
    - electrostatic and thermal readings, where the gradient of voltage gives the electric field and the gradient of temperature drives heat flux
    - same scalar field shown under the differentiation operator applied coordinate-wise versus time-wise, exposing the gradient as the spatial sibling of the time derivative
  - leads into: laplacian, gradient descent

- laplacian
  - prereq: derivative second order, gradient
  - representations
    - the laplacian as the sum of unmixed second partial derivatives across all input coordinates, defining the operator concretely
    - coloured overlay on the input space showing the sign of the laplacian at each point, with positive readings where the value is locally below its neighbourhood average and negative where it is above
    - neighbourhood-average framing, where the laplacian at a point measures how much the value at that point differs from the average over a small region around it
    - laplacian as the divergence of the gradient, expressing the operator as a composition of two earlier operators rather than as a fresh definition
    - one-dimensional case, where the laplacian collapses to the ordinary second derivative and the multidimensional intuition reduces to 1d concavity
    - zero-set of the laplacian, partitioning the input space into peaked, dipped, and harmonic (locally flat-on-average) regions
    - heat-equation reading, where the laplacian acts as the source term driving how a temperature distribution flattens over time
    - wave-equation reading, where the laplacian appears as the spatial side of an equation whose temporal side is a second time derivative, surfacing the parallel between spatial and temporal second derivatives
    - same scalar field shown under second-order spatial differentiation (laplacian) versus second-order temporal differentiation (acceleration-like quantity), exposing them as siblings of the same operator under different variables
    - physical reading as a measure of how far a field is from local equilibrium, with steady states corresponding to laplacian-equals-zero regions
    - preview-only mention of the role of the laplacian and related differential operators in systems whose behaviour is studied in idea2
  - leads into: physical meaning synthesis

- physical meaning synthesis across derivatives
  - prereq: derivative first order, derivative second order, gradient, laplacian
  - representations
    - table of the differentiation operator applied to a position-versus-time function: zeroth order is position, first is velocity, second is acceleration, third is jerk
    - table of the differentiation operator applied to a scalar field over space: zeroth order is the scalar value, first-order partials assemble into the gradient, second-order partials assemble into the laplacian and the hessian
    - parallel structure of temporal and spatial differentiation, where the same operator gives time-rate quantities on one axis and space-rate quantities on the other
    - units mapping across orders, where each derivative order divides by another factor of the input variable's units (time, length, etc.)
    - composite equations that combine both spatial and temporal derivatives (heat equation, wave equation as canonical examples), named here only as previews of the equations whose solutions belong to idea2
    - sign behaviour: a positive first derivative means increase, a positive second derivative means the increase is accelerating; the same logic carries over from time to space
    - the same gradient operator wearing different physical clothes: force from a potential (mechanics), electric field from a voltage (electrostatics), heat flux from a temperature (thermal physics)
    - the same laplacian operator wearing different physical clothes: source term in heat diffusion, spatial term in wave propagation, charge density in Poisson's equation
  - leads into: perceptron, what a neuron is (both carry the gradient concept forward into the loss-surface descent later)

- perceptron, the historical and conceptual starting point of neural networks
  - prereq: derivative first order (light)
  - representations
    - the original perceptron model (Rosenblatt, late 1950s) as a single computational unit that takes a weighted sum of inputs, adds a bias, applies a hard threshold, and outputs 0 or 1 depending on whether the sum exceeds the threshold
    - the perceptron learning rule, where on every misclassified example each weight is updated by a fixed amount in the direction that reduces the error on that example, repeated across the dataset until no examples are misclassified
    - geometric reading as a separating hyperplane in input space, with each weight-update step rotating and shifting the hyperplane to better separate the two classes
    - the perceptron convergence theorem, guaranteeing that on linearly separable data the learning rule finds a separating hyperplane in a finite number of updates
    - the XOR problem and related non-linearly-separable cases, demonstrating that a single-layer perceptron cannot represent trivial functions like exclusive-or no matter how long it is trained
    - the Minsky-Papert critique (1969), the formal analysis that proved the linear-separability limitation of the single-layer perceptron and contributed to the contraction of neural-network research through the 1970s (the so-called AI winter)
    - the multi-layer perceptron extension as a conceptual response to the limitation, where stacking perceptrons in layers expands the representational reach, though the original learning rule does not apply across multiple layers (the gap that backpropagation later filled in the 1980s)
    - comparison to the McCulloch-Pitts neuron (1943) as the immediate mathematical predecessor: McCulloch-Pitts had fixed weights and no learning rule; the perceptron added both
    - hardware embodiment as the Mark I Perceptron (late 1950s), built with motor-driven potentiometers as the weights, surfacing that the concept was physically tangible and not purely abstract
    - the perceptron's structural role as the conceptual ancestor of every later neural-network architecture, with the modern feedforward network as its direct generalisation
  - leads into: what a neuron is and where the name came from, fully-connected network as a system of equations

- what a neuron is and where the name came from
  - prereq: derivative first order (light), gradient (light)
  - representations
    - biological neuron schematic with its parts named (dendrites, soma, axon, synapses), as a physical object that takes electrical inputs and produces an electrical output
    - the same object reduced to its computational core: inputs come in, get weighted, get summed, and the result is squashed through an output function
    - early-1940s threshold-logic neuron, with output 0 or 1 depending on whether the weighted sum crosses a threshold, named as the first mathematical neuron model
    - late-1950s perceptron extension, with adjustable weights and a learning rule, but still a hard threshold-style activation
    - smooth-activation replacement (sigmoid, hyperbolic tangent, rectifier), where the hard threshold becomes a differentiable curve and enables later gradient-based training
    - neuron as a single equation: output equals activation function applied to (weighted sum of inputs plus a bias term)
    - neuron as a tiny graph with several input edges, a single computation node, and an output edge, composable with other neurons
    - linear-classifier reading of a single neuron with a threshold or sigmoid activation, where the neuron implements a separating hyperplane in input space
    - bias term as a shifted threshold, isolating why a separate bias parameter is needed even when all inputs are zero
    - naming-origin framing: the term "neuron" was carried over deliberately from neuroscience when the first mathematical models were proposed in the early 1940s, and has stuck through every subsequent generation of model regardless of how far the math has drifted from biology
    - distinction between "neuron" in the biological sense (a cell with intricate ion-channel dynamics) and "neuron" in the mathematical sense (a weighted sum plus an activation function), keeping the analogy honest
  - leads into: fully-connected network

- fully-connected network as a system of equations
  - prereq: neuron, gradient
  - representations
    - layered graph drawing, with nodes per neuron and edges per weight, distinguishing input layer, one or more hidden layers, and output layer
    - matrix-vector form, where each layer's computation is one matrix multiplication (weights) plus one vector addition (biases) plus an element-wise activation function
    - unrolled scalar-equation form, with one explicit equation per output of each layer and every weight and bias as a named variable
    - computational-graph form, where the network is a directed acyclic graph of elementary operations from inputs to outputs, ready for automatic differentiation
    - forward-pass view, tracing how one input vector propagates through the network to produce an output vector
    - parameter count as a function of layer widths and depth, surfacing how the number of weights scales
    - activation function as the single source of non-linearity, with the activation-stripped version of the network collapsing to one linear function of the input regardless of depth
    - the same network rewritten as a function of its parameters (weights and biases) for fixed inputs, surfacing the perspective change from "function of input" to "function of parameters" used during training
    - weight-sharing-free reading, distinguishing a fully-connected network from convolutional and attention-based architectures (those are out of scope here)
    - the system of equations as under-determined or over-determined depending on the dataset size versus parameter count
    - input-output dimensionality as a constraint on the input and output layers, while hidden layer widths remain a free design choice
  - leads into: weight initialisation, analytical solution, loss surface

- weight initialisation
  - prereq: fully-connected network as a system of equations
  - representations
    - zero initialisation, where every weight starts at zero, exposing the symmetry problem: every neuron in a layer produces identical outputs and identical gradients, so the network can only learn what a one-neuron model can learn
    - constant non-zero initialisation, which has the same symmetry problem as zero initialisation for the same reason
    - uniform random initialisation in a small symmetric range around zero, breaking the symmetry but without principled scaling against layer width
    - normal-distribution initialisation with mean zero and a fixed small variance, similar in spirit to uniform random but with different tail behaviour
    - Xavier / Glorot initialisation, which scales the weight variance as 1 over the number of input connections (or as 2 over the sum of fan-in and fan-out) so that activation variance stays approximately constant across sigmoid and hyperbolic-tangent layers
    - He / Kaiming initialisation, which adjusts the Xavier formula by a factor of 2 to account for the gain of the rectifier activation, keeping activation variance constant in rectifier-based networks
    - orthogonal initialisation, where the weight matrix is sampled as a random orthogonal matrix, preserving signal norm exactly during the forward pass rather than approximately
    - sparse initialisation, where most weights are zero and only a fixed small number per neuron are non-zero, biasing the network toward simpler initial functions
    - bias initialisation, typically zero but occasionally set to a small positive value for rectifier units to avoid the "dead neuron" problem (a rectifier that outputs zero for all inputs has zero gradient and never recovers)
    - effect on gradient flow during training, where bad initialisation makes gradients either vanish (saturating activations with badly scaled weights) or explode (deep networks with naively large weights), slowing or preventing convergence even when the rest of the training setup is correct
    - effect on the entry point into the loss surface, where different initialisations land the optimisation trajectory in different basins of the same loss surface; the initialisation choice indirectly determines which local minimum the network reaches
  - leads into: analytical solution, loss surface and gradient descent

- analytical solution
  - prereq: fully-connected network, integral (light)
  - representations
    - closed-form solution of a linear system with no activation function, computed by matrix inversion
    - least-squares fit as a closed-form solution to a linear system that has more constraints than unknowns, expressed through the pseudo-inverse
    - residual-error view, where the analytical solution minimises the sum of squared residuals exactly with no iteration
    - failure mode when the system is non-linear: a single activation function blocks the closed-form path and forces a search-based approach
    - failure mode when the parameter count exceeds the data: many exact solutions exist, the inversion becomes singular, and a regularised closed form (or an iterative method) is needed
    - comparison of analytical and iterative solutions on the same small linear system, where both arrive at the same answer via different routes
    - computational-cost reading, where analytical solving scales roughly as the cube of the parameter count for the inversion step, surfacing why analytical methods are abandoned at scale even when they technically apply
    - geometric reading of least squares as a projection of the target vector onto the column space of the feature matrix
  - leads into: loss surface and gradient descent

- loss surface and gradient descent
  - prereq: gradient, fully-connected network
  - representations
    - loss as a single scalar function of all weights and biases, treating the network's parameters as the variables and the dataset as fixed
    - low-dimensional slice of the loss surface (typically two parameters at a time) as a 3d height plot, with the rest held fixed
    - contour-plot view of the same slice from directly above, showing level sets of the loss in the chosen parameter slice
    - gradient of the loss with respect to the parameters as a vector in parameter space, pointing in the direction of fastest loss increase
    - update rule as one equation: new parameters equal old parameters minus a learning rate times the gradient
    - iterative-trajectory view, plotting a sequence of parameter snapshots one update apart on the loss surface or contour map
    - loss-versus-iteration plot, tracking the scalar loss over the course of training and surfacing convergence behaviour separately from the geometric path
    - learning-rate sensitivity, with paths under several learning rates plotted on the same surface (too-small crawling, too-large overshooting, well-tuned descending cleanly)
    - local-minimum and saddle-point behaviour, where the iterative path stalls at zero-gradient locations that are not the global minimum
    - momentum and accelerated-descent variants as small modifications of the update rule, named here as a class without expanding each one
    - backpropagation named as the specific algorithm that computes the gradient of the loss with respect to every weight in a multi-layer network, with the chain-rule mechanics left for a later idea if needed
    - loss-function choice as a separate design knob (squared error, cross-entropy), named here as a class without expanding each one
  - leads into: backpropagation, numerical optimisation methods beyond gradient descent, stochastic gradient descent

- backpropagation
  - prereq: gradient, fully-connected network as a system of equations, loss surface and gradient descent
  - representations
    - the chain rule applied recursively from the loss back through each layer to the input, with one local derivative computed at each node in the network
    - computational-graph framing where the forward pass propagates values left-to-right and the backward pass propagates gradients right-to-left through the same graph
    - per-layer derivative formula in matrix form, where the gradient of the loss with respect to a layer's weights equals the outer product of the upstream gradient and the layer's input
    - cached intermediate activations from the forward pass, reused during the backward pass to avoid recomputing the network state at each layer
    - reverse-mode automatic differentiation framing, with backpropagation as the special case of reverse-mode autodiff applied to the computational graph of a neural network
    - computational-cost reading, where the backward pass is roughly twice the cost of the forward pass regardless of network depth, surfacing why backpropagation makes gradient descent on deep networks feasible
    - vanishing gradient problem in deep networks with saturating activations, where the product of small per-layer derivatives shrinks the gradient toward numerical zero as it propagates back to the early layers
    - exploding gradient problem in deep networks where the product of large per-layer derivatives causes the gradient to grow without bound, producing numerical instability and divergence
    - gradient clipping as a defence against exploding gradients, where the global norm of the gradient is rescaled to a fixed maximum before each update step
    - skip / residual connections as a structural defence against vanishing gradients, where extra paths in the computational graph allow gradients to bypass long chains of multiplications (named as a class, not unfolded here)
    - relationship to forward-mode automatic differentiation, which traces derivatives forward through the graph and is favourable when inputs are few relative to outputs (the opposite of the neural-network case, where the loss is a scalar and the parameters are many)
    - historical placement: the chain rule had been known for centuries, but its systematic application to multi-layer neural networks was popularised in the mid-1980s (Rumelhart, Hinton, Williams) and is what re-opened the field after the AI winter
  - leads into: numerical optimisation methods beyond gradient descent, stochastic gradient descent, differential equations in neural networks

- numerical optimisation methods, survey beyond gradient descent
  - prereq: loss surface and gradient descent
  - representations
    - momentum, where each update direction is a weighted sum of the current gradient and a fraction of the previous step, named after the physical intuition of a mass that resists changes in velocity and rolls through narrow valleys without oscillating across them
    - Nesterov accelerated gradient, where the gradient is evaluated at a look-ahead position computed from the current momentum rather than at the current parameters, giving a small theoretical improvement over plain momentum on convex problems
    - Newton's method, which uses the inverse of the Hessian (the matrix of second partial derivatives of the loss) to take steps that account for the local curvature of the loss surface, achieving quadratic convergence near the optimum
    - quasi-Newton methods (BFGS, L-BFGS), which approximate the inverse Hessian iteratively from a history of gradient differences without computing or storing the full matrix, retaining most of Newton's per-step quality at far lower per-step cost
    - conjugate-gradient method, which builds a sequence of mutually non-interfering search directions and converges in at most as many steps as there are parameters on a quadratic loss surface
    - adaptive-learning-rate family with separate per-parameter rates: Adagrad accumulates squared gradients to shrink the rate for frequently updated parameters; RMSProp uses an exponential moving average of squared gradients to forget old history; Adam combines RMSProp's per-parameter rates with momentum
    - line-search variants, where the step size at each iteration is chosen by searching along the descent direction for an acceptable decrease in loss, rather than being fixed in advance
    - trust-region variants, where a region around the current parameters is treated as the domain on which a local quadratic model of the loss is trusted, and the next step is constrained to lie inside that region
    - first-order versus second-order distinction: first-order methods use only gradient information, second-order methods use curvature; trade-off between per-step cost and per-step quality
    - convergence-rate reading, where plain gradient descent converges linearly on well-conditioned smooth problems, Newton's method converges quadratically near the optimum, and momentum achieves the optimal first-order rate on smooth strongly convex problems
    - applicability in deep-learning practice, where most theoretically attractive second-order methods are not used at scale because of memory and computation constraints, leaving first-order methods with adaptive learning rates (Adam and its variants) as the practical workhorse
  - leads into: stochastic gradient descent

- stochastic processes (brief)
  - prereq: none of the heavy material, basic plotting
  - representations
    - a single sequence of values where the next value depends partly on randomness, plotted as a polyline over time
    - an ensemble of many such sequences started from the same initial value, plotted overlaid, showing how the cloud of possible futures spreads
    - the distribution of values at a fixed time across the ensemble, drawn as a histogram or density curve
    - random walk as the simplest non-trivial example, with each step drawn independently from a fixed distribution
    - stationary versus non-stationary distinction, separating processes whose distribution stabilises over time from those that keep spreading or drifting
    - Markov property framing, where the next value depends only on the current value and not on the full history, naming the simplification without spelling it out in formulas
    - discrete-time versus continuous-time framing of the same process
    - sample-path view (one realisation) versus distribution view (the full ensemble), as two complementary lenses on the same object
    - entry points where randomness enters into network training (mini-batch sampling, weight initialisation, dropout, data augmentation), named without expanding each one
  - leads into: stochastic gradient descent, and idea2 (for the chaos-versus-randomness distinction)

- stochastic gradient descent
  - prereq: gradient descent, stochastic processes brief
  - representations
    - estimated-gradient update rule, where the true gradient is replaced with a gradient computed on a small random subset (a mini-batch) of the dataset
    - trajectory comparison, with a full-batch gradient descent path next to a mini-batch path on the same loss surface, the mini-batch path noisier but tracking the same downhill direction on average
    - loss-versus-iteration plot for both, where the mini-batch curve oscillates around a smoothly descending trend rather than descending smoothly
    - batch-size as a knob: at one extreme the mini-batch is the entire dataset (full-batch gradient descent), at the other a single sample (pure stochastic gradient descent), with intermediate values the common case
    - computational-cost reading, where one mini-batch step costs proportionally less than a full-batch step but the trajectory needs more steps to converge
    - variance-of-gradient reading, where smaller batches mean noisier gradient estimates and therefore noisier trajectories
    - noise-as-a-feature framing, where random perturbation helps the trajectory escape shallow local minima and saddle points that full-batch descent would get stuck at
    - learning-rate-schedule view, where the step size is decayed over time so that the noisy trajectory can still settle into a minimum
    - bridge to idea2, where the same random-perturbation idea returns as a way to distinguish deterministic chaos from genuine stochastic dynamics
    - bridge to idea3, where the same descent machinery trains the networks that produce text
  - leads into: differential equations in neural networks, idea2, idea3

- differential equations in neural networks
  - prereq: derivative first order, integral, gradient descent, fully-connected network as a system of equations
  - representations
    - gradient flow, where the parameter trajectory is the solution of the continuous-time ordinary differential equation dθ/dt = -∇L(θ), and ordinary gradient descent is its forward-Euler discretisation with the learning rate as the integration step
    - gradient flow viewed as a vector field on parameter space, with the loss acting as a Lyapunov function that decreases along every trajectory
    - stochastic differential equation reading of stochastic gradient descent, where the mini-batch noise is modelled as a Brownian perturbation added to the gradient flow, producing a Langevin-style stochastic differential equation
    - continuous-depth networks, where the forward pass is the solution of an ordinary differential equation dh/dt = f(h, t, θ) over a depth variable t, with discrete layers replaced by a continuous integration step
    - neural ordinary differential equations as the trainable instance of the above, with the right-hand-side function f represented by a small feedforward sub-network whose parameters are learned
    - the adjoint sensitivity method for training continuous-depth networks, which solves a second ordinary differential equation backwards in time to compute gradients without storing the entire forward trajectory, trading memory for additional computation
    - residual networks viewed as the forward-Euler discretisation of a continuous-depth ordinary differential equation, providing a unifying framing across discrete and continuous architectures
    - batch normalisation as a transformation whose forward pass involves running mean and variance statistics that obey an exponential moving-average update equation (a discrete-time first-order linear difference equation)
    - recurrent networks as discrete-time approximations of continuous-time dynamical systems, with the hidden state evolving according to a finite-difference version of a differential equation
    - physics-informed neural networks, where the network is trained to satisfy a partial differential equation in its outputs, with the differential operator appearing inside the loss function rather than as a constraint on the architecture
    - score-based diffusion models, where the forward (data-corruption) and reverse (data-generation) processes are governed by stochastic differential equations, and the network learns the score (gradient of the log probability) of intermediate distributions
    - the broader conceptual move, where deep-learning architectures and dynamical systems are seen as two views of the same underlying object (a parameterised flow that transforms an input distribution into an output distribution, expressible in either discrete layer-by-layer or continuous differential-equation form)
  - leads into: idea2 (where the same differential-equation machinery returns for chaos, attractors, and bifurcation)

## out of scope for this idea

- systems of differential equations not tied to neural-network architectures, attractors, deterministic chaos, fractals, bifurcation diagrams: all in idea2
- tokens, embeddings, autoregressive generation, language models: all in idea3
- deep architectures beyond fully-connected (convolutional networks, attention-based networks): out of scope at this level
- regularisation techniques (weight decay, dropout, layer normalisation): named only as entry points for randomness, not expanded as their own topics
- specific theoretical results beyond what is named (no proofs of convergence, no formal stability analysis, no information-theoretic framings): out of scope at this level
