# idea2 - systems of differential equations, attractors, chaos, fractals

## scope

cover the mathematics of systems that evolve in time: what a differential equation is, what it means to solve one analytically and what it means to solve one numerically, what an attractor is, what makes a system chaotic while remaining fully deterministic, how the route into chaos is charted, how fractal geometry falls out of that route, and where the whole subject has been put to work. begins after idea1's calculus material and does not re-derive it. ends before anything about tokens, embeddings or language models (idea3).

## audience assumption

the derivative and the integral are known as objects, at the level idea1 leaves them: a derivative is a rate, an integral is an accumulation, and both have physical readings. no experience of differential equations, linear algebra beyond a matrix times a vector, or complex arithmetic beyond "there is a number whose square is minus one" is assumed.

## relationship to math/docs/idea1.md

three entries in idea1's catalog are prerequisites for this one and are not restated here. they are named as `(idea1)` in the prereq lines below and their representational angles are taken from that file:

- "complex exponent and Euler's identity", needed for the eigenvalues of a rotating equilibrium and again for the quadratic map on the complex plane
- "laplacian", needed for the partial-differential-equation entries and for the growth models in the fractal block
- "stochastic processes (brief)", needed for the noise-driven growth models and for the distinction between a chaotic system and a random one

story1 lists all three as out of scope for its own flow and moves them here, so this idea is where they are actually presented.

## relationship to math/01-fractals

the fractal-geometry block of this idea has already been produced, out of order, as an eleven-part video series in `math/01-fractals`. its per-part content is recorded in `math/01-fractals/NARRATION.md` and is not restated here. the catalog entries under "fractal dimension" and "escape-time dynamics" below name only what that series already covers, so that the chain of prerequisites reads correctly; anything marked `(produced)` exists as finished video.

that series was built before this catalog was written, and it therefore assumes less than this idea otherwise would: it introduces the complex plane from scratch rather than relying on idea1. the consequence is that the fractal block can be watched independently, and that story2 has to decide whether to keep that self-contained opening or to cut it once the earlier steps exist. the decision is noted in story2 rather than settled here.

## topic chain

- ordinary differential equation, the object
  - prereq: derivative first order (idea1), integral (idea1)
  - representations
    - an equation whose unknown is a function rather than a number, with the function's own derivative appearing in it, contrasted directly against an algebraic equation whose unknown is a number
    - order as the highest derivative appearing, with first order and second order as the two cases the rest of the idea uses
    - the general solution as a family of functions carrying one free constant per order, and the particular solution as the member of that family picked out by an initial condition
    - the same equation read as a rule for the next instant: given where the system is now, the equation says how fast each quantity is changing, and nothing else
    - autonomous versus non-autonomous, where the rule either does or does not depend on the clock as well as on the state
    - linear versus non-linear, defined by whether the unknown function and its derivatives appear only to the first power and never multiplied together
    - physical readings of the same first-order form: exponential decay of a radioactive sample, cooling of a body towards ambient temperature, discharge of a capacitor, growth of a population without limit
    - the units of every term, where each derivative divides the state's units by time, so that consistency of units is a check on the equation itself
  - leads into: direction field, analytical solution, system of first-order equations

- direction field and integral curves
  - prereq: ordinary differential equation
  - representations
    - a short segment drawn at each point of the plane with the slope the equation prescribes there, turning the equation into a picture before any solution exists
    - integral curves as the curves that follow those segments everywhere, so a solution becomes something traced rather than computed
    - the family of integral curves filling the plane without crossing, and the uniqueness statement that follows from the crossing prohibition
    - isoclines as the loci where the prescribed slope is one fixed value, with the zero-slope isocline as the special case that locates equilibria
    - the initial condition as the choice of which integral curve is being followed, read off as a single point in the plane
    - qualitative behaviour read straight off the field with no solution formula present, as the first appearance of the theme that a solution and a formula are not the same thing
  - leads into: analytical solution, equilibria and linearisation

- analytical solution of a single equation
  - prereq: ordinary differential equation, integral (idea1)
  - representations
    - separation of variables, where the state and the clock are moved to opposite sides and both sides are integrated, with the arbitrary constant appearing as the integration constant
    - the linear first-order equation solved by an integrating factor, and the same solution read as the sum of a decaying memory of the initial condition and a response to the driving term
    - the linear constant-coefficient equation solved through its characteristic equation, with real roots giving exponentials and complex roots giving oscillations
    - the exponential function arriving as the answer to "what function is its own derivative", so that idea1's exponent entry is recognised in retrospect as having been the solution of a differential equation all along
    - the second-order oscillator (mass and spring, or pendulum at small angle) solved in closed form, with the three damping regimes appearing as the three cases of the characteristic roots
    - substitution methods for a few standard non-linear forms (homogeneous, Bernoulli), named as the boundary of the closed-form toolbox rather than expanded
    - verification by substitution as the only step that certifies a solution, independent of how it was found
    - the pendulum at large angle as the first equation in the idea with no elementary closed form, stated as the motivation for everything numerical that follows
  - leads into: numerical solution, system of first-order equations

- system of first-order equations
  - prereq: ordinary differential equation, analytical solution of a single equation
  - representations
    - several unknown functions of the same clock, each with its own equation, and each equation allowed to mention all of the unknowns
    - the state vector as the bundle of every unknown at one instant, and the system as one vector-valued rule for how that bundle changes
    - reduction of a single higher-order equation to a first-order system by naming each derivative as a new state variable, with the second-order oscillator carried through as the worked case
    - the linear system written as a matrix times the state vector, connecting straight back to idea1's matrix form of a network layer as the same notation doing different work
    - coupling as the entries off the matrix diagonal, with the uncoupled case shown to be several independent single equations wearing one notation
    - the general linear system solved through the eigenvalues and eigenvectors of its matrix, with each eigenvector direction behaving as an independent single equation
    - physical readings: two chemical species reacting, predator and prey, two masses joined by springs, current and voltage in a resonant circuit
    - dimension of the system as the number of state variables, established here as the quantity that later decides what behaviour is possible at all
  - leads into: phase space, numerical solution, equilibria and linearisation

- phase space and the trajectory
  - prereq: system of first-order equations
  - representations
    - one axis per state variable, so that the entire state at one instant is a single point and the clock is not an axis at all
    - the trajectory as the curve that point traces, with the equation supplying the velocity vector at every location
    - the same solution shown twice, as one curve in phase space and as one time series per variable, so that the two views are established as views of the same object rather than as two results
    - the vector field on phase space as the multi-variable version of the direction field, with the field fixed and the trajectory following it
    - trajectories never crossing in phase space for an autonomous system, and the reason: the rule at a point cannot prescribe two different velocities
    - closed trajectories as periodic solutions, read directly as "the state returns exactly to where it was"
    - two nearby starting points released together, with the gap between their trajectories established here as the quantity to watch for the rest of the idea
    - what a two-variable phase plane cannot contain, as the statement that motivates the third dimension later
  - leads into: equilibria and linearisation, limit cycle, attractor

- numerical solution methods
  - prereq: ordinary differential equation, system of first-order equations
  - representations
    - the forward Euler method as the direction field taken literally: stand at the current state, read the velocity, step along it for a short time, repeat
    - local error against global error, where a small error made at each step accumulates along the trajectory, and the order of a method as the power of the step size the local error carries
    - the midpoint and Heun methods as one correction to Euler, evaluating the rule twice a step and averaging
    - the fourth-order Runge-Kutta method as the standard workhorse, with four evaluations a step and its error carrying the fourth power of the step
    - step size as the single knob, with the same trajectory computed at several step sizes and the answers compared against each other rather than against a formula
    - adaptive stepping, where the step is shortened where the trajectory turns sharply and lengthened where it does not, and the error estimate that drives the choice
    - stiffness as the case where one part of the system moves far faster than another, forcing an explicit method to take steps sized for the fast part over the whole run, and implicit methods named as the response
    - symplectic and energy-preserving integrators for conservative systems, where the point is not accuracy of the trajectory but preservation of a conserved quantity over long runs
    - the honest statement of what a numerical solution is: a sequence of states, with no formula, from which every later picture in this idea is drawn
    - convergence as the step size shrinks, and the separate fact that a chaotic trajectory computed two ways will still diverge no matter how small the step, which is not a failure of the method
  - leads into: equilibria and linearisation, the Lorenz system, deterministic chaos

- equilibria and linearisation
  - prereq: system of first-order equations, phase space, gradient (idea1)
  - representations
    - an equilibrium as a state where the prescribed velocity is exactly zero, so the system placed there stays there
    - the Jacobian matrix as the array of first partial derivatives of the rule with respect to the state, and its reading as the local linear stand-in for a non-linear system, exactly parallel to idea1's tangent line for a curve
    - eigenvalues of the Jacobian as the local growth or decay rates, with each eigenvector as the direction that rate belongs to
    - the classification of a two-dimensional equilibrium by its eigenvalues: stable node, unstable node, saddle, stable spiral, unstable spiral, centre, with the phase portrait of each
    - complex eigenvalues as rotation, with the real part as growth or decay and the imaginary part as angular frequency, drawing directly on idea1's complex exponent entry
    - the saddle's stable and unstable directions as the first appearance of a structure that both attracts and repels
    - hyperbolicity as the condition that no eigenvalue sits on the imaginary axis, and the statement that linearisation decides the local behaviour exactly when that condition holds
    - the centre as the borderline case where linearisation decides nothing and the non-linear terms take over, named as the reason the classification is local and not global
  - leads into: stability and the Lyapunov exponent, limit cycle, bifurcation

- stability, and the Lyapunov exponent
  - prereq: equilibria and linearisation, exponent function and natural logarithm (idea1)
  - representations
    - stability posed as a question about neighbours rather than about one trajectory: released nearby, does the state come back, stay near, or leave
    - the three answers as asymptotic stability, neutral stability and instability, each read off a phase portrait
    - the separation between two nearby trajectories plotted against time on a logarithmic axis, with a straight line on that axis as exponential separation
    - the Lyapunov exponent as the slope of that line: the average exponential rate at which nearby states separate, positive for separation and negative for convergence
    - the spectrum of exponents, one per phase-space direction, and the sum of the spectrum as the rate at which a small volume of phase space grows or shrinks
    - the divergence of the vector field as the same volume statement read locally, separating conservative systems where volume is preserved from dissipative systems where it contracts
    - the largest exponent's sign as the working definition of chaos used for the rest of the idea, and the observation that a dissipative system can have a positive largest exponent while its volume still contracts
    - the finite-time exponent computed from a numerical trajectory, with the practical caveats: it needs a long run, it needs the transient discarded, and it is an average that says nothing about any single instant
  - leads into: attractor, deterministic chaos, the bifurcation diagram

- conservative and dissipative systems
  - prereq: stability and the Lyapunov exponent, integral (idea1)
  - representations
    - a conserved quantity as a function of the state that the equations leave unchanged along every trajectory, with total energy of the undamped oscillator as the worked case
    - trajectories confined to the level sets of a conserved quantity, so that a conserved quantity removes one dimension from where the state can go
    - the undamped pendulum's phase portrait as nested closed curves with a saddle at the inverted position, read entirely from its energy
    - dissipation as the loss of a conserved quantity, with the damped oscillator's spiral into the origin as the same phase portrait once energy leaks
    - a blob of initial conditions followed forward: unchanged in volume under a conservative flow, shrinking under a dissipative one
    - the consequence that only a dissipative system can have an attractor, since an attractor is by definition a set that a volume of states collapses onto
    - Lyapunov's function method as the way to certify stability without solving anything, named as the analytical counterpart to the numerical exponent
  - leads into: attractor, the Lorenz system

- limit cycle
  - prereq: phase space, equilibria and linearisation
  - representations
    - an isolated closed trajectory that nearby trajectories spiral onto, distinguished from the nested closed curves of a conservative system by that isolation
    - stable and unstable limit cycles, and the phase portrait of each
    - the van der Pol oscillator as the standard case, with the cycle's shape changing from near-circular to sharply relaxational as its one parameter grows
    - self-sustained oscillation as the physical reading: a system with no periodic driving that nevertheless settles into a fixed rhythm, with a heartbeat, a laser and a violin string as instances
    - the Poincare-Bendixson theorem as the statement that a bounded two-dimensional system with no equilibrium in its way must settle onto a closed trajectory, and its consequence that chaos is impossible in two dimensions
    - that consequence stated as the reason the idea moves to three state variables, so that the Lorenz system arrives as a necessity rather than as a curiosity
  - leads into: attractor, the Lorenz system, bifurcation

- attractor
  - prereq: phase space, stability and the Lyapunov exponent, conservative and dissipative systems, limit cycle
  - representations
    - the definition assembled from parts already present: a set that trajectories approach, that contains no smaller such set, and that a whole neighbourhood of states falls onto
    - the four kinds in ascending order of dimension: the stable equilibrium as a point attractor, the limit cycle as a one-dimensional attractor, the invariant torus as a two-dimensional attractor carrying two incommensurate frequencies, and the strange attractor
    - the basin of attraction as the set of starting states that end on a given attractor, with a system carrying several attractors and a basin boundary between them
    - the transient as the part of a trajectory before it reaches the attractor, and the practice of discarding it before measuring anything
    - the strange attractor introduced by its two properties together: trajectories on it separate exponentially, and yet the attractor itself is bounded and has a fractal dimension
    - the resolution of the apparent contradiction, that a bounded set can hold exponentially separating trajectories only by folding, and that repeated folding is what makes the dimension fractional
    - the fractal dimension of an attractor as the first place the two halves of this idea meet, with the box-counting definition taken from the fractal block
    - the word "strange" placed historically, as the name given when such a set was first identified rather than as a description of anything mysterious
  - leads into: the Lorenz system, deterministic chaos, fractal dimension

- the Poincare section and the first-return map
  - prereq: phase space, attractor
  - representations
    - a surface placed across the flow, and only the points where trajectories pierce it in one direction recorded, discarding everything between crossings
    - the continuous three-dimensional flow reduced to a discrete two-dimensional map, with one dimension removed by the section and the clock removed by only looking at crossings
    - a periodic orbit appearing as a single point on the section, a doubled period as two points, a torus as a closed curve, and a strange attractor as a fractal dust
    - the first-return map as the rule that takes one crossing to the next, establishing discrete-time dynamics as a legitimate object in its own right
    - the same reduction run on the Lorenz system, producing the one-dimensional map whose shape explains the attractor's structure
    - the bridge this builds: everything said about continuous systems can be asked of a map, and a map is far cheaper to iterate and to draw
  - leads into: the logistic map, deterministic chaos

- the Lorenz system
  - prereq: system of first-order equations, numerical solution methods, attractor
  - representations
    - the three equations in full, with each of the three parameters named and its physical origin given: the system was written in 1963 as a severely truncated model of convection in a fluid layer heated from below
    - the three state variables identified with what they stood for in that model, so the system is not presented as three arbitrary equations
    - the behaviour as the driving parameter is raised: a stable equilibrium at rest, then two symmetric equilibria as convection starts, then the loss of both and the appearance of the attractor
    - the trajectory in three-dimensional phase space as the two-lobed shape, together with the three time series, with the correspondence between a lobe switch and a sign change in the time series made explicit
    - two trajectories from initial conditions differing in the last recorded digit, followed until they are on opposite lobes, with the separation plotted on a logarithmic axis to recover the positive Lyapunov exponent
    - the attractor's volume contraction computed from the divergence of the field, showing a set that attracts every neighbourhood while having zero volume
    - the measured fractal dimension of the attractor, a little above two, with the reading that it is more than a surface and less than a solid
    - the Poincare section of the attractor and the return map read off it
    - the historical statement kept accurate: the sensitivity was found in the course of restarting a numerical run from printed output rounded to fewer digits than the machine held, and the phrase about a butterfly came later and from a different paper
  - leads into: deterministic chaos, the Rossler system

- the Rossler system
  - prereq: the Lorenz system
  - representations
    - the three equations in full, with the observation that two of them are linear and only one carries a single non-linear term, so that the machinery producing chaos is as small as it can be
    - the geometry read as one action rather than two: the trajectory spirals outward in a plane and is lifted and folded back into the middle, which is the stretch-and-fold operation named directly
    - the same system at a sequence of parameter values, passing through a simple cycle, a doubled cycle, further doublings, and then the attractor, so that the route in is visible in one family
    - the comparison against Lorenz: same dimension, same positive exponent, visibly simpler folding, no symmetry
    - its Poincare section as a nearly one-dimensional curve, which is what makes the return map so close to the maps studied in the next entries
    - the system placed historically as having been constructed deliberately in 1976 to be the simplest possible carrier of the behaviour, in contrast to Lorenz's arrival from a physical model
  - leads into: deterministic chaos, the logistic map

- deterministic chaos
  - prereq: stability and the Lyapunov exponent, the Lorenz system, the Poincare section
  - representations
    - the three conditions stated together as the definition, rather than sensitivity alone: sensitive dependence on initial conditions, dense periodic orbits, and topological mixing
    - determinism and unpredictability held side by side, with the rule fixed and exact, no noise anywhere, and the long-run outcome still unavailable
    - the doubling map on the unit interval as the smallest possible carrier, where each step is exactly one binary digit shifted out, making the loss of information per step countable
    - the stretch-and-fold operation as the mechanism, with the horseshoe construction as its canonical picture
    - the prediction horizon computed rather than asserted: with a known largest Lyapunov exponent and a known measurement precision, the time until the error reaches a stated size follows from a logarithm, and improving the measurement by a factor of ten buys only a fixed additional interval
    - the distinction from randomness made operationally: a chaotic series is generated by a rule of a few terms and lies on a low-dimensional attractor, which shows up in a delay embedding, while a random series does not
    - the distinction from instability, since an unstable equilibrium loses its neighbours once and a chaotic system loses them while staying bounded forever
    - what chaos does not mean, listed explicitly to close the usual misreadings: not disorder, not noise, not complexity in the everyday sense, and not a licence to give up on prediction over short intervals
  - leads into: the logistic map, the bifurcation diagram, chaos control

- the logistic map and discrete-time dynamics
  - prereq: the Poincare section, deterministic chaos
  - representations
    - the map in one line, with its one parameter, and its origin as a population model where growth is checked by crowding
    - iteration as a sequence of numbers, with the cobweb diagram as the geometric form of the same iteration against the diagonal
    - fixed points as intersections with the diagonal, and their stability decided by the slope of the map there, which is the one-dimensional case of the Jacobian eigenvalue
    - the behaviour as the parameter is raised: a single fixed point, a two-cycle, a four-cycle, an eight-cycle, and then aperiodic behaviour
    - the second iterate of the map plotted alongside the map itself, so that a two-cycle of one is a fixed point of the other, which makes the doubling mechanism visible rather than asserted
    - the time series at a chaotic parameter value set beside a series of random numbers, indistinguishable by eye, separated by the cobweb and by the return map
    - the whole of the earlier continuous material recognised in a system with one variable and one parameter, and the closing observation that dimension one suffices in discrete time while dimension three was needed in continuous time
  - leads into: bifurcation, the bifurcation diagram

- bifurcation
  - prereq: equilibria and linearisation, the logistic map
  - representations
    - a bifurcation as a qualitative change in the set of attractors as a parameter passes a critical value, distinguished from the quantitative change that a parameter usually causes
    - the saddle-node bifurcation, where two equilibria approach, meet and annihilate, leaving the state nowhere nearby to settle
    - the transcritical bifurcation, where two equilibria exchange stability as they cross
    - the pitchfork bifurcation, where one equilibrium loses stability and two new ones appear symmetrically, with the symmetry of the equations as the reason
    - the Hopf bifurcation, where a spiral equilibrium loses stability and a limit cycle is born around it, identified as the eigenvalue pair crossing the imaginary axis
    - the period-doubling bifurcation for maps, where a cycle loses stability and a cycle of twice the period appears, identified as the slope of the iterated map passing minus one
    - the bifurcation diagram of a single bifurcation as the local picture: the parameter on one axis, the location of each attractor on the other, stable branches solid and unstable branches broken
    - hysteresis where two attractors coexist over a parameter range, so that the path taken through parameter space decides which one the system is on
    - the normal form of each bifurcation as the statement that these few pictures exhaust the local possibilities, which is why the list is short
  - leads into: the bifurcation diagram and the period-doubling cascade

- the bifurcation diagram and the period-doubling cascade
  - prereq: bifurcation, the logistic map, stability and the Lyapunov exponent
  - representations
    - the diagram built by construction rather than displayed: for each parameter value the map is iterated, the transient discarded, and the visited values plotted above that parameter
    - the cascade read off the diagram: one branch, two, four, eight, sixteen, with the parameter intervals between successive doublings visibly shrinking
    - the ratio of successive intervals computed from the diagram and seen to approach a limit, with that limit named as Feigenbaum's delta and its value 4.669
    - the second constant, Feigenbaum's alpha, 2.503, as the corresponding ratio of the widths of the branches rather than of the parameter intervals
    - universality as the claim that both constants are the same for every map with a single smooth quadratic maximum, checked by running the same construction on a different such map and recovering the same numbers
    - the accumulation point where the doublings run out, and beyond it the chaotic band with the periodic windows inside it, the widest of which is the three-cycle
    - self-similarity of the diagram under magnification at the accumulation point, with alpha as the scale factor, which is the point at which this entry and the fractal block are the same subject
    - the largest Lyapunov exponent plotted beneath the diagram on the same parameter axis, negative through the periodic regime, touching zero exactly at each bifurcation, and positive in the chaotic band, so that the earlier definition of chaos is confirmed against the picture
    - the same construction applied to a continuous system's Poincare section, recovering a cascade in the Rossler system, which closes the loop back to continuous time
  - leads into: fractal dimension, escape-time dynamics

- fractal dimension (produced)
  - prereq: the bifurcation diagram, attractor, exponent function and natural logarithm (idea1)
  - representations
    - covered by `math/01-fractals`, parts 1 to 7 and part 11: the coastline paradox and the divider method, box-counting dimension, the Koch curve as an idealised coastline, iterated function systems and the Barnsley fern, the wider geometric family, the random growth models, and the analytical layer that derives the dimension formulas and states the Hausdorff definition
    - the entry exists here for the prerequisite chain only. what those parts show, why each exists, and how each connects to its neighbours is recorded per part in `math/01-fractals/NARRATION.md`
    - the two connections back into this idea that the produced series does not itself make, and that story2 has to supply: the dimension of a strange attractor as an instance of the box-counting definition, and the self-similarity of the bifurcation diagram as an instance of the scaling law
  - leads into: escape-time dynamics

- escape-time dynamics (produced)
  - prereq: fractal dimension, complex exponent and Euler's identity (idea1), the logistic map
  - representations
    - covered by `math/01-fractals`, parts 8 to 10: the complex plane and complex arithmetic, the escape-time test, Julia sets, the Mandelbrot set, the colouring by escape count, and the boundary's structure under magnification
    - the entry exists here for the prerequisite chain only, with the per-part record in `math/01-fractals/NARRATION.md`
    - the correction this idea has to make, because the original sketch has it wrong: the Mandelbrot set is not "the fractal on the imaginary axis". it is the set of complex parameters c for which the orbit of zero under the quadratic map stays bounded, and it lives in the plane of the parameter, not in the plane of the state. its Julia sets live in the plane of the state
    - the connection that the sketch was reaching for, which is real and is the strongest single link between the two halves of this idea: the quadratic map restricted to real numbers is the logistic map after a change of variable, so the intersection of the Mandelbrot set with the real axis is the parameter axis of the bifurcation diagram. the period-doubling cascade is the chain of circular bulbs along that axis, each bulb's period is the period of the cycle attracting there, the accumulation point is the Feigenbaum point on the real axis, and the same delta governs the shrinking of the bulbs
    - the periodic windows inside the chaotic band identified with the small copies of the whole set strung along the real axis, so that two pictures produced independently in different parts of the series turn out to be one picture
  - leads into: chaos control

- partial differential equations, briefly
  - prereq: laplacian (idea1), ordinary differential equation, numerical solution methods
  - representations
    - the step from one independent variable to several, where the unknown is a function of space as well as time and the equation carries partial derivatives in each
    - the heat equation as the canonical first-order-in-time case, with its reading as "the rate of change at a point is proportional to how much the neighbours differ from it", which is the laplacian's physical meaning from idea1 read out loud
    - the wave equation as the canonical second-order-in-time case, with the same laplacian on the right and a qualitatively different behaviour, so that the time derivative's order is seen to matter as much as the spatial term
    - Laplace's and Poisson's equations as the steady state, where the time derivative is dropped and what remains is a statement about the balance of neighbours
    - boundary conditions as the additional data a spatial problem needs, replacing the initial condition of the single-variable case
    - discretisation on a grid, where each partial derivative becomes a finite difference between neighbouring cells and the equation becomes a large sparse system, connecting to the relaxation computation already used by the dielectric-breakdown model in part 7 of the produced series
    - the honest boundary of the treatment: named, discretised, connected to what has already been shown, and not solved analytically, since separation of variables and transform methods are their own subject
  - leads into: chaos control

- chaos control
  - prereq: deterministic chaos, the bifurcation diagram, equilibria and linearisation
  - representations
    - the counter-intuitive premise stated first: sensitivity to small perturbations, which makes a chaotic system unpredictable, is exactly what makes it controllable with vanishingly small effort
    - the dense set of unstable periodic orbits inside a strange attractor as the raw material, so that control means stabilising an orbit the system already visits rather than imposing a new one
    - the Ott-Grebogi-Yorke method, where the state is tracked until it lands near the chosen unstable orbit and a small parameter adjustment, computed from the local linearisation, is applied to place it on the orbit's stable direction
    - the size of the required perturbation, which shrinks with the tolerance on how close the state must be, so that waiting longer buys a smaller intervention
    - delayed-feedback control, where the correction is proportional to the difference between the present state and the state one period earlier, requiring no model of the system and no knowledge of the orbit
    - targeting, where the same sensitivity is used to steer the state to a chosen region far faster than it would arrive on its own
    - the failure modes: control that is lost when the perturbation bound is too small for the noise present, and orbits whose linearisation makes them unreachable
  - leads into: the cardiac arrhythmia experiment

- the cardiac arrhythmia experiment
  - prereq: chaos control, the logistic map, the Poincare section
  - representations
    - the 1992 experiment as the closing case, in which chaos control was applied to cardiac tissue: a piece of rabbit heart in a bath, made arrhythmic by a drug, with the interval between beats recorded as the observable
    - the sequence of inter-beat intervals treated as a discrete map, so that the entire discrete-time apparatus of this idea applies to a measured biological signal with no model of the tissue
    - the return map built from the recorded intervals, and the unstable fixed point found in it, identified as the periodic rhythm the tissue is failing to hold
    - the control applied as small, correctly timed electrical stimuli, chosen by the delayed-feedback rule, and the interval sequence collapsing from aperiodic to periodic
    - the amount of energy involved, far below defibrillation, as the practical significance: the intervention works with the system's dynamics rather than against them
    - the accurate statement of what was and was not shown, since this is where the subject is most often overclaimed: an in-vitro preparation was stabilised, arrhythmia in an intact heart is not established as low-dimensional chaos, and no clinical device followed from it
    - the closing structural point of the whole idea, that the chain from a rule written in a few lines, through numerical solution, through an attractor, through a measured exponent, through a bifurcation diagram, to a small correctly-timed nudge, is one chain, and every link in it was built in this idea
  - leads into: nothing; closing entry

## out of scope for this idea

- neural networks, loss surfaces, gradient descent and everything else about training: all in idea1
- tokens, embeddings, autoregressive generation, language models: all in idea3
- Hamiltonian mechanics, canonical coordinates and integrable systems beyond the conserved-quantity entry: named only where a conserved quantity is needed
- ergodic theory, invariant measures and the formal definitions of mixing beyond the statement in the chaos entry: out of scope at this level
- delay differential equations, and chaos in systems with infinitely many degrees of freedom: out of scope
- turbulence, and the relationship between the Lorenz truncation and the Navier-Stokes equations it came from: named in the Lorenz entry as the origin, not expanded
- analytical solution methods for partial differential equations (separation of variables, transforms, Green's functions): out of scope, the partial-differential-equation entry stops at discretisation
- proofs: the Poincare-Bendixson theorem, the perceptron-style convergence statements, universality of the Feigenbaum constants and the Hausdorff-versus-box-counting relation are stated and used, never proved
