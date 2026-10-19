import type { Piece } from "./kinds";

export const CURRENT: Piece = {
  id: "current",
  topic: "complex",
  question: "Why does a motor draw more current than the work it does?",
  lede: "The electricity in a wall socket pushes and pulls fifty times a second. Describing that with a turning arrow, which is a complex number, is how every engineer since 1893 has done it, and it explains a bill.",
  sections: [
    {
      heading: "What comes out of the wall",
      paragraphs: [
        "A battery pushes charge one way. The mains does not. Across most of the world the voltage at a socket swings from about plus 325 volts to minus 325 volts and back fifty times a second, in the smooth curve called a sine. In North America it swings a little less, sixty times a second. The 230 or 120 written on appliances is an average of that swing, chosen so that the same number of watts comes out as would from a steady supply.",
        "Fifty and sixty are accidents of history. A German maker chose 50 a second in 1891 because lamps flickered at lower rates; an American maker chose 60 in 1890 because its arc lamps ran a little better there. Japan bought generators from both, and to this day the east of the country runs at 50 and the west at 60, joined by four converter stations.",
      ],
    },
    {
      heading: "A current that arrives late",
      paragraphs: [
        "Put a plain heater across the socket and the current follows the voltage exactly: when the push is largest, the flow is largest. Put a coil of wire there instead, the kind inside every motor, and something odd happens. The current still swings fifty times a second, but it reaches its peak a quarter of a cycle after the voltage does. It lags.",
        "The reason is inside the coil. A changing current in a coil makes a changing magnetic field, and a changing magnetic field pushes back against the current that made it. So the current cannot jump when the voltage jumps; it builds while the voltage is already falling, and peaks late. A capacitor, two plates with a gap, does the opposite: charge has to flow onto the plates before any voltage stands between them, so there the current runs a quarter cycle ahead.",
        "A quarter cycle late, or a quarter cycle early. Those two facts are the whole of what has to be described, and describing them with ordinary numbers is clumsy: every quantity needs a size and a timing, and the timings have to be added and compared by hand.",
      ],
    },
    {
      heading: "The turning arrow",
      paragraphs: [
        "In this topic a number on the plane is an arrow with a length and an angle, and multiplying by i turns an arrow a quarter turn. That is exactly the tool. Draw the voltage as an arrow of a certain length. The current in a heater is an arrow pointing the same way. The current in a coil is an arrow turned a quarter turn back; in a capacitor, a quarter turn forward. Let all the arrows spin together at fifty turns a second and their shadows on a line are the swinging voltages and currents. The angle between two arrows is the delay between them.",
        "This was seen in 1893. Arthur Kennelly noticed that a diagram engineers had been drawing to add such delays was the plane of complex numbers, and Charles Steinmetz, at the International Electrical Congress in Chicago that year, showed that with the arrows written as complex numbers the whole business of alternating current became algebra. Engineers write the imaginary unit as j rather than i, because i already means current, and the method is used unchanged today.",
        "One complex number then does the work of two ordinary ones. Impedance is written Z equals R plus jX. The real part R is resistance, the part that turns current into heat. The imaginary part X is reactance, the part that only delays: positive for a coil, negative for a capacitor. The length of Z is how much current a given voltage produces; the angle of Z is how late that current arrives.",
      ],
    },
    {
      heading: "Where the bill comes from",
      paragraphs: [
        "Power is voltage times current, moment by moment. When the current arrives on time, every moment of the cycle delivers power. When it arrives a quarter cycle late, half of each cycle has the current flowing against the voltage, and the energy that went into the coil's field in one quarter comes straight back out in the next. It does no work. A pure coil draws a large current and delivers nothing.",
        "The share that does work is the cosine of the angle of Z, and the electricity industry calls it the power factor. A motor at full load typically runs at 0.84 to 0.91: nine tenths of its current is doing work and the rest is only building and collapsing the field. Half loaded it drops to 0.72 to 0.81; idling, to 0.15 or 0.20, a motor drawing a fifth of its full current to do nothing at all.",
        "The utility has to supply all of that current, not only the working part. To deliver one kilowatt at a power factor of 0.2 takes five times the current of a heater doing the same work, and current heats the wires along the way. So utilities charge industrial customers whose power factor falls below about 0.9. The remedy is the other arrow: a capacitor bank across the motor, turned a quarter cycle the other way, cancels the coil's delay. A 150 kilowatt motor running at 0.75 needs about 87 kilovolt-amperes of capacitors to reach 0.96, and the bill falls.",
      ],
    },
    {
      heading: "What the imaginary part was for",
      paragraphs: [
        "Nothing in a wire is imaginary. The imaginary part of Z is a bookkeeping of timing, and the angle it makes is a real delay that a meter can measure. The number i was invented in this topic as the thing that squares to minus one; here it is the thing that turns an arrow a quarter turn, and a quarter turn is exactly what a coil does to a current. That is why the same number serves.",
      ],
    },
  ],
  limits: [
    "Real mains voltage is only nearly a sine, and real coils have resistance as well as reactance; the numbers here are for the ideal parts, which is how the calculation is set up before the corrections.",
    "Who first said the word phasor for the turning arrow was not found; Kennelly and Steinmetz are the documented sources of the method.",
    "The motor figures are typical values from an engineering reference, not measurements of one motor.",
  ],
  sources: [
    { label: "Mains electricity and utility frequency, Wikipedia", url: "https://en.wikipedia.org/wiki/Utility_frequency" },
    { label: "Electrical impedance, Wikipedia (Heaviside 1886, Kennelly 1893)", url: "https://en.wikipedia.org/wiki/Electrical_impedance" },
    { label: "Kennelly, Impedance, Transactions of the AIEE 10, 1893", url: "https://books.google.com/books?id=3C0SAAAAIAAJ" },
    { label: "Steinmetz, Complex Quantities and Their Use in Electrical Engineering, International Electrical Congress, Chicago, 1893", url: "https://catalog.hathitrust.org/Record/001616266" },
    { label: "Araujo and Tonidandel, Steinmetz and the Concept of Phasor, 2013", url: "https://doi.org/10.1007/s40313-013-0030-5" },
    { label: "Electrical reactance, Wikipedia", url: "https://en.wikipedia.org/wiki/Electrical_reactance" },
    { label: "Power factor, Wikipedia", url: "https://en.wikipedia.org/wiki/Power_factor" },
    { label: "Three-phase electrical motors, power factor against load, Engineering ToolBox", url: "https://www.engineeringtoolbox.com/power-factor-electrical-motor-d_654.html" },
  ],
};

export const FREQUENCIES: Piece = {
  id: "frequencies",
  topic: "complex",
  question: "How does a photograph fit in a tenth of the space?",
  lede: "Every picture on a phone and every song in a pocket has been taken apart into turning arrows, the ones that could not be heard or seen thrown away, and the rest put back together. The arrows are complex numbers.",
  sections: [
    {
      heading: "A sound is a sum",
      paragraphs: [
        "Press one key on a piano and the air swings back and forth some hundreds of times a second: one frequency. Press three keys and the swing is three frequencies added together. In 1822 Joseph Fourier claimed something much stronger, that any curve at all can be written as a sum of such swings, each with its own frequency, its own size and its own timing. The judges of the prize he entered in 1811, Lagrange and Laplace among them, wrote that his argument still left something to be desired. He was right and they were not.",
        "A swing with a size and a timing is exactly a turning arrow from this topic: a complex number, its length the loudness of that frequency and its angle where in the cycle it starts. Taking a sound apart into frequencies is finding one arrow per frequency. That list of arrows is the Fourier transform of the sound.",
      ],
    },
    {
      heading: "Finding the arrows fast",
      paragraphs: [
        "For a recording of a few thousand samples the arithmetic is heavy: every sample has a say in every arrow, so for 4,096 samples it is about 30 million multiplications. In 1965 James Cooley and John Tukey published a way to reuse the work, splitting the list in halves again and again, that brings 4,096 samples down to about 70,000 operations, four hundred times fewer. Tukey had the idea in a government committee discussing how to detect Soviet nuclear tests from seismic recordings. Gauss had found essentially the same trick around 1805 to fit the orbits of two asteroids, and left it unpublished.",
        "That fast Fourier transform is what makes the rest possible. Without it a phone would take minutes to show a photograph.",
      ],
    },
    {
      heading: "A picture, eight pixels at a time",
      paragraphs: [
        "A photograph is a grid of brightness values, and a row of pixels is a curve like a sound: brightness against position instead of pressure against time. The JPEG standard, agreed in 1992, cuts the picture into blocks of 8 by 8 pixels, 64 numbers each, and takes each block apart into 64 frequencies: one for the block's average brightness, and 63 for ever finer stripes and checks across it.",
        "Here is the trick. The eye is bad at judging the exact strength of fine stripes. So each of the 64 frequency numbers is divided by a chosen amount and rounded to a whole number, and the fine ones are divided by large amounts. Most of the 63 detail numbers come out as zero. A long run of zeros costs almost nothing to store. Put back together, the block is not quite what it was, but the difference is in exactly the fine detail the eye could not judge.",
        "Divide more coarsely and the file shrinks further while the picture gets blockier. A ratio of ten to one is typical with a loss most people accept; at about two bits per pixel, down from twenty-four, the result is usually indistinguishable from the original.",
      ],
    },
    {
      heading: "A song, and what cannot be heard",
      paragraphs: [
        "A compact disc holds 44,100 samples a second for each of two ears, sixteen bits each: about 1.4 million bits for every second of music. The MP3 standard of 1993 gets the same second down to 128 thousand bits, eleven times fewer, and most listeners cannot tell.",
        "It does it with the same two moves as the picture, plus one about the ear. The sound is cut into frames of 1,152 samples and each frame is taken apart into 576 frequencies. Then a model of hearing decides what can be thrown away: a loud tone masks a quieter one close to it in frequency, and a loud sound masks quieter ones for a moment before and after it. The frequencies the ear would not have heard are stored coarsely or not at all. The bits that are left go to what would be heard.",
        "A spectrogram makes all of this visible: cut a recording into short windows, about 23 thousandths of a second each, take each apart into frequencies, and draw time across, frequency up, and loudness as brightness. Speech becomes stripes; a bird call becomes a curve. It is the sound written as its arrows, moment by moment.",
      ],
    },
    {
      heading: "The same arrows, everywhere",
      paragraphs: [
        "Multiplying two complex numbers adds their angles. That one fact is why a frequency, a shift in time and a shift in position all look the same once a signal has been taken apart: each is a turn of the arrows. Fourier did it for heat in 1822, Cooley and Tukey made it fast in 1965, and the standards of 1992 and 1993 put it in every pocket. What a photograph and a song have in common is that both were, for a moment, a list of turning arrows.",
      ],
    },
  ],
  limits: [
    "JPEG uses a cousin of the Fourier transform called the discrete cosine transform, which works with real numbers by choosing the arrows' angles in advance; the idea of frequencies and the fast algorithm are the same, and the complex form is the one the sound side uses directly.",
    "The eleven-to-one ratio is at one common bitrate; MP3 offers fourteen bitrates from 32 to 320 thousand bits a second and the ratio changes with them.",
    "Compression numbers are typical values from the standards and their authors, not measurements of one file.",
  ],
  sources: [
    { label: "Fourier, Theorie analytique de la chaleur, 1822", url: "https://doi.org/10.3931/e-rara-19706" },
    { label: "Fourier series, history, Wikipedia", url: "https://en.wikipedia.org/wiki/Fourier_series" },
    { label: "Cooley and Tukey, An Algorithm for the Machine Calculation of Complex Fourier Series, 1965", url: "https://doi.org/10.1090/S0025-5718-1965-0178586-1" },
    { label: "Heideman, Johnson and Burrus, Gauss and the history of the fast Fourier transform, 1985", url: "https://doi.org/10.1007/BF00348431" },
    { label: "ITU-T Recommendation T.81, the JPEG standard, 1992", url: "https://www.itu.int/rec/T-REC-T.81-199209-I/en" },
    { label: "Wallace, The JPEG Still Picture Compression Standard, Communications of the ACM, 1991", url: "https://doi.org/10.1145/103085.103089" },
    { label: "MP3 and MPEG-1, Wikipedia", url: "https://en.wikipedia.org/wiki/MP3" },
    { label: "Sellars, Perceptual Coding: How MP3 Compression Works, Sound On Sound, 2000", url: "https://www.soundonsound.com/techniques/perceptual-coding-how-mp3-compression-works" },
    { label: "Spectrogram, Wikipedia", url: "https://en.wikipedia.org/wiki/Spectrogram" },
  ],
};
