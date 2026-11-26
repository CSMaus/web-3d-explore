/**
 * the stories of the site: each page that opens with a story, the number of its steps, and the one
 * sentence that stands under its title (the English wording, which is also the dictionary key).
 * the tests read this list, so a page left out or a story cut short fails them.
 */
export const STORIES: Record<string, number> = {
  "series/fourier": 20,
  "probability/dice": 10,
  "probability/birthdays": 10,
  "probability/test": 11,
  "probability/doors": 10,
  "probability/game": 10,
  "probability/hats": 10,
  "probability/galton": 9,
  "probability/poisson": 9,
  "probability/bins": 8,
  "probability/memory": 8,
  "probability/walks": 9,
  "probability/ruin": 11,
};

export const JOBS: Record<string, string> = {
  "series/fourier": "How do smoothly turning arrows make a wave with sharp corners?",
  "probability/dice": "When two dice are thrown, why does a sum of 7 come up six times as often as a sum of 2?",
  "probability/birthdays": "How many people does a room need for a likely shared birthday?",
  "probability/test": "After a positive test result, how likely is the disease?",
  "probability/doors": "Three doors, one car: is it better to stay or to switch?",
  "probability/game": "A round costs 2, and a six on a die wins 10. How much has a player won or lost after 1000 rounds?",
  "probability/hats": "Hats come back at random. How many people get their own?",
  "probability/galton": "Why do balls falling at random always pile up in the same shape?",
  "probability/poisson": "A call centre gets three calls a minute on average. How often does a minute pass with no call?",
  "probability/bins": "Taxis come at random, 10 minutes apart on average. How often is the wait over 20 minutes?",
  "probability/memory": "After ten minutes of waiting for a taxi, how much longer is the wait?",
  "probability/walks": "Where does a player end up after hundreds of fair coin tosses?",
  "probability/ruin": "A gambler starts with 10 and bets 1 at a time on a coin. How often is 20 reached before 0?",
};
