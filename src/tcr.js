let playerCounter = 0

const actionApply = 'apply'
const actionNotApply = 'not_apply'

const actionChallenge = 'challenge'
const actionNotChallenge = 'not_challenge'

const actionAccept = 'accept'
const actionReject = 'reject'
const actionAbstain = 'abstain'

const columnAccept = 'accept'
const columnReject = 'reject'
const columnNotChallenge = 'not_challenge'

const columnWin = 'win'
const columnLose = 'lose'

class Payoff {
  constructor({ action, value } = {}) {
    this.action = action
    this.value = value
  }
}

class Player {
  constructor({
    tokens = 0,
    registryValue = 0,
    quality = 0,
    isListed = false,
    action
  } = {}) {
    this.id = playerCounter
    this.tokens = tokens
    this.registryValue = registryValue
    this.quality = quality
    this.isListed = isListed
    this.action = action

    playerCounter++
  }
}

class TCR {
  constructor({
    players = [],
    candidate,
    challenger,
    minDeposit,
    dispensationPct,
    minorityBlocSlash,
    voteQuorum,
    applicationEffort,
    challengeEffort,
    voteEffort
  } = {}) {
    this.players = players
    this.candidate = candidate
    this.challenger = challenger
    this.registry = []
    this.minDeposit = minDeposit
    this.dispensationPct = dispensationPct
    this.minorityBlocSlash = minorityBlocSlash
    this.voteQuorum = voteQuorum
    this.applicationEffort = applicationEffort
    this.challengeEffort = challengeEffort
    this.voteEffort = voteEffort
  }

  getCandidateMatrix() {
    const candidate = this.getPlayer(this.candidate)
    const validActions = this.getValidActions(candidate)
    const isChallenged = this.getIsChallenged()
    const challengeResult = getVerdict(this.getEligibleVoters(), this.voteQuorum) ? columnAccept : columnReject
    const columnSelected = !isChallenged ? columnNotChallenge : challengeResult
    const minDeposit = this.getMinDeposit()
    const dispensationPct = this.getDispensationPct()
    const applicationEffort = this.getApplicationEffort()
    const registryValue = this.getRegistryValue(candidate)

    let matrix = {}

    if (validActions.includes(actionApply)) {
      matrix[actionApply] = {}
      matrix[actionApply][columnAccept] = registryValue + minDeposit * dispensationPct  - applicationEffort
      matrix[actionApply][columnReject] = -1 * minDeposit  - applicationEffort
      matrix[actionApply][columnNotChallenge] = registryValue - applicationEffort
    }

    if (validActions.includes(actionNotApply)) {
      matrix[actionNotApply] = {}
      matrix[actionNotApply][columnAccept] = 0
      matrix[actionNotApply][columnReject] = 0
      matrix[actionNotApply][columnNotChallenge] = 0
    }

    let selectedColumns = {}
    selectedColumns[actionApply] = columnSelected
    selectedColumns[actionNotApply] = columnSelected

    return { matrix, selectedColumns }
  }

  getChallengerMatrix() {
    const candidate = this.getPlayer(this.candidate)
    const challenger = this.getPlayer(this.challenger)
    const validActions = this.getValidActions(challenger)
    const minDeposit = this.getMinDeposit()
    const voteQuorum = this.getVoteQuorum()
    const dispensationPct = this.getDispensationPct()
    const challengeEffort = this.getChallengeEffort()
    const tokens = this.getTokens(challenger)

    const columnSelected = getVerdict(this.getEligibleVoters(), voteQuorum) ? columnLose : columnWin
    const tokenValueChange = tokens * (this.getTokenAppreciation() - 1)

    let matrix = {}

    if (validActions.includes(actionChallenge)) {
      matrix[actionChallenge] = {}
      matrix[actionChallenge][columnWin] = minDeposit * dispensationPct - challengeEffort
      matrix[actionChallenge][columnLose] = tokenValueChange - minDeposit - challengeEffort
    }

    if (validActions.includes(actionNotChallenge)) {
      matrix[actionNotChallenge] = {}
      matrix[actionNotChallenge][columnWin] = tokenValueChange
      matrix[actionNotChallenge][columnLose] = tokenValueChange
    }

    let selectedColumns = {}
    selectedColumns[actionChallenge] = columnSelected
    selectedColumns[actionNotChallenge] = columnSelected

    return { matrix, selectedColumns }
  }

  getVoterMatrix({ id }) {
    const voter = this.getPlayer(id)
    const validActions = this.getValidActions(voter)
    const minDeposit = this.getMinDeposit()
    const dispensationPct = this.getDispensationPct()
    const voteQuorum = this.getVoteQuorum()
    const voteEffort = this.getVoteEffort()
    const minorityBlocSlash = this.getMinorityBlocSlash()
    const tokens = this.getTokens(voter)

    const otherVoters = this.getEligibleVoters().filter((player) => {
      return player.id !== voter.id
    })

    // hypothetical voting choices
    const withMeAccepting = otherVoters.concat(new Player({ tokens, action: actionAccept, registryValue: 1000 }))
    const withMeRejecting = otherVoters.concat(new Player({ tokens, action: actionReject, registryValue: 1001 }))

    // tokens excluding voter
    const acceptBlocTokens = getAcceptBlocTokens(otherVoters)
    const rejectBlocTokens = getRejectBlocTokens(otherVoters)

    // the outcome of the vote depends on my action (possibly)
    // therefore the column selected now depends on my action
    const columnIfIAccept = getVerdict(withMeAccepting, voteQuorum) ? columnAccept : columnReject
    const columnIfIReject = getVerdict(withMeRejecting, voteQuorum) ? columnAccept : columnReject
    const columnIfIAbstain = getVerdict(otherVoters, voteQuorum) ? columnAccept : columnReject

    // percentage including voter
    const percentOfAcceptBloc = voter.tokens / (acceptBlocTokens + tokens)
    const percentOfRejectBloc = voter.tokens / (rejectBlocTokens + tokens)

    const tokenValueChange = tokens * (this.getTokenAppreciation() - 1)

    let matrix = {}

    if (validActions.includes(actionAccept)) {
      matrix[actionAccept] = {}
      matrix[actionAccept][columnAccept] = tokenValueChange + (1 - dispensationPct) * minDeposit * percentOfAcceptBloc + rejectBlocTokens * minorityBlocSlash * percentOfAcceptBloc - voteEffort
      matrix[actionAccept][columnReject] = -1 * tokens * minorityBlocSlash - voteEffort
    }

    if (validActions.includes(actionReject)) {
      matrix[actionReject] = {}
      matrix[actionReject][columnAccept] = tokenValueChange - (tokens * minorityBlocSlash) - voteEffort
      matrix[actionReject][columnReject] = (1 - dispensationPct) * minDeposit * percentOfRejectBloc + acceptBlocTokens * minorityBlocSlash * percentOfRejectBloc - voteEffort
    }

    if (validActions.includes(actionAbstain)) {
      matrix[actionAbstain] = {}
      matrix[actionAbstain][columnAccept] = tokenValueChange
      matrix[actionAbstain][columnReject] = 0
    }

    let selectedColumns = {}
    selectedColumns[actionAccept] = columnIfIAccept
    selectedColumns[actionReject] = columnIfIReject
    selectedColumns[actionAbstain] = columnIfIAbstain

    return { matrix, selectedColumns }
  }

  getIsChallenged() {
    const challenger = this.getPlayer(this.challenger)
    return challenger.action === actionChallenge
  }

  tokensFor(player) {
    const all = player.tokens
    const hasLocked = (player.id === this.candidate) || (player.id === this.challenger) || this.registry.includes(player.id)
    const available = hasLocked ? all - this.minDeposit : all
    return available >= 0 ? available : 0
  }

  getTokenAppreciation() {
    const currentQuality = 100 // just stubbing this in for now
    const candidate = this.getPlayer(this.candidate)
    const addedQuality = this.getQuality(candidate) || 0
    return (currentQuality + addedQuality) / currentQuality
  }

  getEligibleVoters() {
    return this.players.filter(({ id }) => {
      return (id !== this.candidate) && (id !== this.challenger)
    })
  }

  getPlayer(playerId) {
    return this.players.filter(({ id }) => id === playerId)[0]
  }

  getPlayerMatrix(player) {
    let payoff
    if (player.id === this.candidate) {
      payoff = this.getCandidateMatrix()
    } else if (player.id === this.challenger) {
      payoff = this.getChallengerMatrix()
    } else {
      payoff = this.getVoterMatrix(player)
    }
    return payoff
  }

  getValidActions(player) {
    const selectedAction = player.action
    const tokens = this.getTokens(player)
    const minDeposit = this.getMinDeposit()
    const canDeposit = tokens >= minDeposit
    let validActions
    if (player.id === this.candidate) {
      validActions = canDeposit ? [actionApply, actionNotApply] : [actionNotApply]
    } else if (player.id === this.challenger) {
      validActions = canDeposit ? [actionChallenge, actionNotChallenge] : [actionNotChallenge]
    } else {
      validActions = [actionAbstain, actionAccept, actionReject]
    }
    return validActions
  }

  getPlayerAction(player, action) {
    const actionToUse = action || player.action
    const validActions = this.getValidActions(player)
    return validActions.includes(actionToUse) ? actionToUse : validActions[0]
  }

  getPayoff({ matrix, selectedColumns }, player, selectedAction) {
    const validAction = this.getPlayerAction(player, selectedAction)
    const column = selectedColumns[validAction]
    return matrix[validAction][column]
  }

  getBestStrategy(player, payoffs) {
    const actions = Object.keys(payoffs.matrix)
    const firstAction = actions[0]
    return actions.slice(1).reduce((bestAction, action) => {
      const value = this.getPayoff(payoffs, player, action)
      const bestValue = this.getPayoff(payoffs, player, bestAction)
      return value > bestValue ? action : bestAction
    }, firstAction)
  }

  isBestStrategy(player, action, payoffs) {
    const bestStrategy = this.getBestStrategy(player, payoffs)
    return this.getPayoff(payoffs, player, bestStrategy) === this.getPayoff(payoffs, player, action)
  }

  isEquilibrium() {
    return this.players.reduce((acc, player) => {
      const payoffs = this.getPlayerMatrix(player)
      const selectedAction = this.getPlayerAction(player)
      return acc && this.isBestStrategy(player, selectedAction, payoffs)
    }, true)
  }

  getGameData() {
    const voters = this.getEligibleVoters()

    const candidate = this.getPlayer(this.candidate)
    const candidatePayoffs = this.getCandidateMatrix(candidate)

    const challenger = this.getPlayer(this.challenger)
    const challengerPayoffs = this.getChallengerMatrix(challenger)

    return {
      candidate: {
        player: candidate,
        payoffs: candidatePayoffs,
        bestStrategy: this.getBestStrategy(candidate, candidatePayoffs)
      },
      challenger: {
        player: challenger,
        payoffs: challengerPayoffs,
        bestStrategy: this.getBestStrategy(challenger, challengerPayoffs)
      },
      voters: voters.map((voter) => {
        const payoffs = this.getVoterMatrix(voter)
        const bestStrategy = this.getBestStrategy(voter, payoffs)
        return {
          player: voter,
          payoffs,
          bestStrategy
        }
      }),
      verdict: getVerdict(voters, this.voteQuorum),
      isEquilibrium: this.isEquilibrium()
    }
  }

  getMinDeposit() {
    return Number(this.minDeposit)
  }

  getDispensationPct() {
    return Number(this.dispensationPct)
  }

  getMinorityBlocSlash() {
    return Number(this.minorityBlocSlash)
  }

  getVoteQuorum() {
    return Number(this.voteQuorum)
  }

  getApplicationEffort() {
    return Number(this.applicationEffort)
  }

  getChallengeEffort() {
    return Number(this.challengeEffort)
  }

  getVoteEffort() {
    return Number(this.voteEffort)
  }

  getRegistryValue(player) {
    return Number(player.registryValue)
  }

  getQuality(player) {
    return Number(player.quality)
  }

  getTokens(player) {
    return Number(player.tokens)
  }
}

function getAcceptBlocTokens(voters) {
  return voters.filter(({ action }) => {
    return action === actionAccept
  }).map(({ tokens }) => tokens).reduce((total, current) => {
    return total + current
  }, 0)
}

function getRejectBlocTokens(voters) {
  return voters.filter(({ action }) => {
    return action === actionReject
  }).map(({ tokens }) => tokens).reduce((total, current) => {
    return total + current
  }, 0)
}

function getVerdict(voters, voteQuorum) {
  const acceptBlocTokens = getAcceptBlocTokens(voters)
  const rejectBlocTokens = getRejectBlocTokens(voters)
  if (acceptBlocTokens === 0 && rejectBlocTokens === 0) {
    return true
  }
  return acceptBlocTokens / (acceptBlocTokens + rejectBlocTokens) >= voteQuorum
}

module.exports = {
  actionApply,
  actionNotApply,
  actionChallenge,
  actionNotChallenge,
  actionAccept,
  actionReject,
  actionAbstain,
  columnAccept,
  columnReject,
  columnNotChallenge,
  columnWin,
  columnLose,
  Player,
  TCR
}
