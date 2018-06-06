import React, { Component } from 'react';
import DecisionMatrix from './DecisionMatrix.js';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
import Icon from '@material-ui/core/Icon';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import logo from './logo.svg';
import './App.css';
import {
  actionApply,
  actionNotApply,
  actionChallenge,
  actionNotChallenge,
  actionAccept,
  actionReject,
  actionAbstain,
  Player,
  TCR
} from './tcr'

const styles = theme => ({
  app: {
    padding: theme.spacing.unit * 2,
  },
  success: {
    color: "#43A047",
  },
  error: {
    color: "#E53935",
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: '150px',
  },
});

class App extends Component {
  constructor() {
    super(...arguments);
    const tcr = new TCR({
      minDeposit: 5,
      dispensationPct: 0.5,
      minorityBlocSlash: 0.1,
      voteQuorum: 0.5,
      applicationEffort: 0,
      challengeEffort: 0,
      voteEffort: 0,
      players: [
        new Player({ tokens: 6, action: actionChallenge }),
        new Player({ tokens: 5, action: actionNotApply, registryValue: 100, quality: 1 }),
        new Player({ tokens: 10, action: actionAccept }),
        new Player({ tokens: 15, action: actionReject }),
        new Player({ tokens: 10, action: actionReject }),
        new Player({ tokens: 10, action: actionReject }),
      ]
    })
    tcr.challenger = tcr.players[0].id;
    tcr.candidate = tcr.players[1].id;
    this.state = { tcr };
  }

  setGameProperty(property) {
    return (e) => {
      this.state.tcr[property] = e.target.value;
      this.forceUpdate();
    }
  }

  setPlayerProperty(player, property) {
    return (e) => {
      player[property] = e.target.value;
      this.forceUpdate();
    }
  }

  setAction(player) {
    return (e) => {
      player.action = e.target.value;
      this.forceUpdate();
    }
  }

  render() {
    const { classes } = this.props;
    const { tcr } = this.state;
    const gameData = tcr.getGameData();
    const {
      candidate,
      challenger,
      voters
    } = gameData;

    return (
      <div className="App" className={classes.app}>
        <Grid container spacing={24}>
          <Grid item sm={12}>
            <Paper className={classes.paper}>
              <h2>TCR Parameters</h2>
              <TextField
                id="number"
                label="MIN_DEPOSIT"
                value={tcr.minDeposit}
                onChange={this.setGameProperty("minDeposit")}
                type="number"
                inputProps={{ min: "0" }}
                InputLabelProps={{
                  shrink: true,
                }}
                margin="normal"
                className={classes.textField}
              />
              <TextField
                id="number"
                label="DISPENSATION_PCT"
                value={tcr.dispensationPct}
                onChange={this.setGameProperty("dispensationPct")}
                type="number"
                inputProps={{ min: "0", max: "1", step: "0.1" }}
                InputLabelProps={{
                  shrink: true,
                }}
                margin="normal"
                className={classes.textField}
              />
              <TextField
                id="number"
                label="MINORITY_BLOC_SLASH"
                value={tcr.minorityBlocSlash}
                onChange={this.setGameProperty("minorityBlocSlash")}
                type="number"
                inputProps={{ min: "0", max: "1", step: "0.1" }}
                InputLabelProps={{
                  shrink: true,
                }}
                margin="normal"
                className={classes.textField}
              />
              <TextField
                id="number"
                label="VOTE_QUORUM"
                value={tcr.voteQuorum}
                onChange={this.setGameProperty("voteQuorum")}
                type="number"
                inputProps={{ min: "0", max: "1", step: "0.1" }}
                InputLabelProps={{
                  shrink: true,
                }}
                margin="normal"
                className={classes.textField}
              />
            </Paper>
          </Grid>
          <Grid item sm={12}>
            <Paper className={classes.paper}>
              <h2>External Parameters</h2>
              <TextField
                id="number"
                label="Application Effort"
                value={tcr.applicationEffort}
                onChange={this.setGameProperty("applicationEffort")}
                type="number"
                inputProps={{ min: "0" }}
                InputLabelProps={{
                  shrink: true,
                }}
                margin="normal"
                className={classes.textField}
              />
              <TextField
                id="number"
                label="Challenge Effort"
                value={tcr.challengeEffort}
                onChange={this.setGameProperty("challengeEffort")}
                type="number"
                inputProps={{ min: "0" }}
                InputLabelProps={{
                  shrink: true,
                }}
                margin="normal"
                className={classes.textField}
              />
              <TextField
                id="number"
                label="Vote Effort"
                value={tcr.voteEffort}
                onChange={this.setGameProperty("voteEffort")}
                type="number"
                inputProps={{ min: "0" }}
                InputLabelProps={{
                  shrink: true,
                }}
                margin="normal"
                className={classes.textField}
              />
            </Paper>
          </Grid>
          <Grid item sm={12}>
            <Grid container spacing={24}>
              <Grid item sm={12} md={6}>
                <Paper className={classes.paper}>
                  <h2>Candidate</h2>
                  <TextField
                    id="number"
                    label="Listing Valuation"
                    value={candidate.player.registryValue}
                    onChange={this.setPlayerProperty(candidate.player, "registryValue")}
                    type="number"
                    inputProps={{ min: "0" }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    margin="normal"
                    className={classes.textField}
                  />
                  <TextField
                    id="number"
                    label="Quality"
                    value={candidate.player.quality}
                    onChange={this.setPlayerProperty(candidate.player, "quality")}
                    type="number"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    margin="normal"
                    className={classes.textField}
                  />
                  <TextField
                    id="number"
                    label="Tokens"
                    value={candidate.player.tokens}
                    onChange={this.setPlayerProperty(candidate.player, "tokens")}
                    type="number"
                    inputProps={{ min: "0" }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    margin="normal"
                    className={classes.textField}
                  />
                  <Select
                    value={candidate.player.action}
                    onChange={this.setAction(candidate.player)}
                  >
                    <MenuItem value={actionApply}>Apply</MenuItem>
                    <MenuItem value={actionNotApply}>Don't Apply</MenuItem>
                  </Select>
                  {
                    candidate.player.action === candidate.bestStrategy
                      ? (<Icon className={classes.success}>check</Icon>)
                      : (<Icon className={classes.error}>close</Icon>)
                  }
                  <DecisionMatrix player={candidate}/>
                </Paper>
              </Grid>
              <Grid item sm={12} md={6}>
                <Paper className={classes.paper}>
                  <h2>Challenger</h2>
                  <TextField
                    id="number"
                    label="Tokens"
                    value={challenger.player.tokens}
                    onChange={this.setPlayerProperty(challenger.player, "tokens")}
                    type="number"
                    inputProps={{ min: "0" }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    margin="normal"
                    className={classes.textField}
                  />
                  <Select
                    value={challenger.player.action}
                    onChange={this.setAction(challenger.player)}
                  >
                    <MenuItem value={actionChallenge}>Challenge</MenuItem>
                    <MenuItem value={actionNotChallenge}>Don't Challenge</MenuItem>
                  </Select>
                  {
                    challenger.player.action === challenger.bestStrategy
                      ? (<Icon className={classes.success}>check</Icon>)
                      : (<Icon className={classes.error}>close</Icon>)
                  }
                  <DecisionMatrix player={challenger}/>
                </Paper>
              </Grid>
            </Grid>
            <Grid container spacing={24}>
              {
                voters.map((voter, index) => {
                  return (
                    <Grid item sm={12} md={6} key={index}>
                      <Paper className={classes.paper}>
                        <h2>Voter</h2>
                        <TextField
                          id="number"
                          label="Tokens"
                          value={voter.player.tokens}
                          onChange={this.setPlayerProperty(voter.player, "tokens")}
                          type="number"
                          inputProps={{ min: "0" }}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          margin="normal"
                          className={classes.textField}
                        />
                        <Select
                          value={voter.player.action}
                          onChange={this.setAction(voter.player)}
                        >
                          <MenuItem value={actionAbstain}>Abstain</MenuItem>
                          <MenuItem value={actionAccept}>Accept</MenuItem>
                          <MenuItem value={actionReject}>Reject</MenuItem>
                        </Select>
                        {
                          voter.player.action === voter.bestStrategy
                            ? (<Icon className={classes.success}>check</Icon>)
                            : (<Icon className={classes.error}>close</Icon>)
                        }
                        <DecisionMatrix player={voter}/>
                      </Paper>
                    </Grid>
                  )
                })
              }
            </Grid>
          </Grid>
          <Grid item sm={12}>
            <Paper className={classes.paper}>
              <h2>Outcome</h2>
              <List>
                <ListItem>
                  <div>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={gameData.isEquilibrium}
                          color="primary"
                        />
                      }
                      label="Equilibrium"
                    />
                  </div>
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default withStyles(styles)(App);
