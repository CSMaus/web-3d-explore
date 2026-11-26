import { L } from "@/lib/lang";
import type { Piece } from "./kinds";

export const CURRENT: Piece = {
  id: "current",
  topic: "complex",
  question: L("Why does a motor take more current from the mains than its work needs?"),
  lede: L("The electricity in a wall socket pushes one way and then the other, fifty times a second. Engineers describe such a push with a turning arrow, which is a complex number: a point of a flat plane, with a length and an angle. They have done so since 1893, and the method explains a part of the electricity bill."),
  sections: [
    {
      heading: L("What comes out of the wall"),
      paragraphs: [
        L("A battery pushes electric charge in one direction. The mains, the supply in a wall socket, does not. Across most of the world the voltage at a socket, the push that drives the charge, swings from about plus 325 volts to minus 325 volts and back, fifty times a second. The swing follows a smooth wave called a sine curve. In North America it swings a little less, sixty times a second. The 230 or 120 volts written on appliances is an average of that swing. It is chosen so that a steady supply of that many volts would deliver the same power, counted in watts."),
        L("The numbers fifty and sixty are accidents of history. A German maker chose 50 a second in 1891 because lamps flickered at lower rates. An American maker chose 60 in 1890 because its arc lamps ran a little better there. Japan bought generators from both. To this day the east of the country runs at 50 and the west at 60, joined by four converter stations."),
      ],
    },
    {
      heading: L("A current that arrives late"),
      paragraphs: [
        L("Current is the amount of charge that flows each second. With a plain heater plugged in, the current follows the voltage exactly: when the push is largest, the flow is largest. With a coil of wire instead, the kind found inside every motor, something odd happens. The current still swings fifty times a second, but it reaches its peak a quarter of a cycle after the voltage does. A cycle is one full swing, there and back. The current lags behind."),
        L("The reason is inside the coil. A changing current in a coil makes a changing magnetic field, and a changing magnetic field pushes back against the current that made it. So the current cannot jump when the voltage jumps. It builds up while the voltage is already falling, and peaks late. A capacitor, two metal plates with a gap between them, does the opposite. Charge has to flow onto the plates before any voltage can stand between them, so there the current runs a quarter of a cycle ahead."),
        L("A quarter of a cycle late, or a quarter of a cycle early: these two facts are all that has to be described. Ordinary numbers describe them clumsily. Every quantity needs both a size and a timing, and the timings have to be added and compared by hand."),
      ],
    },
    {
      heading: L("The turning arrow"),
      paragraphs: [
        L("A complex number is a point of a flat plane, written a + bi: a is how far across from zero and b how far up. Drawn as an arrow from zero, it has a length and an angle. Multiplying by the number i, whose square is minus one, turns an arrow a quarter turn. That is exactly the tool needed here. The voltage is drawn as an arrow of a certain length. The current in a heater is an arrow pointing the same way. The current in a coil is an arrow turned a quarter turn back; in a capacitor, a quarter turn forward. All the arrows spin together at fifty turns a second, and their shadows on a line are the swinging voltages and currents. The angle between two arrows is the delay between them."),
        L("This was seen in 1893. Arthur Kennelly noticed that a diagram engineers had been drawing to add such delays was the plane of complex numbers. Charles Steinmetz, at the International Electrical Congress in Chicago that year, showed that with the arrows written as complex numbers, all the calculations of alternating current became ordinary algebra. Engineers write the imaginary unit as j rather than i, because i already stands for current. The method is used unchanged today."),
        L("One complex number then does the work of two ordinary ones. The impedance of a device, how strongly it holds back the current, is written Z = R + jX. The real part, R, is the resistance: the part that turns current into heat. The imaginary part, X, is the reactance: the part that only delays the current. It is positive for a coil and negative for a capacitor. The length of Z gives how much current a given voltage produces. The angle of Z gives how late that current arrives."),
      ],
    },
    {
      heading: L("Where the bill comes from"),
      paragraphs: [
        L("Power is voltage times current, moment by moment. When the current arrives on time, every moment of the cycle delivers power. When it arrives a quarter of a cycle late, for half of each cycle the current flows against the voltage. The energy that went into the coil's magnetic field in one quarter comes straight back out in the next. It does no work. A pure coil draws a large current and delivers nothing."),
        L("The share of the current that does work is the cosine of the angle of Z. The cosine of an angle is how far across a point lies on a circle of radius one, turned by that angle: 1 for no angle, 0 for a quarter turn. The electricity industry calls this share the power factor. A motor at full load typically runs at 0.84 to 0.91: nine tenths of its current does work, and the rest only builds and collapses the magnetic field. Half loaded, it drops to 0.72 to 0.81. Idling, it drops to 0.15 or 0.20: the motor draws a fifth of its full current and does no work at all."),
        L("The utility, the company that supplies the electricity, has to deliver all of that current, not only the working part. Delivering one kilowatt at a power factor of 0.2 takes five times the current of a heater doing the same work, and current heats the wires along the way. So utilities charge extra to industrial customers whose power factor falls below about 0.9. The remedy is the other kind of arrow. A bank of capacitors connected across the motor turns its share of the current a quarter of a cycle the other way and cancels the coil's delay. A 150 kilowatt motor running at 0.75 needs capacitors of about 87 kilovolt-amperes, a unit for the current they carry at mains voltage, to reach 0.96, and the bill falls."),
      ],
    },
    {
      heading: L("What the imaginary part was for"),
      paragraphs: [
        L("Nothing in a wire is imaginary. The imaginary part of Z is a record of timing, and the angle it makes is a real delay that a meter can measure. The number i was invented as the number whose square is minus one. Here it is the number that turns an arrow a quarter turn, and a quarter of a cycle is exactly the delay a coil gives a current. That is why the same number serves both purposes."),
      ],
    },
  ],
  limits: [
    L("Real mains voltage is only nearly a sine curve, and real coils have resistance as well as reactance. The numbers here are for ideal parts, which is how the calculation is set up before corrections are added."),
    L("The person who first used the word phasor for the turning arrow was not found. Kennelly and Steinmetz are the documented sources of the method."),
    L("The motor figures are typical values from an engineering reference, not measurements of one motor."),
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
  question: L("How does a photograph fit in a tenth of the space?"),
  lede: L("Every picture on a phone and every song stored on it has been taken apart into turning arrows. The arrows that could not be seen or heard were thrown away, and the rest were put back together. The arrows are complex numbers: points of a flat plane, each with a length and an angle."),
  sections: [
    {
      heading: L("A sound is a sum"),
      paragraphs: [
        L("Press one key on a piano and the air swings back and forth some hundreds of times a second. The number of swings a second is called the frequency. Press three keys and the swing is three frequencies added together. In 1822 Joseph Fourier claimed something much stronger: any curve at all can be written as a sum of such swings, each with its own frequency, its own size and its own timing. Lagrange and Laplace were among the judges of the prize he entered in 1811, and they wrote that his argument still left something to be desired. He was right and they were not."),
        L("A swing with a size and a timing is exactly a turning arrow: a complex number whose length is the loudness of that frequency and whose angle is the point in the cycle where it starts. Taking a sound apart into frequencies means finding one arrow for each frequency. That list of arrows is called the Fourier transform of the sound."),
      ],
    },
    {
      heading: L("Finding the arrows fast"),
      paragraphs: [
        L("A recording is stored as samples: the air pressure measured many times a second. For a recording of a few thousand samples the arithmetic is heavy, because every sample affects every arrow. For 4,096 samples it takes about 30 million multiplications. In 1965 James Cooley and John Tukey published a way to reuse the work by splitting the list in halves again and again. It brings 4,096 samples down to about 70,000 operations, four hundred times fewer. Tukey had the idea in a government committee discussing how to detect Soviet nuclear tests from recordings of ground shaking. Gauss had found essentially the same trick around 1805, to fit the orbits of two asteroids, and left it unpublished."),
        L("This method is called the fast Fourier transform, and it makes the rest possible. Without it a phone would take minutes to show a photograph."),
      ],
    },
    {
      heading: L("A picture, eight pixels at a time"),
      paragraphs: [
        L("A photograph is a grid of brightness values, one for each tiny square, called a pixel. A row of pixels is a curve like a sound: brightness against position instead of pressure against time. The JPEG standard, agreed in 1992, cuts the picture into blocks of 8 by 8 pixels, 64 numbers each. It takes each block apart into 64 frequencies: one for the block's average brightness, and 63 for ever finer stripes and checks across it."),
        L("The main idea: the eye is bad at judging the exact strength of fine stripes. So each of the 64 frequency numbers is divided by a chosen amount and rounded to a whole number, and the fine ones are divided by large amounts. Most of the 63 detail numbers come out as zero. A long run of zeros costs almost nothing to store. When the block is put back together it is not quite what it was, but the difference lies in exactly the fine detail the eye could not judge."),
        L("Dividing more coarsely makes the file smaller still and the picture blockier. A ratio of ten to one is typical, with a loss most people accept. A bit is the smallest unit of stored information, a 0 or a 1. At about two bits per pixel, down from twenty-four, the result usually cannot be told apart from the original."),
      ],
    },
    {
      heading: L("A song, and what cannot be heard"),
      paragraphs: [
        L("A compact disc holds 44,100 samples a second for each of two ears, sixteen bits each: about 1.4 million bits for every second of music. The MP3 standard of 1993 brings the same second down to 128 thousand bits, eleven times fewer, and most listeners cannot hear the difference."),
        L("It uses the same two moves as the picture, plus one about the ear. The sound is cut into frames of 1,152 samples, and each frame is taken apart into 576 frequencies. Then a model of hearing decides what can be thrown away. A loud tone hides a quieter one close to it in frequency, and a loud sound hides quieter ones for a moment before and after it. The frequencies the ear would not have heard are stored coarsely or not at all. The bits that are left go to what would be heard."),
        L("A spectrogram makes all of this visible. A recording is cut into short windows, about 23 thousandths of a second each, and each window is taken apart into frequencies. The picture shows time across, frequency up, and loudness as brightness. Speech becomes stripes; a bird call becomes a curve. It is the sound written as its arrows, moment by moment."),
      ],
    },
    {
      heading: L("The same arrows, everywhere"),
      paragraphs: [
        L("Multiplying two complex numbers adds their angles. Because of that one fact, once a signal has been taken apart, a shift in time and a shift in position both become the same thing: a turn of the arrows. Fourier did this for heat in 1822, Cooley and Tukey made it fast in 1965, and the standards of 1992 and 1993 put it into every phone. A photograph and a song have this in common: both were, for a moment, a list of turning arrows."),
      ],
    },
  ],
  limits: [
    L("JPEG uses a close relative of the Fourier transform, called the discrete cosine transform. It works with ordinary numbers by fixing the arrows' angles in advance. The idea of frequencies and the fast method are the same, and the sound side uses the complex form directly."),
    L("The ratio of eleven to one holds at one common bitrate, the number of bits stored for each second. MP3 offers fourteen bitrates, from 32 to 320 thousand bits a second, and the ratio changes with them."),
    L("The compression numbers are typical values from the standards and their authors, not measurements of one file."),
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
