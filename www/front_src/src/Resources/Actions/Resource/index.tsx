import * as React from 'react';

import { isEmpty } from 'ramda';
import { useTranslation } from 'react-i18next';

import { ButtonProps, Grid, Menu, MenuItem } from '@material-ui/core';
import IconAcknowledge from '@material-ui/icons/Person';
import IconCheck from '@material-ui/icons/Sync';
import IconMore from '@material-ui/icons/MoreHoriz';

import { useCancelTokenSource, Severity, useSnackbar } from '@centreon/ui';

import IconDowntime from '../../icons/Downtime';
import {
  labelAcknowledge,
  labelSetDowntime,
  labelCheck,
  labelSomethingWentWrong,
  labelCheckCommandSent,
  labelMoreActions,
  labelDisacknowledge,
} from '../../translatedLabels';
import AcknowledgeForm from './Acknowledge';
import DowntimeForm from './Downtime';
import { useResourceContext } from '../../Context';
import useAclQuery from './aclQuery';
import { checkResources } from '../api';
import ActionButton from '../ActionButton';
import DisacknowledgeForm from './Disacknowledge';

const ContainedActionButton = (props: ButtonProps): JSX.Element => (
  <ActionButton variant="contained" {...props} />
);

const ResourceActions = (): JSX.Element => {
  const { t } = useTranslation();
  const { cancel, token } = useCancelTokenSource();
  const { showMessage } = useSnackbar();
  const [
    moreActionsMenuAnchor,
    setMoreActionsMenuAnchor,
  ] = React.useState<Element | null>(null);

  const {
    resourcesToCheck,
    setSelectedResources,
    selectedResources,
    resourcesToAcknowledge,
    setResourcesToAcknowledge,
    resourcesToSetDowntime,
    setResourcesToSetDowntime,
    setResourcesToCheck,
    resourcesToDisacknowledge,
    setResourcesToDisacknowledge,
  } = useResourceContext();

  const showError = (message): void =>
    showMessage({ message, severity: Severity.error });
  const showSuccess = (message): void =>
    showMessage({ message, severity: Severity.success });

  const {
    canAcknowledge,
    canDowntime,
    canCheck,
    canDisacknowledge,
  } = useAclQuery();

  const hasResourcesToCheck = resourcesToCheck.length > 0;

  const confirmAction = (): void => {
    setSelectedResources([]);
    setResourcesToAcknowledge([]);
    setResourcesToSetDowntime([]);
    setResourcesToCheck([]);
    setResourcesToDisacknowledge([]);
  };

  React.useEffect(() => {
    if (!hasResourcesToCheck) {
      return;
    }

    checkResources({
      resources: resourcesToCheck,
      cancelToken: token,
    })
      .then(() => {
        confirmAction();
        showSuccess(t(labelCheckCommandSent));
      })
      .catch(() => showError(t(labelSomethingWentWrong)));
  }, [resourcesToCheck]);

  React.useEffect(() => (): void => cancel(), []);

  const prepareToAcknowledge = (): void => {
    setResourcesToAcknowledge(selectedResources);
  };

  const prepareToSetDowntime = (): void => {
    setResourcesToSetDowntime(selectedResources);
  };

  const prepareToCheck = (): void => {
    setResourcesToCheck(selectedResources);
  };

  const cancelAcknowledge = (): void => {
    setResourcesToAcknowledge([]);
  };

  const cancelSetDowntime = (): void => {
    setResourcesToSetDowntime([]);
  };

  const closeMoreActionsMenu = (): void => {
    setMoreActionsMenuAnchor(null);
  };

  const prepareToDisacknowledge = (): void => {
    closeMoreActionsMenu();
    setResourcesToDisacknowledge(selectedResources);
  };

  const cancelDisacknowledge = (): void => {
    setResourcesToDisacknowledge([]);
  };

  const openMoreActionsMenu = (event: React.MouseEvent): void => {
    setMoreActionsMenuAnchor(event.currentTarget);
  };

  const noResourcesSelected = isEmpty(selectedResources);

  const getDisableAction = (canAction): boolean => {
    return noResourcesSelected || !canAction(selectedResources);
  };

  const disableAcknowledge = getDisableAction(canAcknowledge);
  const disableDowntime = getDisableAction(canDowntime);
  const disableCheck = getDisableAction(canCheck);
  const disableDisacknowledge = getDisableAction(canDisacknowledge);

  return (
    <Grid container spacing={1}>
      <Grid item>
        <ContainedActionButton
          disabled={disableAcknowledge}
          startIcon={<IconAcknowledge />}
          onClick={prepareToAcknowledge}
        >
          {t(labelAcknowledge)}
        </ContainedActionButton>
      </Grid>
      <Grid item>
        <ContainedActionButton
          disabled={disableDowntime}
          startIcon={<IconDowntime />}
          onClick={prepareToSetDowntime}
        >
          {t(labelSetDowntime)}
        </ContainedActionButton>
      </Grid>
      <Grid item>
        <ContainedActionButton
          disabled={disableCheck}
          startIcon={<IconCheck />}
          onClick={prepareToCheck}
        >
          {t(labelCheck)}
        </ContainedActionButton>
      </Grid>
      <Grid item>
        <ActionButton startIcon={<IconMore />} onClick={openMoreActionsMenu}>
          {t(labelMoreActions)}
        </ActionButton>
        <Menu
          anchorEl={moreActionsMenuAnchor}
          keepMounted
          open={Boolean(moreActionsMenuAnchor)}
          onClose={closeMoreActionsMenu}
        >
          <MenuItem
            disabled={disableDisacknowledge}
            onClick={prepareToDisacknowledge}
          >
            {t(labelDisacknowledge)}
          </MenuItem>
        </Menu>
      </Grid>
      {resourcesToAcknowledge.length > 0 && (
        <AcknowledgeForm
          resources={resourcesToAcknowledge}
          onClose={cancelAcknowledge}
          onSuccess={confirmAction}
        />
      )}
      {resourcesToSetDowntime.length > 0 && (
        <DowntimeForm
          resources={resourcesToSetDowntime}
          onClose={cancelSetDowntime}
          onSuccess={confirmAction}
        />
      )}
      {resourcesToDisacknowledge.length > 0 && (
        <DisacknowledgeForm
          resources={resourcesToDisacknowledge}
          onClose={cancelDisacknowledge}
          onSuccess={confirmAction}
        />
      )}
    </Grid>
  );
};

export default ResourceActions;
