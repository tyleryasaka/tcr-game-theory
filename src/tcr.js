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

    let matrix = {}

    if (validActions.includes(actionApply)) {
      matrix[actionApply] = {}
      matrix[actionApply][columnAccept] = candidate.registryValue + this.minDeposit * this.dispensationPct  - this.applicationEffort
      matrix[actionApply][columnReject] = -1 * this.minDeposit  - this.applicationEffort
      matrix[actionApply][columnNotChallenge] = candidate.registryValue - this.applicationEffort
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

    const columnSelected = getVerdict(this.getEligibleVoters(), this.voteQuorum) ? columnLose : columnWin
    const tokenValueChange = challenger.tokens * (this.getTokenAppreciation() - 1)

    let matrix = {}

    if (validActions.includes(actionChallenge)) {
      matrix[actionChallenge] = {}
      matrix[actionChallenge][columnWin] = this.minDeposit * this.dispensationPct - this.challengeEffort
      matrix[actionChallenge][columnLose] = tokenValueChange - this.minDeposit - this.challengeEffort
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

    const otherVoters = this.getEligibleVoters().filter((player) => {
      return player.id !== voter.id
    })

    // hypothetical voting choices
    const withMeAccepting = otherVoters.concat(new Player({ tokens: voter.tokens, action: actionAccept, registryValue: 1000 }))
    const withMeRejecting = otherVoters.concat(new Player({ tokens: voter.tokens, action: actionReject, registryValue: 1001 }))

    // tokens excluding voter
    const acceptBlocTokens = getAcceptBlocTokens(otherVoters)
    const rejectBlocTokens = getRejectBlocTokens(otherVoters)

    // the outcome of the vote depends on my action (possibly)
    // therefore the column selected now depends on my action
    const columnIfIAccept = getVerdict(withMeAccepting, this.voteQuorum) ? columnAccept : columnReject
    const columnIfIReject = getVerdict(withMeRejecting, this.voteQuorum) ? columnAccept : columnReject
    const columnIfIAbstain = getVerdict(otherVoters, this.voteQuorum) ? columnAccept : columnReject

    // percentage including voter
    const percentOfAcceptBloc = voter.tokens / (acceptBlocTokens + voter.tokens)
    const percentOfRejectBloc = voter.tokens / (rejectBlocTokens + voter.tokens)

    const tokenValueChange = voter.tokens * (this.getTokenAppreciation() - 1)

    let matrix = {}

    if (validActions.includes(actionAccept)) {
      matrix[actionAccept] = {}
      matrix[actionAccept][columnAccept] = tokenValueChange + (1 - this.dispensationPct) * this.minDeposit + rejectBlocTokens * this.minorityBlocSlash * percentOfAcceptBloc - this.voteEffort
      matrix[actionAccept][columnReject] = -1 * voter.tokens * this.minorityBlocSlash - this.voteEffort
    }

    if (validActions.includes(actionReject)) {
      matrix[actionReject] = {}
      matrix[actionReject][columnAccept] = tokenValueChange - (voter.tokens * this.minorityBlocSlash) - this.voteEffort
      matrix[actionReject][columnReject] = (1 - this.dispensationPct) * this.minDeposit + acceptBlocTokens * this.minorityBlocSlash * percentOfRejectBloc - this.voteEffort
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
    const addedQuality = Number(candidate.quality) || 0
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
    const canDeposit = player.tokens >= this.minDeposit
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

  getPlayerAction(player) {
    const validActions = this.getValidActions(player)
    return validActions.includes(player.action) ? player.action : validActions[0]
  }

  getPayoff({ matrix, selectedColumns }, selectedAction) {
    const column = selectedColumns[selectedAction]
    return matrix[selectedAction][column]
  }

  getBestStrategy(player, payoffs) {
    const actions = Object.keys(payoffs.matrix)
    const firstAction = actions[0]
    return actions.slice(1).reduce((bestAction, action) => {
      const value = this.getPayoff(payoffs, action)
      const bestValue = this.getPayoff(payoffs, bestAction)
      return value > bestValue ? action : bestAction
    }, firstAction)
  }

  isBestStrategy(action, payoffs) {
    const bestStrategy = this.getBestStrategy(action, payoffs)
    return this.getPayoff(payoffs, bestStrategy) === this.getPayoff(payoffs, action)
  }

  isEquilibrium() {
    return this.players.reduce((acc, player) => {
      const payoffs = this.getPlayerMatrix(player)
      const selectedAction = this.getPlayerAction(player)
      return acc && this.isBestStrategy(selectedAction, payoffs)
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
