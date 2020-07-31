import React from 'react';

import { last, head } from 'ramda';
import axios from 'axios';
import mockDate from 'mockdate';
import {
  render,
  waitFor,
  fireEvent,
  RenderResult,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as clipboard from './tabs/Details/clipboard';

import Details from '.';
import {
  labelMore,
  labelFrom,
  labelTo,
  labelAt,
  labelStatusInformation,
  labelDowntimeDuration,
  labelAcknowledgedBy,
  labelTimezone,
  labelCurrentStateDuration,
  labelLastStateChange,
  labelNextCheck,
  labelActive,
  labelCheckDuration,
  labelLatency,
  labelPercentStateChange,
  labelLastNotification,
  labelLastCheck,
  labelCurrentNotificationNumber,
  labelPerformanceData,
  labelLast7Days,
  labelLast24h,
  labelLast31Days,
  labelCopy,
  labelCommand,
  labelResourceFlapping,
  labelNo,
  labelComment,
} from '../translatedLabels';
import { detailsTabId, graphTabId, timelineTabId } from './tabs';
import * as Context from '../Context';
import { cancelTokenRequestParam } from '../testUtils';
import { buildListTimelineEventsEndpoint } from './tabs/Timeline/api';

const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../icons/Downtime');
jest.mock('./tabs/Details/clipboard');
jest.mock('../Context');

const mockedUseResourceContext = Context.useResourceContext as jest.Mock<
  unknown
>;

const detailsEndpoint = '/resource';
const performanceGraphEndpoint = '/performance';
const statusGraphEndpoint = '/status';
const timelineEndpoint = '/timeline';

const retrievedDetails = {
  display_name: 'Central',
  severity: { level: 1 },
  status: { name: 'Critical', severity_code: 1 },
  parent: { name: 'Centreon', status: { severity_code: 1 } },
  poller_name: 'Poller',
  acknowledged: false,
  checked: true,
  execution_time: 0.070906,
  last_check: '2020-05-18T18:00',
  last_state_change: '2020-04-18T17:00',
  last_update: '2020-03-18T19:30',
  output:
    'OK - 127.0.0.1 rta 0.100ms lost 0%\n OK - 127.0.0.1 rta 0.99ms lost 0%\n OK - 127.0.0.1 rta 0.98ms lost 0%\n OK - 127.0.0.1 rta 0.97ms lost 0%',
  timezone: 'Europe/Paris',
  criticality: 10,
  active_checks: true,
  command_line: 'base_host_alive',
  last_notification: '2020-07-18T19:30',
  latency: 0.005,
  next_check: '2020-06-18T19:15',
  notification_number: 3,
  flapping: false,
  percent_state_change: 3.5,
  downtimes: [
    {
      start_time: '2020-01-18T18:57:59',
      end_time: '2020-01-18T19:57:59',
      comment: 'First downtime set by Admin',
    },
    {
      start_time: '2020-02-18T18:57:59',
      end_time: '2020-02-18T19:57:59',
      comment: 'Second downtime set by Admin',
    },
  ],
  acknowledgement: {
    author_name: 'Admin',
    entry_time: '2020-03-18T19:57:59',
    comment: 'Acknowledged by Admin',
  },
  performance_data:
    'rta=0.025ms;200.000;400.000;0; rtmax=0.061ms;;;; rtmin=0.015ms;;;; pl=0%;20;50;0;100',
  duration: '22m',
  tries: '3/3 (Hard)',
};

const performanceGraphData = {
  global: {},
  times: [],
  metrics: [],
};

const retrievedTimeline = {
  result: [
    {
      type: 'event',
      id: 1,
      date: '2020-06-22T10:40:00',
      tries: '1/1 (Hard)',
      content: 'INITIAL HOST STATE: Centreon-Server;UP;HARD;1;',
      status: {
        severity_code: 5,
        name: 'UP',
      },
    },
    {
      type: 'event',
      id: 2,
      date: '2020-06-22T10:35:00',
      tries: '3/3 (Hard)',
      content: 'INITIAL HOST STATE: Centreon-Server;DOWN;HARD;3;',
      status: {
        severity_code: 1,
        name: 'DOWN',
      },
    },
    {
      type: 'notif',
      id: 3,
      date: '2020-06-21T09:40:00',
      content: 'My little comment',
      author_name: 'admin',
    },
    {
      type: 'ack',
      id: 4,
      date: '2020-06-20T09:35:00Z',
      author_name: 'admin',
      content: 'My little ack',
    },
    {
      type: 'downtime',
      id: 5,
      date: '2020-06-20T09:30:00',
      start_date: '2020-06-20T09:30:00',
      end_date: '2020-06-22T09:33:00',
      author_name: 'admin',
      content: 'My little dt',
    },
  ],
  meta: {
    page: 1,
    limit: 10,
    total: 5,
  },
};

const currentDateIsoString = '2020-06-20T20:00:00.000Z';

const mockUseResourceContext = ({ openTabId }): void => {
  mockedUseResourceContext.mockReturnValue({
    detailsTabIdToOpen: openTabId,
    selectedDetailsEndpoints: {
      details: detailsEndpoint,
      performanceGraph: performanceGraphEndpoint,
      statusGraph: statusGraphEndpoint,
      timeline: timelineEndpoint,
    },
    setDefaultDetailsTabIdToOpen: jest.fn(),
  });
};

const renderDetails = (): RenderResult => render(<Details />);

describe(Details, () => {
  beforeEach(() => {
    mockDate.set(currentDateIsoString);
  });

  afterEach(() => {
    mockDate.reset();
    mockedAxios.get.mockReset();
  });

  it('displays resource details information', async () => {
    mockUseResourceContext({ openTabId: detailsTabId });

    mockedAxios.get.mockResolvedValueOnce({ data: retrievedDetails });

    const { getByText, queryByText, getAllByText } = renderDetails();

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());

    expect(getByText('10')).toBeInTheDocument();
    expect(getByText('CRITICAL')).toBeInTheDocument();
    expect(getByText('Centreon')).toBeInTheDocument();

    expect(getByText(labelStatusInformation)).toBeInTheDocument();
    expect(getByText('OK - 127.0.0.1 rta 0.100ms lost 0%')).toBeInTheDocument();
    expect(getByText('OK - 127.0.0.1 rta 0.99ms lost 0%')).toBeInTheDocument();
    expect(getByText('OK - 127.0.0.1 rta 0.98ms lost 0%')).toBeInTheDocument();
    expect(
      queryByText('OK - 127.0.0.1 rta 0.97ms lost 0%'),
    ).not.toBeInTheDocument();

    fireEvent.click(getByText(labelMore));

    expect(getByText('OK - 127.0.0.1 rta 0.97ms lost 0%')).toBeInTheDocument();

    expect(getAllByText(labelComment)).toHaveLength(3);
    expect(getAllByText(labelDowntimeDuration)).toHaveLength(2);
    expect(getByText(`${labelFrom} 01/18/2020 18:57`)).toBeInTheDocument();
    expect(getByText(`${labelTo} 01/18/2020 19:57`)).toBeInTheDocument();
    expect(getByText(`${labelFrom} 02/18/2020 18:57`)).toBeInTheDocument();
    expect(getByText(`${labelTo} 02/18/2020 19:57`)).toBeInTheDocument();
    expect(getByText('First downtime set by Admin'));
    expect(getByText('Second downtime set by Admin'));

    expect(getByText(labelAcknowledgedBy)).toBeInTheDocument();
    expect(getByText(`Admin ${labelAt} 03/18/2020 19:57`)).toBeInTheDocument();
    expect(getByText('Acknowledged by Admin'));

    expect(getByText(labelTimezone)).toBeInTheDocument();
    expect(getByText('Europe/Paris')).toBeInTheDocument();

    expect(getByText(labelCurrentStateDuration)).toBeInTheDocument();
    expect(getByText('22m')).toBeInTheDocument();
    expect(getByText('3/3 (Hard)')).toBeInTheDocument();

    expect(getByText(labelLastStateChange)).toBeInTheDocument();
    expect(getByText('04/18/2020')).toBeInTheDocument();
    expect(getByText('17:00')).toBeInTheDocument();

    expect(getByText(labelLastCheck)).toBeInTheDocument();
    expect(getByText('05/18/2020')).toBeInTheDocument();
    expect(getByText('18:00')).toBeInTheDocument();

    expect(getByText(labelNextCheck)).toBeInTheDocument();
    expect(getByText('06/18/2020')).toBeInTheDocument();
    expect(getByText('19:15')).toBeInTheDocument();

    expect(getAllByText(labelActive)).toHaveLength(2);

    expect(getByText(labelCheckDuration)).toBeInTheDocument();
    expect(getByText('0.070906 s')).toBeInTheDocument();

    expect(getByText(labelLatency)).toBeInTheDocument();
    expect(getByText('0.005 s')).toBeInTheDocument();

    expect(getByText(labelResourceFlapping)).toBeInTheDocument();
    expect(getByText(labelNo)).toBeInTheDocument();

    expect(getByText(labelPercentStateChange)).toBeInTheDocument();
    expect(getByText('3.5%')).toBeInTheDocument();

    expect(getByText(labelLastNotification)).toBeInTheDocument();
    expect(getByText('07/18/2020')).toBeInTheDocument();
    expect(getByText('19:30')).toBeInTheDocument();

    expect(getByText(labelCurrentNotificationNumber)).toBeInTheDocument();
    expect(getByText('3')).toBeInTheDocument();

    expect(getByText(labelPerformanceData)).toBeInTheDocument();
    expect(
      getByText(
        'rta=0.025ms;200.000;400.000;0; rtmax=0.061ms;;;; rtmin=0.015ms;;;; pl=0%;20;50;0;100',
      ),
    ).toBeInTheDocument();

    expect(getByText(labelCommand)).toBeInTheDocument();
    expect(getByText('base_host_alive')).toBeInTheDocument();
  });

  [
    { period: labelLast24h, startIsoString: '2020-06-19T20:00:00.000Z' },
    { period: labelLast7Days, startIsoString: '2020-06-13T20:00:00.000Z' },
    { period: labelLast31Days, startIsoString: '2020-05-20T20:00:00.000Z' },
  ].forEach(({ period, startIsoString }) =>
    it(`queries performance and status graphs with ${period} period when the Graph tab is selected and ${period} is selected`, async () => {
      mockUseResourceContext({ openTabId: graphTabId });

      mockedAxios.get.mockResolvedValueOnce({ data: performanceGraphData });
      mockedAxios.get
        .mockResolvedValueOnce({ data: retrievedDetails })
        .mockResolvedValueOnce({ data: performanceGraphData });

      const { getByText, getAllByText } = renderDetails();

      await waitFor(() => expect(getByText(labelLast24h)).toBeInTheDocument());

      userEvent.click(head(getAllByText(labelLast24h)) as HTMLElement);

      userEvent.click(last(getAllByText(period)) as HTMLElement);

      await waitFor(() =>
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `${performanceGraphEndpoint}?start=${startIsoString}&end=${currentDateIsoString}`,
          cancelTokenRequestParam,
        ),
      );
    }),
  );

  it('copies the command line to clipboard when the copy button is clicked', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: retrievedDetails });
    mockUseResourceContext({ openTabId: detailsTabId });

    const mockedClipboard = clipboard as jest.Mocked<typeof clipboard>;

    const { getByTitle } = renderDetails();

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());

    fireEvent.click(getByTitle(labelCopy));

    await waitFor(() =>
      expect(mockedClipboard.copy).toHaveBeenCalledWith(
        retrievedDetails.command_line,
      ),
    );
  });

  it('displays retrieved timeline events, grouped by date, when the Timeline tab is selected', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: retrievedTimeline });
    mockedAxios.get.mockResolvedValueOnce({ data: retrievedDetails });
    mockUseResourceContext({ openTabId: timelineTabId });

    const { getByText, getAllByText } = renderDetails();

    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenCalledWith(
        buildListTimelineEventsEndpoint({
          endpoint: timelineEndpoint,
          params: { limit: 10, page: 1 },
        }),
        expect.anything(),
      ),
    );

    expect(getByText('06/22/2020')).toBeInTheDocument();

    expect(getByText('10:40')).toBeInTheDocument();
    expect(getAllByText('Event')).toHaveLength(2);
    expect(getByText('UP')).toBeInTheDocument();
    expect(getByText('1/1 (Hard)')).toBeInTheDocument();
    expect(
      getByText('INITIAL HOST STATE: Centreon-Server;UP;HARD;1;'),
    ).toBeInTheDocument();

    expect(getByText('10:35')).toBeInTheDocument();
    expect(getByText('DOWN')).toBeInTheDocument();
    expect(getByText('3/3 (Hard)')).toBeInTheDocument();
    expect(
      getByText('INITIAL HOST STATE: Centreon-Server;DOWN;HARD;3;'),
    ).toBeInTheDocument();

    expect(getByText('06/21/2020')).toBeInTheDocument();

    expect(getByText('09:40')).toBeInTheDocument();
    expect(getByText('Comment by admin')).toBeInTheDocument();
    expect(getByText('My little comment'));

    expect(getByText('06/20/2020')).toBeInTheDocument();

    expect(getByText('09:35')).toBeInTheDocument();
    expect(getByText('Acknowledgement by admin')).toBeInTheDocument();
    expect(getByText('My little ack'));

    expect(getByText('09:30')).toBeInTheDocument();
    expect(getByText('Downtime by admin')).toBeInTheDocument();
    expect(
      getByText('From 06/20/2020 09:30 To 06/22/2020 09:33'),
    ).toBeInTheDocument();
    expect(getByText('My little dt'));

    const dateRegExp = /\d+\/\d+\/\d+$/;

    expect(getAllByText(dateRegExp).map((baba) => baba.textContent)).toEqual([
      '06/22/2020',
      '06/21/2020',
      '06/20/2020',
    ]);
  });
});
