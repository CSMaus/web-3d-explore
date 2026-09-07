SYSTEMS = [
    {
        "id": "ifs",
        "name": "iterated maps",
        "summary": (
            "a small set of affine moves applied to one point over and over, one chosen at "
            "random each step, so the visited points pile up onto a single fixed shape"
        ),
        "blocks": [
            {
                "label": "one move",
                "tex": r"f_k(x,y) = \bigl(a_k x + b_k y + e_k,\; c_k x + d_k y + f_k\bigr)",
                "note": "four numbers turn and stretch, two more shift",
            },
            {
                "label": "the chaos game",
                "tex": r"z_{n+1} = f_{k_n}(z_n), \qquad \Pr[k_n = k] = p_k",
                "note": "the move is drawn from the weights each step",
            },
            {
                "label": "the attractor",
                "tex": r"A = \bigcup_{k} f_k(A)",
                "note": "the shape is exactly the union of its own images",
            },
            {
                "label": "why it settles",
                "tex": (
                    r"s_k = \sigma_{\max}(M_k) = \sqrt{\lambda_{\max}\!\left(M_k^{\mathsf T}"
                    r" M_k\right)} < 1"
                ),
                "note": "every move shrinks, so any starting shape is pulled onto the same limit",
            },
        ],
        "dimension": {
            "label": "measured by box counting",
            "tex": r"d = \lim_{\varepsilon \to 0} \frac{\log N(\varepsilon)}{\log(1/\varepsilon)}",
            "note": "the fern measures about 1.78",
        },
    },
    {
        "id": "lsystem",
        "name": "rewriting systems",
        "summary": (
            "a short seed word rewritten by a handful of rules, once per pass, then read as "
            "turtle instructions"
        ),
        "blocks": [
            {
                "label": "a production",
                "tex": r"\omega \to \omega', \qquad w_{n+1} = P(w_n)",
                "note": "every symbol is replaced at once, so the word grows by a fixed factor",
            },
            {
                "label": "the branching plant",
                "tex": r"X \to F+[[X]-X]-F[-FX]+X, \qquad F \to FF",
                "note": "F draws a step, plus and minus turn, brackets remember a point",
            },
            {
                "label": "the turtle",
                "tex": (
                    r"\begin{aligned} p_{n+1} &= p_n + \ell\,(\cos\theta_n, \sin\theta_n) \\"
                    r" \theta_{n+1} &= \theta_n \pm \alpha \end{aligned}"
                ),
                "note": "one turn angle for the whole word",
            },
        ],
        "dimension": {
            "label": "read off the rule when the pieces are exact copies",
            "tex": r"d = \frac{\log N}{\log(1/s)}",
            "note": "the Koch curve gives log 4 over log 3, about 1.262",
        },
    },
    {
        "id": "lichtenberg",
        "name": "dielectric breakdown",
        "summary": (
            "the field is solved on the grid and the chance a site lights up next is its field "
            "strength raised to a power, which is the figure a discharge burns into an insulator"
        ),
        "blocks": [
            {
                "label": "the field between growths",
                "tex": r"\nabla^2 \phi = 0, \qquad \phi = 0 \text{ on the cluster}",
                "note": "the cluster is a conductor, so the potential is flat across it",
            },
            {
                "label": "where the next site lights up",
                "tex": (
                    r"p_i = \frac{\left|\nabla\phi_i\right|^{\eta}}"
                    r"{\sum_{j \in \partial} \left|\nabla\phi_j\right|^{\eta}}"
                ),
                "note": "eta is the one knob: at 0 every edge site is equally likely",
            },
            {
                "label": "the relaxation that solves it",
                "tex": (
                    r"\phi^{(m+1)}_{r,c} = \tfrac{1}{4}\left(\phi^{(m)}_{r-1,c} + "
                    r"\phi^{(m)}_{r+1,c} + \phi^{(m)}_{r,c-1} + \phi^{(m)}_{r,c+1}\right)"
                ),
                "note": "swept until the field stops moving, then a few sweeps after each growth",
            },
        ],
        "dimension": {
            "label": "measured by box counting, and it follows the knob",
            "tex": (
                r"d(\eta): \; 1.58 \;\text{at}\; \eta = 0.6"
                r" \;\longrightarrow\; 1.27 \;\text{at}\; \eta = 2"
            ),
            "note": "a bushy cluster measures high, a thin needle measures low",
        },
    },
    {
        "id": "dla",
        "name": "wandering particles",
        "summary": (
            "one seed, and particles released one at a time that step at random until they touch "
            "the cluster and stick"
        ),
        "blocks": [
            {
                "label": "one step of the walk",
                "tex": (
                    r"\Pr\bigl[(y,x) \to (y \pm 1, x)\bigr] = "
                    r"\Pr\bigl[(y,x) \to (y, x \pm 1)\bigr] = \tfrac14"
                ),
                "note": "no direction and no memory",
            },
            {
                "label": "sticking",
                "tex": r"\text{stop at the first site with a neighbour already in the cluster}",
                "note": "the arms shield the inside, so arrivals land on the outside",
            },
            {
                "label": "the mass-radius law",
                "tex": (
                    r"N(r) = k\,r^{d} \qquad \Longleftrightarrow \qquad"
                    r" \log N = d \log r + \log k"
                ),
                "note": "the slope on logarithmic axes is the dimension",
            },
        ],
        "dimension": {
            "label": "measured from the mass-radius fit",
            "tex": (
                r"d \approx 1.67 \;\text{measured}, \qquad"
                r" d \to 1.71 \;\text{for large clusters}"
            ),
            "note": "small clusters read low",
        },
    },
    {
        "id": "julia",
        "name": "Julia sets",
        "summary": (
            "for a fixed c, the starting points whose walk under one squaring and one shift never "
            "escapes"
        ),
        "blocks": [
            {
                "label": "the rule",
                "tex": r"z_{n+1} = z_n^{2} + c",
                "note": "one turn and stretch, then one slide",
            },
            {
                "label": "the set",
                "tex": r"K_c = \left\{ z_0 \in \mathbb{C} \;:\; \sup_n |z_n| < \infty \right\}",
                "note": "the Julia set proper is the boundary of this body",
            },
            {
                "label": "the escape test, and it is final",
                "tex": r"|z_n| > 2 \;\Longrightarrow\; |z_{n+k}| \to \infty",
                "note": "one crossing is enough, which is what makes the picture computable",
            },
            {
                "label": "why squaring alone is not enough",
                "tex": (
                    r"c = 0: \; |z_0| < 1 \Rightarrow z_n \to 0, \quad |z_0| > 1 \Rightarrow "
                    r"z_n \to \infty"
                ),
                "note": "the boundary is then exactly the unit circle, which is smooth",
            },
        ],
        "dimension": {
            "label": "measured by box counting on the boundary",
            "tex": r"1 \le \dim_{\mathrm{B}} \partial K_c \le 2",
            "note": "it depends on c, and reaches 2 for some values",
        },
    },
    {
        "id": "mandelbrot",
        "name": "the Mandelbrot set",
        "summary": (
            "the same rule with the start held at zero and c varied across the picture, which "
            "records exactly which Julia sets hold together in one piece"
        ),
        "blocks": [
            {
                "label": "the set",
                "tex": (
                    r"M = \left\{ c \in \mathbb{C} \;:\; \sup_n \left|z_n\right| < \infty, \;"
                    r" z_0 = 0 \right\}"
                ),
                "note": "one picture answers the question for every c at once",
            },
            {
                "label": "the same condition, read two ways",
                "tex": r"c \in M \iff K_c \text{ is connected}",
                "note": "inside gives one piece, outside gives dust",
            },
            {
                "label": "escape-time colouring",
                "tex": r"\nu(c) = \min\{ n : |z_n| > R \}",
                "note": "the bands of colour are that count",
            },
        ],
        "dimension": {
            "label": "proved, not measured",
            "tex": r"\dim_{\mathrm{H}} \partial M = 2",
            "note": "the roughest a curve can be; no finite picture reaches the limit",
        },
    },
    {
        "id": "mandelbulb",
        "name": "the three-dimensional set",
        "summary": (
            "the squaring is replaced by a power on spherical coordinates, which gives the same "
            "escape test a solid to bound"
        ),
        "blocks": [
            {
                "label": "the power that replaces squaring",
                "tex": (
                    r"\mathbf{v}^{n} = r^{n}\bigl(\sin n\theta \cos n\varphi,\; "
                    r"\sin n\theta \sin n\varphi,\; \cos n\theta \bigr)"
                ),
                "note": "with r, theta and phi the spherical coordinates of the point",
            },
            {
                "label": "the iteration",
                "tex": r"\mathbf{v}_{k+1} = \mathbf{v}_k^{\,n} + \mathbf{c}",
                "note": "at n equal to 8 the solid has eight-fold symmetry about its axis",
            },
            {
                "label": "the distance estimate that lets a ray find it",
                "tex": r"\mathrm{DE} = \frac{|\mathbf{v}|\,\log|\mathbf{v}|}{2\,|\mathbf{v}'|}",
                "note": "a ray may safely advance by this much without passing through the surface",
            },
        ],
        "dimension": {
            "label": "a surface in space",
            "tex": r"2 \le \dim_{\mathrm{B}} \partial \le 3",
            "note": "the boundary is a surface, not a curve",
        },
    },
]

DEFINITIONS = [
    {
        "id": "box",
        "name": "box-counting dimension",
        "tex": r"d = \lim_{\varepsilon \to 0} \frac{\log N(\varepsilon)}{\log(1/\varepsilon)}",
        "note": (
            "boxes of side epsilon are laid over the shape and the ones it touches are counted; "
            "the count against the size is a straight line on logarithmic axes and the dimension "
            "is its slope"
        ),
    },
    {
        "id": "similarity",
        "name": "self-similarity dimension",
        "tex": r"N s^{d} = 1 \qquad \Longrightarrow \qquad d = \frac{\log N}{\log(1/s)}",
        "note": "the exact special case, where the shape is a known number of scaled copies",
    },
    {
        "id": "hausdorff",
        "name": "Hausdorff dimension",
        "tex": (
            r"\mathcal{H}^{p}(S) = \lim_{\delta \to 0} \inf \sum_i (\mathrm{diam}\,U_i)^{p},"
            r" \qquad d = \inf\{ p : \mathcal{H}^{p}(S) = 0 \}"
        ),
        "note": (
            "the critical power at which the sum of covered diameters falls from infinite to "
            "zero; the number box counting approximates"
        ),
    },
    {
        "id": "richardson",
        "name": "the divider method",
        "tex": r"L(\varepsilon) \propto \varepsilon^{1-d}",
        "note": (
            "stepping a boundary off with a fixed opening gives a length that grows as the "
            "opening shrinks, and the slope carries the dimension"
        ),
    },
]
