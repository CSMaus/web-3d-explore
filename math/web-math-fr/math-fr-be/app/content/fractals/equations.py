SYSTEMS = [
    {
        "id": "ifs",
        "name": "Iterated maps",
        "summary": (
            "A small set of affine moves applied to one point over and over, one chosen at "
            "random each step, so the visited points pile up onto a single fixed shape"
        ),
        "blocks": [
            {
                "label": "One move",
                "tex": r"f_k(x,y) = \bigl(a_k x + b_k y + e_k,\; c_k x + d_k y + f_k\bigr)",
                "note": "Four numbers turn and stretch, two more shift",
            },
            {
                "label": "The chaos game",
                "tex": r"z_{n+1} = f_{k_n}(z_n), \qquad \Pr[k_n = k] = p_k",
                "note": "The move is drawn from the weights each step",
            },
            {
                "label": "The attractor",
                "tex": r"A = \bigcup_{k} f_k(A)",
                "note": "The shape is exactly the union of its own images",
            },
            {
                "label": "Why it settles",
                "tex": (
                    r"s_k = \sigma_{\max}(M_k) = \sqrt{\lambda_{\max}\!\left(M_k^{\mathsf T}"
                    r" M_k\right)} < 1"
                ),
                "note": "Every move shrinks, so any starting shape is pulled onto the same limit",
            },
        ],
        "dimension": {
            "label": "Measured by box counting",
            "tex": r"d = \lim_{\varepsilon \to 0} \frac{\log N(\varepsilon)}{\log(1/\varepsilon)}",
            "note": "The fern measures about 1.78",
        },
    },
    {
        "id": "lsystem",
        "name": "Rewriting systems",
        "summary": (
            "A short seed word rewritten by a handful of rules, once per pass, then read as "
            "turtle instructions"
        ),
        "blocks": [
            {
                "label": "A production",
                "tex": r"\omega \to \omega', \qquad w_{n+1} = P(w_n)",
                "note": "Every symbol is replaced at once, so the word grows by a fixed factor",
            },
            {
                "label": "The branching plant",
                "tex": r"X \to F+[[X]-X]-F[-FX]+X, \qquad F \to FF",
                "note": "F draws a step, plus and minus turn, brackets remember a point",
            },
            {
                "label": "The turtle",
                "tex": (
                    r"\begin{aligned} p_{n+1} &= p_n + \ell\,(\cos\theta_n, \sin\theta_n) \\"
                    r" \theta_{n+1} &= \theta_n \pm \alpha \end{aligned}"
                ),
                "note": "One turn angle for the whole word",
            },
        ],
        "dimension": {
            "label": "Read off the rule when the pieces are exact copies",
            "tex": r"d = \frac{\log N}{\log(1/s)}",
            "note": "The Koch curve gives log 4 over log 3, about 1.262",
        },
    },
    {
        "id": "lichtenberg",
        "name": "Dielectric breakdown",
        "summary": (
            "The field is solved on the grid and the chance a site lights up next is its field "
            "strength raised to a power, which is the figure a discharge burns into an insulator"
        ),
        "blocks": [
            {
                "label": "The field between growths",
                "tex": r"\nabla^2 \phi = 0, \qquad \phi = 0 \text{ on the cluster}",
                "note": "The cluster is a conductor, so the potential is flat across it",
            },
            {
                "label": "Where the next site lights up",
                "tex": (
                    r"p_i = \frac{\left|\nabla\phi_i\right|^{\eta}}"
                    r"{\sum_{j \in \partial} \left|\nabla\phi_j\right|^{\eta}}"
                ),
                "note": "Eta is the one knob: at 0 every edge site is equally likely",
            },
            {
                "label": "The relaxation that solves it",
                "tex": (
                    r"\phi^{(m+1)}_{r,c} = \tfrac{1}{4}\left(\phi^{(m)}_{r-1,c} + "
                    r"\phi^{(m)}_{r+1,c} + \phi^{(m)}_{r,c-1} + \phi^{(m)}_{r,c+1}\right)"
                ),
                "note": "Swept until the field stops moving, then a few sweeps after each growth",
            },
        ],
        "dimension": {
            "label": "Measured by box counting, and it follows the knob",
            "tex": (
                r"d(\eta): \; 1.58 \;\text{at}\; \eta = 0.6"
                r" \;\longrightarrow\; 1.27 \;\text{at}\; \eta = 2"
            ),
            "note": "A bushy cluster measures high, a thin needle measures low",
        },
    },
    {
        "id": "dla",
        "name": "Wandering particles",
        "summary": (
            "One seed, and particles released one at a time that step at random until they touch "
            "the cluster and stick"
        ),
        "blocks": [
            {
                "label": "One step of the walk",
                "tex": (
                    r"\Pr\bigl[(y,x) \to (y \pm 1, x)\bigr] = "
                    r"\Pr\bigl[(y,x) \to (y, x \pm 1)\bigr] = \tfrac14"
                ),
                "note": "No direction and no memory",
            },
            {
                "label": "Sticking",
                "tex": r"\text{stop at the first site with a neighbour already in the cluster}",
                "note": "The arms shield the inside, so arrivals land on the outside",
            },
            {
                "label": "The mass-radius law",
                "tex": (
                    r"N(r) = k\,r^{d} \qquad \Longleftrightarrow \qquad"
                    r" \log N = d \log r + \log k"
                ),
                "note": "The slope on logarithmic axes is the dimension",
            },
        ],
        "dimension": {
            "label": "Measured from the mass-radius fit",
            "tex": (
                r"d \approx 1.67 \;\text{measured}, \qquad"
                r" d \to 1.71 \;\text{for large clusters}"
            ),
            "note": "Small clusters read low",
        },
    },
    {
        "id": "julia",
        "name": "Julia sets",
        "summary": (
            "For a fixed c, the starting points whose walk under one squaring and one shift never "
            "escapes"
        ),
        "blocks": [
            {
                "label": "The rule",
                "tex": r"z_{n+1} = z_n^{2} + c",
                "note": "One turn and stretch, then one slide",
            },
            {
                "label": "The set",
                "tex": r"K_c = \left\{ z_0 \in \mathbb{C} \;:\; \sup_n |z_n| < \infty \right\}",
                "note": "The Julia set proper is the boundary of this body",
            },
            {
                "label": "The escape test, and it is final",
                "tex": r"|z_n| > 2 \;\Longrightarrow\; |z_{n+k}| \to \infty",
                "note": "One crossing is enough, which is what makes the picture computable",
            },
            {
                "label": "Why squaring alone is not enough",
                "tex": (
                    r"c = 0: \; |z_0| < 1 \Rightarrow z_n \to 0, \quad |z_0| > 1 \Rightarrow "
                    r"z_n \to \infty"
                ),
                "note": "The boundary is then exactly the unit circle, which is smooth",
            },
        ],
        "dimension": {
            "label": "Measured by box counting on the boundary",
            "tex": r"1 \le \dim_{\mathrm{B}} \partial K_c \le 2",
            "note": "It depends on c, and reaches 2 for some values",
        },
    },
    {
        "id": "mandelbrot",
        "name": "The Mandelbrot set",
        "summary": (
            "The same rule with the start held at zero and c varied across the picture, which "
            "records exactly which Julia sets hold together in one piece"
        ),
        "blocks": [
            {
                "label": "The set",
                "tex": (
                    r"M = \left\{ c \in \mathbb{C} \;:\; \sup_n \left|z_n\right| < \infty, \;"
                    r" z_0 = 0 \right\}"
                ),
                "note": "One picture answers the question for every c at once",
            },
            {
                "label": "The same condition, read two ways",
                "tex": r"c \in M \iff K_c \text{ is connected}",
                "note": "Inside gives one piece, outside gives dust",
            },
            {
                "label": "Escape-time colouring",
                "tex": r"\nu(c) = \min\{ n : |z_n| > R \}",
                "note": "The bands of colour are that count",
            },
        ],
        "dimension": {
            "label": "Proved, not measured",
            "tex": r"\dim_{\mathrm{H}} \partial M = 2",
            "note": "The roughest a curve can be; no finite picture reaches the limit",
        },
    },
    {
        "id": "mandelbulb",
        "name": "The three-dimensional set",
        "summary": (
            "The squaring is replaced by a power on spherical coordinates, which gives the same "
            "escape test a solid to bound"
        ),
        "blocks": [
            {
                "label": "The power that replaces squaring",
                "tex": (
                    r"\mathbf{v}^{n} = r^{n}\bigl(\sin n\theta \cos n\varphi,\; "
                    r"\sin n\theta \sin n\varphi,\; \cos n\theta \bigr)"
                ),
                "note": "With r, theta and phi the spherical coordinates of the point",
            },
            {
                "label": "The iteration",
                "tex": r"\mathbf{v}_{k+1} = \mathbf{v}_k^{\,n} + \mathbf{c}",
                "note": "At n equal to 8 the solid has eight-fold symmetry about its axis",
            },
            {
                "label": "The distance estimate that lets a ray find it",
                "tex": r"\mathrm{DE} = \frac{|\mathbf{v}|\,\log|\mathbf{v}|}{2\,|\mathbf{v}'|}",
                "note": "A ray may safely advance by this much without passing through the surface",
            },
        ],
        "dimension": {
            "label": "A surface in space",
            "tex": r"2 \le \dim_{\mathrm{B}} \partial \le 3",
            "note": "The boundary is a surface, not a curve",
        },
    },
    {
        "id": "hurst",
        "name": "A line that remembers: the Hurst exponent",
        "summary": (
            "A random walk whose steps remember, with one number H saying how much; measured the "
            "way Hurst measured the Nile, and the graph's dimension read off the same number"
        ),
        "blocks": [
            {
                "label": "Steps that remember",
                "tex": r"\rho(k) = \tfrac{1}{2}\bigl((k+1)^{2H} - 2k^{2H} + (k-1)^{2H}\bigr)",
                "note": "the correlation between steps k apart in fractional Gaussian noise. H = 0.5 is the coin toss, no memory; above it a run tends to continue, below it to reverse",
            },
            {
                "label": "Hurst's rescaled range",
                "tex": r"\frac{R}{S}(m) \propto m^{H}",
                "note": "in a block of m steps, how far the running sum wanders over how much the steps vary. Hurst found 0.72 across the Nile and seventy-four other records, where a coin gives 0.5",
            },
            {
                "label": "The spread of the future",
                "tex": r"\sigma(T) = \sigma\, T^{H}",
                "note": "how far the walk can be T steps ahead. a coin gives the square root of T; a persistent series spreads faster, so a long horizon is riskier than the square-root rule says",
            },
            {
                "label": "The graph's dimension",
                "tex": r"D = 2 - H",
                "note": "the box-counting dimension of the walk drawn as a line: a persistent walk is a smoother line, an anti-persistent one rougher. the link back to the coastline",
            },
        ],
        "dimension": {
            "label": "What it cannot do",
            "tex": r"\mathbb{E}[X_{n+1} \mid X_n] \text{ barely moves}",
            "note": "H describes how risk grows with horizon and whether runs continue, not what the next value is; and H is hard to read off a short series, which is Lo's 1991 objection",
        },
    },
    {
        "id": "credibility",
        "name": "Trust the group or trust the record: an actuary's Bayes",
        "summary": (
            "A customer's short record blended with the group's long one; the weight on the record "
            "is the credibility, and with claims as Poisson and rates as a gamma it is exactly Bayes"
        ),
        "blocks": [
            {
                "label": "The blend",
                "tex": r"\hat{\lambda} = Z\,\bar{x} + (1 - Z)\,\mu, \qquad Z = \frac{n}{n + k}",
                "note": "x bar the customer's own rate over n years, mu the group's; Z rises from nothing towards one as the years come. Whitney 1918, Bailey 1950, Buhlmann 1967",
            },
            {
                "label": "What k means",
                "tex": r"k = \frac{\mathbb{E}[\mathrm{Var}(X \mid \theta)]}{\mathrm{Var}(\mathbb{E}[X \mid \theta])}",
                "note": "the noise in one customer's outcomes over the spread between customers. customers who differ a lot from each other earn their own rate quickly; a noisy outcome earns it slowly. Z is one half at n = k",
            },
            {
                "label": "The exact Bayes behind it",
                "tex": r"\lambda \sim \Gamma(a, b),\quad X \mid \lambda \sim \mathrm{Poisson}(\lambda) \;\Rightarrow\; \lambda \mid x \sim \Gamma(a + x,\, b + n)",
                "note": "the posterior mean (a + x) / (b + n) is the blend with k = b and mu = a / b. the page draws this belief as a curve narrowing year by year",
            },
        ],
        "dimension": {
            "label": "The same shape elsewhere",
            "tex": r"\text{reserve} = Z\cdot\text{chain ladder} + (1 - Z)\cdot\text{prior}",
            "note": "the money set aside for claims not yet paid is blended the same way, the reported fraction as Z; mortality forecasts widen their intervals the same way when the parameters are uncertain",
        },
    },
    {
        "id": "tails",
        "name": "Claims with a fractal tail",
        "summary": (
            "Claim sizes with a Pareto tail look the same at every scale, the tail index playing the "
            "part a dimension plays for a coastline; below two the average never settles"
        ),
        "blocks": [
            {
                "label": "The tail",
                "tex": r"P(X > x) = \left(\frac{x_0}{x}\right)^{\alpha}, \quad x \ge x_0",
                "note": "a straight line of slope minus alpha on log-log axes, where a thin tail bends down. the same law Pareto found for incomes in 1896",
            },
            {
                "label": "The same at every scale",
                "tex": r"P(X > x \mid X > u) = \left(\frac{u}{x}\right)^{\alpha}",
                "note": "above any threshold the excess is again Pareto with the same alpha: the largest tenth of the claims, rescaled, is distributed like the whole. self-similarity, as for the coastline",
            },
            {
                "label": "The average that never settles",
                "tex": r"\mathbb{E}[X] = \frac{\alpha x_0}{\alpha - 1}\ (\alpha > 1), \qquad \mathrm{Var}[X] = \infty\ (\alpha \le 2)",
                "note": "below two the variance is infinite, and one claim can outweigh all the others so far: Mandelbrot's Noah effect. the running mean keeps jumping however many claims arrive",
            },
        ],
        "dimension": {
            "label": "The index as a dimension",
            "tex": r"\alpha = -\frac{d \log P(X > x)}{d \log x}",
            "note": "read off the slope of the survival plot as a dimension is read off the box count: the exponent of a power law saying how a count changes with scale",
        },
    },
]

DEFINITIONS = [
    {
        "id": "box",
        "name": "Box-counting dimension",
        "tex": r"d = \lim_{\varepsilon \to 0} \frac{\log N(\varepsilon)}{\log(1/\varepsilon)}",
        "note": (
            "Boxes of side epsilon are laid over the shape and the ones it touches are counted; "
            "the count against the size is a straight line on logarithmic axes and the dimension "
            "is its slope"
        ),
    },
    {
        "id": "similarity",
        "name": "Self-similarity dimension",
        "tex": r"N s^{d} = 1 \qquad \Longrightarrow \qquad d = \frac{\log N}{\log(1/s)}",
        "note": "The exact special case, where the shape is a known number of scaled copies",
    },
    {
        "id": "hausdorff",
        "name": "Hausdorff dimension",
        "tex": (
            r"\mathcal{H}^{p}(S) = \lim_{\delta \to 0} \inf \sum_i (\mathrm{diam}\,U_i)^{p},"
            r" \qquad d = \inf\{ p : \mathcal{H}^{p}(S) = 0 \}"
        ),
        "note": (
            "The critical power at which the sum of covered diameters falls from infinite to "
            "zero; the number box counting approximates"
        ),
    },
    {
        "id": "richardson",
        "name": "The divider method",
        "tex": r"L(\varepsilon) \propto \varepsilon^{1-d}",
        "note": (
            "Stepping a boundary off with a fixed opening gives a length that grows as the "
            "opening shrinks, and the slope carries the dimension"
        ),
    },
]
