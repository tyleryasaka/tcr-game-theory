import React, { Component } from 'react';
import Badge from '@material-ui/core/Badge';
import Icon from '@material-ui/core/Icon';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  bestStrategy: {
    background: '#E8F5E9',
  },
  badge: {
    paddingRight: theme.spacing.unit * 2,
  },
});

class DecisionMatrix extends Component {
  isSelectedColumn(action, column) {
    const { player: { payoffs: { selectedColumns } } } = this.props
    return selectedColumns[action] === column
  }

  round(number) {
    return Math.round(100 * number) / 100
  }

  render() {
    const { player, classes } = this.props
    const { bestStrategy, payoffs: { matrix } } = player
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
                  {column}
                </TableCell>
              )
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {actions.map((action) => {
            return (
              <TableRow
                key={action}
                className={action === bestStrategy ? classes.bestStrategy : ""}
              >
                <TableCell component="th" scope="row">
                  {action}
                </TableCell>
                {columns.map((column) => {
                  return (
                    <TableCell numeric key={column} scope="row">
                      {(<Badge
                          color="primary"
                          className={classes.badge}
                          badgeContent={(
                            <Icon>{
                              this.isSelectedColumn(action, column)
                                ? "radio_button_unchecked"
                                : "lens"
                            }</Icon>
                          )}
                        >
                        <Typography>{this.round(matrix[action][column])}</Typography>
                      </Badge>)}
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
