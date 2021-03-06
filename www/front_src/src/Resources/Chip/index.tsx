import * as React from 'react';

import { makeStyles, Theme } from '@material-ui/core';
import { CreateCSSProperties } from '@material-ui/core/styles/withStyles';

const useStyles = makeStyles<Theme, { color?: string }>((theme) => ({
  chip: ({ color }): CreateCSSProperties => ({
    width: theme.spacing(2.5),
    height: theme.spacing(2.5),
    ...(color && {
      color,
    }),
  }),
}));

interface Props {
  icon: JSX.Element;
  color?: string;
}

const Chip = ({ icon, color }: Props): JSX.Element => {
  const classes = useStyles({ color });

  return <div className={`${classes.chip}`}>{icon}</div>;
};

export default Chip;
