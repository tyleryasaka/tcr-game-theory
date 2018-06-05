import React, { Component } from 'react';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
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
  actionList,
  actionNotList,
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
      challengeEffort: 0,
      voteEffort: 0,
      players: [
        new Player({ tokens: 6, action: actionChallenge }),
        new Player({ tokens: 5, action: actionNotList, registryValue: 100, quality: 0.1 }),
        new Player({ tokens: 10, action: actionReject }),
        new Player({ tokens: 10, action: actionReject }),
        new Player({ tokens: 10, action: actionReject }),
        new Player({ tokens: 10, action: actionReject }),
      ]
    })
    tcr.challenger = tcr.players[0].id;
    tcr.candidate = tcr.players[1].id;
    this.state = { tcr };
  }

  setGameProperty(property, value) {
    return (e) => {
      this.state.tcr[property] = e.target.value;
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
    console.log('tcr', tcr, candidate)

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
                label="Challenge Effort"
                value={tcr.challengeEffort}
                onChange={this.setGameProperty("challengeEffort")}
                type="number"
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
                  <Select
                    value={candidate.player.action}
                    onChange={this.setAction(candidate.player)}
                  >
                    <MenuItem value={actionList}>Apply</MenuItem>
                    <MenuItem value={actionNotList}>Don't Apply</MenuItem>
                  </Select>
                </Paper>
              </Grid>
              <Grid item sm={12} md={6}>
                <Paper className={classes.paper}>
                  <h2>Challenger</h2>
                  <Select
                    value={challenger.player.action}
                    onChange={this.setAction(challenger.player)}
                  >
                    <MenuItem value={actionChallenge}>Challenge</MenuItem>
                    <MenuItem value={actionNotChallenge}>Don't Challenge</MenuItem>
                  </Select>
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
                        <Select
                          value={voter.player.action}
                          onChange={this.setAction(voter.player)}
                        >
                          <MenuItem value={actionAbstain}>Abstain</MenuItem>
                          <MenuItem value={actionAccept}>Accept</MenuItem>
                          <MenuItem value={actionReject}>Reject</MenuItem>
                        </Select>
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
