import React, { Component } from 'react';
import Badge from '@material-ui/core/Badge';
import Icon from '@material-ui/core/Icon';
import Radio from '@material-ui/core/Radio';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import {
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
} from './tcr'

const styles = theme => ({
  selectedActionRow: {
    background: '#F5F5F5',
    '&:hover': {
      cursor: 'pointer',
      background: '#EEEEEE',
    },
  },
  notSelectedActionRow: {
    background: '#FFFFFF',
    '&:hover': {
      cursor: 'pointer',
      background: '#FAFAFA',
    },
  },
  bestStrategy: {
    'font-weight': 'bold',
    color: '#4CAF50',
  },
  notBestStrategy: {
  },
  isSelectedColumn: {
    opacity: 1,
  },
  isNotSelectedColumn: {
    opacity: 0.2,
  },
  badge: {
    paddingRight: theme.spacing.unit * 2,
  },
});

class DecisionMatrix extends Component {
  isSelectedColumn(action, column) {
    const { player: { payoffs: { selectedColumns }, player } } = this.props
    return selectedColumns[action] === column
  }

  round(number) {
    return Math.round(100 * number) / 100
  }

  handleRowClick(action) {
    const { setAction, player } = this.props
    return () => {
      this.props.setAction(player.player, action)
    }
  }

  getActionName(action) {
    let mapping = {}
    mapping[actionApply] = 'Apply'
    mapping[actionNotApply] = 'Don\'t Apply'
    mapping[actionChallenge] = 'Challenge'
    mapping[actionNotChallenge] = 'Don\'t Challenge'
    mapping[actionAccept] = 'Accept'
    mapping[actionReject] = 'Reject'
    mapping[actionAbstain] = 'Abstain'
    return mapping[action]
  }

  getColumnName(column) {
    let mapping = {}
    mapping[columnAccept] = 'Accepted'
    mapping[columnReject] = 'Rejected'
    mapping[columnNotChallenge] = 'Not Challenged'
    mapping[columnWin] = 'Won'
    mapping[columnLose] = 'Lost'
    return mapping[column]
  }

  render() {
    const { player, classes, tcr } = this.props
    const { bestStrategy, payoffs, player: { action } } = player
    const { matrix } = payoffs
    const actions = Object.keys(matrix)
    const firstAction = actions[0]
    const columns = Object.keys(matrix[firstAction])
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            {columns.map((column) => {
              return (
                <TableCell numeric key={column} component="th" scope="row">
                  <span
                    className={
                      this.isSelectedColumn(action, column)
                        ? classes.isSelectedColumn
                        : classes.isNotSelectedColumn
                    }
                  >
                    {this.getColumnName(column)}
                  </span>
                </TableCell>
              )
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {actions.map((row) => {
            return (
              <TableRow
                key={row}
                className={row === action ? classes.selectedActionRow : classes.notSelectedActionRow}
                onClick={this.handleRowClick(row)}
              >
                <TableCell component="th" scope="row">
                  <Radio
                    color="primary"
                    checked={row === action}
                  />
                  <span className={tcr.isBestStrategy(row, payoffs) ? classes.bestStrategy : classes.notBestStrategy}>
                    {
                      tcr.isBestStrategy(row, payoffs)
                        ? (<Icon style={{ fontSize: 16 }}>star</Icon>)
                        : ''
                    }
                    {this.getActionName(row)}
                  </span>
                </TableCell>
                {columns.map((column) => {
                  return (
                    <TableCell numeric key={column} scope="row">
                      <span
                        className={
                          (this.isSelectedColumn(row, column)
                            ? classes.isSelectedColumn
                            : classes.isNotSelectedColumn)
                          + ' '
                          + (tcr.isBestStrategy(row, payoffs)
                            ? classes.bestStrategy
                            : classes.notBestStrategy)
                        }
                      >
                        {this.round(matrix[row][column])}
                      </span>
                    </TableCell>
                  )
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    )
  }
}

export default withStyles(styles)(DecisionMatrix);
