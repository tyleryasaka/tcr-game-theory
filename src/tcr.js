let playerCounter = 0

const actionList = 'list'
const actionNotList = 'not_list'

const actionChallenge = 'challenge'
const actionNotChallenge = 'not_challenge'

const actionAccept = 'accept'
const actionReject = 'reject'

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
    voteQuorum
  } = {}) {
    this.players = players
    this.candidate = candidate
    this.challenger = challenger
    this.registry = []
    this.minDeposit = minDeposit
    this.dispensationPct = dispensationPct
    this.minorityBlocSlash = minorityBlocSlash
    this.voteQuorum = voteQuorum
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

    if (validActions.includes(actionList)) {
      matrix[actionList] = {}
      matrix[actionList][columnAccept] = this.minDeposit * this.dispensationPct
      matrix[actionList][columnReject] = -1 * this.minDeposit
      matrix[actionList][columnNotChallenge] = 0
      payoffs.push(new Payoff({ action: actionList, value: matrix[actionList][columnSelected] }))
    }

    if (validActions.includes(actionNotList)) {
      matrix[actionNotList] = {}
      matrix[actionNotList][columnAccept] = 0
      matrix[actionNotList][columnReject] = 0
      matrix[actionNotList][columnNotChallenge] = 0
      payoffs.push(new Payoff({ action: actionNotList, value: matrix[actionNotList][columnSelected] }))
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

    let matrix = {}, payoffs = []

    if (validActions.includes(actionChallenge)) {
      matrix[actionChallenge] = {}
      matrix[actionChallenge][columnWin] = this.minDeposit * this.dispensationPct
      matrix[actionChallenge][columnLose] = -1 * this.minDeposit
      payoffs.push(new Payoff({ action: actionChallenge, value: matrix[actionChallenge][columnSelected] }))
    }

    if (validActions.includes(actionNotChallenge)) {
      matrix[actionNotChallenge] = {}
      matrix[actionNotChallenge][columnWin] = 0
      matrix[actionNotChallenge][columnLose] = 0
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

    // percentage including voter
    const percentOfAcceptBloc = voter.tokens / (acceptBlocTokens + voter.tokens)
    const percentOfRejectBloc = voter.tokens / (rejectBlocTokens + voter.tokens)

    let matrix = {}, payoffs = []

    if (validActions.includes(actionAccept)) {
      matrix[actionAccept] = {}
      matrix[actionAccept][columnAccept] = (1 - this.dispensationPct) * this.minDeposit + rejectBlocTokens * this.minorityBlocSlash * percentOfAcceptBloc
      matrix[actionAccept][columnReject] = -1 * voter.tokens * this.minorityBlocSlash
      payoffs.push(new Payoff({ action: actionAccept, value: matrix[actionAccept][columnIfIAccept] }))
    }

    if (validActions.includes(actionReject)) {
      matrix[actionReject] = {}
      matrix[actionReject][columnAccept] = -1 * voter.tokens * this.minorityBlocSlash
      matrix[actionReject][columnReject] = (1 - this.dispensationPct) * this.minDeposit + acceptBlocTokens * this.minorityBlocSlash * percentOfRejectBloc
      payoffs.push(new Payoff({ action: actionReject, value: matrix[actionReject][columnIfIReject] }))
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
      validActions = canDeposit ? [actionList, actionNotList] : [actionNotList]
    } else if (player.id === this.challenger) {
      validActions = canDeposit ? [actionChallenge, actionNotChallenge] : [actionNotChallenge]
    } else {
      validActions = [actionAccept, actionReject]
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
    return {
      players: this.players.map((player) => {
        return {
          player,
          payoffs: this.getPlayerPayoff(player),
          isBestStrategy: this.isBestStrategy(player)
        }
      }),
      isEquilibrium: this.isEquilibrium()
    }
  }
}

function getAcceptBlocTokens(voters) {
  return voters.filter(({ action }) => {
    return action === actionAccept
  }).map(({ tokens }) => tokens)
  return tokens.reduce((total, current) => {
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
  actionList,
  actionNotList,
  actionChallenge,
  actionNotChallenge,
  actionAccept,
  actionReject,
  Player,
  TCR
}
