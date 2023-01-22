# A cute little sliding puzzle game

Given a board with a $n$ x $m$ size, we solve it by starting at the player :cat2:. Then there are 4 possible directions (up, down, left, right). We try walking in those directions until we hit a rock. This gives us our potentially new solutions. So we add those to a queue and mark the field of the player as completed.

Then, unsurprisingly, we take a position out of the queue. We do this whole 'walk in 4 directions, check if visited and add to queue' again. And repeat.

In the worst case, we visit every single tile once, before having marked everything as completed. So $O(n \cdot m)$, which is nice and polynomial!

Verifying that this will always find a solution if one exists is left as an exercise for the reader. The author appreciates any and all proper proofs or decent explanations sent their way.

Click on the board to start playing.

<ClientOnly>
<SlidingPuzzle/>
</ClientOnly>

<script setup>
import SlidingPuzzle from './SlidingPuzzle/SlidingPuzzle.vue'
</script>
