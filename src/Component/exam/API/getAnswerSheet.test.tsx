import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import { rootReducers } from '../../../Redux/Store/rootReducer';
import eApi from '../../../Utils/API/e-api';
import useAnswerSheet from './getAnswerSheet';

jest.mock('../../../Utils/API/e-api', () => ({
  __esModule: true,
  default: { getAnswerSheet: jest.fn() },
}));

function Probe({ examId, groupId }: { examId: string; groupId: string }) {
  const sheet = useAnswerSheet(examId, groupId);
  return <div>{sheet?.[0]?.answer ?? 'loading'}</div>;
}

it('loads once per group and selects the new group during navigation', async () => {
  jest
    .mocked(eApi.getAnswerSheet)
    .mockResolvedValueOnce([{ answer: 'A' }])
    .mockResolvedValueOnce([{ answer: 'B' }]);
  const store = createStore(rootReducers);
  const view = render(
    <Provider store={store}>
      <Probe examId="1" groupId="2" />
    </Provider>,
  );
  expect(await screen.findByText('A')).toBeInTheDocument();
  view.rerender(
    <Provider store={store}>
      <Probe examId="1" groupId="3" />
    </Provider>,
  );
  expect(await screen.findByText('B')).toBeInTheDocument();
  await waitFor(() => expect(eApi.getAnswerSheet).toHaveBeenCalledTimes(2));
});
