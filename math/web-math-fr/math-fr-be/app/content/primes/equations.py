"""
the primes topic: the gaps between primes drawn as a return map, beside a
chaotic rule, to show that looking random is not the same as being chaotic. one page.
"""

SYSTEMS = [
    {
        "id": "gaps",
        "name": "Can one gap between primes predict the next?",
        "summary": "Each gap between two neighbouring prime numbers is drawn as a dot against the gap that follows it. If a fixed rule gave the next gap, the dots would lie on one curved line, as they do for the chaotic rule drawn beside it. For the primes they form a scattered cloud",
        "blocks": [
            {
                "label": "The gap between neighbouring primes",
                "tex": r"g_n = p_{n+1} - p_n",
                "note": "The symbol p_n stands for the n-th prime number: p_1 = 2, p_2 = 3, p_3 = 5. The symbol g_n is the gap after it: the next prime minus this one. For example, g_4 = 11 - 7 = 4. The first gap, 3 - 2 = 1, is odd. Every later gap is even, because every prime after 2 is odd, and one odd number minus another is even",
            },
            {
                "label": "Each gap against the next",
                "tex": r"(g_n,\ g_{n+1})",
                "note": "Each pair of neighbouring gaps gives one dot: g_n says how far along, g_(n+1) how far up. For the primes 7, 11, 13 the gaps are 4 and 2, so the dot sits at (4, 2). A picture of each value against the next is called a return map. If a rule gave each next value from the current one, all the dots would lie on the graph of that rule. The prime gaps give a cloud of dots at even numbers instead",
            },
            {
                "label": "How much one gap tells about the next",
                "tex": r"\rho = \frac{\mathbb{E}\big[\operatorname{sd}(g_{n+1} \mid g_n)\big]}{\operatorname{sd}(g_{n+1})}",
                "note": "The letters sd stand for the spread of a list of numbers, its standard deviation: how far the numbers typically lie from their average. The bottom of the fraction is the spread of all the next gaps g_(n+1). The top is the spread of g_(n+1) among only those cases where the current gap g_n has one fixed size. The bar | reads 'given'. E means the average of these spreads over all sizes of g_n, each size counted as often as it occurs, and only sizes seen at least 8 times are used. The ratio ρ (the Greek letter rho) is 0 when the current gap fixes the next exactly, as a rule would. It is 1 when the current gap tells nothing. For the primes ρ comes out close to 1, the same as for the gaps in a random order",
            },
            {
                "label": "How large the gaps are on average",
                "tex": r"\bar{g} \approx \ln p",
                "note": "ḡ, the letter g with a bar, is the average gap between primes near a large number p. The expression ln p is the natural logarithm of p: the power to which the number e ≈ 2.718 must be raised to give p. Near one million, ln p ≈ 13.8, so neighbouring primes there lie about 14 apart on average. This follows from the prime number theorem, which says that near p about one number in ln p is prime. The page shows both numbers: the average gap so far, and ln of the largest prime so far",
            },
        ],
        "dimension": {
            "label": "A chaotic rule, and no rule",
            "tex": r"x_{n+1} = 4\,x_n\,(1 - x_n) \qquad g_{n+1} = \ ?",
            "note": "On the left is the rule of the comparison picture, the logistic map with r = 4. x is a number between 0 and 1, x_n is its value at step n, and the rule gives the value at the next step. This rule is chaotic: two starting values a tiny distance apart give sequences that soon have nothing in common. The speed at which such values move apart is called the Lyapunov exponent. For this rule it is ln 2 ≈ 0.69 per step. It is positive, and that is what chaotic means. On the right is the next prime gap. No formula of this kind gives it from the gap before, so there is nothing to start twice and no exponent to measure. Looking random and being chaotic are different things, and the picture of each value against the next tells them apart",
        },
    },
]

DEFINITIONS = [
    {
        "id": "sieve",
        "name": "The sieve of Eratosthenes",
        "tex": r"\{2, 3, \dots, N\} \setminus \{\, k\,p : p \le \sqrt{N},\ k \ge 2 \,\}",
        "note": "How the page finds the primes up to a number N. The whole numbers from 2 to N are written out. The smallest, 2, is prime, and its multiples 4, 6, 8 and so on are crossed out. The smallest number left, 3, is prime, and its multiples 6, 9, 12 and so on are crossed out. This goes on for every prime p up to √N, the square root of N. In the formula, k p with k = 2, 3, 4 and so on are the multiples of p, and the sign ∖ means 'take away'. The numbers left are exactly the primes up to N. Stopping at √N is enough, because a number up to N that is not prime has a factor no larger than √N. Nothing is guessed and nothing is copied from a table",
    },
    {
        "id": "returnmap",
        "name": "A return map",
        "tex": r"x_n \mapsto x_{n+1}",
        "note": "A way to look for a rule in a sequence of numbers x_1, x_2, x_3 and so on. Each value x_n is drawn as a dot against the value x_(n+1) that comes right after it. The arrow ↦ reads 'is followed by'. If a fixed rule gives each next value from the current one, all the dots lie on one curved line, the graph of that rule. If there is no such rule, the dots scatter. The page applies this test to the gaps between primes",
    },
]
