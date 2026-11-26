import { L } from "@/lib/lang";
import { FREQUENCIES } from "./complex";
import type { Piece } from "./kinds";

/** the photograph and the song, the same piece the imaginary numbers topic carries: here it is the series topic's idea at work */
export const PHOTO: Piece = { ...FREQUENCIES, id: "photo", topic: "series" };

/** how a calculator gets sin(x): a short series, used only where it is short, after the turns are taken off */
export const CALCULATOR: Piece = {
  id: "calculator",
  topic: "series",
  question: L("How does a calculator get sin(x)?"),
  lede: L("A calculator chip can only add, subtract, multiply and shift digits. Sine is not one of these operations, yet sin(2.5) comes back as 0.5984721441 at once. Sine, written sin x, is the function from school trigonometry that gives a height between -1 and 1 for an angle x, measured in radians. The answer is a short sum of simple terms, called a series, together with a trick that keeps the sum short."),
  sections: [
    {
      heading: L("Seven terms are enough near zero"),
      paragraphs: [
        L("sin x can be written as a sum: x - x^3/6 + x^5/120 - x^7/5040, and so on. Each term is a power of x divided by a fixed number. Here x^3 means x × x × x, and 6, 120 and 5040 are the factorials 3!, 5! and 7!, for example 5! = 1 × 2 × 3 × 4 × 5 = 120. This sum is called the Taylor series of sin x, and the page 'Taylor series' in this topic builds it term by term. It uses only multiplying and adding, the two things a chip can do."),
        L("Seven terms, up to the power 13, give 0.5984728 at x = 2.5. The true value is 0.5984721, so six decimal places are right. Closer to zero the result is far better. At a quarter of pi, about 0.785, the same seven terms are off by only 2.0 × 10^-14, in the 14th decimal place."),
      ],
    },
    {
      heading: L("Far from zero the series is useless"),
      paragraphs: [
        L("At x = 100 the seven terms give nonsense: 100^13 divided by 13! alone is about 1.6 × 10^16. More terms might seem to be the fix. The series does work for every x, so its terms shrink in the end. But first they grow: the largest, near the power 100, is about 10^42. To get the answer, the computer would have to add 156 terms with alternating signs, the largest of them about 10^42, and arrive at a result smaller than one."),
        L("A computer keeps about 16 significant digits of each number. A term of size 10^42 kept to 16 digits is already wrong by about 10^26. The sum comes out as -1.4 × 10^26, while the true value of sin 100 is -0.5064. More terms cannot fix this. The error comes from rounding the large terms, not from the terms left out."),
      ],
    },
    {
      heading: L("First take off the whole turns"),
      figure: "calculator",
      paragraphs: [
        L("Sine repeats after every full turn of the angle, 2 pi, about 6.283. Its quarter turns are related too. A quarter turn further on, sine becomes cosine, its companion function from school trigonometry. A half turn further on, sine changes sign. So any x can be moved into the small window from minus a quarter of pi to plus a quarter of pi. The calculator counts how many quarter turns, pi/2 each, fit into x, takes them off, and remembers the count."),
        L("For x = 100, 64 quarter turns fit and -0.531 is left over. Sixty-four quarter turns are 16 whole turns, so the sign does not change: sin 100 = sin(-0.531) = -0.5064. Seven terms at -0.531 are right to the last digit the computer keeps. Call the leftover r. If the count of quarter turns leaves 1, 2 or 3 after dividing by 4, then sin x equals cos r, minus sin r or minus cos r. Cosine has its own short series."),
        L("This is how fdlibm works, a library of mathematical functions for the C programming language written at Sun Microsystems in 1993, and so do the libraries that grew out of it. It uses a polynomial of degree 13, a sum of powers of x up to x^13, on the window from minus to plus a quarter of pi, with a stated error below 2^-58. Its numbers are not exactly Taylor's 1/3!, 1/5! and so on. They are tuned so that the error is spread evenly over the window. With Taylor's numbers the error is zero at the centre and largest at the edges. The idea is the same."),
      ],
    },
    {
      heading: L("Taking the turns off exactly"),
      paragraphs: [
        L("The trick moves the difficulty into one subtraction. Pi has no last digit, so x minus 64 quarter turns is computed with a rounded pi. For x = 100 the rounding does no harm. For x = 10^22 the count of quarter turns has 22 digits, and the digits of pi up to about the fortieth all matter. In 1983 Mary Payne and Robert Hanek published a way to take the turns off exactly for any size of x. It stores as many digits of 2/pi as the size of x needs. Fdlibm keeps 396 hexadecimal digits of 2/pi for this, digits in base 16 instead of base 10."),
      ],
    },
    {
      heading: L("Without multiplying at all"),
      paragraphs: [
        L("Multiplying is the slow step on a small chip. In 1959 Jack Volder, at the company Convair, published a way around it for the navigation computer of the B-58 bomber. It is called CORDIC. Instead of a series, it turns an arrow. The arrow starts at (1, 0), pointing to the right. To find the sine of an angle, CORDIC turns the arrow towards that angle by a fixed list of smaller and smaller angles. These are the angles whose tangent is 1, 1/2, 1/4, 1/8 and so on, the tangent of an angle being its sine divided by its cosine. Each turn goes clockwise or anticlockwise, whichever brings the arrow closer. A turn by such an angle needs only a shift of digits and an addition. After 40 turns, the height of the arrow is the sine, once a fixed scale factor is divided out."),
        L("The first pocket scientific calculator, the HP-35 made by Hewlett-Packard in 1972, computed sines and cosines with turns of this kind, in decimal digits. Many small chips without a fast multiplier still do."),
      ],
    },
    {
      heading: L("In short"),
      paragraphs: [
        L("A series is only as good as the place where it is used. A calculator first moves x to where seven terms are enough. The two careful parts of the work are this move and the choice of the seven numbers."),
      ],
    },
  ],
  limits: [
    L("The error figures on this page are computed in the browser, with 16-digit arithmetic and the plain Taylor terms. A real library, with tuned numbers and careful adding, is a little more accurate."),
    L("Which method a given calculator or processor uses is often not published. The fdlibm numbers come from its source code. The history of the HP-35 and of CORDIC comes from the papers listed below and from the Wikipedia article on CORDIC. The full text of Cochran's 1972 article was not read for this page."),
    L("Cosine, tangent, logarithms and roots are computed in the same two ways. First the input is moved into a small window, then a short polynomial or a set of arrow turns is used. Each function has its own way of moving the input."),
  ],
  sources: [
    { label: "fdlibm, k_sin.c and e_rem_pio2.c, Sun Microsystems, 1993", url: "https://www.netlib.org/fdlibm/" },
    { label: "Payne and Hanek, Radian reduction for trigonometric functions, ACM SIGNUM Newsletter, 1983", url: "https://doi.org/10.1145/1057600.1057602" },
    { label: "Volder, The CORDIC Trigonometric Computing Technique, IRE Transactions on Electronic Computers, 1959", url: "https://doi.org/10.1109/TEC.1959.5222693" },
    { label: "Meggitt, Pseudo Division and Pseudo Multiplication Processes, IBM Journal of Research and Development, 1962", url: "https://doi.org/10.1147/rd.62.0210" },
    { label: "Cochran, Algorithms and Accuracy in the HP-35, Hewlett-Packard Journal, June 1972", url: "https://archived.hpcalc.org/laporte/HP35%20&%20CORDIC%20Links.htm" },
    { label: "CORDIC, Wikipedia", url: "https://en.wikipedia.org/wiki/CORDIC" },
  ],
};
