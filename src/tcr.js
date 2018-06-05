let playerCounter = 0

const actionApply = 'apply'
const actionNotApply = 'not_apply'

const actionChallenge = 'challenge'
const actionNotChallenge = 'not_challenge'

const actionAccept = 'accept'
const actionReject = 'reject'
const actionAbstain = 'abstain'

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

  getCandidatePayoff() {
    const columnAccept = 'accept'
    const columnReject = 'reject'
    const columnNotChallenge = 'not_challenge'

    const candidate = this.getPlayer(this.candidate)
    const validActions = this.getValidActions(candidate)
    const isChallenged = this.getIsChallenged()
    const challengeResult = getVerdict(this.getEligibleVoters(), this.voteQuorum) ? columnAccept : columnReject
    const columnSelected = !isChallenged ? columnNotChallenge : challengeResult

    let matrix = {}, payoffs = []

    if (validActions.includes(actionApply)) {
      matrix[actionApply] = {}
      matrix[actionApply][columnAccept] = candidate.registryValue + this.minDeposit * this.dispensationPct  - this.challengeEffort
      matrix[actionApply][columnReject] = -1 * this.minDeposit  - this.challengeEffort
      matrix[actionApply][columnNotChallenge] = candidate.registryValue - this.challengeEffort
      payoffs.push(new Payoff({ action: actionApply, value: matrix[actionApply][columnSelected] }))
    }

    if (validActions.includes(actionNotApply)) {
      matrix[actionNotApply] = {}
      matrix[actionNotApply][columnAccept] = 0
      matrix[actionNotApply][columnReject] = 0
      matrix[actionNotApply][columnNotChallenge] = 0
      payoffs.push(new Payoff({ action: actionNotApply, value: matrix[actionNotApply][columnSelected] }))
    }

    return payoffs
  }

  getChallengerPayoff() {
    const columnWin = 'win'
    const columnLose = 'lose'

    const candidate = this.getPlayer(this.candidate)
    const challenger = this.getPlayer(this.challenger)
    const validActions = this.getValidActions(challenger)

    const columnSelected = getVerdict(this.getEligibleVoters(), this.voteQuorum) ? columnLose : columnWin
    const tokenValueChange = this.getTokenAppreciation() * challenger.tokens

    let matrix = {}, payoffs = []

    if (validActions.includes(actionChallenge)) {
      matrix[actionChallenge] = {}
      matrix[actionChallenge][columnWin] = this.minDeposit * this.dispensationPct - this.challengeEffort
      matrix[actionChallenge][columnLose] = tokenValueChange - this.minDeposit - this.challengeEffort
      payoffs.push(new Payoff({ action: actionChallenge, value: matrix[actionChallenge][columnSelected] }))
    }

    if (validActions.includes(actionNotChallenge)) {
      matrix[actionNotChallenge] = {}
      matrix[actionNotChallenge][columnWin] = tokenValueChange
      matrix[actionNotChallenge][columnLose] = tokenValueChange
      payoffs.push(new Payoff({ action: actionNotChallenge, value: matrix[actionNotChallenge][columnSelected] }))
    }

    return payoffs
  }

  getVoterPayoff({ id }) {
    const columnAccept = 'accept'
    const columnReject = 'reject'

    const voter = this.getPlayer(id)
    const validActions = this.getValidActions(voter)

    const otherVoters = this.getEligibleVoters().filter((player) => {
      return player.id !== voter.id
    })

    // hypothetical voting choices
    const withMeAccepting = otherVoters.concat(new Player({ tokens: voter.tokens, action: actionAccept }))
    const withMeRejecting = otherVoters.concat(new Player({ tokens: voter.tokens, action: actionReject }))

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

    const tokenValueChange = this.getTokenAppreciation() * voter.tokens

    let matrix = {}, payoffs = []

    if (validActions.includes(actionAccept)) {
      matrix[actionAccept] = {}
      matrix[actionAccept][columnAccept] = tokenValueChange + (1 - this.dispensationPct) * this.minDeposit + rejectBlocTokens * this.minorityBlocSlash * percentOfAcceptBloc - this.voteEffort
      matrix[actionAccept][columnReject] = -1 * voter.tokens * this.minorityBlocSlash - this.voteEffort
      payoffs.push(new Payoff({ action: actionAccept, value: matrix[actionAccept][columnIfIAccept] }))
    }

    if (validActions.includes(actionReject)) {
      matrix[actionReject] = {}
      matrix[actionReject][columnAccept] = tokenValueChange - (voter.tokens * this.minorityBlocSlash) - this.voteEffort
      matrix[actionReject][columnReject] = (1 - this.dispensationPct) * this.minDeposit + acceptBlocTokens * this.minorityBlocSlash * percentOfRejectBloc - this.voteEffort
      payoffs.push(new Payoff({ action: actionReject, value: matrix[actionReject][columnIfIReject] }))
    }

    if (validActions.includes(actionAbstain)) {
      matrix[actionAbstain] = {}
      matrix[actionAbstain][columnAccept] = tokenValueChange
      matrix[actionAbstain][columnReject] = 0
      payoffs.push(new Payoff({ action: actionAbstain, value: matrix[actionAbstain][columnIfIAbstain] }))
    }

    return payoffs
  }

  getIsChallenged() {
    return typeof this.challenger === 'number'
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
    const addedQuality = candidate.quality || 0
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

  getPlayerPayoff(player) {
    let payoff
    if (player.id === this.candidate) {
      payoff = this.getCandidatePayoff()
    } else if (player.id === this.challenger) {
      payoff = this.getChallengerPayoff()
    } else {
      payoff = this.getVoterPayoff(player)
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

  isBestStrategy(player) {
    const payoffs = this.getPlayerPayoff(player)
    const selectedAction = this.getPlayerAction(player)
    const maxPayoff = payoffs.reduce((max, { value }) => {
      return value > max ? value : max
    }, payoffs[0].value)
    const payoffForSelected = payoffs.filter(({ action }) => {
      return action === selectedAction
    })[0].value
    return payoffForSelected === maxPayoff
  }

  isEquilibrium() {
    return this.players.reduce((acc, player) => {
      return acc && this.isBestStrategy(player)
    }, true)
  }

  getGameData() {
    const candidate = this.players[this.candidate]
    const challenger = this.players[this.challenger]
    const voters = this.getEligibleVoters()
    return {
      candidate: {
        player: candidate,
        payoffs: this.getCandidatePayoff(candidate),
        isBestStrategy: this.isBestStrategy(candidate)
      },
      challenger: {
        player: challenger,
        payoffs: this.getChallengerPayoff(challenger),
        isBestStrategy: this.isBestStrategy(challenger)
      },
      voters: voters.map((voter) => {
        return {
          player: voter,
          payoffs: this.getPlayerPayoff(voter),
          isBestStrategy: this.isBestStrategy(voter)
        }
      }),
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
  Player,
  TCR
}
