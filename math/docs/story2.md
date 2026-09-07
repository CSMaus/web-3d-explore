# story2 - the second story

## scope

one continuous presentation flow that starts from a single differential equation, builds the machinery to solve and to picture a system of them, arrives at the attractor, establishes deterministic chaos, charts the route into it through the bifurcation diagram, meets fractal geometry there rather than as a separate subject, and closes on the one experiment where the whole chain was used to do something. twenty-two steps, each one a dedicated beat in the story.

## relationship to math/docs/idea2.md

idea2.md is the catalog of terms and their representational angles. this file is the order in which those terms surface and the connective logic between them. each step lists the catalog entries it draws on and does not re-state their content; the catalog is the source of truth for what gets shown per term.

## relationship to math/docs/idea1.md

three of idea1's catalog entries are used here and are named where they surface: "complex exponent and Euler's identity" at step 7, "laplacian" at step 20, "stochastic processes (brief)" at step 17. story1 lists all three as out of scope for its own flow, so this is where they are presented rather than reused.

this story does not require story1 to have been watched. it requires the derivative and the integral as objects, which is less than story1 delivers and can be assumed of a viewer who has not seen it.

## relationship to math/01-fractals

steps 17 and 18 are already produced, as parts 1 to 11 of the video series in `math/01-fractals`. those parts were built before this flow was written and they open by introducing the complex plane from scratch, which by step 18 of this story has already been established at step 7.

the decision that follows from that, and it is a decision rather than an observation: the produced series stays as it is and is not re-cut. it is the entry point for a viewer who arrives at fractals directly, which is most of them, and self-containment is worth more than the eight minutes of overlap. this story therefore treats steps 17 and 18 as a block that may be watched in either position, and steps 19 and 21 carry the two connections the produced series cannot make because it was built first.

## audience assumption

the derivative is known as a rate and the integral as an accumulation, both with physical readings, at the level idea1 leaves them. no experience of differential equations. a matrix times a vector is familiar as notation. complex numbers are new or hazy, and step 7 treats them as new.

## pacing principle

as in story1: every term in the catalog is meant to land as its own animation beat, and compressing two terms into one beat to save time is not in scope. where a step contains several terms, each is unfolded in turn with the bridges between them as their own micro-beats.

one addition specific to this story. several steps rest on a computed trajectory rather than on a formula, and in those steps the computation is shown being run at more than one setting before its output is trusted. the settling of a numerical answer is part of the content, not an aside.

## step 1 - the differential equation, an equation whose unknown is a function

draws on (from idea2): "ordinary differential equation, the object"
arrives at: an equation containing the unknown function's own derivative is held as a different kind of object from an algebraic equation, with the unknown being a whole function rather than a number; order, autonomous versus non-autonomous, and linear versus non-linear are established as the three classifications the rest of the story uses; the general solution is held as a family carrying one free constant per order and the particular solution as the member an initial condition picks out; the equation is read as a rule for the next instant and nothing more
bridge from previous step: opening beat
pace note: long; the shift from "solve for a number" to "solve for a function" is the whole step and is worth more time than it looks

## step 2 - the direction field, the equation as a picture before it is solved

draws on (from idea2): "direction field and integral curves"
arrives at: the equation drawn as a field of short slopes across the plane, and a solution as a curve that follows them; the family of integral curves fills the plane without crossing, and the no-crossing rule is recognised as uniqueness; isoclines and the zero-slope isocline locating equilibria are on screen; qualitative behaviour is read off the field with no formula anywhere
bridge from previous step: the equation prescribes a rate at every state, so before any solving happens the equation can simply be drawn, and a solution becomes something traced
pace note: medium; this step is what makes every later phase portrait readable, so the no-crossing argument is made properly rather than stated

## step 3 - solving one equation in closed form

draws on (from idea2): "analytical solution of a single equation"
arrives at: separation of variables and the integrating factor are worked through; the linear constant-coefficient case is solved through its characteristic equation, with real roots giving exponentials and complex roots deferred to step 7; the exponential function is recognised in retrospect as the answer to "what function is its own derivative", so idea1's exponent material is re-read as having been a differential equation all along; the second-order oscillator is solved in full with its three damping regimes; verification by substitution is established as the only step that certifies a solution
bridge from previous step: the field shows the shape of every solution but names none of them; for a small set of equations a formula can be produced, and it is worth knowing exactly which set
pace note: long; the oscillator is a payoff beat and the three damping regimes are three sub-beats

## step 4 - where the closed form runs out

draws on (from idea2): "analytical solution of a single equation" (the large-angle pendulum representation)
arrives at: the pendulum without the small-angle approximation is stated, and the absence of an elementary closed form for it is stated as fact rather than as a difficulty to be overcome; the boundary of the analytical toolbox is drawn explicitly; the need for a method that produces a trajectory without producing a formula is accepted
bridge from previous step: the closed-form methods just shown are a short list, and the second equation anyone writes down for a real pendulum is already off it
pace note: short; a deliberate hinge, and it works better brief than laboured

## step 5 - the numerical route

draws on (from idea2): "numerical solution methods"
arrives at: forward Euler is taken literally from the direction field; local against global error and the order of a method are established; midpoint and Heun appear as one correction, and fourth-order Runge-Kutta as the workhorse; step size is the single knob, with the same trajectory computed at several step sizes and the answers compared against each other rather than against a formula; adaptive stepping, stiffness and the implicit response, and symplectic integrators for conservative systems are each named; the honest statement lands, that a numerical solution is a sequence of states with no formula, and that every picture from here to the end of the story is drawn from one
bridge from previous step: no formula exists for the equation just written, so the equation is asked for the only thing it can supply directly, which is the rate at the current state, and a trajectory is built one small step at a time
pace note: very long; this is the load-bearing step of the first third of the story and every method in the catalog entry gets its beat

## step 6 - the system, several unknowns on one clock

draws on (from idea2): "system of first-order equations"
arrives at: several unknown functions each with its own equation, each allowed to mention all of the others; the state vector as the bundle and the system as one vector-valued rule; the reduction of a higher-order equation to a first-order system by naming derivatives as new state variables, worked through on the oscillator from step 3; the linear system as a matrix times the state vector, with the notational overlap with idea1's network layer noted as notation and not as a claim; coupling as the off-diagonal entries; eigenvalues and eigenvectors solving the linear case, with each eigendirection behaving as one independent equation; the dimension of the system established as the count that later decides which behaviours are possible at all
bridge from previous step: one equation with one unknown was never the general case; every physical situation with two interacting quantities needs two equations that mention each other, and the machinery of steps 1 to 5 carries over unchanged
pace note: long; the reduction of the oscillator is the beat that makes the systems view feel like a simplification rather than a complication

## step 7 - complex numbers, and rotation as an eigenvalue

draws on (from idea1): "complex exponent and Euler's identity" (all representations)
arrives at: the imaginary unit, the complex plane, multiplication as rotation and scaling, the modulus and the argument, the complex exponential, and Euler's identity land in full; the complex-root case deferred at step 3 is completed, with the real part read as growth or decay and the imaginary part as angular frequency; a complex eigenvalue pair of a linear system is read as rotation with growth, and the oscillating solution is recognised as an exponential in disguise
bridge from previous step: the eigenvalues of a system's matrix are the growth rates of its independent directions, and the moment a system oscillates those eigenvalues stop being real, so the number system has to be extended before the classification of behaviour can be completed
pace note: very long; a full topic inside the flow. the payoff is that oscillation and decay become one phenomenon rather than two cases

## step 8 - phase space, the state as a single point

draws on (from idea2): "phase space and the trajectory"
arrives at: one axis per state variable, the clock removed from the axes, the whole state as one point and its history as one curve; the same solution shown as a phase-space curve and as one time series per variable, established as two views of one object; the vector field on phase space as the direction field's multi-variable form; trajectories never crossing, for the same reason as in step 2; closed trajectories read as periodic solutions; two nearby starts released together, with the gap between them named as the quantity to watch for the rest of the story
bridge from previous step: a system's solution is several functions of one clock, which is awkward to look at; dropping the clock from the axes and plotting the state against itself turns the whole solution into one curve
pace note: long; the two-views beat and the two-nearby-starts beat are the two that everything later depends on

## step 9 - equilibria, and the local linear stand-in

draws on (from idea2): "equilibria and linearisation"
arrives at: an equilibrium as a state of zero prescribed velocity; the Jacobian as the array of first partials and as the local linear stand-in, drawn in parallel with idea1's tangent line; eigenvalues as local rates and eigenvectors as their directions; the full two-dimensional classification with the phase portrait of each case (stable and unstable node, saddle, stable and unstable spiral, centre); complex eigenvalues read as rotation using step 7; the saddle's stable and unstable directions as the first structure that both attracts and repels; hyperbolicity as the condition under which the linear picture decides the non-linear behaviour, and the centre as the borderline case where it decides nothing
bridge from previous step: the phase portrait is a global picture assembled from local ones, and the local behaviour near a point where the velocity vanishes is where the assembly starts
pace note: very long; six phase portraits, each its own beat, and the hyperbolicity caveat as its own closing beat

## step 10 - stability, and the exponent that measures it

draws on (from idea2): "stability, and the Lyapunov exponent"
arrives at: stability posed as a question about neighbours rather than about one trajectory, with asymptotic, neutral and unstable as the three answers; the separation between two nearby trajectories plotted against time on a logarithmic axis, with a straight line there meaning exponential separation and its slope named as the Lyapunov exponent; the spectrum of exponents, one per direction, and the sum of the spectrum as the volume growth rate; the divergence of the field as the same statement read locally; the sign of the largest exponent adopted as the working definition of chaos for the rest of the story, before any chaotic system has been shown; the finite-time exponent computed from a numerical trajectory with its three practical caveats stated
bridge from previous step: the eigenvalues at an equilibrium give local rates at one point, and the same question can be asked along a whole trajectory rather than at a point, which turns a local classification into a number that describes a run
pace note: long; the definition of chaos is set up here deliberately in advance of the phenomenon, so that step 14 confirms a prediction rather than introducing a surprise

## step 11 - what is conserved, and what leaks

draws on (from idea2): "conservative and dissipative systems"
arrives at: a conserved quantity as a function of the state the equations leave unchanged, with the undamped oscillator's energy as the case; trajectories confined to level sets, so a conserved quantity removes a dimension; the undamped pendulum's full phase portrait read from its energy alone, saddle included; dissipation as the leak, with the damped oscillator's spiral as the same portrait once energy is lost; a blob of initial conditions followed forward, its volume preserved under one flow and shrinking under the other; the consequence that only a dissipative system can have an attractor; Lyapunov's function method named as the analytical counterpart to step 10's numerical exponent
bridge from previous step: the sum of the exponents was a statement about volume, and volume in phase space turns out to be the dividing line between two kinds of system, which decides what each can settle onto
pace note: long; the blob-of-initial-conditions beat is the one that makes the attractor definition inevitable two steps later

## step 12 - the limit cycle, and why two dimensions are not enough

draws on (from idea2): "limit cycle"
arrives at: an isolated closed trajectory that neighbours spiral onto, distinguished from a conservative system's nested closed curves by that isolation; stable and unstable cycles with their portraits; the van der Pol oscillator across its parameter, from near-circular to sharply relaxational; self-sustained oscillation as the physical reading, with the heartbeat named here because step 22 returns to it; the Poincare-Bendixson theorem stated and its consequence drawn, that a bounded two-dimensional system must settle onto an equilibrium or a closed trajectory and therefore cannot be chaotic
bridge from previous step: a dissipative system loses volume and must settle onto something; in two dimensions the list of things it can settle onto turns out to be complete and short, and the completeness is the interesting part
pace note: long; the theorem is the hinge of the whole story and its consequence is stated as a prohibition, so that step 14 arrives as the response to it

## step 13 - the attractor

draws on (from idea2): "attractor"
arrives at: the definition assembled from parts already present rather than announced, as a set trajectories approach that contains no smaller such set and that attracts a whole neighbourhood; the four kinds in ascending dimension, point, cycle, torus, strange; the basin of attraction, coexisting attractors and the basin boundary; the transient as the part discarded before anything is measured; the strange attractor introduced by its two properties held together, exponential separation of trajectories on a bounded set of fractional dimension, with the folding resolution given for why that is not a contradiction; the word "strange" placed historically
bridge from previous step: the two-dimensional list is complete, and the fourth item on the general list is the one that dimension two forbids, so naming it names what the next step has to go looking for
pace note: very long; the assembly of the definition from already-established parts is the point of the step, and the folding argument is its own beat

## step 14 - the Lorenz system

draws on (from idea2): "the Lorenz system"
arrives at: the three equations in full with each parameter's physical origin, presented as a 1963 truncation of convection in a heated fluid layer rather than as three arbitrary equations; the behaviour as the driving parameter is raised, through rest, through two symmetric convecting equilibria, to the loss of both; the trajectory in three dimensions beside its three time series, with lobe switches matched to sign changes; two initial conditions differing in the last digit followed until they are on opposite lobes, with the separation on a logarithmic axis recovering the positive exponent predicted at step 10; the volume contraction computed from the divergence, giving a set that attracts every neighbourhood and has zero volume; the measured fractal dimension a little above two; the Poincare section and its return map; the history stated accurately, including that the phrase about a butterfly came later and from a different paper
bridge from previous step: two dimensions forbid the strange attractor and three do not, so the smallest honest thing to do is write down three equations that came from a real physical problem and look at what they do
pace note: very long; the centrepiece of the continuous-time half of the story. every representation in the catalog entry is its own beat

## step 15 - the Rossler system, and the folding made plain

draws on (from idea2): "the Rossler system"
arrives at: the three equations with the observation that only one term is non-linear, so the machinery is as small as it can be; the geometry read as one action, spiral outward in a plane and be lifted and folded back, which is stretch-and-fold named directly; the same system across a sequence of parameter values, passing through a cycle, a doubled cycle, further doublings and then the attractor, so the route in is visible in one family; the comparison against Lorenz, same dimension and same positive exponent with visibly simpler folding and no symmetry; its nearly one-dimensional Poincare section; the system placed historically as deliberately constructed in 1976 to be the simplest carrier
bridge from previous step: the Lorenz attractor's mechanism is hidden by its symmetry and its two lobes, so a system built on purpose to be simpler shows the same mechanism with nothing in the way
pace note: long; the parameter sweep through the doublings is the beat that sets up step 16, and is deliberately not explained here

## step 16 - deterministic chaos, stated properly

draws on (from idea2): "deterministic chaos"
arrives at: the three conditions given together as the definition rather than sensitivity alone; determinism and unpredictability held side by side, with an exact rule, no noise, and no long-run outcome; the doubling map on the unit interval as the smallest carrier, where each step shifts out exactly one binary digit and the loss of information is countable; stretch-and-fold as the mechanism with the horseshoe as its picture; the prediction horizon computed from the exponent and the measurement precision, with the result that a factor of ten in precision buys only a fixed extra interval; the operational distinction from randomness through the delay embedding; the distinction from ordinary instability; and the explicit list of what chaos does not mean
bridge from previous step: two systems have now been shown separating exponentially while staying bounded, by the same folding, so the phenomenon has been seen twice and can be defined instead of described
pace note: very long; the computed prediction horizon is the beat that does the most work, because it replaces the usual gesture with a number

## step 17 - the fractal block, part one: dimension

draws on (from idea2): "fractal dimension (produced)"
arrives at: parts 1 to 7 and part 11 of the produced series, in their existing order: the coastline paradox and the divider method, box-counting dimension, the Koch curve, iterated function systems and the Barnsley fern, the wider geometric family, the random growth models, and the analytical layer that derives the formulas and states the Hausdorff definition. idea1's "stochastic processes (brief)" is the prerequisite the growth models in part 7 rest on, and the produced series introduces what it needs of it in place
bridge from previous step: the attractor at step 13 was defined as having fractional dimension and the definition was left unexplained; two chaotic systems have since been shown and one of them was measured at a dimension a little above two. that measurement has not been justified, and justifying it is a subject of its own
pace note: produced. eleven parts, about twenty minutes, one clip per beat, recorded per part in `math/01-fractals/NARRATION.md`

## step 18 - the fractal block, part two: escape-time dynamics

draws on (from idea2): "escape-time dynamics (produced)"
arrives at: parts 8 to 10 of the produced series: the complex plane and complex arithmetic, where the quadratic map comes from, the escape-time test, Julia sets, the Mandelbrot set, colouring by escape count, and the boundary under magnification
bridge from previous step: dimension has been made measurable, and the objects measured so far were built by a stated geometric rule; the next family is not built by a rule but selected by a test on an iterated map, which is the same kind of object as everything in steps 14 to 16
pace note: produced. the complex-plane opening of part 8 duplicates step 7 for a viewer following this flow in order, and is kept, for the reason given at the head of this file

## step 19 - closing the loop: the attractor's dimension, and the map on the real axis

draws on (from idea2): "escape-time dynamics (produced)" (the two correction representations), "fractal dimension (produced)" (the two connection representations), "the Lorenz system", "attractor"
arrives at: two connections the produced series cannot make, because it was built before this flow existed, are made explicitly.
- (i) the fractal dimension of the Lorenz attractor is recomputed by the box-counting method just established, so that the number quoted at step 14 stops being an assertion; the same is done for the Rossler attractor, and the two are compared
- (ii) the Mandelbrot set is corrected on the point the original sketch got wrong. it is not the fractal that lives on the imaginary axis; it is the set of parameters for which the orbit of zero stays bounded, and it lives in the plane of the parameter while its Julia sets live in the plane of the state. the connection the sketch was reaching for is real and stronger: the quadratic map restricted to the real line is the logistic map after a change of variable, which makes the real axis of the Mandelbrot set the parameter axis of a bifurcation diagram
bridge from previous step: the fractal block was entered to justify a dimension and was left having built a second family of objects out of iterated maps; both debts are now paid, and the second one turns out to connect the two halves of the story rather than merely closing a gap
pace note: long; part (ii) is a correction and is delivered as one, plainly, with the wrong statement shown and replaced rather than quietly omitted

## step 20 - discrete time, and the logistic map

draws on (from idea2): "the Poincare section and the first-return map", "the logistic map and discrete-time dynamics"
arrives at: the Poincare section as a surface across the flow with only the crossings recorded, reducing a three-dimensional flow to a two-dimensional map by removing one dimension with the section and the clock by only looking at crossings; a periodic orbit as one point on the section, a doubled period as two, a torus as a closed curve and a strange attractor as a fractal dust; the first-return map as the rule from one crossing to the next; then the logistic map in its own right, with its origin as a crowded population, iteration as a sequence and as a cobweb against the diagonal, fixed points as intersections with their stability decided by the slope, the sequence of behaviours as the parameter is raised, the second iterate plotted beside the map so that a two-cycle of one is a fixed point of the other, and a chaotic series set beside random numbers, indistinguishable by eye and separated by the cobweb
bridge from previous step: the Rossler section at step 15 was nearly a one-dimensional curve, and the Mandelbrot correction at step 19 turned the real axis into a parameter axis for a one-dimensional map; both point at the same simplification, which is to stop following the flow and to follow only what a map does
pace note: very long; two catalog entries in one step because the section exists here only to arrive at the map. the second-iterate beat is the one that makes step 21 mechanical rather than magical

## step 21 - bifurcation, the cascade, and Feigenbaum's constants

draws on (from idea2): "bifurcation", "the bifurcation diagram and the period-doubling cascade"
arrives at: bifurcation as a qualitative change in the set of attractors at a critical parameter value, with the saddle-node, transcritical, pitchfork, Hopf and period-doubling cases each given its own beat and its own local diagram, and the normal-form statement that this short list is complete locally; hysteresis where two attractors coexist; then the full diagram built by construction, iterating and discarding the transient for each parameter value; the cascade read off it, with the shrinking parameter intervals; the ratio of successive intervals computed from the diagram and approaching a limit, named as Feigenbaum's delta at 4.669, with the second constant alpha at 2.503 as the ratio of branch widths; universality checked by running the identical construction on a different map with a single quadratic maximum and recovering the same two numbers; the accumulation point, the chaotic band beyond it, and the periodic windows inside it with the three-cycle as the widest; self-similarity of the diagram under magnification with alpha as the scale factor, at which point this step and step 17 are the same subject; the largest Lyapunov exponent plotted beneath on the same axis, negative in the periodic regime, zero at each bifurcation and positive in the band, confirming step 10's definition against the picture; and the same construction run on the Rossler section, recovering the cascade in a continuous system
bridge from previous step: the logistic map's behaviour changed qualitatively at particular parameter values and the changes were only listed; each one has a name and a mechanism, and laying every parameter value out on one axis turns the list into a single picture
pace note: very long; the centrepiece of the discrete-time half of the story, matching step 14 in weight. the delta computation, the universality check and the exponent panel are three separate payoff beats and none of them is compressed

## step 22 - control, and the one experiment

draws on (from idea2): "chaos control", "the cardiac arrhythmia experiment"
arrives at: the premise that sensitivity to small perturbations is what makes a chaotic system cheap to control; the dense unstable periodic orbits inside the attractor as the raw material, so control means stabilising an orbit the system already visits; the Ott-Grebogi-Yorke method with its small parameter adjustment computed from the local linearisation; the trade of waiting time against perturbation size; delayed-feedback control, needing no model and no knowledge of the orbit; targeting; and the failure modes. then the 1992 experiment: rabbit cardiac tissue made arrhythmic by a drug, the inter-beat interval as the observable, the sequence treated as a discrete map with no model of the tissue, the return map built from the recorded intervals, the unstable fixed point found in it, small correctly-timed stimuli applied by the delayed-feedback rule, and the interval sequence collapsing from aperiodic to periodic at an energy far below defibrillation; with the accurate statement of what was and was not shown, since this is the point in the subject most often overclaimed
bridge from previous step: every property established so far has been a property to be understood, and the sharpest of them, sensitivity, has been treated throughout as the obstacle to prediction; the same property read as an opportunity inverts the whole story, because a system that amplifies small nudges can be steered by small nudges
pace note: very long; the closing step. the control methods are one long beat, the experiment is another, and the closing beat retraces the chain from step 1 to here, naming each link, because the point of the story is that it is one chain

## out of scope for this story

- neural networks, loss surfaces, gradient descent, backpropagation: all in idea1 and story1
- tokens, embeddings, autoregressive generation, language models: all in idea3
- the partial-differential-equation entry in idea2, which has no step of its own here. the laplacian's physical meaning is carried by the produced series' dielectric-breakdown model at step 17, and the heat, wave and Poisson equations are named there rather than given a step; a later revision may add them as a step between 16 and 17
- Hamiltonian mechanics and integrable systems beyond the conserved-quantity material at step 11
- ergodic theory and invariant measures; mixing is stated at step 16 and not developed
- turbulence and the relation between the Lorenz truncation and the equations it came from, named at step 14 as origin only
- proofs. Poincare-Bendixson at step 12, the universality of the Feigenbaum constants at step 21 and the Hausdorff-versus-box-counting relation at step 17 are stated and used, never proved
