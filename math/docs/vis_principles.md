# vis_principles - visualisation style for the math track

## scope

style principles for every animation in the math track. each story file (vis_story1.md, vis_story2.md, vis_story3.md) follows these principles. per-step visualisation specifics live in those story files; this doc holds only the principles that span all of them.

## principles

1. **structure first, operations layered on.**
diagrams (neurons, connections, axes, surfaces) are drawn first as static visuals. equations, formulas, and operations layer on top afterwards. the first frame of any beat contains structure only; operations arrive in subsequent frames.

2. **animated transfer with source persistence.**
when a labelled element from a diagram participates in an equation, the element visually moves (flies, slides, ghosts) to its position in the equation. the original element stays in place with its label intact. the motion is what teaches the source-to-use relationship; without the move, the equation looks like an unrelated object.

3. **smallest concrete first, then scale.**
every concept is shown on the tiniest possible instance before any animation pattern is replayed at scale. the canonical smallest case for a neural network is the two-neuron model with the equation y = x*w + b (one input, one output, one weight, one bias). after the smallest case is fully understood, the same animation pattern replays on a larger structure to prove the idea did not change.

4. **animation makes process visible.**
any concept with a "flows-over-time" or "values-change" aspect is shown as motion plus live value or equation re-writes, never as a still end-state. this applies to backpropagation, gradient descent, an activation function applied to its input, loss accumulating over training, signal propagating along network edges, parameter updates over iterations.

5. **one piece at a time, composition decided later.**
when a catalog entry lists several representations of one concept, each representation is its own small clip / animation beat, played one after another. simultaneous side-by-side composition of multiple representations is a separate decision made later, after each small piece has been reviewed individually. the first cut of every beat is solo.

6. **labels and structure persist within a beat, not across beats.**
within a single small clip, labels do not flicker, fade, or get overwritten; new content adds rather than replaces. between beats, the slate clears - the previous beat's structure does not carry forward into the next unless the next beat is explicitly continuing from that structure. each beat is self-contained for review.

7. **zoom navigates between detail and overview.**
the camera moves into a detail to inspect a specific element, then back out to the full picture; after the structure has changed, the camera can dive into a different detail. zoom is the primary device for switching between detail-level and overview-level views without redrawing the underlying figure or starting a new beat.

8. **a plot for every plottable element.**
activation functions appear with the function curve and its derivative curve drawn together within the same beat (both belong to the single concept). losses are shown from several angles in sequence (one beat per angle per principle 5: scalar value, loss surface in 3d, contour map, loss-versus-iteration curve, residual histogram, etc.). axes are always labelled with units.

## doc relationships

each `vis_story<N>.md` references the catalog of representations in `idea<N>.md` and applies these principles to specify how every representation is shown on screen. per-step entries do not restate these principles; if a per-step entry appears to conflict with a principle, the principle wins.
