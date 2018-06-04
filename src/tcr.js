const actionList = 'list'
const actionNotList = 'not_list'

const actionChallenge = 'challenge'
const actionNotChallenge = 'not_challenge'

const actionAccept = 'accept'
const actionReject = 'reject'

const voteAccept = 'accept'
const voteReject = 'reject'

class Payoff {
  constructor({ action, value } = {}) {
    this.action = action
    this.value = value
  }
}

class Player {
  constructor({ tokens = 0, registryValue = 0, quality = 0, isListed = false, vote } = {}) {
    this.tokens = tokens
    this.registryValue = registryValue
    this.quality = quality
    this.isListed = isListed
    this.vote = vote
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

    const candidate = this.getPlayers()[this.candidate]
    const isChallenged = this.getIsChallenged()
    const challengeResult = getVerdict(this.getPlayers(), this.voteQuorum) ? columnAccept : columnReject
    const columnSelected = !isChallenged ? columnNotChallenge : challengeResult

    let matrix = {}
    matrix[actionList] = {}
    matrix[actionNotList] = {}

    matrix[actionList][columnAccept] = this.minDeposit * this.dispensationPct
    matrix[actionList][columnReject] = -1 * this.minDeposit
    matrix[actionList][columnNotChallenge] = 0

    matrix[actionNotList][columnAccept] = 0
    matrix[actionNotList][columnReject] = 0
    matrix[actionNotList][columnNotChallenge] = 0

    return [
      new Payoff({ action: actionList, value: matrix[actionList][columnSelected] }),
      new Payoff({ action: actionNotList, value: matrix[actionNotList][columnSelected] })
    ]
  }

  getChallengerPayoff() {
    const columnWin = 'win'
    const columnLose = 'lose'

    const candidate = this.getPlayers()[this.candidate]

    const columnSelected = getVerdict(this.getPlayers(), this.voteQuorum) ? columnLose : columnWin

    let matrix = {}
    matrix[actionChallenge] = {}
    matrix[actionNotChallenge] = {}

    matrix[actionChallenge][columnWin] = this.minDeposit * this.dispensationPct
    matrix[actionChallenge][columnLose] = -1 * this.minDeposit

    matrix[actionNotChallenge][columnWin] = 0
    matrix[actionNotChallenge][columnLose] = 0

    return [
      new Payoff({ action: actionChallenge, value: matrix[actionChallenge][columnSelected] }),
      new Payoff({ action: actionNotChallenge, value: matrix[actionNotChallenge][columnSelected] })
    ]
  }

  getVoterPayoff(voterIndex) {
    const columnAccept = 'accept'
    const columnReject = 'reject'

    const voter = this.getPlayers()[voterIndex]
    const otherVoters = this.getPlayers().filter((player, index) => index !== voterIndex)

    // hypothetical voting choices
    const withMeAccepting = otherVoters.concat(new Player({ tokens: voter.tokens, vote: voteAccept }))
    const withMeRejecting = otherVoters.concat(new Player({ tokens: voter.tokens, vote: voteReject }))

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

    let matrix = {}
    matrix[actionAccept] = {}
    matrix[actionReject] = {}

    matrix[actionAccept][columnAccept] = (1 - this.dispensationPct) * this.minDeposit + rejectBlocTokens * this.minorityBlocSlash * percentOfAcceptBloc
    matrix[actionAccept][columnReject] = -1 * voter.tokens * this.minorityBlocSlash

    matrix[actionReject][columnAccept] = -1 * voter.tokens * this.minorityBlocSlash
    matrix[actionReject][columnReject] = (1 - this.dispensationPct) * this.minDeposit + acceptBlocTokens * this.minorityBlocSlash * percentOfRejectBloc

    return [
      new Payoff({ action: actionAccept, value: matrix[actionAccept][columnIfIAccept] }),
      new Payoff({ action: actionReject, value: matrix[actionReject][columnIfIReject] })
    ]
  }

  getIsChallenged() {
    return typeof this.challenger === 'number'
  }

  tokensFor(index) {
    const all = this.players[index].tokens
    const hasLocked = (index === this.candidate) || (index === this.challenger) || this.registry.includes(index)
    const available = hasLocked ? all - this.minDeposit : all
    return available >= 0 ? available : 0
  }

  getPlayers() {
    return this.players.map((player, index) => {
      let copy = new Player(player)
      copy.tokens = this.tokensFor(index)
      return copy
    })
  }
}

function getAcceptBlocTokens(voters) {
  let tokens = voters.filter(({ vote }) => {
    return vote === voteAccept
  }).map(({ tokens }) => tokens)
  return tokens.reduce((total, current) => {
    return total + current
  }, 0)
}

function getRejectBlocTokens(voters) {
  return voters.filter(({ vote }) => {
    return vote === voteReject
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
  voteAccept,
  voteReject,
  Player,
  TCR
}
