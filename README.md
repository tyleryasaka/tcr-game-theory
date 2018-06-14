# Token-Curated Registry Playground

## Overview

TCR 1.1 modeled using game theory.

In [this blog post](https://medium.com/@ilovebagels/token-curated-registries-1-0-61a232f8dac7), Mike Goldin describes a cryptoeconomic model known as the **Token-Curated Registry**. In it he lays forth the value propositions for this model and describes in detail his form of the model. He states:

> We believe there is a “right” way to do token-curated registries and that wholesale reuse of a canonical implementation should be possible.

The general idea of a TCR is that there will be a list of some sort, with a stated purpose (perhaps a list of quality breweries in Boulder, Colorado). The ultimate utility of the list of course would be to serve some end consumer that would have use for such a list. The mechanism of the TCR is designed such that, ideally, incentives will exist for the creation and curation of such a list.

### TCR Actors

Other than the end consumers, there are essentially two types of actors that will interact with a TCR. The first are candidates; candidates wish to be included on the list in order to be seen by the consumers of the list. Then there are the curators, who own tokens that will appreciate in value as the list increases in quality. The curators will determine which candidates will and will not be allowed in the list.

### TCR Example

As an example of the curation process: imagine that Alice is a top-tier cobbler in San Francisco. Alice wants her shoe to be listed in the "Sleekest Shoes of Silicon Valley" registry. So she puts up a stake of the registry tokens in the amount of `MIN_DEPOSIT` and applies to list her shoe. Bob sees this new application appear and does not find the shoes to be so sleek. Bob challenges the application, also staking `MIN_DEPOSIT`. The challenge goes up for a vote.

Several curators vote, in proportion to their token holdings, and the result is overwhelmingly in favor of the sleekness of Alice's shoes. `DISPENSATION_PCT
` percent of Bob's stake goes to Alice to compensate her for the risk she took, and the rest of Bob's stake goes to the winning voting bloc, in proportion to token holdings. The winning voting bloc also gets `MINORITY_BLOC_SLASH` percentage of the losing voting bloc's tokens, per the [TCR 1.1 changes](https://medium.com/@ilovebagels/token-curated-registries-1-1-2-0-tcrs-new-theory-and-dev-updates-34c9f079f33d). And Alice's shoes are added to the registry!

### Game Theory Model

The process described above is the core component of TCR. The first question that came to my mind was, "will this actually work?" While I don't know the answer to that question, I do know some techniques from [game theory](https://en.wikipedia.org/wiki/Game_theory) that can be used to analyze the underlying incentive model behind TCR. This is very much a work in progress and has not been thoroughly reviewed, but I have built a playground for visualizing TCR as a game played with [pure strategies](https://en.wikipedia.org/wiki/Strategy_%28game_theory%29#Pure_and_mixed_strategies) and with [perfect information](https://en.wikipedia.org/wiki/Perfect_information). This is perhaps overly simplistic, but it is a starting point that I am hoping to expand upon.

In my analysis, I describe 3 types of players: the **candidate**, the **challenger**, and 1 or more **voters**. Each candidate has a set of possible actions, and must choose exactly one. The candidate can choose either to apply or not to apply; the challenger can choose either to challenge or not to challenge the application (if the candidate chooses to apply); each voter can then choose whether to vote in favor of the application, against the application, or to abstain from voting (if the candidate chooses to apply *and* the application is challenged).

The is a classic example of a game theoretic model, where each player's actions affect the payoffs of the other players' actions. Each player is expected to act, rationally, in response to a rational anticipation of the other players' actions; yet this player's actions will simultaneously affect the actions of the others. An equilibrium is a set of actions, one for each player, in which no player "regrets" their action taken. (Given the actions of the other players, no player can single-handedly do better by switching to a different action.)

The playground allows the relevant TCR parameters to be set. (The timing-related parameters were left out as they are negligible in the bigger picture of incentives). Some additional parameters are also provided, namely **Application Cost**, **Challenge Cost**, **Vote Cost**, and **Number of Voters**. The cost parameters here are simply included as a way to encode any costs that might accompany taking an action. These costs might be literal costs, such as Ethereum gas costs; or they might represent simple inconvenience or time costs of taking an action.

The candidate has parameters for **Listing Valuation**, which is the value that the candidate places on being included in the registry, and **Quality**, which is the value that the candidate will indirectly add to the overall value of the token by increasing the utility of the registry.

Below each player is a payoff matrix, where the rows represent available actions, and the columns represent outcomes. The payoff value for each action/outcome combination is displayed in the matrix. The best strategy for a player in a given scenario is denoted with a star.

The outcome section at the bottom of the playground describes the result of the game. It denotes whether or not the current scenario is a [Nash Equilibrium](https://en.wikipedia.org/wiki/Nash_equilibrium) and provides a brief, automatically generated narration of the outcome.

With the default parameters I have set in the playground, 2 equilibria can be found. The first is as follows:
- Candidate applies
- Challenger does not challenge
- All voters would have accepted

And the second:
- Candidate does not apply
- Challenger would have challenged
- All voters would have rejected

### Considerations

Using the default parameters I set, it's important to note that the candidate is considered "good". (It adds quality to the registry because its "quality" parameter is greater than 0). Thus, the desired result of this scenario is the first equilibrium I described, where the candidate applies and is accepted into the registry. What is interesting is that the second scenario is just as legitimate as the first, at least using the game theoretic model I have used. So this is an important question to ask about token-curated registries: how do we know that the they will arrive at the desired equilibrium? The answer to this question goes beyond the scope of the simplistic model I have presented. The question is quite complex and involves taking human psychology and behavior into account.

One possible answer to this question is that the "truth" serves as a coordination signal to guide players toward the desired equilibrium, where players are acting honestly to increase the overall quality of the registry. Indeed, Bitcoin and blockchains in general seem to face a similar problem; how do you guarantee that the blockchain will reflect the real-world truth? Well, you don't, but you assume that people will naturally gravitate toward the equilibrium centered around the truth. There are a couple reasons this might be the case, such as convenience (there are many lies but only one truth) or perhaps there are a handful of good actors that tilt the scales in favor of the truthful equilibrium, and the rest of the players follow suit. Additionally, the value of the registry (and by extension the tokens) is expected to reflect the quality of its listings. Thus there is at least some value incentive for players to coordinate toward an honest rather than a dishonest equilibrium. The voters should want to increase the overall value of their token holdings. Will this always be enough though? Are there possible scenarios where the system is vulnerable to manipulation for short term gains? I think these are important questions for anyone to consider before implementing a token-curated registry.

Another interesting thing to notice is that, in both equilibria, *the players never actually vote*. They choose strategies such that they *would* vote *if* an application were to be challenged. Of course, this is a model using perfect information. In reality there will be information assymetry in the game. Players will be anticipating, without perfect knowledge, how other players will act. A better model would take this imperfect information into account. (One possible technique that comes to mind is [bayesian game theory](https://en.wikipedia.org/wiki/Bayesian_game).) With imperfect information, it is reasonable to expect that applications would sometimes be challenged, requiring participation from the voters.

### Next Steps

At the moment, the code has not been thoroughly reviewed or tested. It's possible there are mathematical or logical errors. There is also a lot of room for improvement, whether in terms of UI or in terms of the model itself. Feedback and/or contributions are more than welcome!
