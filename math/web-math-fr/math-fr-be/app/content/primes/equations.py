"""
an aside beside topic 2: the gaps between primes, drawn the way the Rossler
page draws a return map, to show what chaos is not. one page.
"""

SYSTEMS = [
    {
        "id": "gaps",
        "name": "The gaps between primes, as a return map",
        "summary": (
            "Each gap between consecutive primes plotted against the next, the way a chaotic "
            "flow's crossings are, beside a map that really has a rule. A cloud against a curve"
        ),
        "blocks": [
            {
                "label": "The gaps",
                "tex": r"g_n = p_{n+1} - p_n",
                "note": "The primes found by a sieve, the gaps read off them. Every gap after the first is even",
            },
            {
                "label": "The return map",
                "tex": r"(g_n,\ g_{n+1})",
                "note": "The same picture the Rossler page makes from a flow. A rule shows as a curve; the gaps show as a cloud on a grid of even numbers",
            },
            {
                "label": "How predictable the next gap is",
                "tex": r"\rho = \frac{\mathbb{E}\big[\operatorname{sd}(g_{n+1} \mid g_n)\big]}{\operatorname{sd}(g_{n+1})}",
                "note": "The spread of the next gap once this one is known, over the spread with nothing known. A rule gives zero; the primes give a number close to one, the same as the shuffled gaps",
            },
            {
                "label": "How big the gaps run",
                "tex": r"\bar{g} \approx \ln p",
                "note": "The average gap near p is about the logarithm of p, the prime number theorem read as a spacing. The histogram's shape follows from that and little else",
            },
        ],
        "dimension": {
            "label": "What chaos is not",
            "tex": r"\text{no rule} \neq \text{a rule that is sensitive}",
            "note": "A chaotic sequence has a rule and a positive exponent; two starts a hair apart follow the rule and part. The primes have no rule to follow, and the return map is how the two are told apart",
        },
    },
]

DEFINITIONS = [
    {
        "id": "sieve",
        "name": "The sieve",
        "tex": r"\text{strike every multiple of each prime up to } \sqrt{N}",
        "note": "How the primes on the page are found: nothing is guessed, and nothing is looked up",
    },
    {
        "id": "returnmap",
        "name": "A return map",
        "tex": r"x_n \mapsto x_{n+1}",
        "note": "Each value against the one that follows it. For a deterministic rule the points lie on the graph of that rule; this is the test the page applies",
    },
]
