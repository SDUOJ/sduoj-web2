import React from 'react';
import { act, render } from '@testing-library/react';
import QRScanner from './QRScanner';

const mockDecodeFromConstraints = jest.fn();
jest.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: jest.fn(() => ({
    decodeFromConstraints: mockDecodeFromConstraints,
  })),
}));
jest.mock('antd', () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function deferredControls() {
  let resolve!: (controls: { stop: () => void }) => void;
  const promise = new Promise<{ stop: () => void }>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => mockDecodeFromConstraints.mockReset());

it('stops scanner controls that resolve after the scanner closes', async () => {
  const controls = deferredControls();
  const stop = jest.fn();
  mockDecodeFromConstraints.mockReturnValueOnce(controls.promise);

  const view = render(<QRScanner open onClose={jest.fn()} onResult={jest.fn()} />);
  view.rerender(<QRScanner open={false} onClose={jest.fn()} onResult={jest.fn()} />);
  await act(async () => controls.resolve({ stop }));

  expect(stop).toHaveBeenCalledTimes(1);
});

it('stops active scanner controls when the scanner closes normally', async () => {
  const controls = deferredControls();
  const stop = jest.fn();
  mockDecodeFromConstraints.mockReturnValueOnce(controls.promise);

  const view = render(<QRScanner open onClose={jest.fn()} onResult={jest.fn()} />);
  await act(async () => controls.resolve({ stop }));
  view.rerender(<QRScanner open={false} onClose={jest.fn()} onResult={jest.fn()} />);

  expect(mockDecodeFromConstraints).toHaveBeenCalledTimes(1);
  expect(stop).toHaveBeenCalledTimes(1);
});
