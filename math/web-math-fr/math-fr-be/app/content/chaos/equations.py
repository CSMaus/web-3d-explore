SYSTEMS = [
    {
        "id": "field",
        "name": "One equation, and its field",
        "summary": (
            "An equation whose unknown is a function rather than a number. It prescribes a rate "
            "at every state, which can be drawn before anything is solved"
        ),
        "blocks": [
            {
                "label": "The object",
                "tex": r"\frac{dx}{dt} = f(x, t), \qquad x(t_0) = x_0",
                "note": "The rule says how fast the state changes, and nothing else",
            },
            {
                "label": "Separable, solved by integrating both sides",
                "tex": r"\frac{dx}{g(x)} = h(t)\,dt \;\Longrightarrow\; \int\!\frac{dx}{g(x)} = \int\! h(t)\,dt + C",
                "note": "The arbitrary constant is the initial condition in disguise",
            },
            {
                "label": "Linear first order, by an integrating factor",
                "tex": r"x' + a(t)x = b(t), \qquad x(t) = e^{-A(t)}\!\left(\int\! e^{A(t)}b(t)\,dt + C\right),\; A = \!\int\! a",
                "note": "A decaying memory of the start plus a response to the driving term",
            },
            {
                "label": "Linear with constant coefficients, by its characteristic equation",
                "tex": r"x'' + 2\zeta\omega x' + \omega^2 x = 0, \qquad \lambda^2 + 2\zeta\omega\lambda + \omega^2 = 0",
                "note": "Real roots give exponentials, complex roots give oscillation",
            },
            {
                "label": "Where the closed form stops",
                "tex": r"\theta'' + \frac{g}{L}\sin\theta = 0",
                "note": (
                    "The pendulum without the small-angle approximation. No elementary solution "
                    "exists, which is the reason for everything numerical that follows"
                ),
            },
        ],
        "dimension": {
            "label": "What a solution is",
            "tex": r"x(t)\ \text{such that}\ x'(t) - f(x(t), t) \equiv 0",
            "note": "Verification by substitution is the only step that certifies one",
        },
    },
    {
        "id": "solvers",
        "name": "Solving it by stepping",
        "summary": (
            "No formula, only the rate at the current state. A trajectory is built one small step "
            "at a time, and the size of the step decides how much of it is real"
        ),
        "blocks": [
            {
                "label": "Forward Euler, the field taken literally",
                "tex": r"x_{n+1} = x_n + h\,f(x_n, t_n)",
                "note": "Stand where you are, read the rate, walk along it",
            },
            {
                "label": "Midpoint, one correction",
                "tex": r"x_{n+1} = x_n + h\,f\!\left(x_n + \tfrac{h}{2}f(x_n,t_n),\; t_n + \tfrac{h}{2}\right)",
                "note": "The rate is read again halfway across the step",
            },
            {
                "label": "Fourth-order Runge-Kutta, the workhorse",
                "tex": (
                    r"x_{n+1} = x_n + \frac{h}{6}\left(k_1 + 2k_2 + 2k_3 + k_4\right),\qquad"
                    r"\begin{aligned} k_1 &= f(x_n, t_n) \\ k_2 &= f(x_n + \tfrac{h}{2}k_1,\; t_n + \tfrac{h}{2}) \\"
                    r" k_3 &= f(x_n + \tfrac{h}{2}k_2,\; t_n + \tfrac{h}{2}) \\ k_4 &= f(x_n + h k_3,\; t_n + h) \end{aligned}"
                ),
                "note": "Four readings of the rate a step",
            },
            {
                "label": "The order of a method",
                "tex": r"\lVert x_N - x(T) \rVert = O(h^{\,p}) \quad\Longrightarrow\quad p = \log_2\!\frac{e(h)}{e(h/2)}",
                "note": (
                    "Halving the step should divide the error by two to the power of the order. "
                    "Measured on the oscillator, where the exact answer is known: 1.03 for Euler, "
                    "2.00 for midpoint, 4.00 for Runge-Kutta"
                ),
            },
            {
                "label": "What a method does not preserve",
                "tex": r"E = \tfrac{1}{2}\!\left(x^2 + v^2\right) \ \text{constant for}\ x'' + x = 0",
                "note": (
                    "Over a hundred turns at a step of 0.01, Euler reports an energy of 267.67 "
                    "where the answer is 0.5, and Runge-Kutta reports 0.500000"
                ),
            },
        ],
        "dimension": {
            "label": "The order, measured rather than quoted",
            "tex": r"p \approx \log_2\!\left(e(h)\,/\,e(h/2)\right)",
            "note": "With the end of the run landing exactly on a whole period, or the offset in the end time swamps the method",
        },
    },
    {
        "id": "phase",
        "name": "Two unknowns, and the phase plane",
        "summary": (
            "Several unknown functions of one clock. The whole state becomes a single point, its "
            "history a single curve, and the clock leaves the axes altogether"
        ),
        "blocks": [
            {
                "label": "The system",
                "tex": r"\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}), \qquad \mathbf{x} \in \mathbb{R}^2",
                "note": "One rule for the whole bundle of unknowns",
            },
            {
                "label": "A higher order equation as a system",
                "tex": r"x'' = g(x, x') \;\Longleftrightarrow\; \begin{cases} \dot{x} = v \\ \dot{v} = g(x, v)\end{cases}",
                "note": "Naming each derivative as a new state variable, and nothing else",
            },
            {
                "label": "An equilibrium, and the linear stand-in beside it",
                "tex": r"\mathbf{f}(\mathbf{x}^{*}) = \mathbf{0}, \qquad J_{ij} = \left.\frac{\partial f_i}{\partial x_j}\right|_{\mathbf{x}^{*}}",
                "note": "The Jacobian is to a system what the tangent line is to a curve",
            },
            {
                "label": "The eigenvalues that classify it",
                "tex": r"\lambda_{1,2} = \frac{\tau \pm \sqrt{\tau^2 - 4\Delta}}{2}, \qquad \tau = \operatorname{tr} J,\ \ \Delta = \det J",
                "note": (
                    "Real and same sign is a node, opposite signs a saddle, complex a spiral, and "
                    "purely imaginary a centre, where the linear picture decides nothing"
                ),
            },
            {
                "label": "Volume, and whether it leaks",
                "tex": r"\nabla\!\cdot\!\mathbf{f} = \operatorname{tr} J = \frac{1}{V}\frac{dV}{dt}",
                "note": "Only a system that loses volume can have an attractor",
            },
            {
                "label": "The van der Pol oscillator, and its limit cycle",
                "tex": r"\ddot{x} - \mu\!\left(1 - x^2\right)\dot{x} + x = 0",
                "note": "An isolated closed trajectory that its neighbours spiral onto",
            },
            {
                "label": "Why two dimensions are not enough",
                "tex": r"\text{Poincar\'e-Bendixson: a bounded planar orbit tends to an equilibrium or a closed orbit}",
                "note": "So chaos is impossible in the plane, and the third variable is a necessity rather than a curiosity",
            },
        ],
        "dimension": {
            "label": "The classification, from the two eigenvalues",
            "tex": r"\operatorname{sign}(\operatorname{Re}\lambda_i),\quad \operatorname{Im}\lambda_i \ne 0\,?",
            "note": "Measured at every equilibrium Newton finds, not assumed from the picture",
        },
    },
    {
        "id": "lorenz",
        "name": "The Lorenz system",
        "summary": (
            "Three equations written in 1963 as a severely truncated model of convection in a "
            "fluid layer heated from below. The smallest honest place chaos can live"
        ),
        "blocks": [
            {
                "label": "The three equations",
                "tex": (
                    r"\begin{aligned} \dot{x} &= \sigma\,(y - x) \\ \dot{y} &= x\,(\rho - z) - y \\"
                    r" \dot{z} &= x y - \beta z \end{aligned}"
                ),
                "note": "Classically sigma = 10, rho = 28, beta = 8/3",
            },
            {
                "label": "Its equilibria",
                "tex": r"\mathbf{0}, \qquad \left(\pm\sqrt{\beta(\rho-1)},\ \pm\sqrt{\beta(\rho-1)},\ \rho-1\right)",
                "note": "The origin is the fluid at rest; the symmetric pair is steady convection, and both lose stability by rho = 28",
            },
            {
                "label": "The volume it loses, everywhere and at the same rate",
                "tex": r"\nabla\!\cdot\!\mathbf{f} = -(\sigma + 1 + \beta) = -13.6\overline{66}",
                "note": "Constant, so a point value is the average. Measured at -13.6667",
            },
            {
                "label": "How fast neighbours separate",
                "tex": r"\lambda_1 = \lim_{T\to\infty}\frac{1}{T}\ln\frac{\lVert \delta(T)\rVert}{\lVert\delta(0)\rVert}",
                "note": "Measured at 0.9043 by releasing a neighbour and renormalising; the published value is 0.906",
            },
            {
                "label": "The prediction horizon that follows",
                "tex": r"T \approx \frac{1}{\lambda_1}\ln\frac{\Delta}{\delta_0}",
                "note": "A factor of ten in measurement precision buys ln(10)/0.904, about 2.5 more time units, and no more",
            },
        ],
        "dimension": {
            "label": "The Kaplan-Yorke dimension",
            "tex": r"D = 2 + \frac{\lambda_1}{\lvert\lambda_3\rvert}, \qquad \lambda_1 + \lambda_2 + \lambda_3 = \nabla\!\cdot\!\mathbf{f},\ \ \lambda_2 = 0",
            "note": (
                "The middle exponent is zero because moving along the trajectory neither grows nor "
                "shrinks a separation, so the third follows from the divergence. Measured 2.062, "
                "which is the published value. Box counting on a finite sample gives 1.911, and the "
                "two are different definitions rather than a disagreement"
            ),
        },
    },
    {
        "id": "rossler",
        "name": "The Rossler system",
        "summary": (
            "Built on purpose in 1976 to be the simplest carrier of the same behaviour. Two of "
            "the three equations are linear and only one term is not"
        ),
        "blocks": [
            {
                "label": "The three equations",
                "tex": (
                    r"\begin{aligned} \dot{x} &= -y - z \\ \dot{y} &= x + a y \\"
                    r" \dot{z} &= b + z\,(x - c) \end{aligned}"
                ),
                "note": "Classically a = 0.2, b = 0.2, c = 5.7. The only non-linear term is z x",
            },
            {
                "label": "Stretch and fold, as one action",
                "tex": r"\text{spiral outward in the } (x,y) \text{ plane} \;\longrightarrow\; \text{lifted by } z \;\longrightarrow\; \text{folded back inward}",
                "note": "The mechanism behind every chaotic system in this topic, with nothing in the way of seeing it",
            },
            {
                "label": "The volume it loses, which is not the same everywhere",
                "tex": r"\nabla\!\cdot\!\mathbf{f} = a + x - c",
                "note": (
                    "State-dependent, so a point value is not the contraction rate. At (1,1,1) it "
                    "reads -4.500 and the average along the attractor is -5.325"
                ),
            },
            {
                "label": "The section that reduces the flow to a map",
                "tex": r"\Sigma = \{\,y = 0,\ \dot{y} > 0\,\}, \qquad P : \Sigma \to \Sigma",
                "note": "One dimension removed by the plane, the clock removed by looking only at crossings",
            },
        ],
        "dimension": {
            "label": "The Kaplan-Yorke dimension",
            "tex": r"D = 2 + \frac{\lambda_1}{\lvert\lambda_3\rvert}",
            "note": (
                "From a measured largest exponent of 0.0702, published 0.0714, and a measured mean "
                "divergence of -5.325: D = 2.013, against a published 2.01"
            ),
        },
    },
    {
        "id": "logistic",
        "name": "The logistic map",
        "summary": (
            "One number to the next, over and over. A map needs one dimension to be chaotic where "
            "a flow needs three, so everything about it is cheap to compute and to draw"
        ),
        "blocks": [
            {
                "label": "The map",
                "tex": r"x_{n+1} = r\,x_n\,(1 - x_n), \qquad x \in [0, 1]",
                "note": "Growth checked by crowding, with one parameter",
            },
            {
                "label": "Its fixed points, and when they hold",
                "tex": r"x^{*} = 0,\ \ 1 - \tfrac{1}{r}; \qquad \text{stable while } \lvert f'(x^{*})\rvert < 1,\ \ f'(x) = r\,(1 - 2x)",
                "note": "The slope at the fixed point is the one-dimensional case of the Jacobian eigenvalue",
            },
            {
                "label": "A cycle of one map is a fixed point of another",
                "tex": r"f_r^{(2)}(x) = f_r\!\left(f_r(x)\right)",
                "note": "Which is what makes period doubling mechanical rather than mysterious",
            },
            {
                "label": "Period doubling, as a condition on the slope",
                "tex": r"\frac{d}{dx}f_r^{(2^{n})}\!\left(x^{*}\right) = -1",
                "note": "The cycle loses stability and one of twice the period appears",
            },
            {
                "label": "Superstable, where the critical point is on the cycle",
                "tex": r"f_R^{(2^{n})}(\tfrac{1}{2}) = \tfrac{1}{2}",
                "note": (
                    "Located by bisection at R = 2, 3.236068, 3.498562, 3.554641, 3.566667, "
                    "3.569244, 3.569795, 3.569913"
                ),
            },
        ],
        "dimension": {
            "label": "The Lyapunov exponent of a map",
            "tex": r"\lambda = \lim_{N\to\infty}\frac{1}{N}\sum_{n=0}^{N-1}\ln\bigl\lvert f'(x_n)\bigr\rvert",
            "note": (
                "Negative on a cycle, zero at every bifurcation, positive in the chaotic band. At "
                "r = 4 it is exactly ln 2, and the measurement returns 0.6931"
            ),
        },
    },
    {
        "id": "bifurcation",
        "name": "The bifurcation diagram",
        "summary": (
            "Every parameter value on one axis and every value the orbit visits above it. The "
            "list of qualitative changes becomes a single picture"
        ),
        "blocks": [
            {
                "label": "How it is built",
                "tex": r"\text{for each } r: \ \text{iterate, discard the transient, plot what remains}",
                "note": "Constructed rather than displayed, so nothing about it is drawn by hand",
            },
            {
                "label": "The local pictures, and why the list is short",
                "tex": (
                    r"\dot{x} = r - x^2 \ \ (\text{saddle-node}), \qquad \dot{x} = rx - x^3 \ \ (\text{pitchfork}), \qquad"
                    r" \operatorname{Re}\lambda_{1,2} : - \to + \ \ (\text{Hopf})"
                ),
                "note": "The normal forms exhaust the local possibilities, which is why there are so few",
            },
            {
                "label": "The cascade, and the constant in its gaps",
                "tex": r"\delta = \lim_{n\to\infty}\frac{R_{n} - R_{n-1}}{R_{n+1} - R_{n}} = 4.669\,201\ldots",
                "note": (
                    "The measured ratios run 4.7089, 4.6808, 4.6630, 4.6684, 4.6690, 4.6692 as the "
                    "period doubles from 4 to 128"
                ),
            },
            {
                "label": "Universality, checked rather than asserted",
                "tex": r"x_{n+1} = r\sin(\pi x_n)",
                "note": (
                    "A different family with a single smooth maximum. The same construction returns "
                    "4.6690, and its cascade accumulates at 0.865571 rather than 3.569913"
                ),
            },
            {
                "label": "The second constant, in the widths rather than the gaps",
                "tex": r"\alpha = 2.502\,907\ldots",
                "note": "The factor the diagram is self-similar under at the accumulation point, which is where this topic and the fractals topic are the same subject",
            },
        ],
        "dimension": {
            "label": "Feigenbaum's delta, measured on two families",
            "tex": r"\delta \approx \frac{R_{n} - R_{n-1}}{R_{n+1} - R_{n}}",
            "note": "4.6692 from the logistic family and 4.6690 from the sine family, both from the same code",
        },
    },
    {
        "id": "control",
        "name": "A real heart: the normal beat, the arrhythmia, and back",
        "summary": (
            "Half an hour of one recorded human heartbeat, record 207 of the MIT-BIH Arrhythmia "
            "Database, as intervals between marked beats: the normal rhythm, runs of ventricular "
            "flutter that start and stop on their own, and the return map of the switches"
        ),
        "blocks": [
            {
                "label": "The interval",
                "tex": r"I_{n} = t_{n+1} - t_{n}",
                "note": "the time from one marked beat to the next, in milliseconds, from the cardiologists' annotation file at 360 samples a second. during flutter each flutter wave is a marked beat",
            },
            {
                "label": "The return map",
                "tex": r"(I_{n},\, I_{n+1})",
                "note": "each interval against the one after it, the picture the Rossler page introduced and the 1992 experiment used. a rhythm that repeats is one spot; a switch is a jump between clouds",
            },
            {
                "label": "How much one interval says about the next",
                "tex": r"\rho = \frac{\overline{\sigma(I_{n+1} \mid I_n \in \text{bin})}}{\sigma(I_{n+1})}",
                "note": "the spread of the next interval among beats whose own interval fell in the same 20 ms bin, over the spread knowing nothing. one for no help, zero for a rule; the same measure the primes aside uses",
            },
            {
                "label": "Rate from interval",
                "tex": r"\text{beats a minute} = \frac{60000}{\bar{I}}",
                "note": "her normal rhythm and the flutter, each as a rate, from their mean intervals",
            },
        ],
        "dimension": {
            "label": "What the record is",
            "tex": r"\text{MIT-BIH 207: 47 patients, 1975-1979, ODC-BY 1.0}",
            "note": "Moody and Mark, IEEE Eng Med Biol 20(3), 2001; Goldberger and colleagues, Circulation 101(23), 2000; PhysioNet doi 10.13026/C2F305. nothing on the page is generated",
        },
    },
]

DEFINITIONS = [
    {
        "id": "upo",
        "name": "An unstable periodic orbit, and control by nudging",
        "tex": r"x^{*} = f(x^{*}), \quad |f'(x^{*})| > 1",
        "note": (
            "A point the rule returns to exactly, which nearby states leave. A chaotic attractor "
            "is threaded with them, which is why the rhythm keeps passing close to a steady beat "
            "it never keeps. Ott, Grebogi and Yorke showed in 1990 that a small, well timed "
            "change made whenever the state comes near can hold it there; Garfinkel, Spano, "
            "Ditto and Weiss did it in heart tissue in 1992 with stimuli that could only shorten "
            "a beat."
        ),
    },
    {
        "id": "lyapunov",
        "name": "The Lyapunov exponent",
        "tex": r"\lambda = \lim_{T\to\infty}\frac{1}{T}\ln\frac{\lVert\delta(T)\rVert}{\lVert\delta(0)\rVert}",
        "note": (
            "The average exponential rate at which neighbouring states separate. Its sign is the "
            "working definition of chaos, and it is measured by renormalising the separation so "
            "the pair never saturates at the width of the attractor"
        ),
    },
    {
        "id": "divergence",
        "name": "The divergence of the field",
        "tex": r"\nabla\!\cdot\!\mathbf{f} = \sum_i \frac{\partial f_i}{\partial x_i} = \frac{1}{V}\frac{dV}{dt}",
        "note": (
            "The rate at which a small volume of states grows or shrinks. It equals the sum of the "
            "exponents, which is what lets the third one be found from the other two"
        ),
    },
    {
        "id": "kaplanyorke",
        "name": "The Kaplan-Yorke dimension",
        "tex": r"D = k + \frac{\sum_{i=1}^{k}\lambda_i}{\lvert\lambda_{k+1}\rvert}, \qquad k = \max\Bigl\{\,j : \textstyle\sum_{i\le j}\lambda_i \ge 0\,\Bigr\}",
        "note": (
            "Whole directions the stretching supports, plus the fraction of the next one it "
            "reaches. This is the number usually quoted for a strange attractor"
        ),
    },
    {
        "id": "boxcount",
        "name": "Box-counting dimension",
        "tex": r"d = \lim_{\varepsilon\to 0}\frac{\log N(\varepsilon)}{\log(1/\varepsilon)}",
        "note": (
            "The same definition the fractals topic measured on a coastline. On a trajectory it "
            "applies only while the box is larger than the spacing between recorded states, so the "
            "fit is taken over that window and the window is reported with the answer"
        ),
    },
    {
        "id": "feigenbaum",
        "name": "Feigenbaum's constants",
        "tex": r"\delta = 4.669\,201\ldots, \qquad \alpha = 2.502\,907\ldots",
        "note": (
            "The ratio the parameter gaps of the cascade shrink by, and the ratio its branch widths "
            "shrink by. The same two numbers for every map with a single smooth quadratic maximum, "
            "whatever else it is"
        ),
    },
]
