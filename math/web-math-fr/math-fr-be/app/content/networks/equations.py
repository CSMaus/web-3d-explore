"""
the thirteen play pages of topic 3, with the mathematics each one moves. the
order is the reading order: the calculus as things that move, one job learned
by a network page after page, and the same job on a picture, a sequence and a
sentence. the notes say what the page shows, not what a textbook proves.
"""

SYSTEMS = [
    {
        "id": "rate",
        "name": "How fast is it going",
        "summary": (
            "A car on a road. Its speed, read from nothing but where it is: a change divided by "
            "a change, with the gap made as small as you like. That is the derivative"
        ),
        "blocks": [
            {
                "label": "Speed from two positions",
                "tex": r"v \approx \frac{s(t + h/2) - s(t - h/2)}{h}",
                "note": "How far it moved, divided by how long that took. The page's slider is h",
            },
            {
                "label": "And the limit",
                "tex": r"v(t) = s'(t) = \lim_{h \to 0} \frac{s(t + h/2) - s(t - h/2)}{h}",
                "note": "The same ratio with the gap taken to nothing. The ring lands on the dot",
            },
            {
                "label": "How wrong the two-position speed is",
                "tex": r"\frac{s(t+h/2) - s(t-h/2)}{h} = s'(t) + \frac{h^{2}}{24}\,s^{(3)}(t) + \ldots",
                "note": "The error goes as the square of the gap: halve the gap, quarter the error. On a straight-line or braking car the third derivative is zero and there is no error at all",
            },
        ],
        "dimension": {
            "label": "The five motions on the page",
            "tex": r"s = 4t,\quad 0.4t^{2},\quad 10t - \tfrac{1}{2}t^{2},\quad 12\sin(t/2),\quad 3t + 2\sin(1.4t)",
            "note": "Steady, speeding up, braking, there and back, stop and go. The exact speeds the page scores against are their derivatives",
        },
    },
    {
        "id": "rate2",
        "name": "Is it speeding up or slowing down",
        "summary": (
            "The same ratio taken of the speed instead of the position. The acceleration, its "
            "sign, and what a change of a change looks like"
        ),
        "blocks": [
            {
                "label": "The second derivative",
                "tex": r"a(t) = v'(t) = s''(t)",
                "note": "The steepness of the speed curve, which is the steepness of the steepness of the position curve",
            },
            {
                "label": "From three positions",
                "tex": r"a \approx \frac{s(t+h) - 2s(t) + s(t-h)}{h^{2}}",
                "note": "Two speeds a gap apart, each from two positions a gap apart, is this. The page does it the long way so the two stages are visible",
            },
            {
                "label": "What the sign says",
                "tex": r"a > 0 \Rightarrow v \text{ rising}, \qquad a < 0 \Rightarrow v \text{ falling}",
                "note": "The rose arrow points against the green one while the car brakes, even though the car still moves forward",
            },
        ],
        "dimension": {
            "label": "At the turning point",
            "tex": r"v(t^{*}) = 0,\quad a(t^{*}) \neq 0",
            "note": "Where the car turns round its speed is zero and its acceleration is not: the speed passes through zero, it does not stop there",
        },
    },
    {
        "id": "accumulate",
        "name": "Adding it back up",
        "summary": (
            "Given only the speed, the distance: slices of speed times duration, added up. The "
            "integral, and the fact that it undoes the derivative"
        ),
        "blocks": [
            {
                "label": "One slice",
                "tex": r"\Delta s_i = v\!\left(t_i + \tfrac{\Delta t}{2}\right)\Delta t",
                "note": "Speed times duration is distance. The speed is read at the middle of the slice",
            },
            {
                "label": "All the slices",
                "tex": r"s(T) - s(0) \approx \sum_{i} v\!\left(t_i + \tfrac{\Delta t}{2}\right)\Delta t \;\longrightarrow\; \int_{0}^{T} v(t)\,dt",
                "note": "The sum, with the slices made as thin as you like. The staircase becomes the curve",
            },
            {
                "label": "The error of the midpoint rule",
                "tex": r"\left|\text{sum} - \int\right| \le \frac{T\,\Delta t^{2}}{24}\max|v''|",
                "note": "Double the slices and the error falls by four. On a speed that is a straight line the error is zero, so the page opens on a speed that bends",
            },
            {
                "label": "The derivative undone",
                "tex": r"\frac{d}{dT}\int_{0}^{T} v(t)\,dt = v(T)",
                "note": "The steepness of the accumulated distance is the speed that was added up. The first page in reverse",
            },
        ],
        "dimension": {
            "label": "Signed area",
            "tex": r"v < 0 \Rightarrow \Delta s_i < 0",
            "note": "On the way back the slices count negative and the total comes back down: this is displacement, not distance travelled",
        },
    },
    {
        "id": "growth",
        "name": "The thing that grows by how much there is",
        "summary": (
            "Money at interest, a population with room. The growth is a fixed fraction of the "
            "amount, and that one rule picks out the exponential"
        ),
        "blocks": [
            {
                "label": "The rule",
                "tex": r"\frac{dA}{dt} = r\,A",
                "note": "How fast it grows is the rate times how much there is. The lower chart on the page is the two sides of this, divided, and it never moves",
            },
            {
                "label": "The only curve that obeys it",
                "tex": r"A(t) = A_0\,e^{rt}",
                "note": "e is the base for which the steepness equals the height exactly, so that the constant is the rate and nothing else",
            },
            {
                "label": "Doubling time",
                "tex": r"t_{2} = \frac{\ln 2}{r}",
                "note": "The same for every doubling, which is why the ticks on the page are evenly spaced",
            },
            {
                "label": "When does it reach a target",
                "tex": r"t^{*} = \frac{1}{r}\ln\frac{A^{*}}{A_0}",
                "note": "The logarithm, read as a question about time",
            },
        ],
        "dimension": {
            "label": "Against a straight line",
            "tex": r"A_0(1 + rt) \le A_0 e^{rt}",
            "note": "Growing by a fixed amount a year, matched to the first moment's speed, falls behind at once and stays behind",
        },
    },
    {
        "id": "slope",
        "name": "Which way is down",
        "summary": (
            "A ball on a landscape, knowing only the ground under its own feet. The gradient, "
            "and stepping against it"
        ),
        "blocks": [
            {
                "label": "Two slopes, one for each way to move",
                "tex": r"\frac{\partial h}{\partial x} \approx \frac{h(x+\epsilon, y) - h(x-\epsilon, y)}{2\epsilon}, \qquad \frac{\partial h}{\partial y} \approx \frac{h(x, y+\epsilon) - h(x, y-\epsilon)}{2\epsilon}",
                "note": "The first page's ratio, taken once per direction, with everything else held still",
            },
            {
                "label": "The gradient",
                "tex": r"\nabla h = \left(\frac{\partial h}{\partial x}, \frac{\partial h}{\partial y}\right)",
                "note": "The two slopes as one arrow. It points the steepest way uphill, and its length is how steep",
            },
            {
                "label": "One step",
                "tex": r"(x, y) \leftarrow (x, y) - \eta\,\nabla h(x, y)",
                "note": "Against the arrow, by the step size times the steepness. Gradient descent",
            },
            {
                "label": "When the step is too big",
                "tex": r"\eta > \frac{2}{\lambda_{\max}} \Rightarrow \text{diverges}",
                "note": "On the narrow valley the across-slope is twelve times the along-slope, so a step that suits the floor overshoots the walls. The ball bounces higher each time",
            },
        ],
        "dimension": {
            "label": "Flat is not bottom",
            "tex": r"\nabla h = 0 \;\not\Rightarrow\; \text{minimum}",
            "note": "At the middle of the saddle the ball stops with the ground falling away either side. The four landscapes on the page are a bowl, a narrow valley, a saddle and two hills",
        },
    },
    {
        "id": "line",
        "name": "Draw the line yourself",
        "summary": (
            "Two colours of dots. The reader draws the dividing line, then Rosenblatt's perceptron "
            "tries, one correction at a time, and hits the wall it hit in 1969"
        ),
        "blocks": [
            {
                "label": "A line as three numbers",
                "tex": r"w_1 x + w_2 y + b = 0",
                "note": "The two weights are the direction across the line and the bias is how far from the origin. The white line's two handles are turned into these",
            },
            {
                "label": "The unit",
                "tex": r"\hat{y} = \begin{cases} 1 & w_1 x + w_2 y + b > 0 \\ 0 & \text{otherwise}\end{cases}",
                "note": "Which side of the line. A weighted sum and a hard threshold, nothing else",
            },
            {
                "label": "One correction",
                "tex": r"w \leftarrow w + \eta\,(y - \hat{y})\,x, \qquad b \leftarrow b + \eta\,(y - \hat{y})",
                "note": "Look at one dot; if it is on the wrong side, turn the line a little towards it. The ringed dot on the page is that dot",
            },
            {
                "label": "It stops, if it can",
                "tex": r"\text{updates} \le \left(\frac{R}{\gamma}\right)^{2}",
                "note": "When a separating line exists the rule finds one in a finite number of corrections. On two clouds of sixty dots, the page counts two",
            },
            {
                "label": "And when it cannot",
                "tex": r"\mathrm{xor}(0,0)=0,\ \mathrm{xor}(0,1)=1,\ \mathrm{xor}(1,0)=1,\ \mathrm{xor}(1,1)=0",
                "note": "No straight line puts the four dots right, so there is always one to correct and the rule never stops. Minsky and Papert, 1969",
            },
        ],
        "dimension": {
            "label": "What the reader can check by hand",
            "tex": r"\text{wrong} = \min\left(\#\{\text{side} \neq y\},\ \#\{\text{side} = y\}\right)",
            "note": "Either side of a hand-drawn line may be either colour, so the count is the smaller of the two readings",
        },
    },
    {
        "id": "unit",
        "name": "Inside one unit",
        "summary": (
            "Three numbers and a squash. Move them by hand and watch the plane recolour, then "
            "let the unit move them itself, downhill on how wrong it is"
        ),
        "blocks": [
            {
                "label": "The unit",
                "tex": r"a = g(w_1 x + w_2 y + b)",
                "note": "Weigh, sum, shift, squash. The diagram on the page is this expression drawn",
            },
            {
                "label": "The squashes on offer",
                "tex": r"\sigma(z) = \frac{1}{1+e^{-z}}, \quad \tanh(z), \quad \max(0, z), \quad z",
                "note": "To 0..1, to -1..1, cut below zero, none. The first is the exponential page's curve, folded",
            },
            {
                "label": "How wrong, as one number",
                "tex": r"L = \frac{1}{2N}\sum_{n}\left(a^{(n)} - y^{(n)}\right)^{2}",
                "note": "The average squared miss over every dot. This is the height the ball rolls down",
            },
            {
                "label": "One step on three numbers",
                "tex": r"w_i \leftarrow w_i - \eta\,\frac{\partial L}{\partial w_i}, \qquad \frac{\partial L}{\partial w_i} = \frac{1}{N}\sum_n (a - y)\,g'(z)\,x_i",
                "note": "The hill page with three directions instead of two. The slope needs the squash to have a slope, which the hard threshold did not",
            },
        ],
        "dimension": {
            "label": "The line is still there",
            "tex": r"a = \tfrac{1}{2} \iff w_1 x + w_2 y + b = 0",
            "note": "Where the squash gives one half is the perceptron's line. The squash adds how sure, on either side of it",
        },
    },
    {
        "id": "layers",
        "name": "Many units, one answer",
        "summary": (
            "Several units side by side, each drawing its own line, and one more that weighs "
            "their answers. What each unit alone sees, and the bent boundary made of them"
        ),
        "blocks": [
            {
                "label": "The middle layer",
                "tex": r"h_j = g\!\left(\sum_i W^{(1)}_{ji} x_i + b^{(1)}_j\right)",
                "note": "Each middle unit is the last page's unit with its own three numbers. The small tiles are these, one each",
            },
            {
                "label": "The last unit",
                "tex": r"\hat{y} = \sigma\!\left(\sum_j W^{(2)}_{j} h_j + b^{(2)}\right)",
                "note": "Weighs the middle answers. Its boundary is where their weighted sum crosses zero, which is no longer a line",
            },
            {
                "label": "How many numbers",
                "tex": r"P = (2 + 1)\,H + (H + 1)",
                "note": "With H middle units. The page counts them from the network rather than from this",
            },
            {
                "label": "One middle unit is not enough",
                "tex": r"H = 1 \Rightarrow \hat{y} = \sigma\!\left(w\,g(\cdot) + b\right)",
                "note": "A squash of a squash of one line is still one line, moved. Two lines can do exclusive or; a ring needs about three",
            },
        ],
        "dimension": {
            "label": "Starting numbers",
            "tex": r"\operatorname{Var}(w) = \frac{2}{n_{\mathrm{in}} + n_{\mathrm{out}}}",
            "note": "Xavier's rule, so the first answers are neither all one half nor all saturated. The slider on the page picks a different draw from the same rule",
        },
    },
    {
        "id": "learn",
        "name": "How it learns, and how fast",
        "summary": (
            "Step size, how many dots before each move, and the standard tricks, with finished "
            "runs kept on one chart. And the one-shot formula that works only when nothing bends"
        ),
        "blocks": [
            {
                "label": "Plain descent",
                "tex": r"p \leftarrow p - \eta\,\nabla L",
                "note": "The ball. One fixed step down the slope, on every number at once",
            },
            {
                "label": "A few dots at a time",
                "tex": r"\nabla L \approx \frac{1}{B}\sum_{n \in \text{batch}} \nabla L_n",
                "note": "The slope estimated from B dots instead of all of them. Cheaper and noisier, which is the jagged curve",
            },
            {
                "label": "Momentum",
                "tex": r"v \leftarrow \beta v + \nabla L, \qquad p \leftarrow p - \eta\,v",
                "note": "The ball keeps some of its speed, so it stops bouncing across a narrow valley and rolls along it",
            },
            {
                "label": "Adam",
                "tex": r"p \leftarrow p - \eta\,\frac{\hat{v}}{\sqrt{\hat{s}} + \epsilon}",
                "note": "Every number gets its own step size, shrunk where its slope has been steep. Adagrad and RMSProp are the two halves of this",
            },
            {
                "label": "The one-shot answer, when nothing bends",
                "tex": r"p^{*} = (A^{\top}A)^{-1}A^{\top}y",
                "note": "With the squashes removed the network is one straight line and the best one has a formula. The dashed line on the page is it, and it cannot bend",
            },
        ],
        "dimension": {
            "label": "When the run blows up",
            "tex": r"\eta > \frac{2}{\lambda_{\max}(H)}",
            "note": "The step overshoots along the steepest direction of the hill and lands higher each time. The page shows the curve going up rather than down",
        },
    },
    {
        "id": "blame",
        "name": "The correction, one dot at a time",
        "summary": (
            "One correction in six moments: the dot goes forward, the miss is measured, the blame "
            "flows back along the wires, every number moves. Backpropagation, checked by nudging"
        ),
        "blocks": [
            {
                "label": "The miss, and the blame at the output",
                "tex": r"\delta^{(2)} = \left(a^{(2)} - y\right)\sigma'\!\left(z^{(2)}\right)",
                "note": "How much the answer is off, times how much the last squash was moving there. A saturated squash passes almost no blame",
            },
            {
                "label": "The blame flowing back",
                "tex": r"\delta^{(1)}_j = \left(\sum_i W^{(2)}_{ij}\,\delta^{(2)}_i\right) g'\!\left(z^{(1)}_j\right)",
                "note": "Each middle unit's share is in proportion to its wire into the output, times its own squash's slope. The chain rule, once per layer",
            },
            {
                "label": "What each weight does with it",
                "tex": r"\Delta W^{(l)}_{ij} = -\eta\,\delta^{(l)}_i\,a^{(l-1)}_j, \qquad \Delta b^{(l)}_i = -\eta\,\delta^{(l)}_i",
                "note": "The blame on the unit it feeds, times the value that came along it. The halos on the page are these",
            },
            {
                "label": "Checked, not trusted",
                "tex": r"\frac{\partial L}{\partial w} \approx \frac{L(w+\epsilon) - L(w-\epsilon)}{2\epsilon}",
                "note": "Every slope also computed by nudging the number by hand. The page reports the worst disagreement, which runs around 1e-7 with tanh in the middle",
            },
        ],
        "dimension": {
            "label": "The cost",
            "tex": r"\text{backward} \approx 2 \times \text{forward}",
            "note": "Thirteen slopes from one pass back, instead of thirteen separate nudges each needing two forward passes",
        },
    },
    {
        "id": "pictures",
        "name": "The same job on a picture",
        "summary": (
            "One small pattern slid over a drawing, the strongest fits kept, the nearest shape "
            "named. A convolution, pooling, and why the shape may move and still be found"
        ),
        "blocks": [
            {
                "label": "One position",
                "tex": r"o_{rc} = \max\!\left(0,\ \sum_{i,j} k_{ij}\,x_{r+i,\,c+j}\right)",
                "note": "The patch under the pattern, times the pattern, added up, cut below zero. The page shows this one position at a time",
            },
            {
                "label": "The whole map",
                "tex": r"(N - K + 1)^{2} \text{ positions from } K^{2} \text{ weights}",
                "note": "A hundred numbers from nine weights, because the same nine are used everywhere. A unit wired to every pixel would need one weight per pair",
            },
            {
                "label": "Pooling",
                "tex": r"p_{rc} = \max_{i,j \in \{0,1\}} o_{2r+i,\,2c+j}",
                "note": "Keep the largest of each block and forget where inside the block it was. This is what lets the shape move a pixel",
            },
            {
                "label": "The nearest shape",
                "tex": r"\hat{c} = \arg\min_c \left\| p - p^{(c)} \right\|",
                "note": "The pooled map against the pooled map of each remembered shape. A trained network would learn this last step too; here it is written out",
            },
        ],
        "dimension": {
            "label": "The patterns on the page",
            "tex": r"\begin{pmatrix} 1 & 0 & -1 \\ 2 & 0 & -2 \\ 1 & 0 & -1 \end{pmatrix}",
            "note": "The vertical-edge pattern: large where the left of a patch is brighter than its right. The others are its turn, a blur, a sharpen and a corner",
        },
    },
    {
        "id": "sequence",
        "name": "The same job on a sequence",
        "summary": (
            "Numbers arriving one a step; say the first one at the end. A gated memory cell "
            "beside a plain loop, with the gates set by hand so the mechanism is visible"
        ),
        "blocks": [
            {
                "label": "The plain loop",
                "tex": r"h_t = \tanh(w_x x_t + w_h h_{t-1} + b)",
                "note": "The answer fed back in. Every step overwrites the state, so the first number fades within a few steps",
            },
            {
                "label": "Three gates",
                "tex": r"f_t = \sigma(\cdot), \quad i_t = \sigma(\cdot), \quad o_t = \sigma(\cdot)",
                "note": "Each a small unit looking at the new number and the last output: how much to keep, how much to let in, how much to show",
            },
            {
                "label": "The memory",
                "tex": r"c_t = f_t\,c_{t-1} + i_t\,\tanh(\cdot)",
                "note": "Kept part plus let-in part. The plus sign is the whole point: added to, not replaced",
            },
            {
                "label": "What is shown",
                "tex": r"h_t = o_t\,\tanh(c_t)",
                "note": "The memory can hold a value without showing it, and show it later",
            },
        ],
        "dimension": {
            "label": "Why the first number survives",
            "tex": r"f_t \approx 1,\ i_t \approx 0 \text{ for } t > 1 \Rightarrow c_t \approx c_1",
            "note": "With the gates set to hold, the memory after step one is left alone. Blame flowing back across the plus sign is not shrunk at each step, which is what a plain loop cannot manage",
        },
    },
    {
        "id": "words",
        "name": "The same job on words",
        "summary": (
            "Each word decides which words to listen to, and how much. One head of attention, "
            "wired by hand so the pattern can be read off"
        ),
        "blocks": [
            {
                "label": "A question, a key and a value for every word",
                "tex": r"q_i = W_q x_i, \qquad k_j = W_k x_j, \qquad v_j = W_v x_j",
                "note": "Three projections of the same vector. The vector carries the position as a point on a circle and the word as a few numbers",
            },
            {
                "label": "How much i listens to j",
                "tex": r"\alpha_{ij} = \frac{\exp(q_i \cdot k_j / \sqrt{d})}{\sum_{j'} \exp(q_i \cdot k_{j'} / \sqrt{d})}",
                "note": "The match between a question and a key, squashed so each row adds to one. The exponential page's curve again",
            },
            {
                "label": "What the word carries out",
                "tex": r"z_i = \sum_j \alpha_{ij}\,v_j",
                "note": "The values of the words it listened to, weighed as the table shows",
            },
            {
                "label": "May only look back",
                "tex": r"j > i \Rightarrow \alpha_{ij} = 0",
                "note": "A model that writes one word at a time has no words ahead of it yet. The dark cells in the table are this",
            },
        ],
        "dimension": {
            "label": "A head that means 'the word before'",
            "tex": r"q_i = R(-\theta)\,\mathrm{pos}_i, \qquad k_j = \mathrm{pos}_j \;\Rightarrow\; q_i \cdot k_j \text{ largest at } j = i - 1",
            "note": "Rotate the question's position back one step and it lines up with the key one position earlier. A trained head that does this is doing the same thing with numbers it found itself",
        },
    },
]


DEFINITIONS = [
    {
        "id": "chain",
        "name": "The chain rule",
        "tex": r"\frac{d}{dx}f\!\left(g(x)\right) = f'\!\left(g(x)\right)g'(x)",
        "note": (
            "The whole of backpropagation is this, applied once per layer from the output "
            "backwards, with the intermediate values kept from the forward pass rather than "
            "recomputed"
        ),
    },
    {
        "id": "gradient",
        "name": "The gradient",
        "tex": r"\nabla L = \left(\frac{\partial L}{\partial p_1}, \ldots, \frac{\partial L}{\partial p_P}\right)",
        "note": (
            "The derivative of one number with respect to many. It points the steepest way up the "
            "surface, which is the only reason walking the other way is the algorithm"
        ),
    },
    {
        "id": "jacobian",
        "name": "The Hessian, and the curvature it carries",
        "tex": r"H_{ij} = \frac{\partial^2 L}{\partial p_i \partial p_j}",
        "note": (
            "The second derivatives. Its largest eigenvalue sets how long a step can be before "
            "descent diverges, and its signs say whether a flat point is a minimum, a maximum or "
            "a saddle"
        ),
    },
    {
        "id": "difference",
        "name": "The finite difference, and its two errors",
        "tex": r"\frac{L(p+\epsilon) - L(p-\epsilon)}{2\epsilon} = \frac{\partial L}{\partial p} + O(\epsilon^2) + O\!\left(\frac{\varepsilon_{\mathrm{machine}}}{\epsilon}\right)",
        "note": (
            "The definition of a derivative, computed. One error falls as the step shrinks and the "
            "other grows, so there is a best step and it is around 1e-4 rather than as small as "
            "possible"
        ),
    },
    {
        "id": "variance",
        "name": "The variance a layer passes on",
        "tex": r"\operatorname{Var}\!\left(z^{(l)}\right) = n_{l-1}\operatorname{Var}(w)\operatorname{Var}\!\left(a^{(l-1)}\right)",
        "note": (
            "Which is why the fan-in appears in every initialisation scheme: the weight variance "
            "has to cancel it or the signal grows or shrinks by the same factor at every layer"
        ),
    },
]
