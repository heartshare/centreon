import * as React from 'react';

import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  fireEvent,
  waitFor,
  render,
  RenderResult,
} from '@testing-library/react';
import { Simulate } from 'react-dom/test-utils';

import userEvent from '@testing-library/user-event';
import {
  labelResource,
  labelHost,
  labelState,
  labelAcknowledged,
  labelStatus,
  labelOk,
  labelHostGroup,
  labelServiceGroup,
  labelSearch,
  labelResourceProblems,
  labelAll,
  labelUnhandledProblems,
  labelShowCriteriasFilters,
  labelOpen,
  labelClearAll,
  labelSearchHelp,
  labelSearchOnFields,
} from '../translatedLabels';
import { allFilter, newFilter } from './models';
import useListing from '../Listing/useListing';
import useActions from '../Actions/useActions';
import useFilter from './useFilter';
import Context, { ResourceContext } from '../Context';

import Filter from '.';
import useLoadResources from '../Listing/useLoadResources';
import {
  defaultStates,
  defaultStatuses,
  getListingEndpoint,
  mockAppStateSelector,
} from '../testUtils';

const mockedAxios = axios as jest.Mocked<typeof axios>;

const filterStorageKey = 'centreon-events-filter';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

window.clearInterval = jest.fn();
window.setInterval = jest.fn();

const searchableFields = ['h.name', 'h.alias', 'h.address', 's.description'];

const linuxServersHostGroup = {
  id: 0,
  name: 'Linux-servers',
};

const webAccessServiceGroup = {
  id: 1,
  name: 'Web-access',
};

const filtersParams = [
  [labelResource, labelHost, { resourceTypes: ['host'] }, undefined],
  [
    labelState,
    labelAcknowledged,
    {
      states: [...defaultStates, 'acknowledged'],
    },
    undefined,
  ],
  [
    labelStatus,
    labelOk,
    {
      statuses: [...defaultStatuses, 'OK'],
    },
    undefined,
  ],
  [
    labelHostGroup,
    linuxServersHostGroup.name,
    {
      hostGroupIds: [linuxServersHostGroup.id],
    },
    (): void => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          result: [linuxServersHostGroup],
          meta: {
            limit: 10,
            total: 1,
          },
        },
      });
    },
  ],
  [
    labelServiceGroup,
    webAccessServiceGroup.name,

    {
      serviceGroupIds: [webAccessServiceGroup.id],
    },
    (): void => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          result: [webAccessServiceGroup],
          meta: {
            limit: 10,
            total: 1,
          },
        },
      });
    },
  ],
];

const FilterWithLoading = (): JSX.Element => {
  useLoadResources();

  return <Filter />;
};

const FilterTest = (): JSX.Element | null => {
  const filterState = useFilter();
  const listingState = useListing();
  const actionsState = useActions();

  return (
    <Context.Provider
      value={
        {
          ...listingState,
          ...actionsState,
          ...filterState,
        } as ResourceContext
      }
    >
      <FilterWithLoading />
    </Context.Provider>
  );
};

const renderFilter = (): RenderResult => render(<FilterTest />);

const mockedLocalStorageGetItem = jest.fn();
const mockedLocalStorageSetItem = jest.fn();

Storage.prototype.getItem = mockedLocalStorageGetItem;
Storage.prototype.setItem = mockedLocalStorageSetItem;

const cancelTokenRequestParam = { cancelToken: {} };

mockAppStateSelector(useSelector);

describe(Filter, () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} }).mockResolvedValueOnce({
      data: {
        result: [],
        meta: {
          page: 1,
          limit: 30,
          total: 0,
        },
      },
    });
  });

  afterEach(() => {
    mockedAxios.get.mockReset();
    mockedLocalStorageSetItem.mockReset();
    mockedLocalStorageGetItem.mockReset();
  });

  it('executes a listing request with "Unhandled problems" filter group by default', async () => {
    renderFilter();

    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenCalledWith(
        getListingEndpoint({}),
        cancelTokenRequestParam,
      ),
    );
  });

  it.each(searchableFields.map((searchableField) => [searchableField]))(
    'executes a listing request with an "$and" search param containing %p when %p is typed in the search field',
    async (searchableField) => {
      const { getByPlaceholderText, getByText } = renderFilter();

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });

      const search = 'foobar';
      const fieldSearchValue = `${searchableField}:${search}`;

      fireEvent.change(getByPlaceholderText(labelSearch), {
        target: { value: fieldSearchValue },
      });

      mockedAxios.get.mockResolvedValueOnce({ data: {} });

      fireEvent.click(getByText(labelSearch));

      const endpoint = getListingEndpoint({ search: fieldSearchValue });

      expect(endpoint).toContain(
        `search={"$and":[{"${searchableField}":{"$rg":"${search}"}}]}`,
      );

      await waitFor(() =>
        expect(mockedAxios.get).toHaveBeenCalledWith(
          endpoint,
          cancelTokenRequestParam,
        ),
      );
    },
  );

  it('executes a listing request with an "$or" search param containing all searchable fields when a string that does not correspond to any searchable field is typed in the search field', async () => {
    const { getByPlaceholderText, getByText } = renderFilter();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    const searchValue = 'foobar';

    fireEvent.change(getByPlaceholderText(labelSearch), {
      target: { value: searchValue },
    });

    mockedAxios.get.mockResolvedValueOnce({ data: {} });

    fireEvent.click(getByText(labelSearch));

    const endpoint = getListingEndpoint({ search: searchValue });

    const searchableFieldExpressions = searchableFields.map(
      (searchableField) => `{"${searchableField}":{"$rg":"${searchValue}"}}`,
    );

    expect(endpoint).toContain(
      `search={"$or":[${searchableFieldExpressions}]}`,
    );

    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenCalledWith(
        endpoint,
        cancelTokenRequestParam,
      ),
    );

    const searchInput = getByPlaceholderText(labelSearch);

    Simulate.keyDown(searchInput, { key: 'Enter', keyCode: 13, which: 13 });

    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenCalledWith(
        endpoint,
        cancelTokenRequestParam,
      ),
    );
  });

  it.each([
    [
      labelResourceProblems,
      {
        statuses: defaultStatuses,
        states: [],
        resourceTypes: [],
      },
    ],
    [
      labelAll,
      {
        statuses: [],
        states: [],
        resourceTypes: [],
      },
    ],
  ])(
    'executes a listing request with "%p" params when "%p" filter group is set',
    async (filterGroup, criterias) => {
      const { getByText } = renderFilter();

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });

      mockedAxios.get.mockResolvedValueOnce({ data: {} });

      userEvent.click(getByText(labelUnhandledProblems));

      userEvent.click(getByText(filterGroup));

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenLastCalledWith(
          getListingEndpoint({
            resourceTypes: criterias.resourceTypes,
            states: criterias.states,
            statuses: criterias.statuses,
          }),
          cancelTokenRequestParam,
        );
      });
    },
  );

  it.each(filtersParams)(
    "executes a listing request with current search and selected %p filter options when it's changed",
    async (
      filterName,
      optionToSelect,
      endpointParamChanged,
      selectEndpointMockAction,
    ) => {
      const {
        getByTitle,
        getByLabelText,
        getByPlaceholderText,
        findByText,
      } = renderFilter();

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });

      fireEvent.click(getByLabelText(labelShowCriteriasFilters));

      selectEndpointMockAction?.();
      mockedAxios.get.mockResolvedValueOnce({ data: {} });

      const searchValue = 'foobar';
      fireEvent.change(getByPlaceholderText(labelSearch), {
        target: { value: searchValue },
      });

      const filterToChange = getByTitle(`${labelOpen} ${filterName}`);
      fireEvent.click(filterToChange);

      const selectedOption = await findByText(optionToSelect);
      fireEvent.click(selectedOption);

      await waitFor(() =>
        expect(mockedAxios.get).toHaveBeenCalledWith(
          getListingEndpoint({
            search: searchValue,
            ...endpointParamChanged,
          }),
          cancelTokenRequestParam,
        ),
      );
    },
  );

  describe('Filter storage', () => {
    const savedFilter = {
      id: '',
      name: '',
      criterias: {
        resourceTypes: [{ id: 'host', name: labelHost }],
        states: [{ id: 'acknowledged', name: labelAcknowledged }],
        statuses: [{ id: 'OK', name: labelOk }],
        hostGroups: [linuxServersHostGroup],
        serviceGroups: [webAccessServiceGroup],
        search: 'searching...',
      },
    };

    it('populates filter with values from localStorage if available', async () => {
      mockedLocalStorageGetItem.mockReturnValue(JSON.stringify(savedFilter));

      const { getByText, getByDisplayValue, queryByLabelText } = renderFilter();

      await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(2));

      expect(mockedLocalStorageGetItem).toHaveBeenCalledWith(filterStorageKey);
      expect(queryByLabelText(labelUnhandledProblems)).not.toBeInTheDocument();
      expect(getByDisplayValue('searching...')).toBeInTheDocument();
      expect(getByText(labelHost)).toBeInTheDocument();
      expect(getByText(labelAcknowledged)).toBeInTheDocument();
      expect(getByText(labelOk)).toBeInTheDocument();
      expect(getByText(linuxServersHostGroup.name)).toBeInTheDocument();
      expect(getByText(webAccessServiceGroup.name)).toBeInTheDocument();
    });

    it('stores filter values in localStorage when updated', async () => {
      const { getByText, getByPlaceholderText, findByText } = renderFilter();

      await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(2));

      mockedAxios.get.mockResolvedValue({ data: {} });

      const unhandledProblemsOption = await findByText(labelUnhandledProblems);

      userEvent.click(unhandledProblemsOption);

      fireEvent.click(getByText(labelAll));

      await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(3));

      expect(mockedLocalStorageSetItem).toHaveBeenCalledWith(
        filterStorageKey,
        JSON.stringify(allFilter),
      );

      fireEvent.change(getByPlaceholderText(labelSearch), {
        target: { value: 'searching...' },
      });

      await waitFor(() =>
        expect(mockedLocalStorageSetItem).toHaveBeenCalledWith(
          filterStorageKey,
          JSON.stringify({
            ...newFilter,
            criterias: { ...allFilter.criterias, search: 'searching...' },
          }),
        ),
      );
    });

    it('clears all filters and set filter group to all when the clear all button is clicked', async () => {
      mockedLocalStorageGetItem.mockReturnValue(JSON.stringify(savedFilter));

      mockedAxios.get.mockResolvedValue({ data: {} });

      const {
        getByText,
        queryByDisplayValue,
        getByLabelText,
        queryByText,
      } = renderFilter();

      await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());

      fireEvent.click(getByLabelText(labelShowCriteriasFilters));

      fireEvent.click(getByText(labelClearAll));

      await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(3));

      expect(getByText(labelAll)).toBeInTheDocument();
      expect(queryByDisplayValue('searching...')).toBeNull();
      expect(queryByText(labelHost)).toBeNull();
      expect(queryByText(labelAcknowledged)).toBeNull();
      expect(queryByText(labelOk)).toBeNull();
      expect(queryByText(linuxServersHostGroup.name)).toBeNull();
      expect(queryByText(webAccessServiceGroup.name)).toBeNull();
    });

    it('leaves search help tooltip visible when the search input is filled', async () => {
      const {
        getByLabelText,
        getByText,
        getByPlaceholderText,
      } = renderFilter();

      await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());

      fireEvent.click(getByLabelText(labelSearchHelp));

      expect(
        getByText(labelSearchOnFields, { exact: false }),
      ).toBeInTheDocument();

      const searchInput = getByPlaceholderText(labelSearch);

      fireEvent.change(searchInput, {
        target: { value: 'foobar' },
      });

      expect(
        getByText(labelSearchOnFields, { exact: false }),
      ).toBeInTheDocument();
    });
  });
});
