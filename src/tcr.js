class Player {
  constructor({ tokens = 0, registryValue = 0, quality = 0, isListed = false } = {}) {
    this.tokens = tokens
    this.registryValue = registryValue
    this.quality = quality
    this.isListed = isListed
  }
}

class Action {
  constructor({ action, payoff } = {}) {
    this.action = action
    this.payoff = payoff
  }
}

class TCR {
  constructor({
    players = [],
    minDeposit,
    dispensationPct,
    minorityBlocSlash,
    voteQuorum
  } = {}) {
    this.players = players
    this.registry = []
    this.minDeposit = minDeposit
    this.dispensationPct = dispensationPct
    this.minorityBlocSlash = minorityBlocSlash
    this.voteQuorum = voteQuorum
  }

  candidates() {
    return this.players.filter(({ registryValue }) => {
      return registryValue > 0
    })
  }
}

function candidatePayoff(candidate, tcr, columnSelected) {
  const actionList = 'list'
  const actionNotList = 'not_list'

  const columnAccept = 'accept'
  const columnReject = 'reject'
  const columnNotChallenge = 'not_challenge'

  let matrix = {}
  matrix[actionList] = {}
  matrix[actionNotList] = {}

  matrix[actionList][columnAccept] = tcr.minDeposit * tcr.dispensationPct
  matrix[actionList][columnReject] = -1 * tcr.minDeposit
  matrix[actionList][columnNotChallenge] = 0

  matrix[actionNotList][columnAccept] = 0
  matrix[actionNotList][columnReject] = 0
  matrix[actionNotList][columnNotChallenge] = 0

  return [
    new Action({ action: actionList, payoff: matrix[actionList][columnSelected] }),
    new Action({ action: actionNotList, payoff: matrix[actionNotList][columnSelected] })
  ]
}

function challengerPayoff(candidate, tcr, columnSelected) {
  const actionChallenge = 'challenge'
  const actionNotChallenge = 'not_challenge'

  const columnWin = 'win'
  const columnLose = 'lose'

  let matrix = {}
  matrix[actionChallenge] = {}
  matrix[actionNotChallenge] = {}

  matrix[actionChallenge][columnWin] = tcr.minDeposit * tcr.dispensationPct
  matrix[actionChallenge][columnLose] = -1 * tcr.minDeposit

  matrix[actionNotChallenge][columnWin] = 0
  matrix[actionNotChallenge][columnLose] = 0

  return [
    new Action({ action: actionChallenge, payoff: matrix[actionChallenge][columnSelected] }),
    new Action({ action: actionNotChallenge, payoff: matrix[actionNotChallenge][columnSelected] })
  ]
}

module.exports = {
  Player,
  TCR,
  candidatePayoff,
  challengerPayoff
}
